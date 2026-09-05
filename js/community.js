(function () {
  "use strict";

  const STORAGE_KEY = "KAISOUL_DEV_COMMUNITY";

  const state = {
    activeTab: "all",
    search: "",
    posts: []
  };

  const demoPosts = [
    {
      id: "post-001",
      type: "showcase",
      author: "KAISOUL",
      username: "kaisoul",
      title: "Modern Portfolio",
      description: "A clean developer portfolio built with HTML, CSS and JavaScript.",
      language: "HTML / CSS / JS",
      likes: 24,
      comments: 6,
      forks: 8,
      liked: false,
      createdAt: Date.now() - 86400000,
      code: {
        html: "<main><h1>Hello KAISOUL</h1></main>",
        css: "body { font-family: sans-serif; }",
        js: "console.log('Hello KAISOUL DEV');"
      }
    },
    {
      id: "post-002",
      type: "code",
      author: "DevUser",
      username: "devuser",
      title: "Simple Dark Button",
      description: "Reusable dark UI button component.",
      language: "CSS",
      likes: 18,
      comments: 3,
      forks: 4,
      liked: false,
      createdAt: Date.now() - 172800000,
      code: {
        html: "<button class=\"btn\">Click me</button>",
        css: ".btn { padding: 12px 20px; border-radius: 8px; }",
        js: ""
      }
    },
    {
      id: "post-003",
      type: "tutorial",
      author: "WebMaster",
      username: "webmaster",
      title: "5 Tips for Better Web Projects",
      description: "A short guide to keeping your HTML, CSS and JavaScript projects organized.",
      language: "Tutorial",
      likes: 31,
      comments: 9,
      forks: 12,
      liked: false,
      createdAt: Date.now() - 259200000,
      code: {
        html: "",
        css: "",
        js: ""
      }
    }
  ];

  function init() {
    loadPosts();
    bindEvents();
    render();
  }

  function loadPosts() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          state.posts = parsed;
          return;
        }
      }
    } catch (error) {
      console.warn("[KAISOUL DEV] Community load error:", error);
    }

    state.posts = demoPosts.map(post => ({ ...post }));
  }

  function savePosts() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state.posts)
      );
    } catch (error) {
      console.warn("[KAISOUL DEV] Community save error:", error);
    }
  }

  function getContainer() {
    return document.querySelector(
      "[data-community-container], #communityPosts, .community-posts"
    );
  }

  function getVisiblePosts() {
    let posts = [...state.posts];

    if (state.activeTab !== "all") {
      posts = posts.filter(
        post => post.type === state.activeTab
      );
    }

    if (state.search.trim()) {
      const query = state.search.trim().toLowerCase();

      posts = posts.filter(post => {
        const text = [
          post.title,
          post.description,
          post.author,
          post.username,
          post.language,
          post.type
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(query);
      });
    }

    return posts.sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  function render() {
    const container = getContainer();

    updateTabs();

    if (!container) return;

    const posts = getVisiblePosts();

    if (!posts.length) {
      container.innerHTML = `
        <div class="community-empty">
          <div class="community-empty-title">
            No posts found
          </div>
          <div class="community-empty-text">
            Try another category or search term.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = posts
      .map(createPostCard)
      .join("");
  }

  function createPostCard(post) {
    const initials = escapeHTML(
      (post.author || "U")
        .slice(0, 2)
        .toUpperCase()
    );

    const likedClass = post.liked
      ? "active"
      : "";

    return `
      <article
        class="community-post"
        data-post-id="${escapeAttribute(post.id)}"
      >

        <div class="community-post-header">

          <div class="community-author">

            <div class="community-avatar">
              ${initials}
            </div>

            <div>
              <div class="community-author-name">
                ${escapeHTML(post.author)}
              </div>

              <div class="community-author-meta">
                @${escapeHTML(post.username)}
                ·
                ${formatDate(post.createdAt)}
              </div>
            </div>

          </div>

          <span class="community-post-type">
            ${escapeHTML(getTypeLabel(post.type))}
          </span>

        </div>

        <div class="community-post-body">

          <h3 class="community-post-title">
            ${escapeHTML(post.title)}
          </h3>

          <p class="community-post-description">
            ${escapeHTML(post.description)}
          </p>

          ${
            post.code && hasCode(post.code)
              ? createCodePreview(post)
              : ""
          }

        </div>

        <div class="community-post-footer">

          <div class="community-post-actions">

            <button
              type="button"
              class="community-action ${likedClass}"
              data-community-action="like"
              data-post-id="${escapeAttribute(post.id)}"
              aria-label="Like"
            >
              <span>♡</span>
              <span>${Number(post.likes) || 0}</span>
            </button>

            <button
              type="button"
              class="community-action"
              data-community-action="comment"
              data-post-id="${escapeAttribute(post.id)}"
            >
              <span>○</span>
              <span>${Number(post.comments) || 0}</span>
            </button>

            <button
              type="button"
              class="community-action"
              data-community-action="fork"
              data-post-id="${escapeAttribute(post.id)}"
            >
              <span>⑂</span>
              <span>${Number(post.forks) || 0}</span>
            </button>

            <button
              type="button"
              class="community-action"
              data-community-action="share"
              data-post-id="${escapeAttribute(post.id)}"
            >
              <span>↗</span>
              <span>Share</span>
            </button>

          </div>

          <button
            type="button"
            class="community-open-btn"
            data-community-action="open"
            data-post-id="${escapeAttribute(post.id)}"
          >
            Open
          </button>

        </div>

        <div
          class="community-comments"
          data-comments-for="${escapeAttribute(post.id)}"
          hidden
        >
          <div class="community-comments-list"></div>

          <form
            class="community-comment-form"
            data-comment-form="${escapeAttribute(post.id)}"
          >
            <input
              type="text"
              name="comment"
              placeholder="Write a comment..."
              maxlength="500"
              autocomplete="off"
            >
            <button type="submit">Post</button>
          </form>
        </div>

      </article>
    `;
  }

  function createCodePreview(post) {
    const code = post.code || {};

    let preview = "";

    if (code.html) {
      preview += escapeHTML(code.html);
    }

    if (code.css) {
      preview += "\n" + escapeHTML(code.css);
    }

    if (!preview.trim()) return "";

    const shortPreview =
      preview.length > 700
        ? preview.slice(0, 700) + "\n..."
        : preview;

    return `
      <div class="community-code-preview">
        <div class="community-code-header">
          <span>${escapeHTML(post.language || "Code")}</span>
          <button
            type="button"
            data-community-action="open"
            data-post-id="${escapeAttribute(post.id)}"
          >
            View
          </button>
        </div>

        <pre><code>${shortPreview}</code></pre>
      </div>
    `;
  }

  function hasCode(code) {
    return Boolean(
      code &&
      (
        String(code.html || "").trim() ||
        String(code.css || "").trim() ||
        String(code.js || "").trim()
      )
    );
  }

  function updateTabs() {
    document
      .querySelectorAll(
        "[data-community-tab]"
      )
      .forEach(button => {
        const tab = button.dataset.communityTab;

        const active =
          tab === state.activeTab;

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

  function setTab(tab) {
    const validTabs = [
      "all",
      "code",
      "projects",
      "tutorials",
      "questions",
      "showcase"
    ];

    if (!validTabs.includes(tab)) {
      tab = "all";
    }

    state.activeTab = tab;
    render();
  }

  function likePost(id) {
    const post = findPost(id);

    if (!post) return;

    post.liked = !post.liked;

    if (post.liked) {
      post.likes = Number(post.likes || 0) + 1;
    } else {
      post.likes = Math.max(
        0,
        Number(post.likes || 0) - 1
      );
    }

    savePosts();
    render();
  }

  function toggleComments(id) {
    const element = document.querySelector(
      `[data-comments-for="${CSS.escape(id)}"]`
    );

    if (!element) return;

    element.hidden = !element.hidden;

    if (!element.hidden) {
      const input = element.querySelector("input");

      if (input) {
        setTimeout(() => input.focus(), 0);
      }
    }
  }

  function addComment(id, text) {
    const post = findPost(id);

    if (!post || !text.trim()) return;

    post.comments = Number(post.comments || 0) + 1;

    savePosts();
    render();

    setTimeout(() => {
      toggleComments(id);
    }, 0);

    notify("Comment added.", "success");
  }

  function forkPost(id) {
    const post = findPost(id);

    if (!post) return;

    if (
      !post.code ||
      !hasCode(post.code)
    ) {
      notify(
        "This post does not contain a forkable project.",
        "error"
      );
      return;
    }

    if (
      window.KAISoulStorage &&
      typeof window.KAISoulStorage.createProject === "function"
    ) {
      try {
        const project = {
          name: `${post.title} — Fork`,
          type: "website",
          description: `Forked from @${post.username}`,
          html: post.code.html || "",
          css: post.code.css || "",
          js: post.code.js || "",
          source: "community-fork",
          sourcePostId: post.id
        };

        const created =
          window.KAISoulStorage.createProject(project);

        if (
          created &&
          typeof window.KAISoulStorage.setCurrentProject === "function"
        ) {
          window.KAISoulStorage.setCurrentProject(
            created.id
          );
        }

        post.forks =
          Number(post.forks || 0) + 1;

        savePosts();

        notify(
          "Project forked successfully.",
          "success"
        );

        if (
          window.KAISoulApp &&
          typeof window.KAISoulApp.navigate === "function"
        ) {
          window.KAISoulApp.navigate("code");
        } else {
          window.location.href = "?page=code";
        }

        return;
      } catch (error) {
        console.error(error);
      }
    }

    notify(
      "Fork system is not available yet.",
      "error"
    );
  }

  async function sharePost(id) {
    const post = findPost(id);

    if (!post) return;

    const url =
      `${window.location.origin}` +
      `${window.location.pathname}` +
      `?page=community&post=${encodeURIComponent(post.id)}`;

    const shareData = {
      title: post.title,
      text: post.description,
      url
    };

    try {
      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(url);

      notify(
        "Community link copied.",
        "success"
      );
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }

      copyFallback(url);
    }
  }

  function copyFallback(text) {
    const textarea =
      document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);

    textarea.select();

    try {
      document.execCommand("copy");
      notify(
        "Community link copied.",
        "success"
      );
    } catch (error) {
      notify(
        "Unable to copy link.",
        "error"
      );
    }

    textarea.remove();
  }

  function openPost(id) {
    const post = findPost(id);

    if (!post) return;

    showPostModal(post);
  }

  function showPostModal(post) {
    const oldModal =
      document.querySelector(
        ".community-post-modal"
      );

    if (oldModal) {
      oldModal.remove();
    }

    const modal =
      document.createElement("div");

    modal.className =
      "modal-overlay community-post-modal";

    modal.innerHTML = `
      <div
        class="modal community-post-detail"
        role="dialog"
        aria-modal="true"
        aria-label="${escapeAttribute(post.title)}"
      >

        <div class="modal-header">
          <div>
            <div class="modal-title">
              ${escapeHTML(post.title)}
            </div>

            <div class="modal-subtitle">
              @${escapeHTML(post.username)}
            </div>
          </div>

          <button
            type="button"
            class="modal-close"
            data-community-modal-close
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div class="modal-body">

          <p class="community-detail-description">
            ${escapeHTML(post.description)}
          </p>

          ${
            post.code && hasCode(post.code)
              ? `
                <div class="community-detail-code">

                  ${
                    post.code.html
                      ? `
                        <section>
                          <h4>HTML</h4>
                          <pre><code>${escapeHTML(post.code.html)}</code></pre>
                        </section>
                      `
                      : ""
                  }

                  ${
                    post.code.css
                      ? `
                        <section>
                          <h4>CSS</h4>
                          <pre><code>${escapeHTML(post.code.css)}</code></pre>
                        </section>
                      `
                      : ""
                  }

                  ${
                    post.code.js
                      ? `
                        <section>
                          <h4>JavaScript</h4>
                          <pre><code>${escapeHTML(post.code.js)}</code></pre>
                        </section>
                      `
                      : ""
                  }

                </div>
              `
              : `
                <div class="community-no-code">
                  This post does not contain source code.
                </div>
              `
          }

        </div>

        <div class="modal-footer">

          <button
            type="button"
            class="btn btn-secondary"
            data-community-modal-action="like"
            data-post-id="${escapeAttribute(post.id)}"
          >
            ${post.liked ? "Unlike" : "Like"}
          </button>

          <button
            type="button"
            class="btn btn-secondary"
            data-community-modal-action="fork"
            data-post-id="${escapeAttribute(post.id)}"
          >
            Fork
          </button>

          <button
            type="button"
            class="btn btn-primary"
            data-community-modal-action="share"
            data-post-id="${escapeAttribute(post.id)}"
          >
            Share
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      modal.classList.add("show");
    });
  }

  function closeModal() {
    const modal =
      document.querySelector(
        ".community-post-modal"
      );

    if (!modal) return;

    modal.classList.remove("show");

    setTimeout(() => {
      modal.remove();
    }, 180);
  }

  function createPost(data) {
    const title =
      String(data.title || "").trim();

    if (!title) {
      notify(
        "Post title is required.",
        "error"
      );
      return null;
    }

    const post = {
      id: generateId(),
      type: data.type || "showcase",
      author: data.author || "You",
      username: data.username || "user",
      title,
      description:
        String(data.description || "").trim(),
      language:
        data.language || "HTML / CSS / JS",
      likes: 0,
      comments: 0,
      forks: 0,
      liked: false,
      createdAt: Date.now(),
      code: data.code || {
        html: "",
        css: "",
        js: ""
      }
    };

    state.posts.unshift(post);

    savePosts();
    render();

    notify(
      "Post published.",
      "success"
    );

    return post;
  }

  function findPost(id) {
    return state.posts.find(
      post => String(post.id) === String(id)
    );
  }

  function generateId() {
    return (
      "post-" +
      Date.now().toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );
  }

  function formatDate(timestamp) {
    const date =
      new Date(Number(timestamp));

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    const diff =
      Date.now() - date.getTime();

    const minute = 60000;
    const hour = minute * 60;
    const day = hour * 24;

    if (diff < minute) {
      return "Just now";
    }

    if (diff < hour) {
      return `${Math.floor(diff / minute)}m ago`;
    }

    if (diff < day) {
      return `${Math.floor(diff / hour)}h ago`;
    }

    if (diff < day * 7) {
      return `${Math.floor(diff / day)}d ago`;
    }

    return date.toLocaleDateString();
  }

  function getTypeLabel(type) {
    const labels = {
      all: "All",
      code: "Code",
      projects: "Project",
      tutorials: "Tutorial",
      questions: "Question",
      showcase: "Showcase"
    };

    return labels[type] || "Post";
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHTML(value);
  }

  function notify(message, type = "info") {
    if (
      window.KAISoulApp &&
      typeof window.KAISoulApp.showToast === "function"
    ) {
      window.KAISoulApp.showToast(
        message,
        type
      );
      return;
    }

    if (
      typeof window.showToast === "function"
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

  function bindEvents() {
    document.addEventListener(
      "click",
      function (event) {
        const tab =
          event.target.closest(
            "[data-community-tab]"
          );

        if (tab) {
          setTab(
            tab.dataset.communityTab
          );
          return;
        }

        const action =
          event.target.closest(
            "[data-community-action]"
          );

        if (action) {
   
