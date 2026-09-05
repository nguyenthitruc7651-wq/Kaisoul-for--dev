(function () {
  "use strict";

  const state = {
    provider: "gemini",
    model: "gemini-2.5-flash",
    responseStyle: "balanced",
    includeCurrentCode: true,
    isLoading: false,
    lastResponse: ""
  };

  const ACTIONS = {
    generate: "generate",
    fix: "fix",
    explain: "explain",
    optimize: "optimize",
    feature: "feature",
    ui: "ui"
  };

  function init() {
    loadSettings();
    bindEvents();
    updateUI();
  }

  /* =========================================================
     SETTINGS
     ========================================================= */

  function loadSettings() {
    let settings = null;

    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.getSettings ===
        "function"
    ) {
      try {
        settings =
          window.KAISoulStorage.getSettings();
      } catch (error) {
        console.warn(
          "[KAISOUL AI] Settings error:",
          error
        );
      }
    }

    if (!settings) {
      try {
        settings = JSON.parse(
          localStorage.getItem(
            "KAISOUL_DEV_SETTINGS"
          ) || "{}"
        );
      } catch (error) {
        settings = {};
      }
    }

    const ai =
      settings?.ai || {};

    state.provider =
      ai.provider ||
      "gemini";

    state.model =
      ai.model ||
      "gemini-2.5-flash";

    state.responseStyle =
      ai.responseStyle ||
      "balanced";

    state.includeCurrentCode =
      ai.includeCurrentCode !== false;
  }

  /* =========================================================
     EVENTS
     ========================================================= */

  function bindEvents() {
    document.addEventListener(
      "click",
      handleClick
    );

    document.addEventListener(
      "submit",
      handleSubmit
    );

    document.addEventListener(
      "kaisoul:settings-updated",
      function () {
        loadSettings();
        updateUI();
      }
    );

    document.addEventListener(
      "kaisoul:project-updated",
      function () {
        updateUI();
      }
    );
  }

  function handleClick(event) {
    const actionButton =
      event.target.closest(
        "[data-ai-action]"
      );

    if (
      actionButton
    ) {
      event.preventDefault();

      runAction(
        actionButton.dataset.aiAction
      );

      return;
    }

    const suggestion =
      event.target.closest(
        "[data-ai-suggestion]"
      );

    if (
      suggestion
    ) {
      event.preventDefault();

      const prompt =
        suggestion.dataset.aiSuggestion ||
        suggestion.textContent.trim();

      sendPrompt(prompt);

      return;
    }

    const clearButton =
      event.target.closest(
        "[data-ai-clear]"
      );

    if (
      clearButton
    ) {
      clearConversation();
    }

    const copyButton =
      event.target.closest(
        "[data-ai-copy]"
      );

    if (
      copyButton
    ) {
      copyLastResponse();
    }

    const applyButton =
      event.target.closest(
        "[data-ai-apply]"
      );

    if (
      applyButton
    ) {
      applyLastCode();
    }
  }

  function handleSubmit(event) {
    const form =
      event.target.closest(
        "[data-ai-form]"
      );

    if (
      !form
    ) {
      return;
    }

    event.preventDefault();

    const input =
      form.querySelector(
        "[data-ai-input]"
      );

    if (!input) {
      return;
    }

    const prompt =
      input.value.trim();

    if (!prompt) {
      return;
    }

    input.value = "";

    sendPrompt(prompt);
  }

  /* =========================================================
     ACTIONS
     ========================================================= */

  async function runAction(
    action
  ) {
    if (
      !Object.values(
        ACTIONS
      ).includes(action)
    ) {
      return;
    }

    let prompt = "";

    switch (action) {
      case ACTIONS.generate:
        prompt =
          "Generate the code needed for my request. Return production-ready HTML, CSS, and JavaScript.";
        break;

      case ACTIONS.fix:
        prompt =
          "Analyze the current project, identify errors or bugs, and provide the corrected code. Explain the important fixes briefly.";
        break;

      case ACTIONS.explain:
        prompt =
          "Explain the current project code clearly. Identify the main components, logic, and important implementation details.";
        break;

      case ACTIONS.optimize:
        prompt =
          "Optimize the current project for performance, maintainability, accessibility, and clean code without unnecessarily changing its behavior.";
        break;

      case ACTIONS.feature:
        prompt =
          "Suggest and implement a useful new feature for the current project. Explain what was added.";
        break;

      case ACTIONS.ui:
        prompt =
          "Improve or generate the user interface of the current project. Focus on responsive design, usability, accessibility, and clean modern UI.";
        break;
    }

    await sendPrompt(
      prompt,
      action
    );
  }

  async function sendPrompt(
    prompt,
    action = "chat"
  ) {
    if (
      state.isLoading
    ) {
      return;
    }

    const cleanPrompt =
      String(
        prompt || ""
      ).trim();

    if (!cleanPrompt) {
      return;
    }

    state.isLoading = true;

    updateLoadingState(
      true
    );

    addMessage(
      "user",
      cleanPrompt
    );

    const context =
      buildProjectContext();

    try {
      const response =
        await requestAI({
          prompt:
            cleanPrompt,
          action,
          context,
          model:
            state.model,
          responseStyle:
            state.responseStyle
        });

      state.lastResponse =
        response;

      addMessage(
        "assistant",
        response
      );

      extractAndOfferCode(
        response
      );

      dispatchAIEvent(
        "kaisoul:ai-response",
        {
          response,
          action
        }
      );
    } catch (error) {
      console.error(
        "[KAISOUL AI]",
        error
      );

      const message =
        error?.message ||
        "Unable to connect to KAISOUL AI.";

      addMessage(
        "error",
        message
      );

      notify(
        message,
        "error"
      );
    } finally {
      state.isLoading = false;

      updateLoadingState(
        false
      );
    }
  }

  /* =========================================================
     API REQUEST
     ========================================================= */

  async function requestAI(
    payload
  ) {
    /*
     * IMPORTANT:
     * Không đặt Gemini API key ở đây.
     *
     * Frontend:
     * KAISOUL DEV → /api/ai
     *
     * Backend:
     * /api/ai → Gemini API
     */

    const endpoint =
      getAIEndpoint();

    const response =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          credentials:
            "include",

          body: JSON.stringify(
            {
              provider:
                state.provider,

              model:
                payload.model,

              prompt:
                payload.prompt,

              action:
                payload.action,

              responseStyle:
                payload.responseStyle,

              includeCurrentCode:
                state.includeCurrentCode,

              context:
                payload.context
            }
          )
        }
      );

    let data = null;

    try {
      data =
        await response.json();
    } catch (error) {
      data = null;
    }

    if (
      !response.ok
    ) {
      throw new Error(
        data?.error ||
        `AI request failed (${response.status}).`
      );
    }

    const text =
      data?.text ||
      data?.response ||
      data?.message ||
      data?.output;

    if (
      !text
    ) {
      throw new Error(
        "KAISOUL AI returned an empty response."
      );
    }

    return String(text);
  }

  function getAIEndpoint() {
    /*
     * Có thể thay bằng:
     *
     * https://your-api-domain.com/api/ai
     *
     * khi frontend và backend nằm khác domain.
     */

    return "/api/ai";
  }

  /* =========================================================
     PROJECT CONTEXT
     ========================================================= */

  function buildProjectContext() {
    if (
      !state.includeCurrentCode
    ) {
      return null;
    }

    let project = null;

    if (
      window.KAISoulEditor &&
      typeof window.KAISoulEditor.getProject ===
        "function"
    ) {
      try {
        project =
          window.KAISoulEditor.getProject();
      } catch (error) {}
    }

    if (
      !project &&
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.getCurrentProject ===
        "function"
    ) {
      try {
        project =
          window.KAISoulStorage.getCurrentProject();
      } catch (error) {}
    }

    if (!project) {
      project =
        readEditorDOM();
    }

    if (!project) {
      return null;
    }

    return {
      name:
        project.name ||
        project.title ||
        "Untitled Project",

      type:
        project.type ||
        "website",

      html:
        String(
          project.html || ""
        ),

      css:
        String(
          project.css || ""
        ),

      javascript:
        String(
          project.javascript ||
          project.js ||
          ""
        )
    };
  }

  function readEditorDOM() {
    const html =
      findEditor(
        "html"
      );

    const css =
      findEditor(
        "css"
      );

    const js =
      findEditor(
        "javascript"
      );

    if (
      !html &&
      !css &&
      !js
    ) {
      return null;
    }

    return {
      name:
        "Current Project",

      type:
        "website",

      html:
        html || "",

      css:
        css || "",

      javascript:
        js || ""
    };
  }

  function findEditor(
    language
  ) {
    const selectors = {
      html: [
        "#htmlEditor",
        "[data-editor-language='html']",
        "[data-language='html']"
      ],

      css: [
        "#cssEditor",
        "[data-editor-language='css']",
        "[data-language='css']"
      ],

      javascript: [
        "#jsEditor",
        "#javascriptEditor",
        "[data-editor-language='javascript']",
        "[data-language='javascript']"
      ]
    };

    const list =
      selectors[
        language
      ] || [];

    for (
      const selector of list
    ) {
      const element =
        document.querySelector(
          selector
        );

      if (
        element
      ) {
        return (
          "value" in element
            ? element.value
            : element.textContent
        );
      }
    }

    return "";
  }

  /* =========================================================
     CHAT UI
     ========================================================= */

  function addMessage(
    role,
    text
  ) {
    const container =
      document.querySelector(
        "[data-ai-messages], #aiMessages, .ai-messages"
      );

    if (!container) {
      return;
    }

    const message =
      document.createElement(
        "div"
      );

    message.className =
      `ai-message ai-message-${role}`;

    message.dataset.aiRole =
      role;

    message.innerHTML = `
      <div class="ai-message-content">
        ${formatResponse(text)}
      </div>
    `;

    container.appendChild(
      message
    );

    container.scrollTop =
      container.scrollHeight;
  }

  function formatResponse(
    text
  ) {
    let value =
      escapeHTML(
        text
      );

    /*
     * Code blocks
     */
    value =
      value.replace(
        /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g,
        function (
          match,
          language,
          code
        ) {
          return `
            <div class="ai-code-block">
              <div class="ai-code-header">
                <span>
                  ${escapeHTML(
                    language ||
                      "code"
                  )}
                </span>

                <button
                  type="button"
                  data-ai-code-copy
                  data-code="${escapeAttribute(
                    decodeEntities(
                      code
                    )
                  )}"
                >
                  Copy
                </button>
              </div>

              <pre><code>${code}</code></pre>
            </div>
          `;
        }
      );

    /*
     * Basic markdown
     */
    value =
      value.replace(
        /^### (.+)$/gm,
        "<h4>$1</h4>"
      );

    value =
      value.replace(
        /^## (.+)$/gm,
        "<h3>$1</h3>"
      );

    value =
      value.replace(
        /^# (.+)$/gm,
        "<h2>$1</h2>"
      );

    value =
      value.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
      );

    value =
      value.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
      );

    value =
      value.replace(
        /\n/g,
        "<br>"
      );

    return value;
  }

  function extractAndOfferCode(
    response
  ) {
    const code =
      extractCodeBlock(
        response
      );

    if (!code) {
      return;
    }

    const container =
      document.querySelector(
        "[data-ai-actions-container], .ai-actions"
      );

    if (!container) {
      return;
    }

    const button =
      document.createElement(
        "button"
      );

    button.type =
      "button";

    button.className =
      "btn btn-primary ai-apply-generated";

    button.dataset.aiApply =
      "true";

    button.textContent =
      "Apply Code";

    container.appendChild(
      button
    );
  }

  function extractCodeBlock(
    text
  ) {
    const match =
      String(text || "")
        .match(
          /```(?:html|css|javascript|js)?\s*([\s\S]*?)```/i
        );

    return match
      ? match[1].trim()
      : "";
  }

  /* =========================================================
     APPLY GENERATED CODE
     ========================================================= */

  function applyLastCode() {
    if (
      !state.lastResponse
    ) {
      notify(
        "There is no generated code to apply.",
        "warning"
      );

      return;
    }

    const blocks =
      extractAllCodeBlocks(
        state.lastResponse
      );

    if (
      !blocks.length
    ) {
      notify(
        "No code block was found.",
        "warning"
      );

      return;
    }

    let applied =
      false;

    for (
      const block of blocks
    ) {
      const language =
        normalizeLanguage(
          block.language
        );

      if (
        language ===
        "html"
      ) {
        setEditorValue(
          "html",
          block.code
        );

        applied = true;
      }

      if (
        language ===
        "css"
      ) {
        setEditorValue(
          "css",
          block.code
        );

        applied = true;
      }

      if (
        language ===
        "javascript"
      ) {
        setEditorValue(
          "javascript",
          block.code
        );

        applied = true;
      }
    }

    /*
     * Nếu AI trả về code không có language,
     * thử đưa vào HTML editor.
     */
    if (
      !applied &&
      blocks.length === 1
    ) {
      setEditorValue(
        "html",
        blocks[0].code
      );

      applied = true;
    }

    if (
      applied
    ) {
      notify(
        "Generated code applied to the editor.",
        "success"
      );

      if (
        window.KAISoulEditor &&
        typeof window.KAISoulEditor.runProject ===
          "function"
      ) {
        window.KAISoulEditor.runProject();
      }

      dispatchAIEvent(
        "kaisoul:ai-code-applied",
        {
          response:
            state.lastResponse
        }
      );
    }
  }

  function extractAllCodeBlocks(
    text
  ) {
    const regex =
      /```([a-zA-Z0-9_-]*)\s*([\s\S]*?)```/g;

    const blocks = [];

    let match;

    while (
      (match =
        regex.exec(
          String(text || "")
        ))
    ) {
      blocks.push({
        language:
          match[1] ||
          "",
        code:
          match[2].trim()
      });
    }

    return blocks;
  }

  function normalizeLanguage(
    language
  ) {
    const value =
      String(
        language || ""
      ).toLowerCase();

    if (
      value === "js" ||
      value ===
        "javascript"
    ) {
      return "javascript";
    }

    if (
      value === "html" ||
      value === "htm"
    ) {
      return "html";
    }

    if (
      value === "css"
    ) {
      return "css";
    }

    return value;
  }

  function setEditorValue(
    language,
    value
  ) {
    const ids = {
      html: [
        "#htmlEditor",
        "[data-editor-language='html']"
      ],

      css: [
        "#cssEditor",
        "[data-editor-language='css']"
      ],

      javascript: [
        "#jsEditor",
        "#javascriptEditor",
        "[data-editor-language='javascript']"
      ]
    };

    const selectors =
      ids[
        language
      ] || [];

    let element = null;

    for (
      const selector of selectors
    ) {
      element =
        document.querySelector(
          selector
        );

      if (
        element
      ) {
        break;
      }
    }

    if (!element) {
      return;
    }

    if (
      "value" in element
    ) {
      element.value =
        value;
    } else {
      element.textContent =
        value;
    }

    element.dispatchEvent(
      new Event(
        "input",
        {
          bubbles:
            true
        }
      )
    );

    element.dispatchEvent(
      new Event(
        "change",
        {
          bubbles:
            true
        }
      )
    );
  }

  /* =========================================================
     CLEAR / COPY
     ========================================================= */

  function clearConversation() {
    const container =
      document.querySelector(
        "[data-ai-messages], #aiMessages, .ai-messages"
      );

    if (
      !container
    ) {
      return;
    }

    container.innerHTML =
      "";

    state.lastResponse =
      "";

    notify(
      "AI conversation cleared.",
      "success"
    );
  }

  async function copyLastResponse() {
    if (
      !state.lastResponse
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        state.lastResponse
      );

      notify(
        "AI response copied.",
        "success"
      );
    } catch (error) {
      notify(
        "Unable to copy response.",
        "error"
      );
    }
  }

  /* =========================================================
     UI STATE
     ========================================================= */

  function updateLoadingState(
    loading
  ) {
    document
      .querySelectorAll(
        "[data-ai-loading]"
      )
      .forEach(
        element => {
          element.hidden =
            !loading;
        }
      );

    document
      .querySelectorAll(
        "[data-ai-submit]"
      )
      .forEach(
        element => {
          element.disabled =
            loading;
        }
      );

    document
      .querySelectorAll(
        "[data-ai-action]"
      )
      .forEach(
        element => {
          element.disabled =
            loading;
        }
      );
  }

  function updateUI() {
    document
      .querySelectorAll(
        "[data-ai-model]"
      )
      .forEach(
        element => {
          if (
            "value" in
            element
          ) {
            element.value =
              state.m
