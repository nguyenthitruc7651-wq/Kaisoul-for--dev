/* =========================================
   KAISOUL DEV — STORAGE
   LocalStorage data manager
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    PROJECTS: "kaisoul_dev_projects",
    SETTINGS: "kaisoul_dev_settings",
    VERSIONS: "kaisoul_dev_versions",
    CURRENT_PROJECT: "kaisoul_dev_current_project",
    RECENT_PROJECTS: "kaisoul_dev_recent_projects",
    USER: "kaisoul_dev_user"
  };

  const DEFAULT_SETTINGS = {
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
      autoSaveDelay: 1000
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
      kaisoulNews: true
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
      projectDefaultVisibility: "private",
      communityActivity: true,
      usageAnalytics: false
    }
  };


  /* =========================================
     BASIC STORAGE HELPERS
     ========================================= */

  function read(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);

      if (value === null) {
        return fallback;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error("KAISOUL DEV Storage Read Error:", error);
      return fallback;
    }
  }


  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("KAISOUL DEV Storage Write Error:", error);

      if (typeof window.kaisoulToast === "function") {
        window.kaisoulToast(
          "Không thể lưu dữ liệu. Bộ nhớ có thể đã đầy.",
          "error"
        );
      }

      return false;
    }
  }


  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("KAISOUL DEV Storage Remove Error:", error);
      return false;
    }
  }


  /* =========================================
     ID GENERATOR
     ========================================= */

  function generateId(prefix = "id") {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }


  /* =========================================
     PROJECTS
     ========================================= */

  function getProjects() {
    return read(STORAGE_KEYS.PROJECTS, []);
  }


  function getProject(id) {
    const projects = getProjects();

    return projects.find(project => project.id === id) || null;
  }


  function createProject(data = {}) {
    const now = new Date().toISOString();

    const project = {
      id: generateId("project"),

      name: data.name || "Untitled Project",

      type: data.type || "website",

      visibility:
        data.visibility ||
        getSettings().privacy.projectDefaultVisibility ||
        "private",

      description: data.description || "",

      html:
        typeof data.html === "string"
          ? data.html
          : "<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"UTF-8\">\n  <title>KAISOUL DEV</title>\n</head>\n<body>\n  <h1>Hello KAISOUL DEV</h1>\n</body>\n</html>",

      css:
        typeof data.css === "string"
          ? data.css
          : "body {\n  font-family: sans-serif;\n}",

      javascript:
        typeof data.javascript === "string"
          ? data.javascript
          : "console.log('Hello KAISOUL DEV');",

      language: data.language || "HTML / CSS / JavaScript",

      createdAt: now,

      updatedAt: now,

      lastOpenedAt: now,

      version: 1,

      published: false,

      publicUrl: null,

      thumbnail: data.thumbnail || null,

      tags: Array.isArray(data.tags) ? data.tags : [],

      author: data.author || getUser(),

      favorite: false
    };

    const projects = getProjects();

    projects.unshift(project);

    write(STORAGE_KEYS.PROJECTS, projects);

    setCurrentProject(project.id);

    addRecentProject(project.id);

    createVersion(project, "Initial version");

    return project;
  }


  function updateProject(id, changes = {}) {
    const projects = getProjects();

    const index = projects.findIndex(project => project.id === id);

    if (index === -1) {
      return null;
    }

    const oldProject = projects[index];

    const updatedProject = {
      ...oldProject,
      ...changes,

      id: oldProject.id,

      createdAt: oldProject.createdAt,

      updatedAt: new Date().toISOString(),

      version:
        typeof changes.version === "number"
          ? changes.version
          : oldProject.version
    };

    projects[index] = updatedProject;

    write(STORAGE_KEYS.PROJECTS, projects);

    addRecentProject(id);

    return updatedProject;
  }


  function deleteProject(id) {
    const projects = getProjects();

    const filtered = projects.filter(project => project.id !== id);

    if (filtered.length === projects.length) {
      return false;
    }

    write(STORAGE_KEYS.PROJECTS, filtered);

    removeProjectVersions(id);

    const recent = getRecentProjects().filter(
      projectId => projectId !== id
    );

    write(STORAGE_KEYS.RECENT_PROJECTS, recent);

    if (getCurrentProjectId() === id) {
      remove(STORAGE_KEYS.CURRENT_PROJECT);
    }

    return true;
  }


  function duplicateProject(id) {
    const source = getProject(id);

    if (!source) {
      return null;
    }

    const copy = {
      ...source,

      id: generateId("project"),

      name: `${source.name} Copy`,

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString(),

      lastOpenedAt: new Date().toISOString(),

      version: 1,

      published: false,

      publicUrl: null,

      favorite: false
    };

    const projects = getProjects();

    projects.unshift(copy);

    write(STORAGE_KEYS.PROJECTS, projects);

    createVersion(copy, "Duplicated from project");

    return copy;
  }


  function forkProject(project) {
    if (!project) {
      return null;
    }

    return createProject({
      name: `${project.name} Fork`,
      type: project.type,
      visibility: "private",
      description: project.description,

      html: project.html,

      css: project.css,

      javascript: project.javascript,

      tags: project.tags,

      author: getUser()
    });
  }


  /* =========================================
     CURRENT PROJECT
     ========================================= */

  function setCurrentProject(id) {
    write(STORAGE_KEYS.CURRENT_PROJECT, id);
  }


  function getCurrentProjectId() {
    return read(STORAGE_KEYS.CURRENT_PROJECT, null);
  }


  function getCurrentProject() {
    const id = getCurrentProjectId();

    if (!id) {
      return null;
    }

    return getProject(id);
  }


  /* =========================================
     RECENT PROJECTS
     ========================================= */

  function getRecentProjects() {
    return read(STORAGE_KEYS.RECENT_PROJECTS, []);
  }


  function addRecentProject(id) {
    let recent = getRecentProjects();

    recent = recent.filter(projectId => projectId !== id);

    recent.unshift(id);

    recent = recent.slice(0, 20);

    write(STORAGE_KEYS.RECENT_PROJECTS, recent);
  }


  function getRecentProjectObjects() {
    const recentIds = getRecentProjects();

    const projects = getProjects();

    return recentIds
      .map(id => projects.find(project => project.id === id))
      .filter(Boolean);
  }


  /* =========================================
     VERSION HISTORY
     ========================================= */

  function getAllVersions() {
    return read(STORAGE_KEYS.VERSIONS, {});
  }


  function getProjectVersions(projectId) {
    const versions = getAllVersions();

    return versions[projectId] || [];
  }


  function createVersion(project, message = "Saved version") {
    if (!project || !project.id) {
      return null;
    }

    const settings = getSettings();

    if (!settings.projects.versionHistory) {
      return null;
    }

    const allVersions = getAllVersions();

    if (!allVersions[project.id]) {
      allVersions[project.id] = [];
    }

    const versionList = allVersions[project.id];

    const nextVersion =
      versionList.length > 0
        ? Math.max(...versionList.map(v => v.version)) + 1
        : 1;

    const version = {
      id: generateId("version"),

      projectId: project.id,

      version: nextVersion,

      message,

      createdAt: new Date().toISOString(),

      html: project.html,

      css: project.css,

      javascript: project.javascript
    };

    versionList.unshift(version);

    const maximum =
      Number(settings.projects.maximumVersions) || 20;

    allVersions[project.id] = versionList.slice(
      0,
      maximum
    );

    write(STORAGE_KEYS.VERSIONS, allVersions);

    return version;
  }


  function restoreVersion(projectId, versionId) {
    const project = getProject(projectId);

    if (!project) {
      return null;
    }

    const versions = getProjectVersions(projectId);

    const version = versions.find(
      item => item.id === versionId
    );

    if (!version) {
      return null;
    }

    const restored = updateProject(projectId, {
      html: version.html,

      css: version.css,

      javascript: version.javascript,

      version: project.version + 1
    });

    if (restored) {
      createVersion(
        restored,
        `Restored version ${version.version}`
      );
    }

    return restored;
  }


  function removeProjectVersions(projectId) {
    const allVersions = getAllVersions();

    delete allVersions[projectId];

    write(STORAGE_KEYS.VERSIONS, allVersions);
  }


  /* =========================================
     SETTINGS
     ========================================= */

  function deepMerge(target, source) {
    const result = {
      ...target
    };

    Object.keys(source || {}).forEach(key => {
      if (
        source[key] &&
        typeof source[key] === "object" &&
        !Array.isArray(source[key]) &&
        typeof target[key] === "object"
      ) {
        result[key] = deepMerge(
          target[key],
          source[key]
        );
      } else {
        result[key] = source[key];
      }
    });

    return result;
  }


  function getSettings() {
    const saved = read(
      STORAGE_KEYS.SETTINGS,
      {}
    );

    return deepMerge(
      DEFAULT_SETTINGS,
      saved
    );
  }


  function saveSettings(changes) {
    const current = getSettings();

    const updated = deepMerge(
      current,
      changes
    );

    write(
      STORAGE_KEYS.SETTINGS,
      updated
    );

    return updated;
  }


  function resetSettings() {
    write(
      STORAGE_KEYS.SETTINGS,
      DEFAULT_SETTINGS
    );

    return DEFAULT_SETTINGS;
  }


  /* =========================================
     USER / KAISOUL ID
     ========================================= */

  function getUser() {
    return read(STORAGE_KEYS.USER, {
      username: "Guest",
      kaisoulId: null,
      avatar: null,
      loggedIn: false
    });
  }


  function saveUser(user) {
    const current = getUser();

    const updated = {
      ...current,
      ...user
    };

    write(
      STORAGE_KEYS.USER,
      updated
    );

    return updated;
  }


  function clearUser() {
    remove(STORAGE_KEYS.USER);
  }


  /* =========================================
     EXPORT DATA
     ========================================= */

  function exportData() {
    return {
      app: "KAISOUL DEV",

      version: "1.0.0",

      exportedAt: new Date().toISOString(),

      projects: getProjects(),

      versions: getAllVersions(),

      settings: getSettings(),

      recentProjects: getRecentProjects(),

      user: getUser()
    };
  }


  function downloadBackup() {
    const data = exportData();

    const json = JSON.stringify(
      data,
      null,
      2
    );

    const blob = new Blob(
      [json],
      {
        type: "application/json"
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `kaisoul-dev-backup-${Date.now()}.json`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  }


  /* =========================================
     IMPORT DATA
     ========================================= */

  function importData(data) {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid KAISOUL DEV backup.");
    }

    if (Array.isArray(data.projects)) {
      write(
        STORAGE_KEYS.PROJECTS,
        data.projects
      );
    }

    if (data.versions) {
      write(
        STORAGE_KEYS.VERSIONS,
        data.versions
      );
    }

    if (data.settings) {
      saveSettings(data.settings);
    }

    if (Array.isArray(data.recentProjects)) {
      write(
        STORAGE_KEYS.RECENT_PROJECTS,
        data.recentProjects
      );
    }

    if (data.user) {
      saveUser(data.user);
    }

    return true;
  }


  /* =========================================
     CLEAR LOCAL DATA
     ========================================= */

  function clearLocalData() {
    Object.values(STORAGE_KEYS).forEach(
      key => remove(key)
    );

    return true;
  }


  /* =========================================
     STORAGE INFORMATION
     ========================================= */

  function getStorageSize() {
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      const value = localStorage.getItem(key);

      total +=
        (key ? key.length : 0) +
        (value ? value.length : 0);
    }

    return total;
  }


  function formatStorageSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }


  /* =========================================
     PUBLIC API
     ========================================= */

  window.KAISoulStorage = {

    // Basic
    read,
    write,
    remove,

    // IDs
    generateId,

    // Projects
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    forkProject,

    // Current project
    setCurrentProject,
    getCurrentProjectId,
    getCurrentProject,

    // Recent
    getRecentProjects,
    addRecentProject,
    getRecentProjectObjects,

    // Versions
    getAllVersions,
    getProjectVersions,
    createVersion,
    restoreVersion,

    // Settings
    getSettings,
    saveSettings,
    resetSettings,

    // User
    getUser,
    saveUser,
    clearUser,

    // Backup
    exportData,
    downloadBackup,
    importData,
    clearLocalData,

    // Storage
    getStorageSize,
    formatStorageSize,

    // Constants
    STORAGE_KEYS
  };


  /* =========================================
     INITIALIZATION
     ========================================= */

  if (
    localStorage.getItem(
      STORAGE_KEYS.SETTINGS
    ) === null
  ) {
    write(
      STORAGE_KEYS.SETTINGS,
      DEFAULT_SETTINGS
    );
  }


  console.log(
    "KAISOUL DEV Storage initialized."
  );

})();
