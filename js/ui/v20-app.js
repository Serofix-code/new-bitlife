(function installNextChapterV20App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  const previousRenderModal = AP.renderModal;
  AP.renderModal = function renderModalV20() {
    if (this.mode === "game" && this.game && this.game.state.alive && !this.game.state.pendingEvent && this.modal && this.modal.type === "activity-center") {
      this.modalRoot.innerHTML = NC.View.activityCenterModal(this);
      return;
    }
    previousRenderModal.call(this);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function handleClickV20(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    const customToggle = action === "dev-toggle" && ["alwaysActivitySuccess", "unlimitedActivityPoints"].includes(button.dataset.key);
    const handled = new Set(["open-activity-center", "dynamic-activity", "dev-max-activities", "dev-clear-activities"]);
    if (!handled.has(action) && !customToggle) return previousHandleClick.call(this, event);
    event.preventDefault();

    try {
      if (!this.game) throw new Error("Start or load a life first.");
      if (action === "open-activity-center") {
        const center = button.dataset.center;
        if (!this.game.activityCenter(center)) throw new Error("That activity system is unavailable.");
        this.modal = { type: "activity-center", center };
        this.renderModal();
      } else if (action === "dynamic-activity") {
        const center = button.dataset.center;
        this.game.performDynamicActivity(center, button.dataset.option);
        this.modal = { type: "activity-center", center };
        this.renderModal();
      } else if (customToggle) {
        const key = button.dataset.key;
        this.game.state.dev[key] = !this.game.state.dev[key];
        if (key === "unlimitedActivityPoints" && this.game.state.dev[key]) this.game.state.activityPoints = Math.max(99, this.game.state.activityPoints);
        this.game.touch("dev-toggle-v20");
      } else if (action === "dev-max-activities") {
        this.game.devMaxActivitySystems();
        this.toast("Activity systems maximized", "Success, followers, licenses, clubs, fame, and action points are ready for testing.", "success");
      } else if (action === "dev-clear-activities") {
        if (!global.confirm("Clear dynamic activity history, clubs, licenses, pets, travel records, and related progress?")) return;
        this.game.devClearActivitySystems();
        this.toast("Activity systems cleared", "The dynamic activity records have been reset.", "success");
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
