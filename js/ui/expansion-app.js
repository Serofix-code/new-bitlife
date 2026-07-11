(function installExpandedApp(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  AP.randomDraft = function expandedRandomDraft() {
    const origins = this.data.catalogs.origins;
    const origin = origins[Math.floor(Math.random() * origins.length)];
    const identity = ["woman", "man", "nonbinary"][Math.floor(Math.random() * 3)];
    const pool = origin.firstNamesByGender && origin.firstNamesByGender[identity] || origin.firstNames;
    const upbringings = this.data.catalogs.upbringings;
    return {
      firstName: pool[Math.floor(Math.random() * pool.length)],
      lastName: origin.lastNames[Math.floor(Math.random() * origin.lastNames.length)],
      identity,
      originId: origin.id,
      upbringingId: upbringings[Math.floor(Math.random() * upbringings.length)].id,
      seed: "", occult: "human", supernatural: "human", specialTalent: "none",
      skin: "#d8a47f", hair: "#4a3028", eye: "#49392f", accent: "#6a5acd", hairStyle: "short", accessory: "none"
    };
  };

  const originalRenderModal = AP.renderModal;
  AP.renderModal = function expandedRenderModal() {
    if (this.mode === "game" && this.game && this.game.state.alive && !this.game.state.pendingEvent && this.modal) {
      if (this.modal.type === "time-travel") { this.modalRoot.innerHTML = NC.View.timeTravelModal(this); return; }
      if (this.modal.type === "emigrate") { this.modalRoot.innerHTML = NC.View.emigrateModal(this); return; }
      if (this.modal.type === "magic") { this.modalRoot.innerHTML = NC.View.magicModal(this); return; }
    }
    originalRenderModal.call(this);
  };

  const originalHandleClick = AP.handleClick;
  AP.handleClick = function expandedHandleClick(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return originalHandleClick.call(this, event);
    const action = button.dataset.action;
    const expandedActions = new Set(["open-section", "adopt-child", "casino-visit", "doctor-visit", "fame-activity", "fertility", "open-emigrate", "emigrate", "open-time-travel", "time-travel", "open-magic", "wizard-turn", "cast-spell"]);
    if (!expandedActions.has(action)) return originalHandleClick.call(this, event);
    event.preventDefault();
    try {
      if (action === "open-section") {
        this.tab = button.dataset.tab || "activities";
        this.render();
      } else if (action === "adopt-child") {
        this.game.adoptChild();
      } else if (action === "casino-visit") {
        this.game.noStakeCasinoVisit();
      } else if (action === "doctor-visit") {
        this.game.doctorVisit();
      } else if (action === "fame-activity") {
        this.game.fameActivity();
      } else if (action === "fertility") {
        this.game.fertilityAction();
      } else if (action === "open-emigrate") {
        this.modal = { type: "emigrate" };
        this.renderModal();
      } else if (action === "emigrate") {
        this.modal = null;
        this.game.emigrate(button.dataset.country);
      } else if (action === "open-time-travel") {
        this.modal = { type: "time-travel" };
        this.renderModal();
      } else if (action === "time-travel") {
        const age = button.dataset.age;
        this.modal = null;
        this.game.timeTravelToAge(age);
        this.tab = "life";
      } else if (action === "open-magic") {
        this.modal = { type: "magic" };
        this.renderModal();
      } else if (action === "wizard-turn") {
        this.game.attemptWizardTurning(button.dataset.method);
      } else if (action === "cast-spell") {
        const target = document.getElementById("magic-target");
        const age = document.getElementById("magic-age");
        const spell = button.dataset.spell;
        if (spell === "inferno" && !global.confirm("Cast the forbidden Inferno spell? It is an abstract attempted killing and can lead to arrest, court, and prison.")) return;
        this.game.castSpell(spell, target ? target.value : "self", age ? age.value : this.game.state.age);
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
