(function () {
  "use strict";

  const state = {
    settings: {},
    activeCategory: "appearance"
  };

  const DEFAULTS = {
    appearance: {
      theme: "dark",
      accentColor: "kaisoul",
      density: "comfortable"
    },

    editor: {
      fontSize: 14,
      fontFamily: "JetBrains Mono",
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,
      minimap: true,
      bracketMatching: true,
      autoIndent: true,
      syntaxHighlighting: true,
      autoSave: true,
      autoSaveDelay: 1
    },

    preview: {
      autoReload: true,
      reloadOnSave: true,
      defaultDevice: "desktop",
      openInNewTab: false
    },

    ai: {
      provider: "Gemini",
      model: "Gemini",
      suggestions: true,
      includeCurrentCode: true,
      autoFixErrors: false,
      responseStyle: "balanced"
    },

    notifications: {
      community: true,
      comments: true,
      likes: true,
      forks: true,
      projectUpdates: true,
      news: true
    },

    projects: {
      defaultType: "website",
      defaultSaveLocation: "my-projects",
      createBackup: true,
      versionHistory: true,
      maximumVersions: 20
    },

    privacy: {
      profileVisibility: "public",
      projectDefault: "private",
      communityActivity: true,
      usageAnalytics: false
    }
  };

  const CATEGORY_NAMES = [
    "appearance",
    "editor",
    "preview",
    "ai",
    "notifications",
    "projects",
    "keyboard",
    "account",
    "privacy",
    "data",
    "about"
  ];

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    loadSettings();
    bindEvents();
    render();
    applySettings();
  }

  function loadSettings() {
    let saved = {};

    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.getSettings === "function"
    ) {
      try {
        saved =
          window.KAISoulStorage.getSettings() || {};
      } catch (error) {
        console.warn(
          "[KAISOUL DEV] Settings load error:",
          error
        );
      }
    }

    state.settings = deepMerge(
      deepClone(DEFAULTS),
      saved
    );
  }

  /* =========================================================
     RENDER
     ========================================================= */

  function render() {
    updateCategoryNavigation();
    syncControls();
    updateAccount();
    updateStorageInfo();
  }

  function updateCategoryNavigation() {
    document
      .querySelectorAll(
        "[data-settings-category]"
      )
      .forEach(item => {
        const category =
          item.dataset.settingsCategory;

        item.classList.toggle(
          "active",
          category === state.activeCategory
        );
      });

    document
      .querySelectorAll(
        "[data-settings-panel]"
      )
      .forEach(panel => {
        const category =
          panel.dataset.settingsPanel;

        const active =
          category === state.activeCategory;

        panel.classList.toggle(
          "active",
          active
        );

        panel.hidden = !active;
      });
  }

  function syncControls() {
    const s = state.settings;

    setValue(
      "[data-setting='appearance.theme']",
      s.appearance.theme
    );

    setValue(
      "[data-setting='appearance.accentColor']",
      s.appearance.accentColor
    );

    setValue(
      "[data-setting='appearance.density']",
      s.appearance.density
    );

    setValue(
      "[data-setting='editor.fontSize']",
      s.editor.fontSize
    );

    setValue(
      "[data-setting='editor.fontFamily']",
      s.editor.fontFamily
    );

    setValue(
      "[data-setting='editor.tabSize']",
      s.editor.tabSize
    );

    setChecked(
      "[data-setting='editor.wordWrap']",
      s.editor.wordWrap
    );

    setChecked(
      "[data-setting='editor.lineNumbers']",
      s.editor.lineNumbers
    );

    setChecked(
      "[data-setting='editor.minimap']",
      s.editor.minimap
    );

    setChecked(
      "[data-setting='editor.bracketMatching']",
      s.editor.bracketMatching
    );

    setChecked(
      "[data-setting='editor.autoIndent']",
      s.editor.autoIndent
    );

    setChecked(
      "[data-setting='editor.syntaxHighlighting']",
      s.editor.syntaxHighlighting
    );

    setChecked(
      "[data-setting='editor.autoSave']",
      s.editor.autoSave
    );

    setValue(
      "[data-setting='editor.autoSaveDelay']",
      s.editor.autoSaveDelay
    );

    setChecked(
      "[data-setting='preview.autoReload']",
      s.preview.autoReload
    );

    setChecked(
      "[data-setting='preview.reloadOnSave']",
      s.preview.reloadOnSave
    );

    setValue(
      "[data-setting='preview.defaultDevice']",
      s.preview.defaultDevice
    );

    setChecked(
      "[data-setting='preview.openInNewTab']",
      s.preview.openInNewTab
    );

    setValue(
      "[data-setting='ai.provider']",
      s.ai.provider
    );

    setValue(
      "[data-setting='ai.model']",
      s.ai.model
    );

    setChecked(
      "[data-setting='ai.suggestions']",
      s.ai.suggestions
    );

    setChecked(
      "[data-setting='ai.includeCurrentCode']",
      s.ai.includeCurrentCode
    );

    setChecked(
      "[data-setting='ai.autoFixErrors']",
      s.ai.autoFixErrors
    );

    setValue(
      "[data-setting='ai.responseStyle']",
      s.ai.responseStyle
    );

    setChecked(
      "[data-setting='notifications.community']",
      s.notifications.community
    );

    setChecked(
      "[data-setting='notifications.comments']",
      s.notifications.comments
    );

    setChecked(
      "[data-setting='notifications.likes']",
      s.notifications.likes
    );

    setChecked(
      "[data-setting='notifications.forks']",
      s.notifications.forks
    );

    setChecked(
      "[data-setting='notifications.projectUpdates']",
      s.notifications.projectUpdates
    );

    setChecked(
      "[data-setting='notifications.news']",
      s.notifications.news
    );

    setValue(
      "[data-setting='projects.defaultType']",
      s.projects.defaultType
    );

    setValue(
      "[data-setting='projects.defaultSaveLocation']",
      s.projects.defaultSaveLocation
    );

    setChecked(
      "[data-setting='projects.createBackup']",
      s.projects.createBackup
    );

    setChecked(
      "[data-setting='projects.versionHistory']",
      s.projects.versionHistory
    );

    setValue(
      "[data-setting='projects.maximumVersions']",
      s.projects.maximumVersions
    );

    setValue(
      "[data-setting='privacy.profileVisibility']",
      s.privacy.profileVisibility
    );

    setValue(
      "[data-setting='privacy.projectDefault']",
      s.privacy.projectDefault
    );

    setChecked(
      "[data-setting='privacy.communityActivity']",
      s.privacy.communityActivity
    );

    setChecked(
      "[data-setting='privacy.usageAnalytics']",
      s.privacy.usageAnalytics
    );
  }

  function updateAccount() {
    const user =
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.getUser === "function"
        ? window.KAISoulStorage.getUser()
        : null;

    document
      .querySelectorAll(
        "[data-account-username]"
      )
      .forEach(element => {
        element.textContent =
          user?.username ||
          user?.name ||
          "Not signed in";
      });

    document
      .querySelectorAll(
        "[data-account-id]"
      )
      .forEach(element => {
        element.textContent =
          user?.id ||
          user?.kaisoulId ||
          "Not connected";
      });

    document
      .querySelectorAll(
        "[data-account-status]"
      )
      .forEach(element => {
        element.textContent =
          user
            ? "Signed in"
            : "Not signed in";
      });
  }

  function updateStorageInfo() {
    let size = "0 KB";

    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.getStorageSize ===
      "function"
    ) {
      try {
        size =
          window.KAISoulStorage.getStorageSize();
      } catch (error) {}
    }

    document
      .querySelectorAll(
        "[data-storage-size]"
      )
      .forEach(element => {
        element.textContent = size;
      });
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
      "change",
      handleChange
    );

    document.addEventListener(
      "input",
      handleInput
    );

    document.addEventListener(
      "keydown",
      handleKeyboard
    );
  }

  function handleClick(event) {
    const category =
      event.target.closest(
        "[data-settings-category]"
      );

    if (category) {
      setCategory(
        category.dataset.settingsCategory
      );
      return;
    }

    const reset =
      event.target.closest(
        "[data-settings-reset]"
      );

    if (reset) {
      resetSettings();
      return;
    }

    const exportButton =
      event.target.closest(
        "[data-settings-export]"
      );

    if (exportButton) {
      exportData();
      return;
    }

    const backup =
      event.target.closest(
        "[data-settings-backup]"
      );

    if (backup) {
      downloadBackup();
      return;
    }

    const importButton =
      event.target.closest(
        "[data-settings-import]"
      );

    if (importButton) {
      openImportPicker();
      return;
    }

    const clearData =
      event.target.closest(
        "[data-settings-clear-data]"
      );

    if (clearData) {
      clearLocalData();
      return;
    }

    const login =
      event.target.closest(
        "[data-settings-login]"
      );

    if (login) {
      openKaisoulID();
      return;
    }

    const logout =
      event.target.closest(
        "[data-settings-logout]"
      );

    if (logout) {
      logoutUser();
      return;
    }

    const increase =
      event.target.closest(
        "[data-setting-increase]"
      );

    if (increase) {
      adjustNumberSetting(
        increase.dataset.settingIncrease,
        1
      );
      return;
    }

    const decrease =
      event.target.closest(
        "[data-setting-decrease]"
      );

    if (decrease) {
      adjustNumberSetting(
        decrease.dataset.settingDecrease,
        -1
      );
    }
  }

  function handleChange(event) {
    const control =
      event.target.closest(
        "[data-setting]"
      );

    if (!control) return;

    updateSettingFromControl(control);
  }

  function handleInput(event) {
    const control =
      event.target.closest(
        "[data-setting]"
      );

    if (!control) return;

    if (
      control.type !== "checkbox" &&
      control.type !== "radio"
    ) {
      updateSettingFromControl(
        control,
        false
      );
    }
  }

  /* =========================================================
     SETTING UPDATE
     ========================================================= */

  function updateSettingFromControl(
    control,
    rerender = true
  ) {
    const path =
      control.dataset.setting;

    if (!path) return;

    let value;

    if (control.type === "checkbox") {
      value = control.checked;
    } else if (control.type === "number") {
      value = Number(control.value);
    } else {
      value = control.value;
    }

    setByPath(
      state.settings,
      path,
      value
    );

    saveSettings();

    if (rerender) {
      render();
    }

    applySettings();
  }

  function setCategory(category) {
    if (!CATEGORY_NAMES.includes(category)) {
      category = "appearance";
    }

    state.activeCategory = category;

    updateCategoryNavigation();

    const panel =
      document.querySelector(
        `[data-settings-panel="${CSS.escape(category)}"]`
      );

    if (panel) {
      panel.scrollTop = 0;
    }
  }

  function adjustNumberSetting(
    path,
    amount
  ) {
    const current =
      Number(getByPath(
        state.settings,
        path
      ));

    if (!Number.isFinite(current)) {
      return;
    }

    let next =
      current + amount;

    if (path === "editor.fontSize") {
      next = clamp(next, 10, 32);
    }

    if (path === "editor.tabSize") {
      next = clamp(next, 1, 8);
    }

    if (path === "editor.autoSaveDelay") {
      next = clamp(next, 0, 10);
    }

    if (path === "projects.maximumVersions") {
      next = clamp(next, 1, 100);
    }

    setByPath(
      state.settings,
      path,
      next
    );

    saveSettings();
    render();
    applySettings();
  }

  function saveSettings() {
    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.saveSettings ===
      "function"
    ) {
      try {
        window.KAISoulStorage.saveSettings(
          state.settings
        );
      } catch (error) {
        console.warn(
          "[KAISOUL DEV] Settings save error:",
          error
        );
      }
    }

    try {
      localStorage.setItem(
        "KAISOUL_DEV_SETTINGS",
        JSON.stringify(
          state.settings
        )
      );
    } catch (error) {}
  }

  /* =========================================================
     APPLY SETTINGS
     ========================================================= */

  function applySettings() {
    applyAppearance();
    applyEditorSettings();
    applyPreviewSettings();

    document.dispatchEvent(
      new CustomEvent(
        "kaisoul:settings-updated",
        {
          detail: deepClone(
            state.settings
          )
        }
      )
    );
  }

  function applyAppearance() {
    const appearance =
      state.settings.appearance;

    const theme =
      appearance.theme || "dark";

    document.documentElement.dataset.theme =
      theme;

    document.documentElement.dataset.density =
      appearance.density ||
      "comfortable";

    document.documentElement.dataset.accent =
      appearance.accentColor ||
      "kaisoul";

    if (theme === "light") {
      document.documentElement.classList.add(
        "light-theme"
      );
    } else if (theme === "dark") {
      document.documentElement.classList.remove(
        "light-theme"
      );
    } else {
      const dark =
        window.matchMedia &&
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

      document.documentElement.classList.toggle(
        "light-theme",
        !dark
      );
    }
  }

  function applyEditorSettings() {
    if (
      window.KAISoulEditor &&
      typeof window.KAISoulEditor.applySettings ===
      "function"
    ) {
      try {
        window.KAISoulEditor.applySettings(
          state.settings.editor
        );
      } catch (error) {
        console.warn(
          "[KAISOUL DEV] Editor settings apply error:",
          error
        );
      }
    }

    const editor =
      state.settings.editor;

    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${editor.fontSize}px`
    );

    document.documentElement.style.setProperty(
      "--editor-font-family",
      editor.fontFamily
    );

    document.documentElement.style.setProperty(
      "--editor-tab-size",
      String(editor.tabSize)
    );
  }

  function applyPreviewSettings() {
    document.documentElement.dataset.previewDevice =
      state.settings.preview.defaultDevice;
  }

  /* =========================================================
     RESET
     ========================================================= */

  function resetSettings() {
    const confirmed =
      window.confirm(
        "Reset all KAISOUL DEV settings to default?"
      );

    if (!confirmed) return;

    state.settings =
      deepClone(DEFAULTS);

    saveSettings();
    render();
    applySettings();

    notify(
      "Settings restored to default.",
      "success"
    );
  }

  /* =========================================================
     ACCOUNT
     ========================================================= */

  function openKaisoulID() {
    const url =
      "https://phanvanthanh702-dev.github.io/KAISOUL-ID/";

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function logoutUser() {
    const confirmed =
      window.confirm(
        "Log out of KAISOUL ID?"
      );

    if (!confirmed) return;

    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.clearUser ===
      "function"
    ) {
      window.KAISoulStorage.clearUser();
    }

    updateAccount();

    notify(
      "You have been logged out.",
      "success"
    );

    document.dispatchEvent(
      new CustomEvent(
        "kaisoul:logout"
      )
    );
  }

  /* =========================================================
     DATA
     ========================================================= */

  function exportData() {
    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.exportData ===
      "function"
    ) {
      try {
        const data =
          window.KAISoulStorage.exportData();

        downloadJSON(
          data,
          `kaisoul-dev-export-${dateStamp()}.json`
        );

        notify(
          "All project data exported.",
          "success"
        );

        return;
      } catch (error) {
        console.error(error);
      }
    }

    /*
     * Fallback
     */
    const data = {};

    for (
      let index = 0;
      index < localStorage.length;
      index++
    ) {
      const key =
        localStorage.key(index);

      try {
        data[key] =
          JSON.parse(
            localStorage.getItem(key)
          );
      } catch (error) {
        data[key] =
          localStorage.getItem(key);
      }
    }

    downloadJSON(
      data,
      `kaisoul-dev-export-${dateStamp()}.json`
    );
  }

  function downloadBackup() {
    exportData();
  }

  function openImportPicker() {
    let input =
      document.querySelector(
        "#kaisoulImportFile"
      );

    if (!input) {
      input =
        document.createElement("input");

      input.type = "file";
      input.accept = ".json,application/json";
      input.id = "kaisoulImportFile";

      input.style.display = "none";

      document.body.appendChild(input);

      input.addEventListener(
        "change",
        handleImport
      );
    }

    input.click();
  }

  async function handleImport(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      const text =
        await file.text();

      const data =
        JSON.parse(text);

      if (
        window.KAISoulStorage &&
        typeof window.KAISoulStorage.importData ===
        "function"
      ) {
        window.KAISoulStorage.importData(
          data
        );
      } else {
        importFallback(data);
      }

      loadSettings();
      render();
      applySettings();

      notify(
        "Data imported successfully.",
        "success"
      );
    } catch (error) {
      console.error(error);

      notify(
        "Invalid backup file.",
        "error"
      );
    }

    event.target.value = "";
  }

  function importFallback(data) {
    if (
      !data ||
      typeof data !== "object"
    ) {
      throw new Error(
        "Invalid data"
      );
    }

    Object.entries(data)
      .forEach(([key, value]) => {
        try {
          localStorage.setItem(
            key,
            JSON.stringify(value)
          );
        } catch (error) {}
      });
  }

  function clearLocalData() {
    const confirmed =
      window.confirm(
        "This will permanently remove locally stored projects and settings."
      );

    if (!confirmed) return;

    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.clearL
