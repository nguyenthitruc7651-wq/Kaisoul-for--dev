require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const path = require("path");

const { GoogleGenAI } = require("@google/genai");

const app = express();

const PORT = process.env.PORT || 3000;

const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ||
  `http://localhost:${PORT}`;

app.use(
  helmet({
    contentSecurityPolicy: false
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
    limit: "2mb"
  })
);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api/", apiLimiter);

/* =========================================================
   GEMINI
   ========================================================= */

let gemini = null;

if (process.env.GEMINI_API_KEY) {
  gemini = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
}

/* =========================================================
   TEMP DATABASE
   =========================================================

   Hiện tại dùng RAM.

   Sau này đổi sang PostgreSQL.
*/

const projects = new Map();

/* =========================================================
   HELPERS
   ========================================================= */

function generateId(length = 10) {
  return crypto
    .randomBytes(32)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length);
}

function slugify(text) {
  return String(text || "project")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "project";
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanCode(value, max = 500000) {
  return String(value || "").slice(0, max);
}

function findProjectByPublicKey(key) {
  return [...projects.values()].find(
    project =>
      `${project.slug}-${project.publicId}` === key ||
      project.publicId === key
  );
}

/* =========================================================
   HEALTH
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "KAISOUL DEV",
    version: "1.0.0",
    time: new Date().toISOString()
  });
});

/* =========================================================
   PUBLISH
   ========================================================= */

app.post("/api/projects/publish", (req, res) => {
  try {
    const {
      name,
      description,
      html,
      css,
      js,
      visibility
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        ok: false,
        error: "Project name is required."
      });
    }

    if (visibility && visibility !== "public") {
      return res.status(400).json({
        ok: false,
        error: "Project must be public to publish."
      });
    }

    const id = generateId(14);
    const publicId = generateId(10);

    let slug = slugify(name);

    /*
      Đảm bảo slug không trùng.
    */

    let counter = 1;

    while (
      [...projects.values()].some(
        project =>
          project.slug === slug
      )
    ) {
      slug =
        `${slugify(name)}-${counter}`;
      counter++;
    }

    const now =
      new Date().toISOString();

    const project = {
      id,

      publicId,

      slug,

      name:
        String(name).trim().slice(0, 100),

      description:
        String(description || "")
          .slice(0, 500),

      html:
        cleanCode(html),

      css:
        cleanCode(css),

      js:
        cleanCode(js),

      visibility: "public",

      published: true,

      createdAt: now,

      updatedAt: now,

      publishedAt: now
    };

    projects.set(
      id,
      project
    );

    const publicUrl =
      `${PUBLIC_BASE_URL}/p/${slug}-${publicId}`;

    res.status(201).json({
      ok: true,

      project: {
        id: project.id,
        publicId: project.publicId,
        slug: project.slug,
        name: project.name,
        visibility: project.visibility,
        published: project.published,
        publishedAt: project.publishedAt
      },

      publicUrl
    });

  } catch (error) {
    console.error(
      "Publish error:",
      error
    );

    res.status(500).json({
      ok: false,
      error: "Failed to publish project."
    });
  }
});

/* =========================================================
   GET PUBLIC PROJECT API
   ========================================================= */

app.get(
  "/api/projects/public/:key",
  (req, res) => {

    const project =
      findProjectByPublicKey(
        req.params.key
      );

    if (!project) {
      return res.status(404).json({
        ok: false,
        error: "Project not found."
      });
    }

    if (
      !project.published ||
      project.visibility !== "public"
    ) {
      return res.status(404).json({
        ok: false,
        error: "Project is private."
      });
    }

    res.json({
      ok: true,
      project
    });
  }
);

/* =========================================================
   UNPUBLISH
   ========================================================= */

app.delete(
  "/api/projects/:id/publish",
  (req, res) => {

    const project =
      projects.get(req.params.id);

    if (!project) {
      return res.status(404).json({
        ok: false,
        error: "Project not found."
      });
    }

    project.published = false;
    project.visibility = "private";
    project.updatedAt =
      new Date().toISOString();

    projects.set(
      project.id,
      project
    );

    res.json({
      ok: true,
      message: "Project unpublished."
    });
  }
);

