(function () {
  "use strict";

  const state = {
    query: "",
    activeCategory: "all",
    results: [],
    opened: false
  };

  const CATEGORIES = [
    "all",
    "projects",
    "users",
    "templates",
    "community",
    "tutorials"
  ];

  function init() {
    bindEvents();
    render();
  }

  function getSearchInput() {
    return document.querySelector(
      "[data-global-search], #globalSearch, #searchInput"
    );
  }

  function getResultsContainer() {
    return document.querySelector(
      "[data-search-results], #searchResults, .search-results"
    );
  }

  function getSearchOverlay() {
    return document.querySelector(
      "[data-search-overlay], #searchOverlay, .search-overlay"
    );
  }

  function bindEvents() {
    document.addEventListener("input", function (event) {
      const input = event.target.closest(
        "[data-global-search], #globalSearch, #searchInput"
      );

      if (!input) return;

      state.query = input.value || "";
      state.opened = true;

      search();
    });

    document.addEventListener("click", function (event) {
      const category = event.target.closest(
        "[data-search-category]"
      );

      if (category) {
        setCategory(
          category.dataset.searchCategory
        );
        return;
      }

      const result = event.target.closest(
        "[data-search-result]"
      );

      if (result) {
        openResult(
          result.dataset.searchResult,
          result.dataset.searchId
        );
        return;
      }

      const clear = event.target.closest(
        "[data-search-clear]"
      );

      if (clear) {
        clearSearch();
        return;
      }

      const close = event.target.closest(
        "[data-search-close]"
      );

      if (close) {
        closeSearch();
        return;
      }

      const searchButton = event.target.closest(
        "[data-open-search]"
      );

      if (searchButton) {
        openSearch();
        return;
      }

      if (
        state.opened &&
        !event.target.closest(
          "[data-search-overlay], #searchOverlay, .search-overlay"
        ) &&
        !event.target.closest(
          "[data-open-search]"
        )
      ) {
        /*
         * Không đóng search ngay trên desktop vì
         * kết quả có thể nằm trong topbar.
         */
      }
    });

    document.addEventListener("keydown", function (event) {
      /*
       * Ctrl/Cmd + K
       */
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        openSearch();
        return;
      }

      /*
       * Escape
       */
      if (event.key === "Escape") {
        if (state.opened) {
          closeSearch();
        }
      }
    });
  }

  function openSearch() {
    state.opened = true;

    const overlay = getSearchOverlay();

    if (overlay) {
      overlay.hidden = false;
      overlay.classList.add("show");
      overlay.classList.add("active");
    }

    const input = getSearchInput();

    if (input) {
      input.focus();
      input.select();
    }

    search();
  }

  function closeSearch() {
    state.opened = false;

    const overlay = getSearchOverlay();

    if (overlay) {
      overlay.classList.remove("show");
      overlay.classList.remove("active");

      /*
       * Cho CSS animation có thời gian chạy.
       */
      setTimeout(() => {
        if (!state.opened) {
          overlay.hidden = true;
        }
      }, 180);
    }
  }

  function clearSearch() {
    state.query = "";

    const input = getSearchInput();

    if (input) {
      input.value = "";
      input.focus();
    }

    search();
  }

  function setCategory(category) {
    if (!CATEGORIES.includes(category)) {
      category = "all";
    }

    state.activeCategory = category;

    updateCategoryButtons();
    search();
  }

  function updateCategoryButtons() {
    document
      .querySelectorAll(
        "[data-search-category]"
      )
      .forEach(button => {
        const active =
          button.dataset.searchCategory ===
          state.activeCategory;

        button.classList.toggle(
          "active",
          active
        );

        button.setAttribute(
          "aria-selected",
          active ? "true" : "false"
        );
      });
  }

  function search() {
    const query =
      state.query.trim().toLowerCase();

    if (!query) {
      state.results = [];
      render();
      updateCategoryButtons();
      return;
    }

    const allResults = collectResults();

    state.results = allResults
      .filter(result => {
        if (
          state.activeCategory !== "all" &&
          result.category !== state.activeCategory
        ) {
          return false;
        }

        return matchesQuery(
          result,
          query
        );
      })
      .sort(compareResults);

    render();
    updateCategoryButtons();
  }

  function collectResults() {
    const results = [];

    collectProjects(results);
    collectUsers(results);
    collectTemplates(results);
    collectCommunity(results);
    collectTutorials(results);

    return results;
  }

  /* =========================================================
     PROJECTS
     ========================================================= */

  function collectProjects(results) {
    if (
      !window.KAISoulStorage ||
      typeof window.KAISoulStorage.getProjects !== "function"
    ) {
      return;
    }

    let projects = [];

    try {
      projects =
        window.KAISoulStorage.getProjects() || [];
    } catch (error) {
      console.warn(
        "[KAISOUL DEV] Project search error:",
        error
      );
      return;
    }

    projects.forEach(project => {
      results.push({
        category: "projects",
        id: project.id,
        title:
          project.name ||
          project.title ||
          "Untitled Project",
        description:
          project.description ||
          "KAISOUL DEV project",
        meta:
          project.type ||
          project.language ||
          "Project",
        icon: "P",
        data: project,
        score: 0
      });
    });
  }

  /* =========================================================
     USERS
     ========================================================= */

  function collectUsers(results) {
    /*
     * Community users
     */
    if (
      window.KAISoulCommunity &&
      typeof window.KAISoulCommunity.getPosts === "function"
    ) {
      const users = new Map();

      try {
        const posts =
          window.KAISoulCommunity.getPosts() || [];

        posts.forEach(post => {
          const username =
            post.username ||
            "user";

          if (!users.has(username)) {
            users.set(username, {
              id: username,
              title:
                post.author ||
                username,
              description:
                `@${username}`,
              meta: "Community user",
              icon: "U",
              data: {
                username,
                author: post.author
              }
            });
          }
        });
      } catch (error) {
        console.warn(
          "[KAISOUL DEV] User search error:",
          error
        );
      }

      users.forEach(user => {
        results.push({
          category: "users",
          ...user,
          score: 0
        });
      });
    }

    /*
     * Current KAISOUL ID user
     */
    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.getUser === "function"
    ) {
      try {
        const user =
          window.KAISoulStorage.getUser();

        if (user) {
          const username =
            user.username ||
            user.name ||
            user.id;

          if (username) {
            results.push({
              category: "users",
              id:
                user.id ||
                username,
              title:
                user.name ||
                username,
              description:
                `@${username}`,
              meta: "Your profile",
              icon: "U",
              data: user,
              score: 0
            });
          }
        }
      } catch (error) {
        console.warn(
          "[KAISOUL DEV] Account search error:",
          error
        );
      }
    }
  }

  /* =========================================================
     TEMPLATES
     ========================================================= */

  function collectTemplates(results) {
    if (
      !window.KAISoulTemplates ||
      typeof window.KAISoulTemplates.getTemplate !== "function"
    ) {
      return;
    }

    /*
     * templates.js hiện không expose toàn bộ template list
     * trong API. Nếu có getVisibleTemplates() thì dùng nó.
     */
    if (
      typeof window.KAISoulTemplates.getVisibleTemplates ===
      "function"
    ) {
      try {
        const templates =
          window.KAISoulTemplates
            .getVisibleTemplates() || [];

        templates.forEach(template => {
          results.push({
            category: "templates",
            id: template.id,
            title:
              template.name ||
              template.title ||
              "Template",
            description:
              template.description ||
              "KAISOUL DEV template",
            meta:
              template.type ||
              "Template",
            icon: "T",
            data: template,
            score: 0
          });
        });

        return;
      } catch (error) {
        console.warn(
          "[KAISOUL DEV] Template search error:",
          error
        );
      }
    }

    /*
     * Fallback danh sách template mặc định.
     */
    const fallbackTemplates = [
      {
        id: "landing-page",
        title: "Landing Page",
        description: "Modern responsive landing page",
        meta: "Website"
      },
      {
        id: "portfolio",
        title: "Portfolio",
        description: "Developer portfolio website",
        meta: "Website"
      },
      {
        id: "login-page",
        title: "Login Page",
        description: "Modern authentication interface",
        meta: "Website"
      },
      {
        id: "dashboard",
        title: "Dashboard",
        description: "Admin dashboard interface",
        meta: "App"
      },
      {
        id: "calculator",
        title: "Calculator",
        description: "Simple JavaScript calculator",
        meta: "App"
      },
      {
        id: "todo-app",
        title: "Todo App",
        description: "Task management application",
        meta: "App"
      },
      {
        id: "snake-game",
        title: "Snake Game",
        description: "Classic browser snake game",
        meta: "Game"
      },
      {
        id: "quiz-game",
        title: "Quiz Game",
        description: "Interactive quiz game",
        meta: "Game"
      }
    ];

    fallbackTemplates.forEach(template => {
      results.push({
        category: "templates",
        id: template.id,
        title: template.title,
        description: template.description,
        meta: template.meta,
        icon: "T",
        data: template,
        score: 0
      });
    });
  }

  /* =========================================================
     COMMUNITY
     ========================================================= */

  function collectCommunity(results) {
    if (
      !window.KAISoulCommunity ||
      typeof window.KAISoulCommunity.getPosts !== "function"
    ) {
      return;
    }

    try {
      const posts =
        window.KAISoulCommunity.getPosts() || [];

      posts.forEach(post => {
        results.push({
          category: "community",
          id: post.id,
          title:
            post.title ||
            "Community Post",
          description:
            post.description ||
            "",
          meta:
            getCommunityType(post.type),
          icon: "C",
          data: post,
          score: 0
        });
      });
    } catch (error) {
      console.warn(
        "[KAISOUL DEV] Community search error:",
        error
      );
    }
  }

  /* =========================================================
     TUTORIALS
     ========================================================= */

  function collectTutorials(results) {
    /*
     * Nếu sau này tutorials.js được thêm vào,
     * search.js tự động sử dụng API của nó.
     */
    if (
      window.KAISoulTutorials &&
      typeof window.KAISoulTutorials.getTutorials ===
      "function"
    ) {
      try {
        const tutorials =
          window.KAISoulTutorials
            .getTutorials() || [];

        tutorials.forEach(tutorial => {
          results.push({
            category: "tutorials",
            id: tutorial.id,
            title:
              tutorial.title ||
              tutorial.name ||
              "Tutorial",
            description:
              tutorial.description ||
              "",
            meta:
              tutorial.level ||
              "Tutorial",
            icon: "T",
            data: tutorial,
            score: 0
          });
        });
      } catch (error) {
        console.warn(
          "[KAISOUL DEV] Tutorial search error:",
          error
        );
      }
    }

    /*
     * Fallback tutorials để Search không bị trống
     * khi tutorials.js chưa được xây dựng.
     */
    const fallback = [
      {
        id: "html-basics",
        title: "HTML Basics",
        description:
          "Learn the fundamentals of HTML",
        meta: "Beginner"
      },
      {
        id: "css-basics",
        title: "CSS Basics",
        description:
          "Learn selectors, layouts and styling",
        meta: "Beginner"
      },
      {
        id: "javascript-basics",
        title: "JavaScript Basics",
        description:
          "Learn variables, functions and events",
        meta: "Beginner"
      },
      {
        id: "responsive-web",
        title: "Responsive Web Design",
        description:
          "Build websites for desktop and mobile",
        meta: "Intermediate"
      }
    ];

    fallback.forEach(tutorial => {
      results.push({
        category: "tutorials",
        id: tutorial.id,
        title: tutorial.title,
        description: tutorial.description,
        meta: tutorial.meta,
        icon: "T",
        data: tutorial,
        score: 0
      });
    });
  }

  /* =========================================================
     MATCHING
     ========================================================= */

  function matchesQuery(result, query) {
    const text = [
      result.title,
      result.description,
      result.meta,
      result.category,
      getSearchableData(result.data)
    ]
      .join(" ")
      .toLowerCase();

    if (!text.includes(query)) {
      return false;
    }

    result.score =
      calculateScore(
        result,
        query
      );

    return true;
  }

  function getSearchableData(data) {
    if (!data) return "";

    try {
      return Object.values(data)
        .filter(value => {
          return (
            typeof value === "string" ||
            typeof value === "number"
          );
        })
        .join(" ");
    } catch (error) {
      return "";
    }
  }

  function calculateScore(result, query) {
    const title =
      String(result.title || "")
        .toLowerCase();

    const description =
      String(result.description || "")
        .toLowerCase();

    const category =
      String(result.category || "")
        .toLowerCase();

    let score = 0;

    if (title === query) {
      score += 100;
    }

    if (title.startsWith(query)) {
      score += 50;
    }

    if (title.includes(query)) {
      score += 30;
    }

    if (description.includes(query)) {
      score += 10;
    }

    if (category.includes(query)) {
      score += 5;
    }

    return score;
  }

  function compareResults(a, b) {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return String(a.title)
      .localeCompare(
        String(b.title)
      );
  }

  /* =========================================================
     RENDER
     ========================================================= */

  function render() {
    const container =
      getResultsContainer();

    updateCategoryButtons();

    if (!container) return;

    if (!state.query.trim()) {
      container.innerHTML = createInitialState();
      return;
    }

    if (!state.results.length) {
      container.innerHTML = createEmptyState();
      return;
    }

    container.innerHTML =
      state.results
        .map(createResult)
        .join("");
  }

  function createResult(result) {
    return `
      <button
        type="button"
        class="search-result"
        data-search-result="true"
        data-search-id="${escapeAttribute(result.id)}"
        data-search-result="${escapeAttribute(result.category)}"
      >

        <div class="search-result-icon">
          ${escapeHTML(result.icon || "•")}
        </div>

        <div class="search-result-content">

          <div class="search-result-title">
            ${escapeHTML(result.title)}
          </div>

          <div class="search-result-description">
            ${escapeHTML(
              result.description || ""
            )}
          </div>

        </div>

        <div class="search-result-meta">
          ${escapeHTML(
            getCategoryLabel(result.category)
          )}

          ${
            result.meta
              ? `
                <span>
                  ${escapeHTML(
                    String(result.meta)
                  )}
                </span>
              `
              : ""
          }
        </div>

      </button>
    `;
  }

  function createInitialState() {
    return `
      <div class="search-initial">

        <div class="search-initial-title">
          Search KAISOUL DEV
        </div>

        <div class="search-initial-text">
          Find projects, users, templates,
          community posts and tutorials.
        </div>

        <div class="search-shortcuts">
          <span>Ctrl</span>
          <span>K</span>
          <span>to search</span>
        </div>

      </div>
    `;
  }

  function createEmptyState() {
    return `
      <div class="search-empty">

        <div class="search-empty-title">
          No results found
        </div>

        <div class="search-empty-text">
          No matching results for
          "<strong>${escapeHTML(
            state.query
          )}</strong>".
        </div>

      </div>
    `;
  }

  /* =========================================================
     OPEN RESULT
     ========================================================= */

  function openResult(category, id) {
    const result =
      state.results.find(item => {
        return (
          item.category === category &&
          String(item.id) === String(id)
        );
      });

    if (!result) return;

    closeSearch();

    switch (category) {
      case "projects":
        openProject(result);
        break;

      case "templates":
        openTemplate(result);
        break;

      case "community":
        openCommunity(result);
        break;

      case "users":
        openUser(result);
        break;

      case "tutorials":
        openTutorial(result);
        break;
    }
  }

  function openProject(result) {
    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.setCurrentProject ===
      "function"
    ) {
      window.KAISoulStorage.setCurrentProject(
        result.id
      );
    }

    navigate("code");
  }

  function openTemplate(result) {
    if (
      window.KAISoulTemplates &&
      typeof window.KAISoulTemplates.useTemplate ===
      "function"
    ) {
      window.KAISoulTemplates.useTemplate(
        result.id
      );
      return;
        }
