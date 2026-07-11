(function installApp(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;

  class AppController {
    constructor(data, store) {
      this.data = data;
      this.store = store;
      this.root = document.getElementById("app");
      this.modalRoot = document.getElementById("modal-root");
      this.fileInput = document.getElementById("import-file");
      this.mode = "landing";
      // No game exists on the landing screen yet. Calling a game method here
      // caused startup to fail before a new or saved life could be opened.
      this.game = null;
      this.tab = "life";
      this.modal = null;
      this.lastSavedAt = null;
      this.creatorDraft = this.randomDraft();

      this.root.addEventListener("click", (event) => this.handleClick(event));
      this.modalRoot.addEventListener("click", (event) => this.handleClick(event));
      this.root.addEventListener("submit", (event) => this.handleSubmit(event));
      this.modalRoot.addEventListener("submit", (event) => this.handleSubmit(event));
      this.fileInput.addEventListener("change", (event) => this.handleImportFile(event));
      NC.on("state-changed", (event) => this.onStateChanged(event.detail));
    }

    start() {
      this.render();
      if (!this.store.available) {
        setTimeout(() => this.toast("Saving is limited", "Browser storage is unavailable; JSON export still works.", "error"), 300);
      }
    }

    randomDraft() {
      const origins = this.data.catalogs.origins;
      const origin = origins[Math.floor(Math.random() * origins.length)];
      const upbringings = this.data.catalogs.upbringings;
      return {
        firstName: origin.firstNames[Math.floor(Math.random() * origin.firstNames.length)],
        lastName: origin.lastNames[Math.floor(Math.random() * origin.lastNames.length)],
        identity: ["woman", "man", "nonbinary"][Math.floor(Math.random() * 3)],
        originId: origin.id,
        upbringingId: upbringings[Math.floor(Math.random() * upbringings.length)].id,
        seed: "", supernatural: "human", specialTalent: "none", skin: "#d8a47f", hair: "#4a3028", eye: "#49392f", accent: "#6a5acd", hairStyle: "short", accessory: "none"
      };
    }

    render() {
      if (this.mode === "game" && this.game && this.game.isIncarcerated() && !["life", "jail", "developer"].includes(this.tab)) this.tab = "jail";
      if (this.mode === "creator") this.root.innerHTML = NC.View.creator(this);
      else if (this.mode === "game" && this.game) this.root.innerHTML = NC.View.game(this);
      else this.root.innerHTML = NC.View.landing(this);
      this.renderModal();
    }

    renderModal() {
      if (this.mode !== "game" || !this.game) {
        this.modalRoot.innerHTML = "";
        return;
      }
      if (!this.game.state.alive) this.modalRoot.innerHTML = NC.View.deathModal(this);
      else if (this.game.state.pendingEvent) this.modalRoot.innerHTML = NC.View.eventModal(this);
      else if (this.modal && this.modal.type === "saves") this.modalRoot.innerHTML = NC.View.saveModal(this);
      else if (this.modal && this.modal.type === "enroll") this.modalRoot.innerHTML = NC.View.enrollModal(this, this.modal.programId);
      else this.modalRoot.innerHTML = "";
    }

    onStateChanged(detail) {
      if (!this.game || detail.state !== this.game.state) return;
      try {
        this.lastSavedAt = this.store.save("autosave", this.game.state);
      } catch (error) {
        this.toast("Autosave failed", error.message, "error");
      }
      if (this.game.isIncarcerated() && !["life", "jail", "developer"].includes(this.tab)) this.tab = "jail";
      if (this.mode === "game") this.render();
    }

    loadState(state, message) {
      this.game = new NC.GameEngine(this.data, state);
      if (state.pendingEvent && !this.game.events.byId(state.pendingEvent.eventId)) state.pendingEvent = null;
      this.mode = "game";
      this.tab = "life";
      this.modal = null;
      this.lastSavedAt = state.updatedAt || now();
      this.render();
      if (message) this.toast("Life loaded", message, "success");
    }

    handleClick(event) {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      event.preventDefault();
      const action = button.dataset.action;

      try {
        if (action === "toggle-theme") {
          const dark = document.documentElement.dataset.theme !== "dark";
          document.documentElement.dataset.theme = dark ? "dark" : "light";
          try { localStorage.setItem("next-chapter-theme", dark ? "dark" : "light"); } catch (_) {}
        } else if (action === "continue-life") {
          const state = this.store.load("autosave");
          if (!state) throw new Error("No autosave was found.");
          this.loadState(state, "Your latest autosave is ready.");
        } else if (action === "new-life") {
          this.creatorDraft = this.randomDraft();
          this.mode = "creator";
          this.render();
        } else if (action === "back-to-landing") {
          this.mode = "landing";
          this.render();
        } else if (action === "randomize-character") {
          this.creatorDraft = this.randomDraft();
          this.render();
        } else if (action === "tab") {
          if (button.dataset.tab) {
            const requested = button.dataset.tab;
            if (this.game && this.game.isIncarcerated() && !["life", "jail", "developer"].includes(requested)) throw new Error("Only jail options are available while incarcerated.");
            this.tab = requested;
          }
          this.render();
        } else if (action === "age-up") {
          this.game.ageUp();
        } else if (action === "open-saves") {
          this.modal = { type: "saves" };
          this.renderModal();
        } else if (action === "close-modal") {
          this.modal = null;
          this.renderModal();
        } else if (action === "event-choice") {
          this.game.resolveChoice(button.dataset.choice);
        } else if (action === "complete-event") {
          this.game.completeEvent();
        } else if (action === "relationship") {
          this.game.relationshipAction(button.dataset.person, button.dataset.kind);
        } else if (action === "find-date") {
          this.game.findDate();
        } else if (action === "propose") {
          this.game.propose(button.dataset.person, button.dataset.ring);
        } else if (action === "marry") {
          this.game.marry(button.dataset.person, button.dataset.plan, button.dataset.surname, button.dataset.prenup === "true");
        } else if (action === "divorce") {
          if (global.confirm("Divorce this spouse? Financial consequences may apply.")) this.game.divorce(button.dataset.person);
        } else if (action === "renew-vows") {
          this.game.renewVows(button.dataset.person);
        } else if (action === "reconcile") {
          this.game.reconcile(button.dataset.person);
        } else if (action === "funeral") {
          this.game.planFuneral(button.dataset.person, button.dataset.method);
        } else if (action === "prison-action") {
          this.game.prisonAction(button.dataset.kind, button.dataset.person);
        } else if (action === "appeal") {
          this.game.appealSentence(button.dataset.lawyer);
        } else if (action === "activity") {
          this.game.startActivity(button.dataset.activity);
        } else if (action === "crime") {
          this.game.commitCrime(button.dataset.crime, button.dataset.target);
        } else if (action === "court") {
          this.game.resolveCourt(button.dataset.lawyer);
        } else if (action === "enroll") {
          const check = this.game.canEnroll(button.dataset.program);
          if (!check.allowed) throw new Error(check.reason);
          this.modal = { type: "enroll", programId: button.dataset.program };
          this.renderModal();
        } else if (action === "leave-education") {
          if (global.confirm("Leave this education program? Progress in the current program will be lost.")) this.game.leaveEducation();
        } else if (action === "apply-job") {
          this.game.applyForJob(button.dataset.job);
        } else if (action === "work-hard") {
          this.game.workHard();
        } else if (action === "join-assassin") {
          this.game.joinAssassinCareer();
        } else if (action === "assassin-contract") {
          this.game.assassinContract();
        } else if (action === "quit-job") {
          if (global.confirm("Resign from this job?")) this.game.quitCareer();
        } else if (action === "retire") {
          if (global.confirm("Retire from your current career?")) this.game.retire();
        } else if (action === "buy-asset") {
          this.game.buyAsset(button.dataset.asset);
        } else if (action === "sell-asset") {
          if (global.confirm("Sell this asset?")) this.game.sellAsset(button.dataset.instance);
        } else if (action === "save-slot") {
          const savedAt = this.store.save(button.dataset.slot, this.game.state);
          this.toast("Saved", `Named save updated ${U.formatDate(savedAt)}.`, "success");
          this.renderModal();
        } else if (action === "load-slot") {
          if (!global.confirm("Load this save? Your current autosave will remain available.")) return;
          const state = this.store.load(button.dataset.slot);
          if (!state) throw new Error("That slot is empty.");
          this.loadState(state, "Named save loaded.");
        } else if (action === "delete-slot") {
          if (!global.confirm("Delete this named save? This cannot be undone.")) return;
          this.store.remove(button.dataset.slot);
          this.renderModal();
        } else if (action === "export") {
          this.exportSave();
        } else if (action === "import") {
          this.fileInput.value = "";
          this.fileInput.click();
        } else if (action === "server-save") {
          this.pushServerSave();
        } else if (action === "server-load") {
          this.pullServerSave();
        } else if (action === "fresh-life") {
          this.beginFreshLife();
        } else if (action === "continue-heir") {
          this.tab = "life";
          this.game.continueAs(button.dataset.person);
          this.toast("A new generation", "The estate and family history have passed forward.", "success");
        } else if (action === "dev-set-age") {
          const input = document.getElementById("dev-age");
          this.game.devSetAge(input ? input.value : this.game.state.age);
        } else if (action === "dev-cash") {
          this.game.devCash(50000);
        } else if (action === "dev-stats") {
          this.game.devMaxStats();
        } else if (action === "dev-child") {
          this.game.devAddChild();
        } else if (action === "dev-death") {
          if (global.confirm("Force this character's death for inheritance testing?")) this.game.die("a developer test");
        } else if (action === "dev-event") {
          const input = document.getElementById("dev-event");
          if (input) this.game.devTriggerEvent(input.value);
        } else if (action === "dev-toggle") {
          this.game.devToggle(button.dataset.key);
        } else if (action === "dev-fame") {
          this.game.devFame();
        } else if (action === "dev-clear-record") {
          this.game.devClearRecord();
        } else if (action === "dev-challenge") {
          this.game.devCompleteChallenge();
        } else if (action === "dev-skip-sentence") {
          this.game.devSkipSentence();
        } else if (action === "dev-partner") {
          this.game.devAddPartner();
        } else if (action === "dev-assassin-unlock") {
          this.game.devUnlockAssassin();
        } else if (action === "dev-promote") {
          this.game.devPromoteCareer();
        }
      } catch (error) {
        this.toast("Could not do that", error.message || String(error), "error");
      }
    }

    handleSubmit(event) {
      event.preventDefault();
      const form = event.target;
      if (form.id === "creator-form") {
        const values = Object.fromEntries(new FormData(form).entries());
        this.game = new NC.GameEngine(this.data);
        this.game.createCharacter(values);
        this.mode = "game";
        this.tab = "life";
        this.modal = null;
        this.render();
        this.toast("A new life begins", "Age up when you are ready for the next year.", "success");
      } else if (form.id === "enroll-form") {
        const values = Object.fromEntries(new FormData(form).entries());
        this.modal = null;
        this.game.enroll(values.programId, values.field);
      }
    }

    async handleImportFile(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error("That save file is too large.");
        const text = await file.text();
        const state = this.store.import(text);
        this.loadState(state, "Imported JSON passed validation.");
        this.store.save("autosave", state);
      } catch (error) {
        this.toast("Import failed", error.message || String(error), "error");
      } finally {
        event.target.value = "";
      }
    }

    exportSave() {
      if (!this.game) throw new Error("Start or load a life before exporting.");
      const state = this.game.state;
      const filename = `next-chapter-${state.profile.firstName}-${state.profile.lastName}-age-${state.age}.json`
        .toLocaleLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-");
      U.downloadText(filename, this.store.export(state));
      this.toast("Save exported", "The JSON file contains this life, lineage, and pending choices.", "success");
    }

    async pushServerSave() {
      if (!this.game) { this.toast("Server save failed", "Start or load a life first.", "error"); return; }
      try {
        const response = await fetch("/api/server-save", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: this.store.export(this.game.state)
        });
        if (!response.ok) throw new Error((await response.text()) || `Server returned ${response.status}`);
        this.toast("Saved to home server", "This life can now be loaded from another device on the same server.", "success");
      } catch (error) {
        this.toast("Server save failed", "Start the included phone server first. " + (error.message || String(error)), "error");
      }
    }

    async pullServerSave() {
      try {
        const response = await fetch("/api/server-save", { cache: "no-store" });
        if (response.status === 404) throw new Error("No shared server save exists yet.");
        if (!response.ok) throw new Error((await response.text()) || `Server returned ${response.status}`);
        const text = await response.text();
        const state = this.store.import(text);
        this.store.save("autosave", state);
        this.loadState(state, "Shared home-server save loaded.");
      } catch (error) {
        this.toast("Server load failed", "Start the included phone server first. " + (error.message || String(error)), "error");
      }
    }

    beginFreshLife() {
      const hasLivingGame = this.game && this.game.state.alive;
      if (hasLivingGame && !global.confirm("Begin a new life? Your current autosave will be replaced. Export or use a named slot first if you want to keep it.")) return;
      this.store.remove("autosave");
      this.game = null;
      this.modal = null;
      this.creatorDraft = this.randomDraft();
      this.mode = "creator";
      this.render();
    }

    toast(title, message, kind) {
      const root = document.getElementById("toast-root");
      const toast = document.createElement("div");
      toast.className = `toast ${kind || ""}`;
      const symbol = document.createElement("span");
      symbol.className = "toast-symbol";
      symbol.textContent = kind === "error" ? "!" : "✓";
      const copy = document.createElement("div");
      const heading = document.createElement("strong");
      const body = document.createElement("span");
      heading.textContent = title;
      body.textContent = message;
      copy.append(heading, body);
      toast.append(symbol, copy);
      root.appendChild(toast);
      setTimeout(() => toast.remove(), 3600);
    }
  }

  // Exposed for the startup smoke test and optional extensions.
  NC.AppController = AppController;

  function now() { return new Date().toISOString(); }

  async function boot() {
    try {
      const data = await NC.Data.load();
      const store = new NC.SaveStore();
      const app = new AppController(data, store);
      NC.app = app;
      try { document.documentElement.dataset.theme = localStorage.getItem("next-chapter-theme") || "light"; } catch (_) {}
      app.start();
    } catch (error) {
      const root = document.getElementById("app");
      root.innerHTML = `<main class="landing-shell"><section class="landing-card"><img src="assets/mark.svg" alt=""><h1>Next Chapter could not start</h1><p>${U.escape(error.message || String(error))}</p><div class="hint-box">If you edited the JSON data, run <strong>node tools/sync-data.mjs</strong> and reopen index.html.</div></section></main>`;
      console.error(error);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})(window);
