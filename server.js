"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT =
  process.env.PORT || 3000;

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

const DEFAULT_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";

/* =========================================================
   SECURITY
   ========================================================= */

app.disable("x-powered-by");

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

const aiLimiter =
  rateLimit({
    windowMs:
      60 * 1000,

    max: 30,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
      error:
        "Too many AI requests. Please try again later."
    }
  });

/* =========================================================
   GEMINI
   ========================================================= */

let gemini = null;

if (
  GEMINI_API_KEY
) {
  gemini =
    new GoogleGenAI({
      apiKey:
        GEMINI_API_KEY
    });
} else {
  console.warn(
    "[KAISOUL DEV] GEMINI_API_KEY is not configured."
  );
}

/* =========================================================
   SYSTEM PROMPT
   ========================================================= */

const SYSTEM_PROMPT = `
You are KAISOUL AI, the coding assistant inside KAISOUL DEV.

Your primary role is helping users build websites, web apps,
web games, UI components, HTML, CSS and JavaScript.

Rules:

1. Do not invent APIs, libraries, functions or documentation.
2. Analyze the user's provided code before suggesting changes.
3. Prefer vanilla HTML, CSS and JavaScript unless the user
   explicitly requests another framework.
4. Keep generated code practical and runnable.
5. Preserve existing functionality unless the user asks
   to change it.
6. When fixing code, identify the actual problem first.
7. When generating code, clearly separate HTML, CSS and JS
   when appropriate.
8. Never expose API keys, environment variables or secrets.
9. Never place server-side secrets in frontend code.
10. Consider responsive design and mobile devices.
11. Consider accessibility when modifying UI.
12. Avoid unnecessary dependencies.
13. If the request is ambiguous, make the safest reasonable
    assumption and state it briefly.
14. Do not claim that code was tested when it was not actually
    executed.
15. Be concise but technically precise.

You are integrated with a browser-based code editor.
The current project context may be included below.
`;

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,

      service:
        "KAISOUL DEV API",

      ai:
        Boolean(
          gemini
        ),

      model:
        DEFAULT_MODEL,

      time:
        new Date().toISOString()
    });
  }
);

/* =========================================================
   AI ENDPOINT
   ========================================================= */

app.post(
  "/api/ai",
  aiLimiter,
  async (req, res) => {
    try {
      if (!gemini) {
        return res
          .status(503)
          .json({
            error:
              "Gemini API is not configured on the server."
          });
      }

      const {
        prompt,
        action,
        context,
        model,
        responseStyle
      } = req.body || {};

      if (
        typeof prompt !==
          "string" ||
        !prompt.trim()
      ) {
        return res
          .status(400)
          .json({
            error:
              "A valid prompt is required."
          });
      }

      const cleanPrompt =
        prompt
          .trim()
          .slice(
            0,
            20000
          );

      const selectedModel =
        sanitizeModel(
          model
        );

      const style =
        normalizeResponseStyle(
          responseStyle
        );

      const contextText =
        buildContext(
          context
        );

      const actionText =
        action
          ? `Requested action: ${sanitizeText(
              action,
              100
            )}`
          : "";

      const styleText =
        buildResponseStyle(
          style
        );

      const finalPrompt = `
${SYSTEM_PROMPT}

${actionText}

${styleText}

CURRENT PROJECT CONTEXT:
${contextText}

USER REQUEST:
${cleanPrompt}

Respond directly to the user.
`;

      const result =
        await gemini.models.generateContent(
          {
            model:
              selectedModel,

            contents:
              finalPrompt
          }
        );

      const text =
        extractText(
          result
        );

      if (
        !text
      ) {
        return res
          .status(502)
          .json({
            error:
              "Gemini returned an empty response."
          });
      }

      return res.json({
        ok: true,

        text,

        model:
          selectedModel,

        action:
          action || "chat"
      });
    } catch (error) {
      console.error(
        "[KAISOUL DEV] AI error:",
        error
      );

      return res
        .status(
          getErrorStatus(
            error
          )
        )
        .json({
          error:
            getSafeErrorMessage(
              error
            )
        });
    }
  }
);

/* =========================================================
   CONTEXT
   ========================================================= */

