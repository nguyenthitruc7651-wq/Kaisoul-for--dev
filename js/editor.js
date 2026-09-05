/* =========================================
   KAISOUL DEV — EDITOR
   HTML / CSS / JavaScript editor controller
   ========================================= */

(function () {
  "use strict";

  let currentProject = null;
  let currentLanguage = "html";

  let editors = {
    html: null,
    css: null,
    javascript: null
  };

  let autoSaveTimer = null;

  let history = {
    html: [],
    css: [],
    javascript: []
  };

  let historyIndex = {
    html: -1,
    css: -1,
    javascript: -1
  };

  let isRestoringHistory = false;

  const STORAGE =
    window.KAISoulStorage || null;

  const PREVIEW =
    window.KAISoulPreview || null;


  /* =========================================
     INITIALIZATION
     ========================================= */

  function init() {

    findEditors();

    bindLanguageTabs();

    bindEditorEvents();

    bindEditorActions();

    loadCurrentProject();

    applyEditorSettings();

    console.log(
      "KAISOUL DEV Editor initialized."
    );
  }


  /* =========================================
     FIND EDITORS
     ========================================= */

  function findEditors() {

    editors.html =
      document.querySelector(
        "#htmlEditor, textarea[data-language='html'], textarea[data-editor='html']"
      );

    editors.css =
      document.querySelector(
        "#cssEditor, textarea[data-language='css'], textarea[data-editor='css']"
      );

    editors.javascript =
      document.querySelector(
        "#jsEditor, #javascriptEditor, textarea[data-language='javascript'], textarea[data-editor='javascript']"
      );

    /*
     * Fallback:
     * Find editors by class/data attributes.
     */

    if (!editors.html) {
      editors.html =
        document.querySelector(
          ".code-editor[data-lang='html']"
        );
    }

    if (!editors.css) {
      editors.css =
        document.querySelector(
          ".code-editor[data-lang='css']"
        );
    }

    if (!editors.javascript) {
      editors.javascript =
        document.querySelector(
          ".code-editor[data-lang='javascript']"
        );
    }
  }


  /* =========================================
     LANGUAGE TABS
     ========================================= */

  function bindLanguageTabs() {

    document
      .querySelectorAll(
        "[data-editor-tab], [data-language-tab]"
      )
      .forEach(tab => {

        tab.addEventListener(
          "click",
          function () {

            const language =
              this.dataset.editorTab ||
              this.dataset.languageTab;

            if (!language) {
              return;
            }

            switchLanguage(
              normalizeLanguage(language)
            );
          }
        );
      });
  }


  function normalizeLanguage(language) {

    language =
      String(language)
        .toLowerCase()
        .trim();

    if (
      language === "js" ||
      language === "javascript"
    ) {
      return "javascript";
    }

    if (language === "css") {
      return "css";
    }

    return "html";
  }


  function switchLanguage(language) {

    currentLanguage =
      normalizeLanguage(language);

    Object.keys(editors).forEach(
      key => {

        const editor =
          editors[key];

        if (!editor) {
          return;
        }

        const container =
          editor.closest(
            ".editor-container, .code-editor-container, .editor-pane, .editor-panel"
          );

        if (container) {

          container.classList.toggle(
            "active",
            key === currentLanguage
          );

          container.hidden =
            key !== currentLanguage;

        } else {

          editor.style.display =
            key === currentLanguage
              ? ""
              : "none";
        }
      }
    );


    document
      .querySelectorAll(
        "[data-editor-tab], [data-language-tab]"
      )
      .forEach(tab => {

        const language =
          normalizeLanguage(
            tab.dataset.editorTab ||
            tab.dataset.languageTab
          );

        const active =
          language === currentLanguage;

        tab.classList.toggle(
          "active",
          active
        );

        tab.setAttribute(
          "aria-selected",
          active
            ? "true"
            : "false"
        );
      });


    updateLineNumbers();

    updateEditorStatus();
  }


  /* =========================================
     EDITOR EVENTS
     ========================================= */

  function bindEditorEvents() {

    Object.keys(editors).forEach(
      language => {

        const editor =
          editors[language];

        if (!editor) {
          return;
        }

        editor.addEventListener(
          "input",
          function () {

            if (isRestoringHistory) {
              return;
            }

            pushHistory(language);

            scheduleAutoSave();

            updateLineNumbers();

            updateEditorStatus();

            if (
              getSettings()
                ?.preview
                ?.autoReload
            ) {
              schedulePreview();
            }
          }
        );


        editor.addEventListener(
          "keydown",
          handleEditorKeydown
        );


        editor.addEventListener(
          "scroll",
          function () {

            syncLineNumbers(
              language
            );
          }
        );
      }
    );
  }


  /* =========================================
     KEYBOARD SHORTCUTS
     ========================================= */

  function handleEditorKeydown(event) {

    const key =
      event.key.toLowerCase();

    /*
     * Ctrl / Cmd + S
     */

    if (
      (event.ctrlKey || event.metaKey) &&
      key === "s"
    ) {

      event.preventDefault();

      save();

      return;
    }


    /*
     * Ctrl / Cmd + Enter
     */

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "Enter"
    ) {

      event.preventDefault();

      run();

      return;
    }


    /*
     * Ctrl / Cmd + Z
     */

    if (
      (event.ctrlKey || event.metaKey) &&
      key === "z" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      undo();

      return;
    }


    /*
     * Ctrl / Cmd + Shift + Z
     */

    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      key === "z"
    ) {

      event.preventDefault();

      redo();

      return;
    }


    /*
     * Tab inserts spaces instead
     * of leaving textarea.
     */

    if (event.key === "Tab") {

      event.preventDefault();

      const start =
        event.target.selectionStart;

      const end =
        event.target.selectionEnd;

      const settings =
        getSettings();

      const tabSize =
        Number(
          settings?.editor?.tabSize || 2
        );

      const spaces =
        " ".repeat(tabSize);

      const value =
        event.target.value;

      event.target.value =
        value.substring(0, start) +
        spaces +
        value.substring(end);

      event.target.selectionStart =
        event.target.selectionEnd =
        start + tabSize;

      event.target.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );
    }
  }


  /* =========================================
     EDITOR ACTIONS
     ========================================= */

  function bindEditorActions() {

    document
      .querySelectorAll(
        "[data-editor-action]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          function () {

            handleAction(
              this.dataset.editorAction
            );
          }
        );
      });


    /*
     * Generic buttons with common IDs.
     */

    bindClick(
      "#runProject",
      run
    );

    bindClick(
      "#saveProject",
      save
    );

    bindClick(
      "#undoCode",
      undo
    );

    bindClick(
      "#redoCode",
      redo
    );

    bindClick(
      "#formatCode",
      format
    );

    bindClick(
      "#clearCode",
      clearCurrentEditor
    );

    bindClick(
      "#openPreview",
      openPreview
    );

    bindClick(
      "#newTabPreview",
      openPreviewInNewTab
    );

    bindClick(
      "#clearConsole",
      clearConsole
    );
  }


  function bindClick(
    selector,
    callback
  ) {

    const element =
      document.querySelector(selector);

    if (!element) {
      return;
    }

    element.addEventListener(
      "click",
      callback
    );
  }


  function handleAction(action) {

    switch (action) {

      case "run":
        run();
        break;

      case "save":
        save();
        break;

      case "undo":
        undo();
        break;

      case "redo":
        redo();
        break;

      case "format":
        format();
        break;

      case "clear":
        clearCurrentEditor();
        break;

      case "preview":
        openPreview();
        break;

      case "new-tab":
        openPreviewInNewTab();
        break;

      case "search":
        openSearch();
        break;

      case "settings":
        openEditorSettings();
        break;
    }
  }


  /* =========================================
     LOAD CURRENT PROJECT
     ========================================= */

  function loadCurrentProject() {

    if (!STORAGE) {
      return;
    }

    currentProject =
      STORAGE.getCurrentProject();

    /*
     * If there is no project,
     * create a default project.
     */

    if (!currentProject) {

      currentProject =
        STORAGE.createProject({
          name: "Untitled Project",
          type: "website"
        });
    }


    setEditorValue(
      "html",
      currentProject.html || ""
    );

    setEditorValue(
      "css",
      currentProject.css || ""
    );

    setEditorValue(
      "javascript",
      currentProject.javascript || ""
    );


    resetHistory();

    updateProjectTitle();

    updateLineNumbers();

    updateEditorStatus();

    if (PREVIEW) {

      PREVIEW.init({
        frame:
          document.querySelector(
            "#previewFrame, .preview-frame"
          ),

        console:
          document.querySelector(
            "#consoleOutput, .console-output"
          )
      });

      PREVIEW.run(
        getEditorValue("html"),
        getEditorValue("css"),
        getEditorValue("javascript")
      );
    }
  }


  /* =========================================
     GET / SET CODE
     ========================================= */

  function getEditorValue(language) {

    const editor =
      editors[
        normalizeLanguage(language)
      ];

    return editor
      ? editor.value
      : "";
  }


  function setEditorValue(
    language,
    value
  ) {

    const editor =
      editors[
        normalizeLanguage(language)
      ];

    if (!editor) {
      return;
    }

    editor.value =
      typeof value === "string"
        ? value
        : "";
  }


  function getAllCode() {

    return {
      html:
        getEditorValue("html"),

      css:
        getEditorValue("css"),

      javascript:
        getEditorValue("javascript")
    };
  }


  /* =========================================
     SAVE
     ========================================= */

  function save(
    showMessage = true
  ) {

    if (!STORAGE) {
      return null;
    }

    if (!currentProject) {
      currentProject =
        STORAGE.getCurrentProject();
    }

    if (!currentProject) {
      return null;
    }

    const code =
      getAllCode();

    const updated =
      STORAGE.updateProject(
        currentProject.id,
        {
          html: code.html,

          css: code.css,

          javascript: code.javascript,

          version:
            (currentProject.version || 1) + 1
        }
      );

    if (!updated) {
      return null;
    }

    currentProject =
      updated;

    STORAGE.createVersion(
      currentProject,
      "Saved changes"
    );

    updateProjectTitle();

    updateEditorStatus(
      "Saved"
    );


    if (showMessage) {

      toast(
        "Project saved.",
        "success"
      );
    }

    return currentProject;
  }


  /* =========================================
     AUTO SAVE
     ========================================= */

  function scheduleAutoSave() {

    const settings =
      getSettings();

    if (
      !settings?.editor?.autoSave
    ) {
      return;
    }

    clearTimeout(
      autoSaveTimer
    );

    const delay =
      Number(
        settings.editor.autoSaveDelay ||
        1000
      );

    autoSaveTimer =
      setTimeout(
        function () {

          save(false);

        },
        delay
      );
  }


  /* =========================================
     PREVIEW
     ========================================= */

  let previewTimer = null;

  function schedulePreview() {

    clearTimeout(
      previewTimer
    );

    previewTimer =
      setTimeout(
        run,
        250
      );
  }


  function run() {

    const code =
      getAllCode();

    if (!PREVIEW) {

      toast(
        "Preview engine chưa được tải.",
        "error"
      );

      return;
    }

    PREVIEW.run(
      code.html,
      code.css,
      code.javascript
    );

    updateEditorStatus(
      "Running"
    );
  }


  function openPreview() {

    const preview =
      document.querySelector(
        ".preview-panel"
      );

    if (preview) {

      preview.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    run();
  }


  function openPreviewInNewTab() {

    const code =
      getAllCode();

    if (!PREVIEW) {
      return;
    }

    PREVIEW.openInNewTab(
      code.html,
      code.css,
      code.javascript
    );
  }


  function clearConsole() {

    if (PREVIEW) {
      PREVIEW.clearConsole();
    }
  }


  /* =========================================
     UNDO / REDO
     ========================================= */

  function resetHistory() {

    Object.keys(history)
      .forEach(language => {

        history[language] = [
          getEditorValue(language)
        ];

        historyIndex[language] = 0;

      });
  }


  function pushHistory(language) {

    if (isRestoringHistory) {
      return;
    }

    const value =
      getEditorValue(language);

    const list =
      history[language];

    const index =
      historyIndex[language];

    if (
      list[index] === value
    ) {
      return;
    }

    /*
     * Remove redo states.
     */

    history[language] =
      list.slice(
        0,
        index + 1
      );

    history[language].push(
      value
    );

    /*
     * Keep history reasonable.
     */

    if (
      history[language].length > 100
    ) {

      history[language].shift();

    }

    historyIndex[language] =
      history[language].length - 1;
  }


  function undo() {

    const language =
      currentLanguage;

    const index =
      historyIndex[language];

    if (index <= 0) {

      toast(
        "Không còn thao tác để Undo.",
        "info"
      );

      return;
    }

    historyIndex[language] =
      index - 1;

    restoreHistory(
      language
    );
  }


  function redo() {

    const language =
      currentLanguage;

    const index =
      historyIndex[language];

    const list =
      history[language];

    if (
      index >= list.length - 1
    ) {

      toast(
        "Không còn thao tác để Redo.",
        "info"
      );

      return;
    }

    historyIndex[language] =
      index + 1;

    restoreHistory(
      language
    );
  }


  function restoreHistory(
    language
  ) {

    isRestoringHistory = true;

    setEditorValue(
      language,
      history[language][
        historyIndex[language]
      ]
    );

    isRestoringHistory = false;

    updateLineNumbers();

    updateEditorStatus(
      "Unsaved changes"
    );

    scheduleAutoSave();

    if (
      getSettings()
        ?.preview
        ?.autoReload
    ) {
      schedulePreview();
    }
  }


  /* =========================================
     FORMAT
     ========================================= */

  function format() {

    const language =
      currentLanguage;

    const value =
      getEditorValue(language);

    let formatted =
      value;

    if (
      language === "html"
    ) {
      formatted =
        formatHTML(value);
    }

    if (
      language === "css"
    ) {
      formatted =
        formatCSS(value);
    }

    if (
      language === "javascript"
    ) {
      formatted =
        formatJavaScript(value);
    }

    setEditorValue(
      language,
      formatted
    );

    pushHistory(language);

    updateLineNumbers();

    scheduleAutoSave();

    toast(
      "Code formatted.",
      "success"
    );
  }


  function formatHTML(code) {

    if (!code.trim()) {
      return "";
    }

    const lines =
      code
        .replace(/>\s*</g, "><")
        .replace(
          /></g,
          ">\n<"
        )
        .split("\n");

    let indent = 0;

    const output = [];

    lines.forEach(line => {

      line = line.trim();

      if (!line) {
        return;
      }

      if (
        /^<\/[\w-]+>/.test(line)
      ) {
        indent =
          Math.max(
            0,
            indent - 1
          );
      }

      output.push(
        "  ".repeat(indent) +
        line
      );

      if (
        /^<[\w-]+(?:\s[^>]*)?>$/.test(line) &&
        !/^<(meta|link|img|input|br|hr|area|base|embed|source|track|wbr)\b/i.test(line)
      ) {
        indent++;
      }

    });

    return output.join("\n");
  }


  function formatCSS(code) {

    if (!code.trim()) {
      return "";
    }

    let result =
      code
        .replace(/\s+/g, " ")
        .replace(/\s*{\s*/g, " {\n")
        .replace(/;\s*/g, ";\n")
        .replace(/\s*}\s*/g, "\n}\n");

    let indent = 0;

    const lines =
      result
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    const output = [];

    lines.forEach(line => {

      if (line.startsWith("}")) {
        indent =
          Math.max(
            0,
            indent - 1
          );
      }

      output.push(
        "  ".repeat(indent) +
        line
      );

      if (
        line.endsWith("{")
      ) {
        indent++;
      }
    });

    return output.join("\n");
  }


  function formatJavaScript(code) {

    /*
     * Lightweight formatter.
     * Does not attempt to fully parse JavaScript.
     */

    if (!code.trim()) {
      return "";
    }

    let result =
      code
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+$/gm, "");

    let indent = 0;

    const output = [];

    const lines =
      result.split("\n");

    lines.forEach(line => {

      let trimmed =
        line.trim();

      if (!trimmed) {
        output.push("");
        return;
      }

      if (
        /^[}\])]/.test(trimmed)
      ) {
        indent =
          Math.max(
            0,
            indent - 1
          );
      }

      output.push(
        "  ".repeat(indent) +
        trimmed
      );

      const opens =
        (trimmed.match(
          /[{[(]/g
        ) || []).length;

      const closes =
        (trimmed.match(
          /[}\])]/g
        ) || []).length;

      indent +=
        opens - closes;

      indent =
        Math.max(
          0,
          indent
        );
    });

    return output.join("\n");
  }


  /* =========================================
     CLEAR CURRENT EDITOR
     ========================================= */

  function clearCurrentEditor() {

    const confirmed =
      window.confirm(
        "Xóa toàn bộ code trong editor?"
      );

    if (!confirmed) {
      return;
    }

    setEditorValue(
      currentLanguage,
      ""
    );

    pushHistory(
      currentLanguage
    );

    updateLi
