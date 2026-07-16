(function installNextChapterV29App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  function animateAction(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const action = button.dataset.action || "";
    if (["tab", "menu-tab", "close-modal", "toggle-theme", "open-main-menu"].includes(action)) return;
    document.body.classList.remove("v29-action-running");
    void document.body.offsetWidth;
    document.body.classList.add("v29-action-running");
    setTimeout(() => document.body.classList.remove("v29-action-running"), 520);
    if (action.startsWith("vampire-") || action === "wizard-turn") {
      const splash = document.createElement("div");
      splash.className = "v29-occult-splash";
      splash.innerHTML = "<i></i><i></i><i></i><strong>Night action</strong>";
      document.body.appendChild(splash);
      setTimeout(() => splash.remove(), 900);
    }
  }

  document.addEventListener("click", animateAction, true);

  const previousStart = AP.start;
  AP.start = function startV29() {
    if (!this._v29ModInputBound) {
      const input = document.getElementById("mod-import-file");
      if (input) input.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        try {
          if (file.size > 1024 * 1024) throw new Error("Mod files must be smaller than 1 MB.");
          const installed = NC.Mods.install(JSON.parse(await file.text()));
          this.toast("Mod installed", `${installed.name} added ${installed.events.length} custom life event${installed.events.length === 1 ? "" : "s"}. Reloading…`, "success");
          setTimeout(() => global.location.reload(), 650);
        } catch (error) {
          this.toast("Could not install mod", error.message || String(error), "error");
        } finally {
          event.target.value = "";
        }
      });
      this._v29ModInputBound = true;
    }
    return previousStart.call(this);
  };

  const previousRenderModal = AP.renderModal;
  AP.renderModal = function renderModalV29() {
    if (this.mode === "game" && this.game && this.game.state.alive && !this.game.state.pendingEvent && this.modal && this.modal.type === "mods") {
      this.modalRoot.innerHTML = NC.View.modsModal(this);
      return;
    }
    previousRenderModal.call(this);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function handleClickV29(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    const handled = new Set(["open-mods", "open-mod-maker", "import-mod", "toggle-mod", "remove-mod", "spend-time-all"]);
    if (!handled.has(action)) return previousHandleClick.call(this, event);
    event.preventDefault();
    try {
      if (action === "open-mods") {
        this.modal = { type: "mods" };
        this.renderModal();
      } else if (action === "open-mod-maker") {
        global.open("mod-maker.html", "_blank", "noopener");
      } else if (action === "import-mod") {
        const input = document.getElementById("mod-import-file");
        if (input) { input.value = ""; input.click(); }
      } else if (action === "toggle-mod") {
        NC.Mods.toggle(button.dataset.mod);
        this.renderModal();
      } else if (action === "remove-mod") {
        NC.Mods.remove(button.dataset.mod);
        this.renderModal();
      } else if (action === "spend-time-all") {
        const count = this.game.spendTimeWithAll();
        this.toast("Time well spent", `You connected with ${count} people.`, "success");
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
