(function installNextChapterV16App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  const previousStart = AP.start;
  AP.start = function v16Start() {
    try {
      if (!localStorage.getItem("next-chapter-theme")) {
        localStorage.setItem("next-chapter-theme", "dark");
        document.documentElement.dataset.theme = "dark";
      }
    } catch (_) {
      document.documentElement.dataset.theme = "dark";
    }
    return previousStart.call(this);
  };

  const previousRenderModal = AP.renderModal;
  AP.renderModal = function v16RenderModal() {
    if (this.mode === "game" && this.game && this.game.state.alive && !this.game.state.pendingEvent && this.modal) {
      if (this.modal.type === "relocate") { this.modalRoot.innerHTML = NC.View.relocateModal(this); return; }
      if (this.modal.type === "casino") { this.modalRoot.innerHTML = NC.View.casinoModal(this); return; }
      if (this.modal.type === "main-menu") { this.modalRoot.innerHTML = NC.View.mainMenuModal(this); return; }
    }
    previousRenderModal.call(this);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function v16HandleClick(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    const handled = new Set(["open-relocate", "relocate", "open-casino", "casino-start", "casino-pick", "casino-reset", "open-main-menu", "menu-tab", "buy-market"]);
    if (!handled.has(action)) return previousHandleClick.call(this, event);
    event.preventDefault();
    try {
      if (action === "open-relocate") {
        this.modal = { type: "relocate" };
        this.renderModal();
      } else if (action === "relocate") {
        this.modal = null;
        this.game.relocate(button.dataset.country, button.dataset.city);
      } else if (action === "open-casino") {
        this.modal = { type: "casino" };
        this.renderModal();
      } else if (action === "casino-start") {
        this.game.beginCasinoArcade();
        this.modal = { type: "casino" };
        this.renderModal();
      } else if (action === "casino-pick") {
        this.game.resolveCasinoArcade(button.dataset.index);
        this.modal = { type: "casino" };
        this.renderModal();
      } else if (action === "casino-reset") {
        this.game.clearCasinoRound();
        this.modal = null;
        this.render();
      } else if (action === "open-main-menu") {
        this.modal = { type: "main-menu" };
        this.renderModal();
      } else if (action === "menu-tab") {
        const requested = button.dataset.tab || "life";
        if (this.game.isIncarcerated() && !["life", "jail", "developer"].includes(requested)) throw new Error("Only jail options are available while incarcerated.");
        this.tab = requested;
        this.modal = null;
        this.render();
      } else if (action === "buy-market") {
        this.game.buyMarketListing(button.dataset.listing);
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
