(function installNextChapterV25App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  const previousRenderModal = AP.renderModal;
  AP.renderModal = function renderModalV25() {
    if (this.mode === "game" && this.game && this.game.state.alive && !this.game.state.pendingEvent && this.modal) {
      if (this.modal.type === "v25-enterprises") { this.modalRoot.innerHTML = NC.View.enterpriseModal(this); return; }
      if (this.modal.type === "v25-collections") { this.modalRoot.innerHTML = NC.View.collectionModal(this); return; }
      if (this.modal.type === "v25-special-careers") { this.modalRoot.innerHTML = NC.View.specialCareerModal(this); return; }
    }
    previousRenderModal.call(this);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function handleClickV25(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    const newExpansion = action === "open-expansion" && ["enterprises", "collections", "special-careers"].includes(button.dataset.expansion);
    const toggleKeys = ["enterpriseAlwaysProfits", "collectionAlwaysAuthentic", "specialCareerAlwaysSucceeds"];
    const customToggle = action === "dev-toggle" && toggleKeys.includes(button.dataset.key);
    const handled = new Set([
      "enterprise-start", "enterprise-action", "collectible-buy", "collectible-appraise", "collectible-sell", "collectible-display",
      "special-career-start", "special-career-action", "dev-v25-collectibles", "dev-v25-max", "dev-v25-clear"
    ]);
    if (!newExpansion && !customToggle && !handled.has(action)) return previousHandleClick.call(this, event);
    event.preventDefault();

    try {
      if (!this.game) throw new Error("Start or load a life first.");
      if (newExpansion) {
        const target = button.dataset.expansion;
        this.modal = { type: target === "enterprises" ? "v25-enterprises" : target === "collections" ? "v25-collections" : "v25-special-careers" };
        this.renderModal();
        return;
      }
      if (action === "enterprise-start") {
        const type = this.game.enterpriseType(button.dataset.type);
        if (!type) throw new Error("Enterprise type not found.");
        const requested = global.prompt(`Choose a name for your ${type.label}:`, `${this.game.state.profile.lastName} ${type.label}`);
        if (requested == null) return;
        this.game.startEnterprise(type.id, requested);
        this.renderModal();
      } else if (action === "enterprise-action") {
        if (button.dataset.kind === "sell" && !global.confirm("Sell this enterprise? Its future annual income will end.")) return;
        this.game.enterpriseAction(button.dataset.enterprise, button.dataset.kind);
        this.renderModal();
      } else if (action === "collectible-buy") {
        this.game.buyCollectible(button.dataset.lot);
        this.renderModal();
      } else if (action === "collectible-appraise") {
        this.game.appraiseCollectible(button.dataset.collectible);
        this.renderModal();
      } else if (action === "collectible-sell") {
        if (!global.confirm("Sell this collectible to a private buyer?")) return;
        this.game.sellCollectible(button.dataset.collectible);
        this.renderModal();
      } else if (action === "collectible-display") {
        this.game.displayCollectible(button.dataset.collectible, button.dataset.enterprise);
        this.renderModal();
      } else if (action === "special-career-start") {
        this.game.startSpecialCareer(button.dataset.track);
        this.renderModal();
      } else if (action === "special-career-action") {
        if (button.dataset.kind === "leave" && !global.confirm("Leave this special career? Your rank will not carry into a different path.")) return;
        this.game.specialCareerAction(button.dataset.kind);
        this.renderModal();
      } else if (customToggle) {
        const key = button.dataset.key;
        this.game.state.dev[key] = !this.game.state.dev[key];
        this.game.touch("dev-v25-toggle");
      } else if (action === "dev-v25-collectibles") {
        this.game.devAddAllCollectibles();
        this.toast("Collectibles added", "Every current auction lot was added as an authentic item.", "success");
      } else if (action === "dev-v25-max") {
        this.game.devMaxV25Systems();
        this.toast("v2.5 systems maximized", "Enterprises, collectibles, and the active special career are ready for testing.", "success");
      } else if (action === "dev-v25-clear") {
        if (!global.confirm("Clear all major enterprises, collectibles, and special-career progress?")) return;
        this.game.devClearV25Systems();
        this.toast("v2.5 systems cleared", "Enterprise, auction, and special-career data was reset.", "success");
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
