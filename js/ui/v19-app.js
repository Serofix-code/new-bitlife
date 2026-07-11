(function installNextChapterV19App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;


  function updateFlagPreview(app) {
    if (!app || app.mode !== "creator") return;
    const select = app.root.querySelector && app.root.querySelector("#origin");
    const image = app.root.querySelector && app.root.querySelector("#creator-flag-preview");
    if (!select || !image) return;
    const origin = app.data.catalogs.origins.find((item) => item.id === select.value);
    if (!origin) return;
    image.src = origin.flag;
    image.alt = `${origin.country} flag`;
  }

  const previousStart = AP.start;
  AP.start = function startV19() {
    if (!this._v19PreviewBound) {
      this.root.addEventListener("change", () => updateFlagPreview(this));
      this._v19PreviewBound = true;
    }
    const result = previousStart.call(this);
    setTimeout(() => updateFlagPreview(this), 0);
    return result;
  };

  const previousRandomDraft = AP.randomDraft;
  AP.randomDraft = function randomDraftV19() {
    const draft = previousRandomDraft.call(this);
    draft.reproductiveRole = draft.identity === "woman" ? "carry" : draft.identity === "man" ? "contribute" : "assisted";
    return draft;
  };

  const previousRenderModal = AP.renderModal;
  AP.renderModal = function renderModalV19() {
    if (this.mode === "game" && this.game && this.game.state.alive && !this.game.state.pendingEvent && this.modal && this.modal.type === "family-planning") {
      this.modalRoot.innerHTML = NC.View.familyPlanningModal(this);
      return;
    }
    previousRenderModal.call(this);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function handleClickV19(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    const customDevToggle = action === "dev-toggle" && ["alwaysFertilitySuccess", "ignoreActivityAgeLocks"].includes(button.dataset.key);
    const handled = new Set(["open-family-planning", "family-method", "set-contraception", "lifestyle-action", "dev-max-fertility", "dev-clear-family"]);
    if (!handled.has(action) && !customDevToggle) return previousHandleClick.call(this, event);
    event.preventDefault();

    try {
      if (!this.game) throw new Error("Start or load a life first.");
      if (action === "open-family-planning") {
        this.modal = { type: "family-planning" };
        this.renderModal();
      } else if (action === "family-method") {
        this.game.familyPlanningAction(button.dataset.method);
        this.modal = { type: "family-planning" };
        this.renderModal();
      } else if (action === "set-contraception") {
        this.game.setContraception(button.dataset.contraception);
        this.modal = { type: "family-planning" };
        this.renderModal();
      } else if (action === "lifestyle-action") {
        this.game.lifestyleAction(button.dataset.kind);
      } else if (customDevToggle) {
        const key = button.dataset.key;
        this.game.state.dev[key] = !this.game.state.dev[key];
        this.game.touch("dev-toggle-v19");
      } else if (action === "dev-max-fertility") {
        this.game.devMaxFertility();
      } else if (action === "dev-clear-family") {
        if (!global.confirm("Clear the pending family process and family-planning history? Existing children will remain.")) return;
        this.game.devClearFamilyPlanning();
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
