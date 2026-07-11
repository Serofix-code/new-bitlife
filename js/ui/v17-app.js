(function installNextChapterV17App(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const AP = NC.AppController.prototype;

  function mergeAccountProgressIntoState(app, state) {
    if (!app || !state || !state.legacy) return;
    const progress = app.store.getProfileProgress();
    state.legacy.ribbons = state.legacy.ribbons || [];
    state.legacy.completedChallenges = state.legacy.completedChallenges || [];
    const ribbonIds = new Set(state.legacy.ribbons.map((item) => item.id));
    (progress.ribbons || []).forEach((item) => {
      if (item && item.id && !ribbonIds.has(item.id)) {
        ribbonIds.add(item.id);
        state.legacy.ribbons.push(U.deepClone(item));
      }
    });
    const challengeIds = new Set(state.legacy.completedChallenges);
    (progress.completedChallenges || []).forEach((id) => {
      if (!challengeIds.has(id)) {
        challengeIds.add(id);
        state.legacy.completedChallenges.push(id);
      }
    });
    if (state.challenges && state.challenges.bankRobber && state.legacy.completedChallenges.includes("bank_robber")) {
      state.challenges.bankRobber.completed = true;
    }
  }

  function syncAccountProgressFromState(app) {
    if (!app || !app.game || !app.game.state || !app.game.state.legacy) return;
    const state = app.game.state;
    app.store.mergeProfileProgress({
      ribbons: state.legacy.ribbons || [],
      completedChallenges: state.legacy.completedChallenges || [],
      stats: {
        livesStarted: Math.max(1, (app.store.getProfileProgress().stats || {}).livesStarted || 0),
        livesCompleted: (app.store.getProfileProgress().stats || {}).livesCompleted || 0
      }
    });
    if (!state.alive && state.death && !state.death.accountRecorded) {
      const progress = app.store.getProfileProgress();
      progress.stats.livesCompleted = (progress.stats.livesCompleted || 0) + 1;
      app.store.saveProfileProgress(progress);
      state.death.accountRecorded = true;
    }
  }

  function updatePreview(app) {
    if (app.mode !== "creator") return;
    const form = app.root.querySelector("#creator-form");
    if (!form) return;
    const values = Object.fromEntries(new FormData(form).entries());
    const draft = Object.assign({}, app.creatorDraft, values);
    draft.identity = values.identity || draft.identity || "nonbinary";
    draft.supernatural = values.supernatural || draft.supernatural || "human";
    app.creatorDraft = draft;
    const img = app.root.querySelector("#creator-avatar-preview");
    const name = app.root.querySelector("#creator-name-preview");
    const origin = app.root.querySelector("#creator-origin-preview");
    const occult = app.root.querySelector("#creator-occult-preview");
    const originRec = app.data.catalogs.origins.find((item) => item.id === draft.originId) || app.data.catalogs.origins[0];
    if (img) img.src = U.avatarSvg(Object.assign({}, draft, { identity: draft.identity, wizard: draft.supernatural === "wizard", vampire: draft.supernatural === "vampire" }));
    if (name) name.textContent = `${draft.firstName || "Unnamed"} ${draft.lastName || ""}`.trim();
    if (origin) origin.textContent = `${originRec.country} · ${draft.identity === 'woman' ? 'Woman' : draft.identity === 'man' ? 'Man' : 'Nonbinary'}`;
    if (occult) {
      const talent = NC.SPECIAL_TALENTS[draft.specialTalent] || NC.SPECIAL_TALENTS.none;
      occult.textContent = `${draft.supernatural === 'wizard' ? 'Wizard / Witch' : draft.supernatural === 'vampire' ? 'Vampire' : 'Human'} · ${talent.label}`;
    }
  }

  const previousStart = AP.start;
  AP.start = function v17Start() {
    if (!this._v17BoundPreview) {
      this.root.addEventListener("input", () => updatePreview(this));
      this.root.addEventListener("change", () => updatePreview(this));
      this._v17BoundPreview = true;
    }
    const result = previousStart.call(this);
    return result;
  };

  const previousLoadState = AP.loadState;
  AP.loadState = function v17LoadState(state, message) {
    mergeAccountProgressIntoState(this, state);
    previousLoadState.call(this, state, message);
    mergeAccountProgressIntoState(this, this.game.state);
    if (this.game && this.game.state && this.game.state.profile) {
      this.game.state.profile.avatar = this.game.state.profile.avatar || {};
      this.game.state.profile.avatar.identity = this.game.state.profile.identity;
    }
    this.render();
  };

  const previousOnStateChanged = AP.onStateChanged;
  AP.onStateChanged = function v17OnStateChanged(detail) {
    previousOnStateChanged.call(this, detail);
    if (this.game && detail && detail.state === this.game.state) syncAccountProgressFromState(this);
  };

  const previousRender = AP.render;
  AP.render = function v17Render() {
    const result = previousRender.call(this);
    if (this.mode === "creator") setTimeout(() => updatePreview(this), 0);
    return result;
  };

  const previousHandleSubmit = AP.handleSubmit;
  AP.handleSubmit = function v17HandleSubmit(event) {
    const form = event.target;
    if (form && form.id === "creator-form") {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      this.creatorDraft = Object.assign({}, this.creatorDraft, values);
      this.game = new NC.GameEngine(this.data);
      this.game.createCharacter(values);
      mergeAccountProgressIntoState(this, this.game.state);
      const profile = this.store.getProfileProgress();
      profile.stats.livesStarted = (profile.stats.livesStarted || 0) + 1;
      this.store.saveProfileProgress(profile);
      this.mode = "game";
      this.tab = "life";
      this.modal = null;
      this.render();
      this.toast("A new life begins", `Playing on account ${this.store.getCurrentAccount().name}.`, "success");
      return;
    }
    previousHandleSubmit.call(this, event);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function v17HandleClick(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    const handled = new Set(["create-account", "switch-account", "dev-unlock-all", "dev-occult", "dev-magic"]);
    if (!handled.has(action)) return previousHandleClick.call(this, event);
    event.preventDefault();
    try {
      if (action === "create-account") {
        const name = global.prompt("Choose a user name for this account:", "Player 2");
        if (!name) return;
        const account = this.store.createAccount(name);
        this.game = null;
        this.mode = "landing";
        this.tab = "life";
        this.modal = null;
        this.render();
        this.toast("Account created", `${account.name} is now the active user.`, "success");
      } else if (action === "switch-account") {
        const account = this.store.setCurrentAccount(button.dataset.account);
        this.game = null;
        this.mode = "landing";
        this.tab = "life";
        this.modal = null;
        this.render();
        this.toast("Switched account", `Now viewing ${account.name}.`, "success");
      } else if (action === "dev-unlock-all") {
        this.game.devUnlockAll();
      } else if (action === "dev-occult") {
        this.game.devToggleOccult(button.dataset.kind);
      } else if (action === "dev-magic") {
        if (!this.game.state.flags.wizard) this.game.devToggleOccult("wizard");
        this.game.state.magic = this.game.state.magic || { mana: 0, power: 0, spellsCast: 0, source: "developer", inherited: false, transformationAge: this.game.state.age };
        this.game.state.magic.mana = 100;
        this.game.state.magic.power = 100;
        this.game.touch("dev-magic");
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
