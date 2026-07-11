(function installNextChapterV18App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  const previousStart = AP.start;
  AP.start = function v18Start() {
    try {
      const saved = localStorage.getItem("next-chapter-theme");
      document.documentElement.dataset.theme = saved || "dark";
      if (!saved) localStorage.setItem("next-chapter-theme", "dark");
    } catch (_) {
      document.documentElement.dataset.theme = "dark";
    }
    return previousStart.call(this);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function v18HandleClick(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    const handled = new Set(["dev-all-ribbons", "dev-clear-ribbons", "dev-all-challenges", "dev-billionaire", "dev-everything"]);
    if (!handled.has(action)) return previousHandleClick.call(this, event);
    event.preventDefault();

    try {
      if (!this.game) throw new Error("Start or load a life first.");
      if (action === "dev-all-ribbons") {
        const count = this.game.devUnlockAllRibbons();
        this.store.mergeProfileProgress({ ribbons: this.game.state.legacy.ribbons || [] });
        this.toast("All ribbons unlocked", `${count} ribbons are now saved to ${this.store.getCurrentAccount().name}.`, "success");
      } else if (action === "dev-clear-ribbons") {
        if (!global.confirm("Clear every ribbon from this user account?")) return;
        const progress = this.store.getProfileProgress();
        progress.ribbons = [];
        this.store.saveProfileProgress(progress);
        this.game.devClearAllRibbons();
        this.toast("Ribbons cleared", "The account ribbon collection is empty.", "success");
      } else if (action === "dev-all-challenges") {
        this.game.devCompleteAllChallenges();
        this.store.mergeProfileProgress({ completedChallenges: this.game.state.legacy.completedChallenges || [] });
        this.toast("Challenges completed", "All current challenges are complete for this account.", "success");
      } else if (action === "dev-billionaire") {
        this.game.devBecomeBillionaire();
        this.toast("Money added", "The character is now a billionaire with no debt.", "success");
      } else if (action === "dev-everything") {
        if (!global.confirm("Unlock all cheats, ribbons, challenges, money, stats, and action points?")) return;
        this.game.devUnlockEverything();
        this.store.mergeProfileProgress({
          ribbons: this.game.state.legacy.ribbons || [],
          completedChallenges: this.game.state.legacy.completedChallenges || []
        });
        this.toast("Everything unlocked", "This test life and account collection are fully unlocked.", "success");
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