/* =========================================================
   PUBLIC PROJECT PAGE
   ========================================================= */

app.get(
  "/p/:key",
  (req, res) => {

    const project =
      findProjectByPublicKey(
        req.params.key
      );

    if (
      !project ||
      !project.published ||
      project.visibility !== "public"
    ) {
      return res
        .status(404)
        .send(`
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    Project Not Found — KAISOUL DEV
  </title>

  <style>

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;

      display: grid;
      place-items: center;

      background: #0b0b0b;
      color: #fff;

      font-family:
        Inter,
        system-ui,
        sans-serif;
    }

    main {
      text-align: center;
      padding: 30px;
    }

    h1 {
      margin: 0 0 10px;
      font-size: 28px;
    }

    p {
      margin: 0;
      color: #888;
    }

  </style>

</head>

<body>

  <main>

    <h1>
      Project Not Found
    </h1>

    <p>
      This project does not exist
      or is private.
    </p>

  </main>

</body>

</html>
        `);
    }

    const html =
      project.html || "";

    const css =
      project.css || "";

    const js =
      project.js || "";

    res.send(`
<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    ${escapeHTML(project.name)}
  </title>

  <style>

    ${css}

  </style>

</head>

<body>

  ${html}

  <script>

    try {

      ${js}

    } catch (error) {

      console.error(error);

    }

  <\/script>

</body>

</html>
    `);
  }
);

/* =========================================================
   AI
   ========================================================= */

app.post(
  "/api/ai",
  async (req, res) => {

    try {

      if (!gemini) {
        return res.status(500).json({
          ok: false,
          error:
            "Gemini API is not configured."
        });
      }

      const {
        prompt,
        model,
        code
      } = req.body || {};

      if (
        !prompt ||
        !String(prompt).trim()
      ) {
        return res.status(400).json({
          ok: false,
          error:
            "Prompt is required."
        });
      }

      const allowedModels = [
        "gemini-2.5-flash",
        "gemini-2.5-pro"
      ];

      const selectedModel =
        allowedModels.includes(model)
          ? model
          : (
              process.env.GEMINI_MODEL ||
              "gemini-2.5-flash"
            );

      const systemPrompt = `
You are KAISOUL AI,
the official AI coding assistant
for KAISOUL DEV.

You specialize in:

- HTML
- CSS
- JavaScript
- Web applications
- Web games
- UI/UX
- Debugging
- Code optimization

Rules:

1. Do not invent APIs.
2. Prefer working code.
3. Keep answers practical.
4. When modifying code, preserve
   existing functionality.
5. Never expose API keys,
   passwords or secrets.
6. If the user provides code,
   analyze that code before
   suggesting changes.
`;

      const context =
        code
          ? `

CURRENT PROJECT CODE:

HTML:
${String(code.html || "")}

CSS:
${String(code.css || "")}

JavaScript:
${String(code.js || "")}

`
          : "";

      const finalPrompt =
        systemPrompt +
        context +
        `

USER REQUEST:

${String(prompt)}
`;

      const response =
        await gemini.models.generateContent({
          model: selectedModel,

          contents: finalPrompt
        });

      res.json({
        ok: true,

        text:
          response.text || "",

        model:
          selectedModel
      });

    } catch (error) {

      console.error(
        "AI error:",
        error
      );

      res.status(500).json({
        ok: false,
        error:
          "AI request failed."
      });
    }
  }
);

/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
  PORT,
  () => {

    console.log(
      "===================================="
    );

    console.log(
      "       KAISOUL DEV SERVER"
    );

    console.log(
      "===================================="
    );

    console.log(
      `Local: http://localhost:${PORT}`
    );

    console.log(
      `Public: ${PUBLIC_BASE_URL}`
    );

    console.log(
      "===================================="
    );
  }
);
