/* =========================================
   KAISOUL DEV — PREVIEW ENGINE
   ========================================= */

(function () {
  "use strict";

  let currentDevice = "desktop";
  let previewFrame = null;
  let consoleOutput = null;

  const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>KAISOUL DEV Preview</title>
</head>
<body>
  <h1>Hello KAISOUL DEV</h1>
</body>
</html>`;

  function init(options = {}) {
    previewFrame =
      options.frame ||
      document.querySelector(
        "#previewFrame, .preview-frame, iframe[data-preview]"
      );

    consoleOutput =
      options.console ||
      document.querySelector(
        "#consoleOutput, .console-output, .console"
      );

    bindDeviceButtons();

    bindPreviewActions();

    if (previewFrame) {
      clearConsole();
    }

    console.log("KAISOUL DEV Preview initialized.");
  }


  /* =========================================
     BUILD PREVIEW DOCUMENT
     ========================================= */

  function buildDocument(html, css, javascript) {
    html = typeof html === "string" ? html : "";
    css = typeof css === "string" ? css : "";
    javascript =
      typeof javascript === "string"
        ? javascript
        : "";

    let documentHTML = html.trim();

    if (!documentHTML) {
      documentHTML = DEFAULT_HTML;
    }

    /*
     * If the user's HTML already contains
     * a complete document, inject CSS/JS into it.
     */

    if (
      /<html[\s>]/i.test(documentHTML)
    ) {
      if (/<\/head>/i.test(documentHTML)) {
        documentHTML = documentHTML.replace(
          /<\/head>/i,
          `<style id="kaisoul-user-css">
${css}
</style>
</head>`
        );
      } else {
        documentHTML =
          `<style id="kaisoul-user-css">
${css}
</style>\n` +
          documentHTML;
      }

      if (/<\/body>/i.test(documentHTML)) {
        documentHTML = documentHTML.replace(
          /<\/body>/i,
          `<script>
${createRuntimeScript(javascript)}
<\/script>
</body>`
        );
      } else {
        documentHTML += `
<script>
${createRuntimeScript(javascript)}
<\/script>`;
      }

      return documentHTML;
    }

    /*
     * Fragment HTML
     */

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<style id="kaisoul-user-css">
${css}
</style>
</head>

<body>

${documentHTML}

<script>
${createRuntimeScript(javascript)}
<\/script>

</body>
</html>`;
  }


  /* =========================================
     SANDBOX RUNTIME
     ========================================= */

  function createRuntimeScript(javascript) {
    const escapedCode = String(javascript)
      .replace(/<\/script/gi, "<\\/script");

    return `
(function () {

  function send(type, args) {

    try {

      window.parent.postMessage(
        {
          source: "KAISOUL_DEV_PREVIEW",
          type: type,
          args: args
        },
        "*"
      );

    } catch (error) {}

  }

  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = function () {
    const args = Array.from(arguments);

    send("log", serialize(args));

    originalLog.apply(console, arguments);
  };

  console.info = function () {
    const args = Array.from(arguments);

    send("info", serialize(args));

    originalInfo.apply(console, arguments);
  };

  console.warn = function () {
    const args = Array.from(arguments);

    send("warn", serialize(args));

    originalWarn.apply(console, arguments);
  };

  console.error = function () {
    const args = Array.from(arguments);

    send("error", serialize(args));

    originalError.apply(console, arguments);
  };

  window.addEventListener(
    "error",
    function (event) {

      send(
        "runtime-error",
        [
          event.message ||
          "Unknown runtime error"
        ]
      );

    }
  );

  window.addEventListener(
    "unhandledrejection",
    function (event) {

      send(
        "runtime-error",
        [
          String(
            event.reason ||
            "Unhandled promise rejection"
          )
        ]
      );

    }
  );


  function serialize(value) {

    return value.map(function (item) {

      if (
        item === null ||
        item === undefined
      ) {
        return String(item);
      }

      if (
        typeof item === "object"
      ) {

        try {
          return JSON.stringify(
            item,
            null,
            2
          );
        } catch (error) {
          return "[Object]";
        }

      }

      return String(item);

    });

  }


  try {

${escapedCode}

  } catch (error) {

    send(
      "runtime-error",
      [
        error.message ||
        String(error)
      ]
    );

  }

})();
`;
  }


  /* =========================================
     RUN
     ========================================= */

  function run(html, css, javascript) {

    if (!previewFrame) {
      previewFrame =
        document.querySelector(
          "#previewFrame, .preview-frame"
        );
    }

    if (!previewFrame) {
      console.warn(
        "KAISOUL DEV: Preview iframe not found."
      );

      return false;
    }

    clearConsole();

    const documentHTML =
      buildDocument(
        html,
        css,
        javascript
      );

    previewFrame.srcdoc =
      documentHTML;

    previewFrame.dataset.ready =
      "false";

    previewFrame.onload = function () {

      previewFrame.dataset.ready =
        "true";

      addConsoleMessage(
        "system",
        ["Preview loaded."]
      );

    };

    return true;
  }


  /* =========================================
     RELOAD
     ========================================= */

  function reload(
    html,
    css,
    javascript
  ) {
    return run(
      html,
      css,
      javascript
    );
  }


  /* =========================================
     NEW TAB
     ========================================= */

  function openInNewTab(
    html,
    css,
    javascript
  ) {

    const documentHTML =
      buildDocument(
        html,
        css,
        javascript
      );

    const blob =
      new Blob(
        [documentHTML],
        {
          type: "text/html"
        }
      );

    const url =
      URL.createObjectURL(blob);

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );

    setTimeout(
      function () {
        URL.revokeObjectURL(url);
      },
      60000
    );
  }


  /* =========================================
     DEVICE PREVIEW
     ========================================= */

  function setDevice(device) {

    const allowed =
      ["desktop", "tablet", "mobile"];

    if (!allowed.includes(device)) {
      device = "desktop";
    }

    currentDevice = device;

    const wrapper =
      document.querySelector(
        ".preview-frame-wrapper"
      );

    const frame =
      previewFrame ||
      document.querySelector(
        "#previewFrame, .preview-frame"
      );

    if (wrapper) {

      wrapper.dataset.device =
        device;

      wrapper.classList.remove(
        "device-desktop",
        "device-tablet",
        "device-mobile"
      );

      wrapper.classList.add(
        `device-${device}`
      );
    }

    if (frame) {

      frame.classList.remove(
        "desktop",
        "tablet",
        "mobile"
      );

      frame.classList.add(
        device
      );
    }

    document
      .querySelectorAll(
        "[data-preview-device]"
      )
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.previewDevice ===
          device
        );

        button.setAttribute(
          "aria-pressed",
          button.dataset.previewDevice ===
          device
            ? "true"
            : "false"
        );

      });

    return device;
  }


  function getDevice() {
    return currentDevice;
  }


  function bindDeviceButtons() {

    document
      .querySelectorAll(
        "[data-preview-device]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          function () {

            setDevice(
              this.dataset.previewDevice
            );

          }
        );

      });
  }


  /* =========================================
     CONSOLE
     ========================================= */

  function clearConsole() {

    if (!consoleOutput) {
      consoleOutput =
        document.querySelector(
          "#consoleOutput, .console-output"
        );
    }

    if (!consoleOutput) {
      return;
    }

    const lines =
      consoleOutput.querySelectorAll(
        ".console-line"
      );

    lines.forEach(
      line => line.remove()
    );

    consoleOutput.textContent = "";

  }


  function addConsoleMessage(
    type,
    args
  ) {

    if (!consoleOutput) {
      consoleOutput =
        document.querySelector(
          "#consoleOutput, .console-output"
        );
    }

    if (!consoleOutput) {
      return;
    }

    const line =
      document.createElement("div");

    line.className =
      "console-line";

    line.classList.add(
      `console-${type}`
    );

    const time =
      new Date().toLocaleTimeString();

    const text =
      Array.isArray(args)
        ? args.join(" ")
        : String(args);

    line.innerHTML = `
      <span class="console-time">
        ${escapeHTML(time)}
      </span>

      <span class="console-type">
        ${escapeHTML(type)}
      </span>

      <span class="console-message">
        ${escapeHTML(text)}
      </span>
    `;

    consoleOutput.appendChild(line);

    consoleOutput.scrollTop =
      consoleOutput.scrollHeight;
  }


  function escapeHTML(value) {

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  /* =========================================
     MESSAGE HANDLER
     ========================================= */

  window.addEventListener(
    "message",
    function (event) {

      const data = event.data;

      if (
        !data ||
        data.source !==
        "KAISOUL_DEV_PREVIEW"
      ) {
        return;
      }

      addConsoleMessage(
        data.type,
        data.args || []
      );

    }
  );


  /* =========================================
     PREVIEW ACTION BUTTONS
     ========================================= */

  function bindPreviewActions() {

    document
      .querySelectorAll(
        "[data-preview-action]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          function () {

            const action =
              this.dataset.previewAction;

            handleAction(action);

          }
        );

      });
  }


  function handleAction(action) {

    const project =
      getCurrentProject();

    if (!project) {

      if (
        typeof window.kaisoulToast ===
        "function"
      ) {
        window.kaisoulToast(
          "Chưa có project để preview.",
          "error"
        );
      }

      return;
    }

    switch (action) {

      case "run":

        run(
          project.html,
          project.css,
          project.javascript
        );

        break;


      case "reload":

        reload(
          project.html,
          project.css,
          project.javascript
        );

        break;


      case "clear-console":

        clearConsole();

        break;


      case "new-tab":

        openInNewTab(
          project.html,
          project.css,
          project.javascript
        );

        break;

    }
  }


  /* =========================================
     GET CURRENT PROJECT
     ========================================= */

  function getCurrentProject() {

    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage
        .getCurrentProject ===
        "function"
    ) {

      return window.KAISoulStorage
        .getCurrentProject();

    }

    return null;
  }


  /* =========================================
     PUBLIC API
     ========================================= */

  window.KAISoulPreview = {

    init,

    run,

    reload,

    buildDocument,

    openInNewTab,

    setDevice,

    getDevice,

    clearConsole,

    addConsoleMessage

  };

})();
