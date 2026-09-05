(function () {
  "use strict";

  const state = {
    activeTab: "projects",
    user: null
  };

  const TABS = [
    "projects",
    "posts",
    "liked",
    "forks"
  ];

  function init() {
    loadUser();
    bindEvents();
    render();
  }

  /* =========================================================
     USER
     ========================================================= */

  function loadUser() {
    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.getUser === "function"
    ) {
      try {
        state.user =
          window.KAISoulStorage.getUser() || null;
      } catch (error) {
        console.warn(
          "[KAISOUL DEV] Profile user error:",
          error
        );
      }
    }

    /*
     * Cho phép trang khác cập nhật profile.
     */
    document.addEventListener(
      "kaisoul:user-updated",
      function (event) {
        state.user =
          event.detail?.user ||
          getStoredUser();

        render();
      }
    );

    document.addEventListener(
      "kaisoul:logout",
      function () {
        state.user = null;
        render();
      }
    );
  }

  function getStoredUser() {
    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.getUser === "function"
    ) {
      try {
        return (
          window.KAISoulStorage.getUser() ||
          null
        );
      } catch (error) {}
    }

    return null;
  }

  /* =========================================================
     RENDER
     ========================================================= */

  function render() {
    renderUser();
    renderStats();
    renderTabs();
    renderContent();
  }

  function renderUser() {
    const user =
      state.user;

    const name =
      user?.name ||
      user?.username ||
      "KAISOUL User";

    const username =
      user?.username ||
      user?.kaisoulId ||
      user?.id ||
      "user";

    const kaisoulId =
      user?.kaisoulId ||
      user?.id ||
      "Not connected";

    const avatar =
      user?.avatar ||
      user?.avatarUrl ||
      "";

    document
      .querySelectorAll(
        "[data-profile-name]"
      )
      .forEach(element => {
        element.textContent =
          name;
      });

    document
      .querySelectorAll(
        "[data-profile-username]"
      )
      .forEach(element => {
        element.textContent =
          `@${username}`;
      });

    document
      .querySelectorAll(
        "[data-profile-kaisoul-id]"
      )
      .forEach(element => {
        element.textContent =
          kaisoulId;
      });

    document
      .querySelectorAll(
        "[data-profile-avatar]"
      )
      .forEach(element => {
        if (
          avatar &&
          element.tagName === "IMG"
        ) {
          element.src = avatar;
          element.alt = name;
        } else if (!avatar) {
          element.textContent =
            getInitials(name);
        }
      });

    document
      .querySelectorAll(
        "[data-profile-login-state]"
      )
      .forEach(element => {
        element.textContent =
          state.user
            ? "Signed in"
            : "Not signed in";
      });

    updateProfileVisibility();
  }

  function renderStats() {
    const projects =
      getProjects();

    const posts =
      getPosts();

    const forks =
      getForks();

    setStat(
      "projects",
      projects.length
    );

    setStat(
      "posts",
      posts.length
    );

    setStat(
      "forks",
      forks.length
    );
  }

  function renderTabs() {
    document
      .querySelectorAll(
        "[data-profile-tab]"
      )
      .forEach(tab => {
        const value =
          tab.dataset.profileTab;

        const active =
          value === state.activeTab;

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
  }

  function renderContent() {
    const container =
      document.querySelector(
        "[data-profile-content], #profileContent, .profile-content"
      );

    if (!container) {
      return;
    }

    switch (
      state.activeTab
    ) {
      case "projects":
        renderProjects(
          container
        );
        break;

      case "posts":
        renderPosts(
          container
        );
        break;

      case "liked":
        renderLiked(
          container
        );
        break;

      case "forks":
        renderForks(
          container
        );
        break;

      default:
        renderProjects(
          container
        );
    }
  }

  /* =========================================================
     PROJECTS
     ========================================================= */

  function getProjects() {
    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.getProjects ===
      "function"
    ) {
      try {
        return (
          window.KAISoulStorage.getProjects() ||
          []
        );
      } catch (error) {
        console.warn(
          "[KAISOUL DEV] Project list error:",
          error
        );
      }
    }

    return [];
  }

  function renderProjects(
    container
  ) {
    const projects =
      getProjects();

    if (!projects.length) {
      container.innerHTML =
        createEmpty(
          "No projects yet",
          "Create your first project to see it here."
        );

      return;
    }

    container.innerHTML =
      projects
        .sort(
          (a, b) =>
            Number(
              b.updatedAt ||
              b.createdAt ||
              0
            ) -
            Number(
              a.updatedAt ||
              a.createdAt ||
              0
            )
        )
        .map(
          createProjectCard
        )
        .join("");
  }

  function createProjectCard(
    project
  ) {
    const name =
      project.name ||
      project.title ||
      "Untitled Project";

    const type =
      project.type ||
      "website";

    const updated =
      project.updatedAt ||
      project.createdAt;

    return `
      <article
        class="profile-project-card"
        data-profile-project="${escapeAttribute(
          project.id
        )}"
      >

        <div class="profile-project-preview">
          <div class="profile-project-preview-code">
            ${escapeHTML(
              getProjectPreview(
                project
              )
            )}
          </div>
        </div>

        <div class="profile-project-info">

          <div>
            <h3>
              ${escapeHTML(name)}
            </h3>

            <p>
              ${escapeHTML(
                getTypeLabel(type)
              )}
              ·
              ${formatDate(updated)}
            </p>
          </div>

          <button
            type="button"
            class="profile-project-open"
            data-profile-action="open-project"
            data-project-id="${escapeAttribute(
              project.id
            )}"
          >
            Open
          </button>

        </div>

      </article>
    `;
  }

  function getProjectPreview(
    project
  ) {
    const html =
      String(
        project.html ||
        ""
      ).trim();

    const css =
      String(
        project.css ||
        ""
      ).trim();

    if (html) {
      return html.slice(
        0,
        180
      );
    }

    if (css) {
      return css.slice(
        0,
        180
      );
    }

    return "Empty project";
  }

  /* =========================================================
     POSTS
     ========================================================= */

  function getPosts() {
    if (
      window.KAISoulCommunity &&
      typeof window.KAISoulCommunity.getPosts ===
      "function"
    ) {
      try {
        const posts =
          window.KAISoulCommunity.getPosts() ||
          [];

        const username =
          state.user?.username ||
          state.user?.kaisoulId;

        if (!username) {
          return posts.filter(
            post =>
              post.author ===
              state.user?.name
          );
        }

        return posts.filter(
          post =>
            post.username ===
            username
        );
      } catch (error) {
        console.warn(
          "[KAISOUL DEV] Profile posts error:",
          error
        );
      }
    }

    return [];
  }

  function renderPosts(
    container
  ) {
    const posts =
      getPosts();

    if (!posts.length) {
      container.innerHTML =
        createEmpty(
          "No posts yet",
          "Your Community posts will appear here."
        );

      return;
    }

    container.innerHTML =
      posts
        .map(
          createPostCard
        )
        .join("");
  }

  function createPostCard(
    post
  ) {
    return `
      <article
        class="profile-post-card"
      >

        <div class="profile-post-meta">
          ${escapeHTML(
            getTypeLabel(
              post.type
            )
          )}
          ·
          ${formatDate(
            post.createdAt
          )}
        </div>

        <h3>
          ${escapeHTML(
            post.title ||
            "Untitled Post"
          )}
        </h3>

        <p>
          ${escapeHTML(
            post.description ||
            ""
          )}
        </p>

        <div class="profile-post-stats">
          <span>
            ♡ ${Number(
              post.likes || 0
            )}
          </span>

          <span>
            ○ ${Number(
              post.comments || 0
            )}
          </span>

          <span>
            ⑂ ${Number(
              post.forks || 0
            )}
          </span>
        </div>

      </article>
    `;
  }

  /* =========================================================
     LIKED
     ========================================================= */

  function renderLiked(
    container
  ) {
    let posts = [];

    if (
      window.KAISoulCommunity &&
      typeof window.KAISoulCommunity.getPosts ===
      "function"
    ) {
      try {
        posts =
          window.KAISoulCommunity
            .getPosts()
            .filter(
              post =>
                post.liked === true
            );
      } catch (error) {}
    }

    if (!posts.length) {
      container.innerHTML =
        createEmpty(
          "No liked posts",
          "Posts you like in Community will appear here."
        );

      return;
    }

    container.innerHTML =
      posts
        .map(
          createPostCard
        )
        .join("");
  }

  /* =========================================================
     FORKS
     ========================================================= */

  function getForks() {
    const projects =
      getProjects();

    return projects.filter(
      project =>
        project.source ===
          "community-fork" ||
        project.sourcePostId
    );
  }

  function renderForks(
    container
  ) {
    const forks =
      getForks();

    if (!forks.length) {
      container.innerHTML =
        createEmpty(
          "No forks yet",
          "Projects forked from Community will appear here."
        );

      return;
    }

    container.innerHTML =
      forks
        .map(
          createProjectCard
        )
        .join("");
  }

  /* =========================================================
     ACTIONS
     ========================================================= */

  function handleAction(
    event
  ) {
    const action =
      event.target.closest(
        "[data-profile-action]"
      );

    if (!action) return;

    const type =
      action.dataset.profileAction;

    switch (type) {
      case "open-project":
        openProject(
          action.dataset.projectId
        );
        break;

      case "edit-profile":
        editProfile();
        break;

      case "login":
        openKaisoulID();
        break;

      case "logout":
        logout();
        break;
    }
  }

  function openProject(
    projectId
  ) {
    if (!projectId) return;

    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.setCurrentProject ===
      "function"
    ) {
      try {
        window.KAISoulStorage.setCurrentProject(
          projectId
        );
      } catch (error) {}
    }

    navigate(
      "code"
    );
  }

  function editProfile() {
    /*
     * Profile data được xác thực bởi KAISOUL ID.
     * KAISOUL DEV không tự sửa username/ID.
     */
    openKaisoulID();
  }

  function openKaisoulID() {
    window.open(
      "https://phanvanthanh702-dev.github.io/KAISOUL-ID/",
      "_blank",
      "noopener,noreferrer"
    );
  }

  function logout() {
    const confirmed =
      window.confirm(
        "Log out of KAISOUL ID?"
      );

    if (!confirmed) {
      return;
    }

    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.clearUser ===
      "function"
    ) {
      window.KAISoulStorage.clearUser();
    }

    state.user = null;

    render();

    document.dispatchEvent(
      new CustomEvent(
        "kaisoul:logout"
      )
    );

    notify(
      "You have been logged out.",
      "success"
    );
  }

  function setTab(
    tab
  ) {
    if (
      !TABS.includes(tab)
    ) {
      tab = "projects";
    }

    state.activeTab =
      tab;

    renderTabs();
    renderContent();
  }

  /* =========================================================
     VISIBILITY
     ========================================================= */

  function updateProfileVisibility() {
    const loggedIn =
      Boolean(
        state.user
      );

    document
      .querySelectorAll(
        "[data-profile-authenticated]"
      )
      .forEach(element => {
        element.hidden =
          !loggedIn;
      });

    document
      .querySelectorAll(
        "[data-profile-guest]"
      )
      .forEach(element => {
        element.hidden =
          loggedIn;
      });
  }

  /* =========================================================
     STATS
     ========================================================= */

  function setStat(
    name,
    value
  ) {
    document
      .querySelectorAll(
        `[data-profile-stat="${name}"]`
      )
      .forEach(element => {
        element.textContent =
          String(value);
      });
  }

  /* =========================================================
     HELPERS
     ========================================================= */

  function createEmpty(
    title,
    text
  ) {
    return `
      <div class="profile-empty">

        <div class="profile-empty-title">
          ${escapeHTML(title)}
        </div>

        <div class="profile-empty-text">
          ${escapeHTML(text)}
        </div>

      </div>
    `;
  }

  function getInitials(
    name
  ) {
    return String(name || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        word =>
          word.charAt(0)
      )
      .join("")
      .toUpperCase();
  }

  function getTypeLabel(
    type
  ) {
    const labels = {
      website: "Website",
      game: "Game",
      games: "Game",
      app: "App",
      apps: "App",
      template: "Template",
      code: "Code",
      projects: "Project",
      project: "Project",
      tutorial: "Tutorial",
      tutorials: "Tutorial",
      question: "Question",
      questions: "Question",
      showcase: "Showcase"
    };

    return (
      labels[
        String(type || "")
          .toLowerCase()
      ] ||
      String(type || "Project")
    );
  }

  function formatDate(
    timestamp
  ) {
    if (!timestamp) {
      return "Recently";
    }

    const date =
      new Date(
        Number(timestamp)
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Recently";
    }

    const diff =
      Date.now() -
      date.getTime();

    const minute =
      60000;

    const hour =
      minute * 60;

    const day =
      hour * 24;

    if (
      diff < minute
    ) {
      return "Just now";
    }

    if (
      diff < hour
    ) {
      return `${Math.floor(
        diff / minute
      )}m ago`;
    }

    if (
      diff < day
    ) {
      return `${Math.floor(
        diff / hour
      )}h ago`;
    }

    if (
      diff < day * 7
    ) {
      return `${Math.floor(
        diff / day
      )}d ago`;
    }

    return date.toLocaleDateString();
  }

  function escapeHTML(
    value
  ) {
    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  function escapeAttribute(
    value
  ) {
    return escapeHTML(
      value
    );
  }

  function navigate(
    page
  ) {
    if (
      window.KAISoulApp &&
      typeof window.KAISoulApp.navigate ===
      "function"
    ) {
      window.KAISoulApp.navigate(
        page
      );
      return;
    }

    if (
      window.KAISoulRouter &&
      typeof window.KAISoulRouter.navigate ===
      "function"
    ) {
      window.KAISoulRouter.navigate(
        page
      );
      return;
    }

    window.location.href =
      `?page=${encodeURIComponent(
        page
      )}`;
  }

  function notify(
    message,
    type = "info"
  ) {
    if (
      window.KAISoulApp &&
      typeof window.KAISoulApp.showToast ===
      "function"
    ) {
      window.KAISoulApp.showToast(
        message,
        type
      );
      return;
    }

    if (
      typeof window.showToast ===
      "function"
    ) {
      window.showToast(
        message,
        type
      );
      return;
    }

    console.log(
      `[KAISOUL DEV] ${message}`
    );
  }

  /* =========================================================
     EVENTS
     ========================================================= */

  function bindEvents() {
    document.addEventListener(
      "click",
      function (event) {
        const tab =
          event.target.closest(
            "[data-profile-tab]"
          );

        if (tab) {
          setTab(
            tab.dataset.profileTab
          );
          return;
        }

        handleAction(event);
      }
    );

    document.addEventListener(
      "kaisoul:project-created",
      function () {
        render();
      }
    );

    document.addEventListener(
      "kaisoul:project-updated",
      function () {
        render();
      }
    );

    document.addEventListener(
      "kaisoul:project-deleted",
      function () {
        render();
      }
    );

    document.addEventListener(
      "kaisoul:template-used",
      function () {
        render();
      }
    );
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */

  window.KAISoulProfile = {
    init,
    render,
    setTab,

    getUser: function () {
      return state.user;
    },

    getStats: function () {
      return {
        projects:
          getProjects().length,
        posts:
          getPosts().length,
        forks:
          getForks().length
      };
    },

    refresh: function () {
      state.user =
        getStoredUser();

      render();
    }
  };

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
