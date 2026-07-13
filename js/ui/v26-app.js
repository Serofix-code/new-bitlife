(function installNextChapterV26App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  const previousRenderModal = AP.renderModal;
  AP.renderModal = function renderModalV26() {
    if (this.mode === "game" && this.game && this.game.state.alive && !this.game.state.pendingEvent && this.modal && this.modal.type === "changelog") {
      this.modalRoot.innerHTML = NC.View.changelogModal(this);
      return;
    }
    previousRenderModal.call(this);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function handleClickV26(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    if (!["open-changelog"].includes(action)) return previousHandleClick.call(this, event);
    event.preventDefault();
    try {
      if (!this.game) throw new Error("Start or load a life first.");
      if (action === "open-changelog") {
        this.modal = { type: "changelog" };
        this.renderModal();
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
