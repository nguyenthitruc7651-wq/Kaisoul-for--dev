/* =========================================================
   KAISOUL DEV — Playground
   File: js/playground.js
   ========================================================= */

(function () {
  "use strict";

  const state = {
    activeTab: "html",
    html: "",
    css: "",
    js: "",
    running: false
  };

  const SELECTORS = {
    html: [
      "#playgroundHtml",
      "#playgroundHTML",
      "[data-playground-editor='html']",
      "[data-playground-html]"
    ],

    css: [
      "#playgroundCss",
      "#playgroundCSS",
      "[data-playground-editor='css']",
      "[data-playground-css]"
    ],

    js: [
      "#playgroundJs",
      "#playgroundJS",
      "#playgroundJavaScript",
      "[data-playground-editor='js']",
      "[data-playground-javascript]"
    ],

    preview: [
      "#playgroundPreview",
      "#playgroundPreviewFrame",
      "[data-playground-preview]"
    ],

    console: [
      "#playgroundConsole",
      "#playgroundConsoleOutput",
      "[data-playground-console]"
    ]
  };

  /* ---------------------------------------------------------
     Utilities
     --------------------------------------------------------- */

  function firstElement(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  function getEditor(type) {
    return firstElement(SELECTORS[type]);
  }

  function getPreview() {
    return firstElement(SELECTORS.preview);
  }

  function getConsole() {
    return firstElement(SELECTORS.console);
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function notify(message, type = "info") {
    if (typeof window.showToast === "function") {
      window.showToast(message, type);
      return;
    }

    if (
      window.KAISoulApp &&
      typeof window.KAISoulApp.showToast === "function"
    ) {
      window.KAISoulApp.showToast(message, type);
      return;
    }

    console.log(`[KAISOUL DEV] ${message}`);
  }

  /* ---------------------------------------------------------
     Read / Write
     --------------------------------------------------------- */

  function readEditors() {
    const htmlEditor = getEditor("html");
    const cssEditor = getEditor("css");
    const jsEditor = getEditor("js");

    if (htmlEditor) state.html = htmlEditor.value;
    if (cssEditor) state.css = cssEditor.value;
    if (jsEditor) state.js = jsEditor.value;
  }

  function writeEditors() {
    const htmlEditor = getEditor("html");
    const cssEditor = getEditor("css");
    const jsEditor = getEditor("js");

    if (htmlEditor) htmlEditor.value = state.html;
    if (cssEditor) cssEditor.value = state.css;
    if (jsEditor) jsEditor.value = state.js;

    updateLineNumbers();
  }

  /* ---------------------------------------------------------
     Tabs
     --------------------------------------------------------- */

  function setActiveTab(tab) {
    if (!["html", "css", "js"].includes(tab)) return;

    state.activeTab = tab;

    document
      .querySelectorAll(
        "[data-playground-tab], [data-playground-language]"
      )
      .forEach((button) => {
        const value =
          button.dataset.playgroundTab ||
          button.dataset.playgroundLanguage;

        button.classList.toggle("active", value === tab);
        button.setAttribute("aria-selected", value === tab ? "true" : "false");
      });

    document
      .querySelectorAll(
        "[data-playground-panel], [data-playground-editor-panel]"
      )
      .forEach((panel) => {
        const value =
          panel.dataset.playgroundPanel ||
          panel.dataset.playgroundEditorPanel;

        const active = value === tab;

        panel.classList.toggle("active", active);
        panel.hidden = !active;
      });

    const editors = {
      html: getEditor("html"),
      css: getEditor("css"),
      js: getEditor("js")
    };

    Object.entries(editors).forEach(([key, editor]) => {
      if (!editor) return;

      const active = key === tab;

      editor.classList.toggle("active", active);

      if (editor.dataset.playgroundStandalone === "true") {
        editor.hidden = !active;
      }
    });

    const activeEditor = editors[tab];

    if (activeEditor) {
      setTimeout(() => {
        activeEditor.focus();
        updateLineNumbers();
      }, 0);
    }
  }

  /* ---------------------------------------------------------
     Preview
     --------------------------------------------------------- */

  function buildDocument() {
    const html = state.html || "";
    const css = state.css || "";
    const js = state.js || "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>
<style>
${css}
</style>
</head>

<body>

${html}

<script>
(function () {
  "use strict";

  function serialize(value) {
    try {
      if (typeof value === "string") {
        return value;
      }

      if (value instanceof Error) {
        return value.stack || value.message;
      }

      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }

  function send(type, args) {
    try {
      window.parent.postMessage({
        source: "kaisoul-playground",
        type: type,
        args: Array.from(args).map(serialize)
      }, "*");
    } catch (error) {}
  }

  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = function () {
    send("log", arguments);
    originalLog.apply(console, arguments);
  };

  console.info = function () {
    send("info", arguments);
    originalInfo.apply(console, arguments);
  };

  console.warn = function () {
    send("warn", arguments);
    originalWarn.apply(console, arguments);
  };

  console.error = function () {
    send("error", arguments);
    originalError.apply(console, arguments);
  };

  window.addEventListener("error", function (event) {
    window.parent.postMessage({
      source: "kaisoul-playground",
      type: "runtime-error",
      message: event.message || "Unknown JavaScript error",
      line: event.lineno || 0,
      column: event.colno || 0
    }, "*");
  });

  window.addEventListener("unhandledrejection", function (event) {
    window.parent.postMessage({
      source: "kaisoul-playground",
      type: "runtime-error",
      message: event.reason
        ? serialize(event.reason)
        : "Unhandled Promise rejection"
    }, "*");
  });
})();
<\/script>

<script>
${js}
<\/script>

</body>
</html>`;
  }

  function run() {
    readEditors();

    const preview = getPreview();

    if (!preview) {
      notify("Không tìm thấy khu vực Preview.", "error");
      return;
    }

    clearConsole();

    state.running = true;

    preview.srcdoc = buildDocument();

    preview.onload = function () {
      state.running = false;
      notify("Playground đã chạy.", "success");
    };
  }

  /* ---------------------------------------------------------
     Console
     --------------------------------------------------------- */

  function clearConsole() {
    const output = getConsole();

    if (!output) return;

    output.innerHTML = "";

    const empty = document.createElement("div");
    empty.className = "console-empty";
    empty.textContent = "Console cleared.";

    output.appendChild(empty);
  }

  function addConsoleMessage(type, args) {
    const output = getConsole();

    if (!output) return;

    const empty = output.querySelector(".console-empty");

    if (empty) {
      empty.remove();
    }

    const line = document.createElement("div");

    line.className = `console-line console-${type}`;

    const prefix = document.createElement("span");
    prefix.className = "console-prefix";

    if (type === "error" || type === "runtime-error") {
      prefix.textContent = "×";
    } else if (type === "warn") {
      prefix.textContent = "!";
    } else {
      prefix.textContent = "›";
    }

    const content = document.createElement("span");
    content.className = "console-content";

    if (Array.isArray(args)) {
      content.textContent = args.join(" ");
    } else {
      content.textContent = String(args || "");
    }

    line.appendChild(prefix);
    line.appendChild(content);

    output.appendChild(line);

    output.scrollTop = output.scrollHeight;
  }

  /* ---------------------------------------------------------
     Message Listener
     --------------------------------------------------------- */

  function handleMessage(event) {
    const data = event.data;

    if (!data || data.source !== "kaisoul-playground") {
      return;
    }

    if (data.type === "runtime-error") {
      addConsoleMessage(
        "runtime-error",
        [
          data.message ||
            "JavaScript runtime error",
          data.line
            ? `Line ${data.line}`
            : ""
        ].filter(Boolean)
      );

      return;
    }

    if (
      ["log", "info", "warn", "error"].includes(data.type)
    ) {
      addConsoleMessage(data.type, data.args || []);
    }
  }

  /* ---------------------------------------------------------
     Formatting
     --------------------------------------------------------- */

  function formatHTML(code) {
    let result = String(code || "").trim();

    if (!result) return "";

    result = result
      .replace(/></g, ">\n<")
      .replace(/^\s+|\s+$/g, "");

    const lines = result.split("\n");

    let depth = 0;

    return lines
      .map((line) => {
        const trimmed = line.trim();

        if (!trimmed) return "";

        if (
          /^<\//.test(trimmed) ||
          /^<[^>]+\/>$/.test(trimmed)
        ) {
          depth = Math.max(0, depth - 1);
        }

        const formatted = "  ".repeat(depth) + trimmed;

        if (
          /^<([a-zA-Z][\w-]*)[^>]*>$/.test(trimmed) &&
          !/<\/[a-zA-Z][\w-]*>$/.test(trimmed) &&
          !/^<(meta|link|img|input|br|hr|area|base|embed|source|track|wbr)\b/i.test(
            trimmed
          )
        ) {
          depth++;
        }

        return formatted;
      })
      .join("\n");
  }

  function formatCSS(code) {
    let result = String(code || "").trim();

    if (!result) return "";

    result = result
      .replace(/\{/g, " {\n")
      .replace(/;/g, ";\n")
      .replace(/\}/g, "\n}\n");

    return result
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        if (line.endsWith("}")) {
          return line;
        }

        if (
          line.includes(":") &&
          !line.endsWith("{")
        ) {
          return "  " + line;
        }

        return line;
      })
      .join("\n")
      .replace(/\n\s*}/g, "\n}");
  }

  function formatJS(code) {
    let result = String(code || "").trim();

    if (!result) return "";

    let indent = 0;

    return result
      .replace(/\{/g, "{\n")
      .replace(/\}/g, "\n}\n")
      .replace(/;/g, ";\n")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        if (line.startsWith("}")) {
          indent = Math.max(0, indent - 1);
        }

        const output = "  ".repeat(indent) + line;

        if (
          line.endsWith("{") ||
          line.includes("{")
        ) {
          indent++;
        }

        return output;
      })
      .join("\n");
  }

  function formatCurrent() {
    readEditors();

    if (state.activeTab === "html") {
      state.html = formatHTML(state.html);
    }

    if (state.activeTab === "css") {
      state.css = formatCSS(state.css);
    }

    if (state.activeTab === "js") {
      state.js = formatJS(state.js);
    }

    writeEditors();

    const editor = getEditor(state.activeTab);

    if (editor) {
      editor.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );
    }

    notify("Đã format code.", "success");
  }

  /* ---------------------------------------------------------
     Clear
     --------------------------------------------------------- */

  function clear() {
    state.html = "";
    state.css = "";
    state.js = "";

    writeEditors();
    clearConsole();

    const preview = getPreview();

    if (preview) {
      preview.srcdoc = "";
    }

    notify("Đã xóa Playground.", "success");
  }

  /* ---------------------------------------------------------
     Line Numbers
     --------------------------------------------------------- */

  function updateLineNumbers() {
    document
      .querySelectorAll(
        "[data-playground-line-numbers]"
      )
      .forEach((container) => {
        const target =
          container.dataset.playgroundLineNumbers;

        const editor = target
          ? document.querySelector(target)
          : getEditor(state.activeTab);

        if (!editor) return;

        const lineCount =
          editor.value.split("\n").length;

        let html = "";

        for (let i = 1; i <= lineCount; i++) {
          html += `<span>${i}</span>`;
        }

        container.innerHTML = html;
      });
  }

  /* ---------------------------------------------------------
     Keyboard
     --------------------------------------------------------- */

  function handleEditorKeydown(event) {
    const editor = event.target;

    if (!editor.matches("textarea, [contenteditable='true']")) {
      return;
    }

    /* Ctrl/Cmd + Enter → Run */
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();
      run();
      return;
    }

    /* Tab → indentation */
    if (event.key === "Tab" && editor.tagName === "TEXTAREA") {
      event.preventDefault();

      const start = editor.selectionStart;
      const end = editor.selectionEnd;

      editor.value =
        editor.value.substring(0, start) +
        "  " +
        editor.value.substring(end);

      editor.selectionStart = start + 2;
      editor.selectionEnd = start + 2;

      editor.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );
    }
  }

  /* ---------------------------------------------------------
     Persistence
     --------------------------------------------------------- */

  function savePlayground() {
    readEditors();

    try {
      localStorage.setItem(
        "KAISOUL_DEV_PLAYGROUND",
        JSON.stringify({
          html: state.html,
          css: state.css,
          js: state.js
        })
      );
    } catch (error) {
      console.warn(
        "[KAISOUL DEV] Cannot save Playground:",
        error
      );
    }
  }

  function loadPlayground() {
    try {
      const raw = localStorage.getItem(
        "KAISOUL_DEV_PLAYGROUND"
      );

      if (!raw) return;

      const data = JSON.parse(raw);

      if (typeof data.html === "string") {
        state.html = data.html;
      }

      if (typeof data.css === "string") {
        state.css = data.css;
      }

      if (typeof data.js === "string") {
        state.js = data.js;
      }

      writeEditors();
    } catch (error) {
      console.warn(
        "[KAISOUL DEV] Cannot load Playground:",
        error
      );
    }
  }

  /* ---------------------------------------------------------
     Events
     --------------------------------------------------------- */

  function bindEvents() {
    document.addEventListener("click", function (event) {
      const tab = event.target.closest(
        "[data-playground-tab], [data-playground-language]"
      );

      if (tab) {
        const value =
          tab.dataset.playgroundTab ||
          tab.dataset.playgroundLanguage;

        setActiveTab(value);
        return;
      }

      const action = event.target.closest(
        "[data-playground-action]"
      );

      if (!action) return;

      const value = action.dataset.playgroundAction;

      switch (value) {
        case "run":
          run();
          break;

        case "clear":
          clear();
          break;

        case "format":
          formatCurrent();
          break;

        case "clear-console":
          clearConsole();
          break;

        case "reload":
          run();
          break;
      }
    });

    document.addEventListener(
      "input",
      function (event) {
        const editor = event.target.closest(
          "[data-playground-editor], textarea"
        );

        if (!editor) return;

        const htmlEditor = getEditor("html");
        const cssEditor = getEditor("css");
        const jsEditor = getEditor("js");

        if (editor === htmlEditor) {
          state.html = editor.value;
        }

        if (editor === cssEditor) {
          state.css = editor.value;
        }

        if (editor === jsEditor) {
          state.js = editor.value;
        }

        updateLineNumbers();
        savePlayground();
      }
    );

    document.addEventListener(
      "keydown",
      handleEditorKeydown
    );

    window.addEventListener(
      "message",
      handleMessage
    );

    document.addEventListener(
      "scroll",
      updateLineNumbers,
      true
    );
  }

  /* ---------------------------------------------------------
     Public API
     --------------------------------------------------------- */

  window.KAISoulPlayground = {
    init,
    run,
    clear,
    format: formatCurrent,
    clearConsole,
    setActiveTab,
    getState: function () {
      return {
        html: state.html,
        css: state.css,
        js: state.js,
        activeTab: state.activeTab
      };
    }
  };

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */

  function init() {
    const htmlEditor = getEditor("html");
    const cssEditor = getEditor("css");
    const jsEditor = getEditor("js");
    const preview = getPreview();

    if (
      !htmlEditor &&
      !cssEditor &&
      !jsEditor &&
      !preview
    ) {
      return;
    }

    loadPlayground();
    bindEvents();
    setActiveTab(state.activeTab);
    updateLineNumbers();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();
