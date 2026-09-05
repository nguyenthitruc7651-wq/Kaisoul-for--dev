/* =========================================================
   KAISOUL DEV — PUBLISH SYSTEM
   File: js/publish.js
   ========================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "KAISOUL_DEV_PUBLISH";

  const state = {
    project: null,
    modal: null
  };

  /* ---------------------------------------------------------
     Helpers
  --------------------------------------------------------- */

  function getStorage() {
    return window.KAISoulStorage || null;
  }

  function getEditor() {
    return window.KAISoulEditor || null;
  }

  function getCurrentProject() {
    const storage = getStorage();

    if (storage && typeof storage.getCurrentProject === "function") {
      return storage.getCurrentProject();
    }

    return null;
  }

  function saveProject(project) {
    const storage = getStorage();

    if (!project) return null;

    try {
      if (storage && typeof storage.updateProject === "function") {
        return storage.updateProject(project.id, project);
      }

      const projects = JSON.parse(
        localStorage.getItem("KAISOUL_DEV_PROJECTS") || "[]"
      );

      const index = projects.findIndex(p => p.id === project.id);

      if (index !== -1) {
        projects[index] = project;
        localStorage.setItem(
          "KAISOUL_DEV_PROJECTS",
          JSON.stringify(projects)
        );
      }

      return project;
    } catch (error) {
      console.error("KAISOUL Publish save error:", error);
      return project;
    }
  }

  function slugify(text) {
    return String(text || "kaisoul-project")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "kaisoul-project";
  }

  function generateId(length = 10) {
    const chars =
      "abcdefghijklmnopqrstuvwxyz0123456789";

    let result = "";

    for (let i = 0; i < length; i++) {
      result += chars[
        Math.floor(Math.random() * chars.length)
      ];
    }

    return result;
  }

  function getPublicBaseUrl() {
    if (
      window.KAISoulConfig &&
      window.KAISoulConfig.publicBaseUrl
    ) {
      return String(window.KAISoulConfig.publicBaseUrl)
        .replace(/\/+$/, "");
    }

    const configured =
      document.documentElement.dataset.publicBaseUrl ||
      document.body.dataset.publicBaseUrl;

    if (configured) {
      return String(configured).replace(/\/+$/, "");
    }

    /*
      IMPORTANT:
      Đây chỉ là URL mặc định để tạo metadata.

      Khi KAISOUL DEV có backend/deployment thật,
      đổi thành:

      https://kaisoul.dev

      hoặc domain deployment thực tế.
    */

    if (window.location.origin &&
        window.location.origin !== "null") {
      return window.location.origin;
    }

    return "https://kaisoul.dev";
  }

  function buildPublicUrl(project) {
    const base = getPublicBaseUrl();

    const slug =
      project.publicSlug ||
      slugify(project.name || "project");

    const id =
      project.publicId ||
      generateId(8);

    /*
      URL dạng:

      /p/project-name-id

      Ví dụ:

      https://kaisoul.dev/p/my-portfolio-a83kd92x
    */

    return `${base}/p/${slug}-${id}`;
  }

  function getPublishData() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}"
      );
    } catch {
      return {};
    }
  }

  function savePublishData(data) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  }

  /* ---------------------------------------------------------
     Read editor code
  --------------------------------------------------------- */

  function getProjectCode(project) {
    const editor = getEditor();

    if (
      editor &&
      typeof editor.getCode === "function"
    ) {
      const code = editor.getCode();

      return {
        html: code.html || "",
        css: code.css || "",
        js: code.js || ""
      };
    }

    const html =
      document.querySelector("#htmlEditor")?.value || "";

    const css =
      document.querySelector("#cssEditor")?.value || "";

    const js =
      document.querySelector("#jsEditor")?.value ||
      document.querySelector("#javascriptEditor")?.value ||
      "";

    return {
      html: html || project?.html || "",
      css: css || project?.css || "",
      js: js || project?.js || ""
    };
  }

  /* ---------------------------------------------------------
     Publish
  --------------------------------------------------------- */

  function publish(options = {}) {
    let project =
      options.project ||
      getCurrentProject();

    if (!project) {
      notify("Không có project để publish.", "error");
      return null;
    }

    const code = getProjectCode(project);

    const now = new Date().toISOString();

    const publicId =
      project.publicId ||
      generateId(8);

    const publicSlug =
      project.publicSlug ||
      slugify(project.name || "kaisoul-project");

    project = {
      ...project,

      html: code.html,
      css: code.css,
      js: code.js,

      published: true,
      visibility: "public",

      publicId,
      publicSlug,

      publicUrl:
        project.publicUrl ||
        buildPublicUrl({
          ...project,
          publicId,
          publicSlug
        }),

      publishedAt:
        project.publishedAt || now,

      updatedAt: now
    };

    const saved = saveProject(project);

    state.project = saved || project;

    const publishData = getPublishData();

    publishData[project.id] = {
      projectId: project.id,
      publicId: project.publicId,
      publicSlug: project.publicSlug,
      publicUrl: project.publicUrl,
      publishedAt: project.publishedAt,
      visibility: project.visibility
    };

    savePublishData(publishData);

    dispatch("kaisoul:project-published", {
      project: project
    });

    notify("Project đã được publish.", "success");

    showPublishModal(project);

    return project;
  }

  /* ---------------------------------------------------------
     Unpublish
  --------------------------------------------------------- */

  function unpublish(project = null) {
    project =
      project ||
      state.project ||
      getCurrentProject();

    if (!project) {
      notify("Không tìm thấy project.", "error");
      return null;
    }

    project = {
      ...project,

      published: false,
      visibility: "private",
      unpublishedAt: new Date().toISOString()
    };

    saveProject(project);

    state.project = project;

    const data = getPublishData();

    delete data[project.id];

    savePublishData(data);

    dispatch("kaisoul:project-unpublished", {
      project: project
    });

    notify("Project đã được unpublish.", "success");

    closeModal();

    return project;
  }

  /* ---------------------------------------------------------
     Visibility
  --------------------------------------------------------- */

  function setVisibility(visibility, project = null) {
    project =
      project ||
      state.project ||
      getCurrentProject();

    if (!project) return null;

    if (visibility !== "public" &&
        visibility !== "private") {
      visibility = "private";
    }

    project.visibility = visibility;

    if (visibility === "public") {
      project.published = true;

      if (!project.publicId) {
        project.publicId = generateId(8);
      }

      if (!project.publicSlug) {
        project.publicSlug =
          slugify(project.name);
      }

      if (!project.publicUrl) {
        project.publicUrl =
          buildPublicUrl(project);
      }

      if (!project.publishedAt) {
        project.publishedAt =
          new Date().toISOString();
      }
    } else {
      project.published = false;
    }

    saveProject(project);

    state.project = project;

    dispatch("kaisoul:visibility-changed", {
      project,
      visibility
    });

    notify(
      visibility === "public"
        ? "Project đang ở chế độ Public."
        : "Project đang ở chế độ Private.",
      "success"
    );

    return project;
  }

  /* ---------------------------------------------------------
     Copy Link
  --------------------------------------------------------- */

  async function copyLink(project = null) {
    project =
      project ||
      state.project ||
      getCurrentProject();

    if (!project || !project.publicUrl) {
      notify(
        "Project chưa có link public.",
        "error"
      );
      return false;
    }

    try {
      await navigator.clipboard.writeText(
        project.publicUrl
      );

      notify(
        "Đã copy public link.",
        "success"
      );

      return true;
    } catch {
      const input =
        document.createElement("input");

      input.value = project.publicUrl;

      document.body.appendChild(input);

      input.select();

      try {
        document.execCommand("copy");
      } catch {}

      input.remove();

      notify(
        "Đã copy public link.",
        "success"
      );

      return true;
    }
  }

  /* ---------------------------------------------------------
     Open Link
  --------------------------------------------------------- */

  function openLink(project = null) {
    project =
      project ||
      state.project ||
      getCurrentProject();

    if (!project || !project.publicUrl) {
      notify(
        "Project chưa có public link.",
        "error"
      );
      return;
    }

    window.open(
      project.publicUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* ---------------------------------------------------------
     Modal
  --------------------------------------------------------- */

  function createModal() {
    if (state.modal) {
      return state.modal;
    }

    const overlay =
      document.createElement("div");

    overlay.className =
      "kaisoul-publish-overlay";

    overlay.innerHTML = `
      <div class="kaisoul-publish-modal"
           role="dialog"
           aria-modal="true">

        <div class="kaisoul-publish-header">

          <div>
            <div class="kaisoul-publish-title">
              Publish Project
            </div>

            <div class="kaisoul-publish-subtitle">
              Chia sẻ project của bạn
            </div>
          </div>

          <button
            type="button"
            class="kaisoul-publish-close"
            data-publish-close>
            ×
          </button>

        </div>

        <div class="kaisoul-publish-body">

          <div class="kaisoul-publish-project">
            <div
              class="kaisoul-publish-project-icon"
              data-publish-icon>
              K
            </div>

            <div>
              <div
                class="kaisoul-publish-project-name"
                data-publish-name>
                Project
              </div>

              <div
                class="kaisoul-publish-status"
                data-publish-status>
                Public
              </div>
            </div>
          </div>

          <div class="kaisoul-publish-field">

            <label>
              Public Link
            </label>

            <div class="kaisoul-publish-link-row">

              <input
                type="text"
                readonly
                data-publish-url
              >

              <button
                type="button"
                data-publish-copy>
                Copy
              </button>

            </div>

          </div>

          <div class="kaisoul-publish-info">
            Project sẽ cần backend/deployment thật
            để người khác có thể truy cập link này
            từ Internet.
          </div>

        </div>

        <div class="kaisoul-publish-footer">

          <button
            type="button"
            class="btn btn-secondary"
            data-publish-unpublish>
            Unpublish
          </button>

          <div class="kaisoul-publish-actions">

            <button
              type="button"
              class="btn btn-secondary"
              data-publish-close>
              Close
            </button>

            <button
              type="button"
              class="btn btn-primary"
              data-publish-open>
              Open Link
            </button>

          </div>

        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    state.modal = overlay;

    bindModalEvents(overlay);

    return overlay;
  }

  function bindModalEvents(modal) {
    modal
      .querySelectorAll("[data-publish-close]")
      .forEach(button => {
        button.addEventListener(
          "click",
          closeModal
        );
      });

    modal
      .querySelector("[data-publish-copy]")
      ?.addEventListener(
        "click",
        () => copyLink()
      );

    modal
      .querySelector("[data-publish-open]")
      ?.addEventListener(
        "click",
        () => openLink()
      );

    modal
      .querySelector("[data-publish-unpublish]")
      ?.addEventListener(
        "click",
        () => unpublish()
      );

    modal.addEventListener(
      "click",
      event => {
        if (event.target === modal) {
          closeModal();
        }
      }
    );
  }

  function showPublishModal(project) {
    const modal = createModal();

    state.project = project;

    const name =
      modal.querySelector(
        "[data-publish-name]"
      );

    const icon =
      modal.querySelector(
        "[data-publish-icon]"
      );

    const status =
      modal.querySelector(
        "[data-publish-status]"
      );

    const url =
      modal.querySelector(
        "[data-publish-url]"
      );

    if (name) {
      name.textContent =
        project.name ||
        "Untitled Project";
    }

    if (icon) {
      icon.textContent =
        String(
          project.name ||
          "K"
        ).charAt(0).toUpperCase();
    }

    if (status) {
      status.textContent =
        project.visibility === "public"
          ? "Public"
          : "Private";
    }

    if (url) {
      url.value =
        project.publicUrl || "";
    }

    modal.classList.add("is-open");

    document.body.classList.add(
      "kaisoul-publish-open"
    );
  }

  function closeModal() {
    if (!state.modal) return;

    state.modal.classList.remove(
      "is-open"
    );

    document.body.classList.remove(
      "kaisoul-publish-open"
    );
  }

  /* ---------------------------------------------------------
     UI button binding
  --------------------------------------------------------- */

  function bindButtons() {
    document.addEventListener(
      "click",
      event => {
        const publishButton =
          event.target.closest(
            "[data-publish]"
          );

        if (publishButton) {
          event.preventDefault();
          publish();
          return;
        }

        const unpublishButton =
          event.target.closest(
            "[data-unpublish]"
          );

        if (unpublishButton) {
          event.preventDefault();
          unpublish();
          return;
        }

        const copyButton =
          event.target.closest(
            "[data-copy-public-link]"
          );

        if (copyButton) {
          event.preventDefault();
          copyLink();
          return;
        }

        const openButton =
          event.target.closest(
            "[data-open-public-link]"
          );

        if (openButton) {
          event.preventDefault();
          openLink();
          return;
        }
      }
    );
  }

  /* ---------------------------------------------------------
     Keyboard
  --------------------------------------------------------- */

  function bindKeyboard() {
    document.addEventListener(
      "keydown",
      event => {
        if (event.key === "Escape") {
          closeModal();
        }
      }
    );
  }

  /* ---------------------------------------------------------
     Toast
  --------------------------------------------------------- */

  function notify(message, type = "info") {
    if (
      window.KAISoulApp &&
      typeof window.KAISoulApp.toast === "function"
    ) {
      window.KAISoulApp.toast(
        message,
        type
      );
      return;
    }

    if (
      window.KAISoulToast &&
      typeof window.KAISoulToast.show === "function"
    ) {
      window.KAISoulToast.show(
        message,
        type
      );
      return;
    }

    let toast =
      document.querySelector(
        ".kaisoul-publish-toast"
      );

    if (!toast) {
      toast =
        document.createElement("div");

      toast.className =
        "kaisoul-publish-toast";

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.dataset.type = type;

    toast.classList.add("show");

    clearTimeout(
      toast._timeout
    );

    toast._timeout =
      setTimeout(() => {
        toast.classList.remove("show");
      }, 2500);
  }

  /* ---------------------------------------------------------
     Events
  --------------------------------------------------------- */

  function dispatch(name, detail) {
    document.dispatchEvent(
      new CustomEvent(
        name,
        {
          detail
        }
      )
    );
  }

  /* ---------------------------------------------------------
     Get publish status
  --------------------------------------------------------- */

  function getStatus(project = null) {
    project =
      project ||
      state.project ||
      getCurrentProject();

    if (!project) {
      return {
        published: false,
        visibility: "private",
        publicUrl: null
      };
    }

    return {
      published:
        project.published === true,

      visibility:
        project.visibility ||
        "private",

      publicId:
        project.publicId ||
        null,

      publicSlug:
        project.publicSlug ||
        null,

      publicUrl:
        project.publicUrl ||
        null,

      publishedAt:
        project.publishedAt ||
        null
    };
  }

  /* ---------------------------------------------------------
     Refresh publish UI
  --------------------------------------------------------- */

  function refresh() {
    const project =
      getCurrentProject();

    if (!project) return;

    state.project = project;

    document
      .querySelectorAll(
        "[data-publish-status]"
      )
      .forEach(element => {
        element.textContent =
          project.published
            ? "Published"
            : "Private";
      });

    document
      .querySelectorAll(
        "[data-public-url]"
      )
      .forEach(element => {
        element.textContent =
          project.publicUrl || "";
      });
  }

  /* ---------------------------------------------------------
     Initialize
  --------------------------------------------------------- */

  function init() {
    bindButtons();
    bindKeyboard();

    document.addEventListener(
      "kaisoul:project-changed",
      refresh
    );

    document.addEventListener(
      "kaisoul:project-saved",
      refresh
    );

    refresh();
  }

  /* ---------------------------------------------------------
     Public API
  --------------------------------------------------------- */

  window.KAISoulPublish = {
    init,
    publish,
    unpublish,
    setVisibility,
    copyLink,
    openLink,
    showPublishModal,
    closeModal,
    getStatus,
    refresh,
    slugify,
    generateId
  };

  /* ---------------------------------------------------------
     Auto init
  --------------------------------------------------------- */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
