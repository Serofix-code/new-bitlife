(function installNextChapterV24App(global) {
  "use strict";

  const NC = global.NextChapter;
  const AP = NC.AppController.prototype;

  const previousRenderModal = AP.renderModal;
  AP.renderModal = function renderModalV24() {
    if (this.mode === "game" && this.game && this.game.state.alive && !this.game.state.pendingEvent && this.modal) {
      if (this.modal.type === "v24-cosmetic") { this.modalRoot.innerHTML = NC.View.cosmeticModal(this); return; }
      if (this.modal.type === "v24-vampire") { this.modalRoot.innerHTML = NC.View.vampireModal(this); return; }
    }
    previousRenderModal.call(this);
  };

  const previousHandleClick = AP.handleClick;
  AP.handleClick = function handleClickV24(event) {
    const button = event.target.closest && event.target.closest("[data-action]");
    if (!button) return previousHandleClick.call(this, event);
    const action = button.dataset.action;
    const v24Toggles = ["surgeryAlwaysSucceeds", "surgeryNoCost", "vampireUnlimitedEssence", "vampireAlwaysSucceeds", "vampireGoalsComplete"];
    const customToggle = action === "dev-toggle" && v24Toggles.includes(button.dataset.key);
    const handled = new Set([
      "open-cosmetic", "cosmetic-procedure", "sue-surgeon",
      "vampire-toggle-form", "vampire-random-form", "vampire-title", "vampire-power", "vampire-hunt",
      "vampire-turn", "vampire-recruit-familiar", "vampire-familiar", "vampire-hypnotize",
      "vampire-property", "vampire-rest", "dev-v24-max", "dev-surgery-clear"
    ]);
    const vampireExpansion = action === "open-expansion" && button.dataset.expansion === "vampire";
    if (!handled.has(action) && !customToggle && !vampireExpansion) return previousHandleClick.call(this, event);
    event.preventDefault();

    try {
      if (!this.game) throw new Error("Start or load a life first.");
      if (vampireExpansion) {
        this.modal = { type: "v24-vampire" };
        this.renderModal();
      } else if (action === "open-cosmetic") {
        this.modal = { type: "v24-cosmetic" };
        this.renderModal();
      } else if (action === "cosmetic-procedure") {
        const procedure = this.game.cosmeticProcedure(button.dataset.procedure);
        if (!procedure) throw new Error("Procedure not found.");
        let identity = this.game.state.profile.identity;
        if (procedure.genderAffirming) {
          const choice = global.prompt("Choose the identity used after the one-time gender-affirming procedure: woman, man, or nonbinary", identity);
          if (choice == null) return;
          identity = String(choice).trim().toLocaleLowerCase();
          if (!["woman", "man", "nonbinary"].includes(identity)) throw new Error("Enter woman, man, or nonbinary.");
        }
        const doctor = this.game.surgeonOffers(procedure.id).find((item) => item.id === button.dataset.surgeon);
        if (!doctor) throw new Error("Surgeon not found.");
        const check = this.game.cosmeticEligibility(procedure.id, doctor.id);
        if (!check.allowed) throw new Error(check.reason);
        const confirmed = global.confirm(`${procedure.label}\n${doctor.name}\nReputation: ${doctor.reputation}%\nCost: ${NC.Utils.formatMoney(check.cost, this.game.state.profile.currency)}\nEstimated success chance: ${check.chance}%\n\nProceed?`);
        if (!confirmed) return;
        const result = this.game.performCosmeticProcedure(procedure.id, doctor.id, identity);
        this.toast(result.success ? "Procedure completed" : "Procedure complications", result.success ? "The procedure was successful." : "The outcome affected health, happiness, and Looks. A malpractice claim may be available.", result.success ? "success" : "error");
        this.renderModal();
      } else if (action === "sue-surgeon") {
        const result = this.game.sueCosmeticSurgeon(button.dataset.record);
        this.toast(result.won ? "Claim succeeded" : "Claim dismissed", result.won ? `Compensation: ${NC.Utils.formatMoney(result.payout, this.game.state.profile.currency)}.` : "No compensation was awarded.", result.won ? "success" : "error");
        this.renderModal();
      } else if (action === "vampire-toggle-form") {
        this.game.vampireToggleForm();
        this.renderModal();
      } else if (action === "vampire-random-form") {
        this.game.vampireRandomizeTrueForm();
        this.renderModal();
      } else if (action === "vampire-title") {
        this.game.vampireSetTitle(button.dataset.title);
        this.renderModal();
      } else if (action === "vampire-power") {
        this.game.vampireChooseLockedStat(button.dataset.stat);
        this.toast("Vampiric power selected", `${NC.Utils.cap(button.dataset.stat)} will remain at 100%.`, "success");
        this.renderModal();
      } else if (action === "vampire-hunt") {
        const result = this.game.vampireHunt(button.dataset.location, button.dataset.tactic);
        this.toast(result.success ? "Hunt succeeded" : "Hunt failed", result.text, result.success ? "success" : "error");
        this.renderModal();
      } else if (action === "vampire-turn") {
        const result = this.game.vampireTurnPerson(button.dataset.person);
        this.toast(result.success ? "New progeny" : "Offer refused", result.success ? "The immortal lineage grew." : "The relationship lost some closeness.", result.success ? "success" : "error");
        this.renderModal();
      } else if (action === "vampire-recruit-familiar") {
        this.game.vampireRecruitFamiliar();
        this.renderModal();
      } else if (action === "vampire-familiar") {
        this.game.vampireFamiliarAction(button.dataset.familiar, button.dataset.kind);
        this.renderModal();
      } else if (action === "vampire-hypnotize") {
        this.game.vampireHypnotize();
        this.toast("Suspicion reduced", "Secrecy increased and criminal heat was reduced.", "success");
        this.renderModal();
      } else if (action === "vampire-property") {
        this.game.buyVampireProperty(button.dataset.property);
        this.renderModal();
      } else if (action === "vampire-rest") {
        this.game.vampireRest(button.dataset.property);
        this.renderModal();
      } else if (customToggle) {
        const key = button.dataset.key;
        this.game.state.dev[key] = !this.game.state.dev[key];
        if (key === "vampireGoalsComplete" && this.game.state.dev[key]) this.game.updateVampireLordRank();
        this.game.touch("dev-v24-toggle");
      } else if (action === "dev-v24-max") {
        this.game.devMaxV24Systems();
        this.toast("v2.4 systems maximized", "Looks, surgery testing, and active vampire systems were maximized.", "success");
      } else if (action === "dev-surgery-clear") {
        if (!global.confirm("Clear all procedure, surgeon lawsuit, and gender-affirming care history for this life?")) return;
        this.game.devClearCosmeticHistory();
        this.toast("Surgery history cleared", "All v2.4 elective-care records were reset.", "success");
      }
    } catch (error) {
      this.toast("Could not do that", error.message || String(error), "error");
    }
  };
})(window);
