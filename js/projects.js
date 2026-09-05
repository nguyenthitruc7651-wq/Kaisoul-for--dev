(function () {
  "use strict";

  const Projects = {
    initialized: false,

    state: {
      filter: "all",
      sort: "updated",
      view: "grid",
      editingProjectId: null
    },

    init() {
      if (this.initialized) return;

      this.initialized = true;

      this.bindEvents();
      this.loadSettings();
      this.render();

      window.addEventListener(
        "kaisoul:project-saved",
        () => this.render()
      );

      window.addEventListener(
        "kaisoul:new-project",
        () => this.render()
      );

      window.addEventListener(
        "popstate",
        () => {
          if (
            window.KAISoulRouter &&
            typeof window.KAISoulRouter.getCurrentPage === "function" &&
            window.KAISoulRouter.getCurrentPage() === "projects"
          ) {
            this.render();
          }
        }
      );
    },

    /* ================================
       STORAGE
    ================================= */

    getProjects() {
      if (
        window.KAISoulStorage &&
        typeof window.KAISoulStorage.getProjects === "function"
      ) {
        return (
          window.KAISoulStorage.getProjects() || []
        );
      }

      return [];
    },

    saveProject(project) {
      if (
        window.KAISoulStorage &&
        typeof window.KAISoulStorage.updateProject === "function"
      ) {
        return window.KAISoulStorage.updateProject(
          project.id,
          project
        );
      }

      return project;
    },

    deleteProject(id) {
      if (
        window.KAISoulStorage &&
        typeof window.KAISoulStorage.deleteProject === "function"
      ) {
        return window.KAISoulStorage.deleteProject(
          id
        );
      }

      return false;
    },

    duplicateProject(id) {
      if (
        window.KAISoulStorage &&
        typeof window.KAISoulStorage.duplicateProject === "function"
      ) {
        return window.KAISoulStorage.duplicateProject(
          id
        );
      }

      return null;
    },

    forkProject(id) {
      if (
        window.KAISoulStorage &&
        typeof window.KAISoulStorage.forkProject === "function"
      ) {
        return window.KAISoulStorage.forkProject(
          id
        );
      }

      return null;
    },

    /* ================================
       SETTINGS
    ================================= */

    loadSettings() {
      try {
        const saved =
          localStorage.getItem(
            "kaisoul_projects_view"
          );

        if (
          saved === "grid" ||
          saved === "list"
        ) {
          this.state.view = saved;
        }

        const filter =
          localStorage.getItem(
            "kaisoul_projects_filter"
          );

        if (filter) {
          this.state.filter =
            filter;
        }

        const sort =
          localStorage.getItem(
            "kaisoul_projects_sort"
          );

        if (sort) {
          this.state.sort = sort;
        }
      } catch (error) {
        console.warn(
          "Projects settings could not be loaded:",
          error
        );
      }
    },

    saveSettings() {
      try {
        localStorage.setItem(
          "kaisoul_projects_view",
          this.state.view
        );

        localStorage.setItem(
          "kaisoul_projects_filter",
          this.state.filter
        );

        localStorage.setItem(
          "kaisoul_projects_sort",
          this.state.sort
        );
      } catch (error) {
        console.warn(
          "Projects settings could not be saved:",
          error
        );
      }
    },

    /* ================================
       EVENTS
    ================================= */

    bindEvents() {
      document.addEventListener(
        "click",
        event => {
          const target =
            event.target;

          /*
           * Filter
           */
          const filter =
            target.closest(
              "[data-project-filter]"
            );

          if (filter) {
            event.preventDefault();

            this.setFilter(
              filter.dataset.projectFilter
            );

            return;
          }

          /*
           * Sort
           */
          const sort =
            target.closest(
              "[data-project-sort]"
            );

          if (sort) {
            event.preventDefault();

            this.setSort(
              sort.dataset.projectSort
            );

            return;
          }

          /*
           * View
           */
          const view =
            target.closest(
              "[data-project-view]"
            );

          if (view) {
            event.preventDefault();

            this.setView(
              view.dataset.projectView
            );

            return;
          }

          /*
           * Project action
           */
          const action =
            target.closest(
              "[data-project-action]"
            );

          if (action) {
            event.preventDefault();

            this.handleProjectAction(
              action.dataset.projectAction,
              action.dataset.projectId
            );
          }

          /*
           * Project card
           */
          const card =
            target.closest(
              "[data-project-card]"
            );

          if (
            card &&
            !target.closest(
              "button, a, input, select"
            )
          ) {
            const id =
              card.dataset.projectCard;

            if (id) {
              this.openProject(id);
            }
          }
        }
      );

      document.addEventListener(
        "change",
        event => {
          const select =
            event.target.closest(
              "[data-project-sort-select]"
            );

          if (!select) return;

          this.setSort(
            select.value
          );
        }
      );
    },

    /* ================================
       FILTER
    ================================= */

    setFilter(filter) {
      const allowed = [
        "all",
        "website",
        "games",
        "apps",
        "templates"
      ];

      if (
        !allowed.includes(filter)
      ) {
        filter = "all";
      }

      this.state.filter =
        filter;

      this.saveSettings();
      this.render();
    },

    setSort(sort) {
      const allowed = [
        "updated",
        "created",
        "name"
      ];

      if (
        !allowed.includes(sort)
      ) {
        sort = "updated";
      }

      this.state.sort = sort;

      this.saveSettings();
      this.render();
    },

    setView(view) {
      if (
        view !== "grid" &&
        view !== "list"
      ) {
        view = "grid";
      }

      this.state.view = view;

      this.saveSettings();
      this.render();
    },

    /* ================================
       GET FILTERED PROJECTS
    ================================= */

    getVisibleProjects() {
      let projects =
        [...this.getProjects()];

      /*
       * Filter
       */
      if (
        this.state.filter !==
        "all"
      ) {
        projects =
          projects.filter(
            project => {
              const type =
                String(
                  project.type ||
                  "website"
                ).toLowerCase();

              if (
                this.state.filter ===
                "games"
              ) {
                return (
                  type === "game" ||
                  type === "games"
                );
              }

              if (
                this.state.filter ===
                "apps"
              ) {
                return (
                  type === "app" ||
                  type === "apps" ||
                  type === "webapp"
                );
              }

              if (
                this.state.filter ===
                "templates"
              ) {
                return (
                  project.isTemplate ===
                    true ||
                  type === "template"
                );
              }

              return (
                type ===
                this.state.filter
              );
            }
          );
      }

      /*
       * Sort
       */
      projects.sort(
        (a, b) => {
          if (
            this.state.sort ===
            "name"
          ) {
            return String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              )
            );
          }

          if (
            this.state.sort ===
            "created"
          ) {
            return (
              this.getDate(
                b.createdAt
              ) -
              this.getDate(
                a.createdAt
              )
            );
          }

          return (
            this.getDate(
              b.updatedAt
            ) -
            this.getDate(
              a.updatedAt
            )
          );
        }
      );

      return projects;
    },

    /* ================================
       RENDER
    ================================= */

    render() {
      const containers =
        document.querySelectorAll(
          "[data-projects-container], #projectsGrid, .projects-grid"
        );

      if (!containers.length) {
        return;
      }

      const projects =
        this.getVisibleProjects();

      containers.forEach(
        container => {
          this.applyView(
            container
          );

          container.innerHTML =
            "";

          if (!projects.length) {
            container.innerHTML =
              this.emptyState();

            return;
          }

          projects.forEach(
            project => {
              container.appendChild(
                this.createCard(
                  project
                )
              );
            }
          );
        }
      );

      this.updateControls();
      this.updateCount(
        projects.length
      );
    },

    /* ================================
       CARD
    ================================= */

    createCard(project) {
      const card =
        document.createElement(
          "article"
        );

      card.className =
        "project-card";

      card.dataset.projectCard =
        project.id;

      const type =
        this.getProjectType(
          project
        );

      const language =
        this.getLanguage(
          project
        );

      const updated =
        this.formatDate(
          project.updatedAt
        );

      const created =
        this.formatDate(
          project.createdAt
        );

      card.innerHTML = `
        <div class="project-card-preview">
          <div class="project-preview-placeholder">
            <span>${this.escapeHTML(
              type
            )}</span>
          </div>
        </div>

        <div class="project-card-content">

          <div class="project-card-top">

            <div class="project-card-title-wrap">
              <h3 class="project-card-title">
                ${this.escapeHTML(
                  project.name ||
                  "Untitled Project"
                )}
              </h3>

              <span class="project-card-type">
                ${this.escapeHTML(
                  language
                )}
              </span>
            </div>

            <button
              type="button"
              class="project-more-btn"
              aria-label="Project menu"
              data-project-action="menu"
              data-project-id="${this.escapeAttribute(
                project.id
              )}"
            >
              ⋯
            </button>

          </div>

          <div class="project-card-meta">
            <span>
              Updated ${this.escapeHTML(
                updated
              )}
            </span>
          </div>

          <div class="project-card-actions">

            <button
              type="button"
              class="btn btn-primary"
              data-project-action="open"
              data-project-id="${this.escapeAttribute(
                project.id
              )}"
            >
              Open
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              data-project-action="duplicate"
              data-project-id="${this.escapeAttribute(
                project.id
              )}"
            >
              Duplicate
            </button>

          </div>

        </div>
      `;

      return card;
    },

    /* ================================
       LIST VIEW
    ================================= */

    applyView(container) {
      container.classList.toggle(
        "projects-list-view",
        this.state.view === "list"
      );

      container.classList.toggle(
        "projects-grid-view",
        this.state.view === "grid"
      );

      container.dataset.view =
        this.state.view;
    },

    /* ================================
       CONTROLS
    ================================= */

    updateControls() {
      document
        .querySelectorAll(
          "[data-project-filter]"
        )
        .forEach(button => {
          button.classList.toggle(
            "active",
            button.dataset
              .projectFilter ===
              this.state.filter
          );

          button.setAttribute(
            "aria-pressed",
            button.dataset
              .projectFilter ===
              this.state.filter
          );
        });

      document
        .querySelectorAll(
          "[data-project-sort]"
        )
        .forEach(button => {
          button.classList.toggle(
            "active",
            button.dataset
              .projectSort ===
              this.state.sort
          );
        });

      document
        .querySelectorAll(
          "[data-project-view]"
        )
        .forEach(button => {
          button.classList.toggle(
            "active",
            button.dataset
              .projectView ===
              this.state.view
          );
        });

      document
        .querySelectorAll(
          "[data-project-sort-select]"
        )
        .forEach(select => {
          select.value =
            this.state.sort;
        });
    },

    updateCount(count) {
      document
        .querySelectorAll(
          "[data-project-count]"
        )
        .forEach(element => {
          element.textContent =
            String(count);
        });
    },

    /* ================================
       ACTIONS
    ================================= */

    handleProjectAction(
      action,
      id
    ) {
      if (!action) return;

      switch (action) {
        case "open":
          this.openProject(id);
          break;

        case "duplicate":
          this.duplicate(id);
          break;

        case "fork":
          this.fork(id);
          break;

        case "rename":
          this.rename(id);
          break;

        case "delete":
          this.remove(id);
          break;

        case "menu":
          this.openProjectMenu(
            id
          );
          break;

        case "export":
          this.export(id);
          break;

        case "versions":
        case "history":
          this.showVersions(id);
          break;

        default:
          window.dispatchEvent(
            new CustomEvent(
              "kaisoul:project-action",
              {
                detail: {
                  action,
                  projectId: id
                }
              }
            )
          );
      }
    },

    /* ================================
       OPEN
    ================================= */

    openProject(id) {
      const project =
        this.findProject(id);

      if (!project) {
        this.notify(
          "Project not found",
          "error"
        );

        return;
      }

      if (
        window.KAISoulStorage &&
        typeof window.KAISoulStorage.setCurrentProject === "function"
      ) {
        window.KAISoulStorage.setCurrentProject(
          project.id
        );
      }

      if (
        window.KAISoulEditor &&
        typeof window.KAISoulEditor.loadProject === "function"
      ) {
        window.KAISoulEditor.loadProject(
          project
        );
      }

      if (
        window.KAISoulApp &&
        typeof window.KAISoulApp.navigate === "function"
      ) {
        window.KAISoulApp.navigate(
          "code"
        );
      } else {
        window.location.href =
          "?page=code";
      }
    },

    /* ================================
       DUPLICATE
    ================================= */

    duplicate(id) {
      const project =
        this.findProject(id);

      if (!project) {
        this.notify(
          "Project not found",
          "error"
        );

        return;
      }

      const copy =
        this.duplicateProject(id);

      if (!copy) {
        this.notify(
          "Unable to duplicate project",
          "error"
        );

        return;
      }

      this.render();

      this.notify(
        `"${project.name}" duplicated`,
        "success"
      );
    },

    /* ================================
       FORK
    ================================= */

    fork(id) {
      const project =
        this.findProject(id);

      if (!project) {
        this.notify(
          "Project not found",
          "error"
        );

        return;
      }

      const fork =
        this.forkProject(id);

      if (!fork) {
        this.notify(
          "Unable to fork project",
          "error"
        );

        return;
      }

      this.render();

      this.notify(
        "Project forked",
        "success"
      );
    },

    /* ================================
       RENAME
    ================================= */

    rename(id) {
      const project =
        this.findProject(id);

      if (!project) return;

      const name =
        window.prompt(
          "Project name:",
          project.name ||
            "Untitled Project"
        );

      if (
        name === null
      ) {
        return;
      }

      const cleanName =
        name.trim();

      if (!cleanName) {
        this.notify(
          "Project name cannot be empty",
          "error"
        );

        return;
      }

      project.name =
        cleanName;

      project.updatedAt =
        new Date().toISOString();

      this.saveProject(
        project
      );

      this.render();

      this.notify(
        "Project renamed",
        "success"
      );
    },

    /* ================================
       DELETE
    ================================= */

    remove(id) {
      const project =
        this.findProject(id);

      if (!project) return;

      const confirmed =
        window.confirm(
          `Delete "${project.name}"?\n\nThis action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      const result =
        this.deleteProject(id);

      if (!result) {
        this.notify(
          "Unable to delete project",
          "error"
        );

        return;
      }

      /*
       * If deleted project was current,
       * clear current project.
       */
      if (
        window.KAISoulStorage &&
        typeof window.KAISoulStorage.getCurrentProject === "function" &&
        typeof window.KAISoulStorage.clearCurrentProject === "function"
      ) {
        const current =
          window.KAISoulStorage.getCurrentProject();

        if (
          current &&
          current.id === id
        ) {
          window.KAISoulStorage.clearCurrentProject();
        }
      }

      this.render();

      this.notify(
        "Project deleted",
        "success"
      );
    },

    /* ================
