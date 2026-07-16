(function installNextChapterV29Core(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine.prototype;
  const STORAGE_KEY = "next-chapter-mods-v1";
  const statKeys = new Set(["health", "happiness", "knowledge", "resilience", "looks"]);

  NC.APP_VERSION = "2.9.0";
  NC.CHANGELOG = [{
    version: "2.9.0",
    title: "Unlimited play & early Mod Maker",
    items: [
      "Actions are now unlimited, so activities no longer require aging up to recharge.",
      "Added animated page changes, action feedback, popup motion, and vampire effects.",
      "Added recording-inspired favorite activities and Spend Time With All.",
      "Added an early standalone Mod Maker and in-game mod manager for custom life events."
    ]
  }].concat(NC.CHANGELOG || []);

  function slug(value, fallback) {
    const text = String(value || fallback || "mod").toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
    return text || "mod";
  }

  function clean(value, fallback, limit) {
    return String(value || fallback || "").replace(/[<>]/g, "").trim().slice(0, limit || 240);
  }

  function loadRecords() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function normalizeEffects(effects) {
    const source = effects && typeof effects === "object" ? effects : {};
    const stats = {};
    Object.entries(source.stats || {}).forEach(([key, value]) => {
      if (statKeys.has(key) && Number.isFinite(Number(value))) stats[key] = U.clamp(Number(value), -25, 25);
    });
    const normalized = {};
    if (Object.keys(stats).length) normalized.stats = stats;
    if (Number.isFinite(Number(source.cash))) normalized.cash = U.clamp(Number(source.cash), -100000, 100000);
    return normalized;
  }

  function normalizeChoice(choice, index) {
    return {
      id: slug(choice && choice.id, `choice-${index + 1}`),
      label: clean(choice && choice.label, `Choice ${index + 1}`, 80),
      outcome: clean(choice && choice.outcome, "Your choice becomes part of the story.", 300),
      effects: normalizeEffects(choice && choice.effects)
    };
  }

  function normalizeEvent(event, modId, index) {
    const choices = Array.isArray(event && event.choices) ? event.choices.slice(0, 4).map(normalizeChoice) : [];
    if (choices.length < 2) throw new Error(`Event ${index + 1} needs at least two choices.`);
    const minAge = U.clamp(Number(event.minAge) || 0, 0, 120);
    const maxAge = U.clamp(Number(event.maxAge) || 120, minAge, 120);
    return {
      id: `mod_${slug(modId)}_${slug(event.id, `event-${index + 1}`)}`,
      title: clean(event.title, "A modded moment", 100),
      text: clean(event.text, "Something unexpected happens.", 500),
      icon: clean(event.icon, "🧩", 8),
      category: "life",
      minAge,
      maxAge,
      weight: U.clamp(Number(event.weight) || 2, 1, 12),
      cooldown: U.clamp(Number(event.cooldown) || 3, 0, 50),
      choices
    };
  }

  const Mods = NC.Mods = {
    storageKey: STORAGE_KEY,
    validate(pkg) {
      if (!pkg || typeof pkg !== "object") throw new Error("That file is not a mod package.");
      const id = slug(pkg.id || pkg.name, "my-first-mod");
      const events = Array.isArray(pkg.events) ? pkg.events.slice(0, 30).map((event, index) => normalizeEvent(event, id, index)) : [];
      if (!events.length) throw new Error("A mod needs at least one life event.");
      return {
        schemaVersion: 1,
        id,
        name: clean(pkg.name, "Untitled Mod", 80),
        author: clean(pkg.author, "Anonymous modder", 60),
        description: clean(pkg.description, "A custom Next Chapter mod.", 240),
        color: /^#[0-9a-f]{6}$/i.test(String(pkg.color || "")) ? pkg.color : "#8b5cf6",
        events
      };
    },
    list() { return loadRecords(); },
    install(pkg) {
      const normalized = this.validate(pkg);
      const records = loadRecords().filter((record) => record.package && record.package.id !== normalized.id);
      records.push({ enabled: true, installedAt: new Date().toISOString(), package: normalized });
      saveRecords(records);
      return normalized;
    },
    remove(id) {
      const records = loadRecords().filter((record) => !record.package || record.package.id !== id);
      saveRecords(records);
    },
    toggle(id) {
      const records = loadRecords();
      const record = records.find((item) => item.package && item.package.id === id);
      if (record) record.enabled = !record.enabled;
      saveRecords(records);
      return record ? record.enabled : false;
    },
    applyToData(data) {
      if (!data || !Array.isArray(data.events)) return data;
      const installed = loadRecords().filter((record) => record.enabled && record.package);
      const existing = new Set(data.events.map((event) => event.id));
      installed.forEach((record) => record.package.events.forEach((event) => {
        if (!existing.has(event.id)) {
          existing.add(event.id);
          data.events.push(U.deepClone(event));
          data.eventsById[event.id] = data.events[data.events.length - 1];
        }
      }));
      data.mods = installed.map((record) => ({ id: record.package.id, name: record.package.name, eventCount: record.package.events.length }));
      return data;
    }
  };

  const previousDataLoad = NC.Data.load;
  NC.Data.load = async function loadWithMods() {
    return Mods.applyToData(await previousDataLoad.call(this));
  };

  function grantUnlimitedActions(game) {
    if (!game || !game.state) return;
    game.state.dev = game.state.dev || {};
    game.state.dev.unlimitedActivityPoints = true;
    game.state.activityPoints = 999;
  }

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV29State() {
    previousEnsure.call(this);
    grantUnlimitedActions(this);
  };

  const previousTouch = GP.touch;
  GP.touch = function touchV29(reason) {
    grantUnlimitedActions(this);
    return previousTouch.call(this, reason);
  };

  GP.spendTimeWithAll = function spendTimeWithAll() {
    this.assertFree("Spending time with everyone");
    const living = this.state.relationships.filter((person) => person.alive !== false);
    if (!living.length) throw new Error("There is no one available to spend time with.");
    living.forEach((person) => { person.closeness = U.clamp(person.closeness + U.randomInt(this.state.rng, 3, 8), 0, 100); });
    this.state.stats.happiness = U.clamp(this.state.stats.happiness + Math.min(10, living.length + 2), 0, 100);
    this.log("Spent time with everyone", `You brought ${living.length} people together and strengthened the relationships that matter.`, "relationship", "🤗");
    this.touch("spend-time-with-all");
    return living.length;
  };
})(window);
