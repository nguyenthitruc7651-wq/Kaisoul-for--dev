/* =========================================
   KAISOUL DEV — ROUTER
   SPA-style client-side navigation
   ========================================= */

(function () {
  "use strict";

  let currentPage = "home";
  let initialized = false;

  const DEFAULT_PAGE = "home";

  const PAGE_TITLES = {
    home: "Home",
    code: "Code Editor",
    playground: "Playground",
    projects: "Projects",
    templates: "Templates",
    community: "Community",
    profile: "Profile",
    settings: "Settings",
    ai: "KAISOUL AI"
  };


  /* =========================================
     INITIALIZATION
     ========================================= */

  function init() {

    if (initialized) {
      return;
    }

    initialized = true;

    bindNavigation();

    bindBrowserNavigation();

    const initialPage =
      getPageFromURL() ||
      DEFAULT_PAGE;

    navigate(
      initialPage,
      {
        replace: true,
        silent: true
      }
    );

    console.log(
      "KAISOUL DEV Router initialized."
    );
  }


  /* =========================================
     NAVIGATION
     ========================================= */

  function navigate(
    page,
    options = {}
  ) {

    page =
      normalizePage(page);

    if (!isValidPage(page)) {
      page = DEFAULT_PAGE;
    }

    const previousPage =
      currentPage;

    currentPage =
      page;

    /*
     * Update URL
     */

    if (!options.silent) {

      updateURL(
        page,
        options.replace === true
      );
    }


    /*
     * Hide all pages
     */

    document
      .querySelectorAll(
        "[data-page]"
      )
      .forEach(section => {

        const sectionPage =
          normalizePage(
            section.dataset.page
          );

        const active =
          sectionPage === page;

        section.classList.toggle(
          "active",
          active
        );

        section.hidden =
          !active;
      });


    /*
     * Support .page elements
     */

    document
      .querySelectorAll(
        ".page[data-route]"
      )
      .forEach(section => {

        const sectionPage =
          normalizePage(
            section.dataset.route
          );

        const active =
          sectionPage === page;

        section.classList.toggle(
          "active",
          active
        );

        section.hidden =
          !active;
      });


    /*
     * Update navigation states
     */

    updateNavigationState(
      page
    );


    /*
     * Update title
     */

    updateDocumentTitle(
      page
    );


    /*
     * Page-specific initialization
     */

    onPageEnter(
      page,
      previousPage
    );


    /*
     * Scroll to top
     */

    if (!options.preserveScroll) {

      window.scrollTo({
        top: 0,
        behavior: "instant"
      });
    }


    /*
     * Event
     */

    window.dispatchEvent(
      new CustomEvent(
        "kaisoul:route",
        {
          detail: {
            page,
            previousPage
          }
        }
      )
    );

    return page;
  }


  /* =========================================
     PAGE NORMALIZATION
     ========================================= */

  function normalizePage(page) {

    if (!page) {
      return DEFAULT_PAGE;
    }

    page =
      String(page)
        .toLowerCase()
        .trim();

    const aliases = {

      "/": "home",

      "index": "home",

      "index.html": "home",

      "editor": "code",

      "code-editor": "code",

      "new-project": "code",

      "play": "playground",

      "account": "profile",

      "user": "profile",

      "ai-assistant": "ai"
    };

    return aliases[page] || page;
  }


  function isValidPage(page) {

    return Object.prototype
      .hasOwnProperty.call(
        PAGE_TITLES,
        page
      );
  }


  /* =========================================
     URL
     ========================================= */

  function getPageFromURL() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const queryPage =
      params.get("page");

    if (queryPage) {
      return normalizePage(
        queryPage
      );
    }


    /*
     * Hash support:
     * #projects
     * #community
     */

    const hash =
      window.location.hash
        .replace(/^#/, "")
        .trim();

    if (hash) {
      return normalizePage(hash);
    }


    return DEFAULT_PAGE;
  }


  function updateURL(
    page,
    replace = false
  ) {

    const url =
      new URL(
        window.location.href
      );

    /*
     * GitHub Pages friendly:
     * ?page=projects
     */

    if (page === DEFAULT_PAGE) {
      url.searchParams.delete(
        "page"
      );
    } else {
      url.searchParams.set(
        "page",
        page
      );
    }

    url.hash = "";

    if (replace) {

      window.history.replaceState(
        {
          page
        },
        "",
        url
      );

    } else {

      window.history.pushState(
        {
          page
        },
        "",
        url
      );
    }
  }


  /* =========================================
     BROWSER BACK / FORWARD
     ========================================= */

  function bindBrowserNavigation() {

    window.addEventListener(
      "popstate",
      function (event) {

        const page =
          event.state?.page ||
          getPageFromURL();

        navigate(
          page,
          {
            silent: true,
            preserveScroll: false
          }
        );
      }
    );


    window.addEventListener(
      "hashchange",
      function () {

        const page =
          getPageFromURL();

        navigate(
          page,
          {
            silent: true
          }
        );
      }
    );
  }


  /* =========================================
     NAVIGATION EVENTS
     ========================================= */

  function bindNavigation() {

    document.addEventListener(
      "click",
      function (event) {

        const target =
          event.target.closest(
            "[data-route], [data-page-link], a[href^='?page='], a[href^='#']"
          );

        if (!target) {
          return;
        }

        /*
         * Do not interfere with
         * external links.
         */

        if (
          target.target === "_blank" ||
          target.hasAttribute("download")
        ) {
          return;
        }


        /*
         * data-route
         */

        let page =
          target.dataset.route;


        /*
         * data-page-link
         */

        if (!page) {
          page =
            target.dataset.pageLink;
        }


        /*
         * ?page=...
         */

        if (!page) {

          const href =
            target.getAttribute(
              "href"
            );

          if (
            href &&
            href.includes("?page=")
          ) {

            try {

              const url =
                new URL(
                  href,
                  window.location.href
                );

              page =
                url.searchParams.get(
                  "page"
                );

            } catch (error) {}
          }
        }


        /*
         * #page
         */

        if (!page) {

          const href =
            target.getAttribute(
              "href"
            );

          if (
            href &&
            href.startsWith("#")
          ) {
            page =
              href.substring(1);
          }
        }


        if (!page) {
          return;
        }


        page =
          normalizePage(page);


        if (!isValidPage(page)) {
          return;
        }


        event.preventDefault();

        navigate(page);
      }
    );
  }


  /* =========================================
     NAVIGATION STATE
     ========================================= */

  function updateNavigationState(page) {

    document
      .querySelectorAll(
        "[data-route], [data-page-link]"
      )
      .forEach(item => {

        const itemPage =
          normalizePage(
            item.dataset.route ||
            item.dataset.pageLink
          );

        const active =
          itemPage === page;

        item.classList.toggle(
          "active",
          active
        );

        item.setAttribute(
          "aria-current",
          active
            ? "page"
            : "false"
        );
      });


    /*
     * Mobile bottom navigation
     */

    document
      .querySelectorAll(
        ".mobile-nav-item"
      )
      .forEach(item => {

        const itemPage =
          normalizePage(
            item.dataset.route ||
            item.dataset.pageLink ||
            item.getAttribute("href") ||
            ""
          );

        item.classList.toggle(
          "active",
          itemPage === page
        );
      });
  }


  /* =========================================
     PAGE TITLE
     ========================================= */

  function updateDocumentTitle(page) {

    const title =
      PAGE_TITLES[page] ||
      "KAISOUL DEV";

    document.title =
      `${title} — KAISOUL DEV`;
  }


  /* =========================================
     PAGE ENTER HOOKS
     ========================================= */

  function onPageEnter(
    page,
    previousPage
  ) {

    switch (page) {

      case "home":

        dispatchPageEvent(
          "kaisoul:home"
        );

        break;


      case "code":

        /*
         * Initialize editor when
         * entering Code page.
         */

        if (
          window.KAISoulEditor &&
          typeof window.KAISoulEditor
            .reloadProject ===
          "function"
        ) {

          window.KAISoulEditor
            .reloadProject();
        }

        break;


      case "playground":

        dispatchPageEvent(
          "kaisoul:playground"
        );

        break;


      case "projects":

        dispatchPageEvent(
          "kaisoul:projects"
        );

        break;


      case "templates":

        dispatchPageEvent(
          "kaisoul:templates"
        );

        break;


      case "community":

        dispatchPageEvent(
          "kaisoul:community"
        );

        break;


      case "profile":

        dispatchPageEvent(
          "kaisoul:profile"
        );

        break;


      case "settings":

        dispatchPageEvent(
          "kaisoul:settings"
        );

        break;


      case "ai":

        dispatchPageEvent(
          "kaisoul:ai"
        );

        break;
    }
  }


  function dispatchPageEvent(
    name
  ) {

    window.dispatchEvent(
      new CustomEvent(name)
    );
  }


  /* =========================================
     GET CURRENT PAGE
     ========================================= */

  function getCurrentPage() {
    return currentPage;
  }


  /* =========================================
     GO BACK
     ========================================= */

  function back() {

    if (
      window.history.length > 1
    ) {

      window.history.back();

    } else {

      navigate(
        DEFAULT_PAGE
      );
    }
  }


  /* =========================================
     GO HOME
     ========================================= */

  function home() {

    navigate(
      DEFAULT_PAGE
    );
  }


  /* =========================================
     PUBLIC API
     ========================================= */

  window.KAISoulRouter = {

    init,

    navigate,

    back,

    home,

    getCurrentPage,

    getPageFromURL,

    isValidPage
  };


  /* =========================================
     AUTO INIT
     ========================================= */

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
