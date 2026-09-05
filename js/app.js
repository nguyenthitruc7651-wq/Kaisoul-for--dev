(function () {
  "use strict";

  const App = {
    initialized: false,

    state: {
      sidebarOpen: false,
      modalOpen: false,
      commandPaletteOpen: false,
      searchOpen: false
    },

    selectors: {
      sidebar: [
        "#sidebar",
        ".sidebar",
        "[data-sidebar]"
      ],

      overlay: [
        "#appOverlay",
        ".app-overlay",
        "[data-overlay]"
      ],

      modal: [
        "#modal",
        ".modal",
        "[data-modal]"
      ],

      commandPalette: [
        "#commandPalette",
        ".command-palette",
        "[data-command-palette]"
      ],

      toast: [
        "#toast",
        ".toast",
        "[data-toast]"
      ]
    },

    init() {
      if (this.initialized) return;

      this.initialized = true;

      this.bindGlobalEvents();
      this.bindButtons();
      this.bindSidebar();
      this.bindModals();
      this.bindCommandPalette();
      this.bindSearch();
      this.bindKeyboardShortcuts();
      this.applySavedSettings();
      this.updateAccountUI();
      this.updateCurrentProjectUI();

      window.dispatchEvent(
        new CustomEvent("kaisoul:app-ready")
      );
    },

    /* ---------------------------------
       DOM HELPERS
    --------------------------------- */

    find(selectors) {
      if (!Array.isArray(selectors)) {
        selectors = [selectors];
      }

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }

      return null;
    },

    findAll(selectors) {
      if (!Array.isArray(selectors)) {
        selectors = [selectors];
      }

      const result = [];

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (!result.includes(el)) {
            result.push(el);
          }
        });
      });

      return result;
    },

    show(element) {
      if (!element) return;

      element.hidden = false;
      element.removeAttribute("aria-hidden");

      element.classList.add("is-open");
      element.classList.remove("hidden");
    },

    hide(element) {
      if (!element) return;

      element.hidden = true;
      element.setAttribute("aria-hidden", "true");

      element.classList.remove("is-open");
    },

    toggle(element, force) {
      if (!element) return;

      const isOpen =
        element.classList.contains("is-open") ||
        element.hidden === false;

      const shouldOpen =
        typeof force === "boolean"
          ? force
          : !isOpen;

      if (shouldOpen) {
        this.show(element);
      } else {
        this.hide(element);
      }
    },

    /* ---------------------------------
       GLOBAL EVENTS
    --------------------------------- */

    bindGlobalEvents() {
      document.addEventListener("click", event => {
        const target = event.target;

        if (!target) return;

        /*
         * Generic data-action support
         */
        const actionElement = target.closest(
          "[data-action]"
        );

        if (actionElement) {
          const action =
            actionElement.dataset.action;

          this.handleAction(
            action,
            actionElement,
            event
          );
        }

        /*
         * Close elements
         */
        const closeElement = target.closest(
          "[data-close]"
        );

        if (closeElement) {
          const targetName =
            closeElement.dataset.close;

          this.closeByName(targetName);
        }
      });

      /*
       * Escape closes overlays/modals.
       */
      document.addEventListener(
        "keydown",
        event => {
          if (event.key !== "Escape") return;

          if (this.state.commandPaletteOpen) {
            this.closeCommandPalette();
            return;
          }

          if (this.state.searchOpen) {
            this.closeSearch();
            return;
          }

          if (this.state.modalOpen) {
            this.closeModal();
            return;
          }

          if (this.state.sidebarOpen) {
            this.closeSidebar();
          }
        }
      );

      /*
       * Custom events from other modules.
       */

      window.addEventListener(
        "kaisoul:project-saved",
        () => {
          this.updateCurrentProjectUI();
          this.showToast(
            "Project saved",
            "success"
          );
        }
      );

      window.addEventListener(
        "kaisoul:settings-changed",
        () => {
          this.applySavedSettings();
        }
      );

      window.addEventListener(
        "kaisoul:user-changed",
        () => {
          this.updateAccountUI();
        }
      );

      window.addEventListener(
        "storage",
        () => {
          this.updateAccountUI();
          this.updateCurrentProjectUI();
        }
      );
    },

    /* ---------------------------------
       ACTION HANDLER
    --------------------------------- */

    handleAction(action, element, event) {
      if (!action) return;

      switch (action) {
        case "new-project":
          event?.preventDefault();
          this.newProject();
          break;

        case "open-playground":
          event?.preventDefault();
          this.navigate("playground");
          break;

        case "open-code":
          event?.preventDefault();
          this.navigate("code");
          break;

        case "open-projects":
          event?.preventDefault();
          this.navigate("projects");
          break;

        case "open-templates":
          event?.preventDefault();
          this.navigate("templates");
          break;

        case "open-community":
          event?.preventDefault();
          this.navigate("community");
          break;

        case "open-profile":
          event?.preventDefault();
          this.navigate("profile");
          break;

        case "open-settings":
          event?.preventDefault();
          this.navigate("settings");
          break;

        case "open-ai":
          event?.preventDefault();
          this.navigate("ai");
          break;

        case "toggle-sidebar":
          event?.preventDefault();
          this.toggleSidebar();
          break;

        case "open-search":
          event?.preventDefault();
          this.openSearch();
          break;

        case "close-search":
          event?.preventDefault();
          this.closeSearch();
          break;

        case "open-command-palette":
          event?.preventDefault();
          this.openCommandPalette();
          break;

        case "close-command-palette":
          event?.preventDefault();
          this.closeCommandPalette();
          break;

        case "save":
          event?.preventDefault();

          if (
            window.KAISoulEditor &&
            typeof window.KAISoulEditor.save === "function"
          ) {
            window.KAISoulEditor.save();
          }
          break;

        case "run":
        case "run-project":
          event?.preventDefault();

          if (
            window.KAISoulEditor &&
            typeof window.KAISoulEditor.run === "function"
          ) {
            window.KAISoulEditor.run();
          } else if (
            window.KAISoulPreview &&
            typeof window.KAISoulPreview.run === "function"
          ) {
            window.KAISoulPreview.run();
          }
          break;

        case "open-preview":
          event?.preventDefault();

          if (
            window.KAISoulEditor &&
            typeof window.KAISoulEditor.openPreview === "function"
          ) {
            window.KAISoulEditor.openPreview();
          } else if (
            window.KAISoulPreview &&
            typeof window.KAISoulPreview.openInNewTab === "function"
          ) {
            window.KAISoulPreview.openInNewTab();
          }
          break;

        case "clear-console":
          event?.preventDefault();

          if (
            window.KAISoulPreview &&
            typeof window.KAISoulPreview.clearConsole === "function"
          ) {
            window.KAISoulPreview.clearConsole();
          }
          break;

        case "export":
        case "export-project":
          event?.preventDefault();
          this.exportProject();
          break;

        case "share":
        case "share-project":
          event?.preventDefault();
          this.shareProject();
          break;

        case "logout":
          event?.preventDefault();
          this.logout();
          break;

        case "login":
          event?.preventDefault();
          this.login();
          break;

        case "register":
          event?.preventDefault();
          this.register();
          break;

        case "show-shortcuts":
          event?.preventDefault();
          this.showShortcuts();
          break;

        case "show-about":
          event?.preventDefault();
          this.showAbout();
          break;

        default:
          /*
           * Allow external modules to react.
           */
          window.dispatchEvent(
            new CustomEvent(
              "kaisoul:action",
              {
                detail: {
                  action,
                  element,
                  event
                }
              }
            )
          );
      }
    },

    /* ---------------------------------
       BUTTON BINDINGS
    --------------------------------- */

    bindButtons() {
      /*
       * Common ID compatibility.
       */

      const mappings = {
        "#newProjectBtn": "new-project",
        "#newProject": "new-project",

        "#playgroundBtn": "open-playground",
        "#openPlayground": "open-playground",

        "#saveBtn": "save",
        "#runBtn": "run",
        "#previewBtn": "open-preview",

        "#settingsBtn": "open-settings",
        "#profileBtn": "open-profile",

        "#searchBtn": "open-search",
        "#commandBtn": "open-command-palette",

        "#menuBtn": "toggle-sidebar",
        "#sidebarToggle": "toggle-sidebar",

        "#logoutBtn": "logout",
        "#loginBtn": "login",
        "#registerBtn": "register"
      };

      Object.entries(mappings).forEach(
        ([selector, action]) => {
          document
            .querySelectorAll(selector)
            .forEach(button => {
              if (
                !button.hasAttribute(
                  "data-action"
                )
              ) {
                button.dataset.action = action;
              }
            });
        }
      );
    },

    /* ---------------------------------
       SIDEBAR
    --------------------------------- */

    bindSidebar() {
      const sidebar = this.find(
        this.selectors.sidebar
      );

      if (!sidebar) return;

      const links = sidebar.querySelectorAll(
        "[data-route], [data-page-link], a"
      );

      links.forEach(link => {
        link.addEventListener("click", () => {
          if (window.innerWidth <= 768) {
            this.closeSidebar();
          }
        });
      });
    },

    toggleSidebar() {
      if (this.state.sidebarOpen) {
        this.closeSidebar();
      } else {
        this.openSidebar();
      }
    },

    openSidebar() {
      const sidebar = this.find(
        this.selectors.sidebar
      );

      if (!sidebar) return;

      this.state.sidebarOpen = true;

      this.show(sidebar);
      sidebar.classList.add("sidebar-open");

      document.body.classList.add(
        "sidebar-is-open"
      );

      this.showOverlay();
    },

    closeSidebar() {
      const sidebar = this.find(
        this.selectors.sidebar
      );

      if (!sidebar) return;

      this.state.sidebarOpen = false;

      sidebar.classList.remove(
        "sidebar-open"
      );

      /*
       * Desktop sidebar usually stays visible.
       */
      if (window.innerWidth <= 768) {
        this.hide(sidebar);
      }

      document.body.classList.remove(
        "sidebar-is-open"
      );

      if (
        !this.state.modalOpen &&
        !this.state.commandPaletteOpen &&
        !this.state.searchOpen
      ) {
        this.hideOverlay();
      }
    },

    /* ---------------------------------
       OVERLAY
    --------------------------------- */

    showOverlay() {
      const overlay = this.find(
        this.selectors.overlay
      );

      if (!overlay) return;

      this.show(overlay);

      overlay.onclick = () => {
        if (this.state.commandPaletteOpen) {
          this.closeCommandPalette();
          return;
        }

        if (this.state.searchOpen) {
          this.closeSearch();
          return;
        }

        if (this.state.modalOpen) {
          this.closeModal();
          return;
        }

        this.closeSidebar();
      };
    },

    hideOverlay() {
      const overlay = this.find(
        this.selectors.overlay
      );

      if (!overlay) return;

      this.hide(overlay);
      overlay.onclick = null;
    },

    /* ---------------------------------
       MODALS
    --------------------------------- */

    bindModals() {
      document
        .querySelectorAll(
          "[data-modal-open]"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            () => {
              this.openModal(
                button.dataset.modalOpen
              );
            }
          );
        });

      document
        .querySelectorAll(
          "[data-modal-close]"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            () => {
              this.closeModal();
            }
          );
        });

      document
        .querySelectorAll(".modal-backdrop")
        .forEach(backdrop => {
          backdrop.addEventListener(
            "click",
            event => {
              if (
                event.target === backdrop
              ) {
                this.closeModal();
              }
            }
          );
        });
    },

    openModal(name) {
      let modal = null;

      if (name) {
        modal =
          document.querySelector(
            `[data-modal="${name}"]`
          ) ||
          document.getElementById(name);
      }

      if (!modal) {
        modal = this.find(
          this.selectors.modal
        );
      }

      if (!modal) return;

      this.state.modalOpen = true;

      this.show(modal);

      modal.classList.add("modal-open");

      document.body.classList.add(
        "modal-is-open"
      );

      this.showOverlay();

      window.dispatchEvent(
        new CustomEvent(
          "kaisoul:modal-open",
          {
            detail: { name, modal }
          }
        )
      );
    },

    closeModal() {
      const modals =
        document.querySelectorAll(
          ".modal, [data-modal]"
        );

      modals.forEach(modal => {
        this.hide(modal);
        modal.classList.remove(
          "modal-open"
        );
      });

      this.state.modalOpen = false;

      document.body.classList.remove(
        "modal-is-open"
      );

      this.updateOverlayState();

      window.dispatchEvent(
        new CustomEvent(
          "kaisoul:modal-close"
        )
      );
    },

    closeByName(name) {
      if (!name) {
        this.closeModal();
        return;
      }

      const element =
        document.querySelector(
          `[data-modal="${name}"]`
        ) ||
        document.getElementById(name);

      if (element) {
        this.hide(element);
        element.classList.remove(
          "modal-open"
        );
      }

      this.state.modalOpen = false;

      this.updateOverlayState();
    },

    /* ---------------------------------
       SEARCH
    --------------------------------- */

    bindSearch() {
      const searchInputs =
        document.querySelectorAll(
          "[data-global-search], #globalSearch, #searchInput"
        );

      searchInputs.forEach(input => {
        input.addEventListener(
          "input",
          event => {
            this.performSearch(
              event.target.value
            );
          }
        );

        input.addEventListener(
          "keydown",
          event => {
            if (event.key === "Escape") {
              this.closeSearch();
            }

            if (event.key === "Enter") {
              const query =
                event.target.value.trim();

              if (query) {
                this.navigate(
                  "search",
                  {
                    q: query
                  }
                );
              }
            }
          }
        );
      });
    },

    openSearch() {
      const search =
        document.querySelector(
          "[data-search-overlay]"
        ) ||
        document.querySelector(
          "#searchOverlay"
        ) ||
        document.querySelector(
          ".search-overlay"
        );

      if (!search) {
        /*
         * If a dedicated overlay doesn't exist,
         * focus the first available search input.
         */
        const input =
          document.querySelector(
            "[data-global-search], #globalSearch, #searchInput"
          );

        if (input) {
          input.focus();
        }

        return;
      }

      this.state.searchOpen = true;

      this.show(search);
      this.showOverlay();

      const input =
        search.querySelector(
          "input"
        );

      if (input) {
        setTimeout(
          () => input.focus(),
          30
        );
      }
    },

    closeSearch() {
      const search =
        document.querySelector(
          "[data-search-overlay]"
        ) ||
        document.querySelector(
          "#searchOverlay"
        ) ||
        document.querySelector(
          ".search-overlay"
        );

      if (search) {
        this.hide(search);
      }

      this.state.searchOpen = false;

      this.updateOverlayState();
    },

    performSearch(query) {
      const cleanQuery =
        String(query || "")
          .trim()
          .toLowerCase();

      const results =
        document.querySelectorAll(
          "[data-search-item]"
        );

      results.forEach(item => {
        if (!cleanQuery) {
          item.hidden = false;
          return;
        }

        const text =
          item.textContent
            .toLowerCase();

        item.hidden =
          !text.includes(cleanQuery);
      });

      window.dispatchEvent(
        new CustomEvent(
          "kaisoul:search",
          {
            detail: {
              query: cleanQuery
            }
          }
        )
      );
    },

    /* ---------------------------------
       COMMAND PALETTE
    --------------------------------- */

    bindCommandPalette() {
      const palette = this.find(
        this.selectors.commandPalette
      );

      if (!palette) return;

      palette.addEventListener(
        "click",
        event => {
          const command =
            event.target.closest(
              "[data-command]"
            );

          if (!command) return;

          const action =
            command.dataset.command;

          this.closeCommandPalette();

          this.handleAction(
            action,
            command,
            event
          );
        }
      );

      const input =
        palette.querySelector(
          "input"
        );

      if (input) {
        input.addEventListener(
          "input",
          () => {
            this.filterCommands(
              input.value
            );
          }
        );
      }
    },

    openCommandPalette() {
      const palette = this.find(
        this.selectors.commandPalette
      );

      if (!palette) return;

      this.state.commandPaletteOpen =
        true;

      this.show(palette);

      palette.classList.add(
        "command-palette-open"
      )
