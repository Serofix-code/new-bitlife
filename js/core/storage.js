(function installStorage(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const PREFIX = "nextchapter.v1.";
  const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

  function storageAvailable() {
    try {
      const key = `${PREFIX}probe`;
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch (_) {
      return false;
    }
  }

  function dangerousKey(key) {
    return key === "__proto__" || key === "prototype" || key === "constructor";
  }

  function safeParse(text) {
    if (typeof text !== "string" || text.length > MAX_IMPORT_BYTES) {
      throw new Error("That save file is too large.");
    }
    return JSON.parse(text, (key, value) => {
      if (dangerousKey(key)) throw new Error("Unsafe key in save file.");
      return value;
    });
  }

  function validateState(state) {
    if (!state || typeof state !== "object") throw new Error("Save state is missing.");
    if (!state.profile || typeof state.profile.firstName !== "string") throw new Error("Character data is missing.");
    if (!Number.isFinite(state.age) || state.age < 0 || state.age > 140) throw new Error("Character age is invalid.");
    if (!state.stats || !NC.STATS.every((stat) => Number.isFinite(state.stats[stat]))) throw new Error("Character stats are invalid.");
    if (!Array.isArray(state.timeline) || !Array.isArray(state.relationships)) throw new Error("Life history is invalid.");
    return true;
  }

  function migrate(input) {
    const state = U.deepClone(input);
    const version = Number(state.schemaVersion || 1);
    if (version > NC.SCHEMA_VERSION) {
      throw new Error("This save was created by a newer version of Next Chapter.");
    }
    if (version < 2) {
      state.legacy = state.legacy || { generation: 1, score: 0, graveyard: [] };
      state.activityPoints = Number.isFinite(state.activityPoints) ? state.activityPoints : 2;
      state.eventLedger = state.eventLedger || { history: [], lastSeenAge: {} };
      state.schemaVersion = 2;
    }
    if (version < 3) {
      state.fame = Number.isFinite(state.fame) ? state.fame : 0;
      state.crime = state.crime || { arrests: 0, convictions: 0, successfulCrimes: 0, bankRobberies: 0, uncaughtBankRobberies: 0, jailYears: 0, record: [], pendingCourt: null };
      state.challenges = state.challenges || { bankRobber: { id: "bank_robber", completed: false, robberySucceededUncaught: false, famous: false } };
      state.dev = state.dev || { alwaysWin: false, neverCaught: false, instantFame: false };
      state.schemaVersion = 3;
    }
    if (version < 4) {
      state.crime = state.crime || {};
      state.crime.record = Array.isArray(state.crime.record) ? state.crime.record : [];
      state.crime.convictionHistory = Array.isArray(state.crime.convictionHistory) ? state.crime.convictionHistory : [];
      state.crime.pendingCourt = state.crime.pendingCourt || null;
      state.crime.incarceration = state.crime.incarceration || null;
      if (!state.crime.incarceration && Number(state.crime.jailYears) > 0) {
        const years = Math.max(1, Math.trunc(state.crime.jailYears));
        state.crime.incarceration = {
          id: `migrated-${Date.now()}`, offense: "Previous conviction", severity: "unknown",
          originalYears: years, yearsRemaining: years, servedYears: 0, startedAge: state.age,
          facility: state.age < 18 ? "Juvenile detention centre" : "Regional correctional facility",
          security: years >= 18 ? "maximum" : years >= 6 ? "medium" : "minimum",
          conduct: 55, appealsUsed: 0, paroleDeniedAtAge: null, escaped: false
        };
      }
      state.relationships.forEach((person) => {
        person.relationshipStatus = person.relationshipStatus || (person.role === "partner" ? "dating" : person.role === "ex" ? "ex" : "family");
        person.marriage = person.marriage || null;
      });
      state.schemaVersion = 4;
    }
    if (version < 5) {
      state.profile.specialTalent = state.profile.specialTalent || "none";
      state.crime = state.crime || {};
      state.crime.uncaughtMurders = Number.isFinite(state.crime.uncaughtMurders) ? state.crime.uncaughtMurders : (Array.isArray(state.crime.record) ? state.crime.record.filter((item) => item.kind === "murder" && item.success && !item.caught).length : 0);
      state.legacy = state.legacy || { generation: 1, score: 0, graveyard: [] };
      state.legacy.completedChallenges = Array.isArray(state.legacy.completedChallenges) ? state.legacy.completedChallenges : [];
      state.challenges = state.challenges || {};
      state.challenges.bankRobber = Object.assign({ id: "bank_robber", completed: false, robberySucceededUncaught: false, famous: false, completedAge: null, completedGeneration: null }, state.challenges.bankRobber || {});
      if (state.challenges.bankRobber.completed && !state.legacy.completedChallenges.includes("bank_robber")) state.legacy.completedChallenges.push("bank_robber");
      state.dev = Object.assign({ alwaysWin: false, neverCaught: false, instantFame: false, alwaysHired: false, instantPromotions: false }, state.dev || {});
      state.schemaVersion = 5;
    }
    NC.STATS.forEach((stat) => { state.stats[stat] = U.clamp(state.stats[stat], 0, 100); });
    validateState(state);
    return state;
  }

  function makeEnvelope(state) {
    return {
      format: NC.SAVE_FORMAT,
      formatVersion: 1,
      appVersion: NC.APP_VERSION,
      exportedAt: new Date().toISOString(),
      state: U.deepClone(state)
    };
  }

  class SaveStore {
    constructor() {
      this.available = storageAvailable();
      this.memory = new Map();
      this.lastError = null;
    }

    key(slot) {
      return `${PREFIX}${slot}`;
    }

    writeRaw(slot, text) {
      if (!this.available) {
        this.memory.set(slot, text);
        return;
      }
      try {
        localStorage.setItem(this.key(slot), text);
      } catch (error) {
        this.lastError = error;
        this.available = false;
        this.memory.set(slot, text);
      }
    }

    readRaw(slot) {
      if (!this.available) return this.memory.get(slot) || null;
      try {
        return localStorage.getItem(this.key(slot));
      } catch (error) {
        this.lastError = error;
        this.available = false;
        return this.memory.get(slot) || null;
      }
    }

    save(slot, state) {
      validateState(state);
      const envelope = makeEnvelope(state);
      envelope.savedAt = new Date().toISOString();
      this.writeRaw(slot, JSON.stringify(envelope));
      return envelope.savedAt;
    }

    load(slot) {
      const raw = this.readRaw(slot);
      if (!raw) return null;
      const envelope = safeParse(raw);
      if (envelope.format !== NC.SAVE_FORMAT || !envelope.state) throw new Error("This is not a Next Chapter save.");
      return migrate(envelope.state);
    }

    remove(slot) {
      this.memory.delete(slot);
      if (!this.available) return;
      try { localStorage.removeItem(this.key(slot)); } catch (_) { /* no-op */ }
    }

    summary(slot) {
      const raw = this.readRaw(slot);
      if (!raw) return null;
      try {
        const envelope = safeParse(raw);
        const state = migrate(envelope.state);
        return {
          slot,
          savedAt: envelope.savedAt || envelope.exportedAt,
          firstName: state.profile.firstName,
          lastName: state.profile.lastName,
          age: state.age,
          alive: state.alive,
          generation: state.legacy && state.legacy.generation || 1,
          occupation: state.career && state.career.active ? state.career.active.title : "Finding their path"
        };
      } catch (_) {
        return { slot, corrupt: true };
      }
    }

    list() {
      return ["autosave", "slot1", "slot2", "slot3"].map((slot) => this.summary(slot));
    }

    export(state) {
      validateState(state);
      return JSON.stringify(makeEnvelope(state), null, 2);
    }

    import(text) {
      const envelope = safeParse(text);
      if (envelope.format !== NC.SAVE_FORMAT || envelope.formatVersion !== 1) {
        throw new Error("This file is not a supported Next Chapter export.");
      }
      return migrate(envelope.state);
    }

    clearAll() {
      ["autosave", "slot1", "slot2", "slot3"].forEach((slot) => this.remove(slot));
    }
  }

  NC.SaveStore = SaveStore;
})(window);