function buildContext(
  context
) {
  if (
    !context ||
    typeof context !==
      "object"
  ) {
    return "No current project context was provided.";
  }

  const name =
    sanitizeText(
      context.name ||
        "Untitled Project",
      200
    );

  const type =
    sanitizeText(
      context.type ||
        "website",
      100
    );

  const html =
    sanitizeCode(
      context.html
    );

  const css =
    sanitizeCode(
      context.css
    );

  const javascript =
    sanitizeCode(
      context.javascript ||
        context.js
    );

  return `
Project name:
${name}

Project type:
${type}

--- HTML ---
${html || "(empty)"}

--- CSS ---
${css || "(empty)"}

--- JavaScript ---
${javascript || "(empty)"}
`;
}

function sanitizeCode(
  value
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.slice(
    0,
    100000
  );
}

function sanitizeText(
  value,
  maxLength
) {
  return String(
    value ?? ""
  )
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
      ""
    )
    .slice(
      0,
      maxLength
    );
}

/* =========================================================
   RESPONSE STYLE
   ========================================================= */

function normalizeResponseStyle(
  style
) {
  const allowed = [
    "concise",
    "balanced",
    "detailed"
  ];

  return allowed.includes(
    style
  )
    ? style
    : "balanced";
}

function buildResponseStyle(
  style
) {
  switch (style) {
    case "concise":
      return `
Response style:
Be concise. Focus on the solution and only explain
what is necessary.
`;

    case "detailed":
      return `
Response style:
Provide a detailed technical explanation when useful.
Explain important implementation decisions and potential
issues.
`;

    default:
      return `
Response style:
Give a balanced answer with enough technical explanation
to make the solution understandable without unnecessary
length.
`;
  }
}

/* =========================================================
   MODEL
   ========================================================= */

function sanitizeModel(
  requestedModel
) {
  const allowedModels =
    [
      "gemini-2.5-flash",
      "gemini-2.5-pro"
    ];

  if (
    allowedModels.includes(
      requestedModel
    )
  ) {
    return requestedModel;
  }

  return DEFAULT_MODEL;
}

/* =========================================================
   RESPONSE EXTRACTION
   ========================================================= */

function extractText(
  result
) {
  if (!result) {
    return "";
  }

  if (
    typeof result.text ===
    "string"
  ) {
    return result.text.trim();
  }

  if (
    result.response &&
    typeof result.response.text ===
      "function"
  ) {
    return String(
      result.response.text()
    ).trim();
  }

  const candidates =
    result.candidates;

  if (
    Array.isArray(
      candidates
    )
  ) {
    const parts = [];

    for (
      const candidate of candidates
    ) {
      const content =
        candidate?.content;

      if (
        !content
      ) {
        continue;
      }

      const contentParts =
        content.parts;

      if (
        !Array.isArray(
          contentParts
        )
      ) {
        continue;
      }

      for (
        const part of contentParts
      ) {
        if (
          typeof part?.text ===
          "string"
        ) {
          parts.push(
            part.text
          );
        }
      }
    }

    return parts
      .join("\n")
      .trim();
  }

  return "";
}

/* =========================================================
   ERRORS
   ========================================================= */

function getErrorStatus(
  error
) {
  const status =
    Number(
      error?.status ||
        error?.statusCode
    );

  if (
    status >= 400 &&
    status <= 599
  ) {
    return status;
  }

  return 500;
}

function getSafeErrorMessage(
  error
) {
  const status =
    getErrorStatus(
      error
    );

  if (
    status === 400
  ) {
    return "Invalid AI request.";
  }

  if (
    status === 401 ||
    status === 403
  ) {
    return "AI authentication failed.";
  }

  if (
    status === 429
  ) {
    return "AI rate limit reached. Please try again later.";
  }

  if (
    status >= 500
  ) {
    return "KAISOUL AI is temporarily unavailable.";
  }

  return (
    error?.message ||
    "An unexpected AI error occurred."
  );
}

/* =========================================================
   404
   ========================================================= */

app.use(
  "/api",
  (req, res) => {
    res
      .status(404)
      .json({
        error:
          "KAISOUL DEV API endpoint not found."
      });
  }
);

/* =========================================================
   GLOBAL ERROR HANDLER
   ========================================================= */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "[KAISOUL DEV] Server error:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(
        error
      );
    }

    res
      .status(500)
      .json({
        error:
          "Internal server error."
      });
  }
);

/* =========================================================
   START
   ========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      "========================================"
    );

    console.log(
      "       KAISOUL DEV API"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `Gemini: ${
        gemini
          ? "configured"
          : "NOT configured"
      }`
    );

    console.log(
      `Model: ${DEFAULT_MODEL}`
    );

    console.log(
      "========================================"
    );
  }
);
