(function installNextChapterExpansion(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine.prototype;
  const EP = NC.EventEngine.prototype;

  const originalEventConditions = EP.conditionsPass;
  EP.conditionsPass = function expandedConditions(state, event) {
    if (!originalEventConditions.call(this, state, event)) return false;
    if (event.activityOnly) return false;
    const ledger = state.eventLedger || {};
    const seen = ledger.seenEventIds || {};
    const timelineSeen = state.timeTravel && state.timeTravel.seenEventIds || {};
    const hasAppeared = Boolean(seen[event.id] || timelineSeen[event.id]);
    // Annual story events are one-per-life unless explicitly marked repeatable.
    // A permanent seen-ID ledger prevents old events from returning after the
    // visible history is trimmed or after travelling to an earlier age.
    if (hasAppeared && event.repeatable !== true) return false;
    if (hasAppeared && event.repeatable === true) {
      const localAge = ledger.lastSeenAge && ledger.lastSeenAge[event.id];
      const timelineAge = state.timeTravel && state.timeTravel.eventLastSeenAge && state.timeTravel.eventLastSeenAge[event.id];
      const lastAge = Math.max(Number.isFinite(localAge) ? localAge : -Infinity, Number.isFinite(timelineAge) ? timelineAge : -Infinity);
      const cooldown = Number.isFinite(event.cooldown) ? event.cooldown : 8;
      if (state.age - lastAge < cooldown) return false;
    }
    return true;
  };

  const originalResolveEvent = EP.resolve;
  EP.resolve = function resolveAndRemember(game, eventId, choiceId) {
    const result = originalResolveEvent.call(this, game, eventId, choiceId);
    const state = game.state;
    state.eventLedger = state.eventLedger || { history: [], lastSeenAge: {}, seenEventIds: {} };
    state.eventLedger.seenEventIds = state.eventLedger.seenEventIds || {};
    state.eventLedger.seenEventIds[eventId] = true;
    if (state.timeTravel) {
      state.timeTravel.seenEventIds = state.timeTravel.seenEventIds || {};
      state.timeTravel.eventLastSeenAge = state.timeTravel.eventLastSeenAge || {};
      state.timeTravel.seenEventIds[eventId] = true;
      state.timeTravel.eventLastSeenAge[eventId] = state.age;
    }
    return result;
  };

  function occultId(value) {
    return ["human", "vampire", "wizard"].includes(value) ? value : "human";
  }

  function genderLabel(identity) {
    if (identity === "woman") return "Woman";
    if (identity === "man") return "Man";
    return "Nonbinary";
  }

  function wizardNoun(identity) {
    if (identity === "woman") return "witch";
    if (identity === "man") return "wizard";
    return "mage";
  }

  function compactSnapshot(state) {
    const clone = U.deepClone(state);
    delete clone.timeTravel;
    clone.updatedAt = state.updatedAt;
    clone.revision = state.revision;
    return clone;
  }

  const originalEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV15State() {
    originalEnsure.call(this);
    const s = this.state;
    if (!s) return;
    s.schemaVersion = NC.SCHEMA_VERSION;

    const legacyOriginMap = { northport: "norway", sunmere: "france", pinehaven: "usa", harborlight: "uk" };
    if (legacyOriginMap[s.profile.originId]) s.profile.originId = legacyOriginMap[s.profile.originId];
    const origin = this.origin(s.profile.originId);
    s.profile.originId = origin.id;
    s.profile.country = origin.country;
    s.profile.currency = origin.currency;
    if (!origin.cities.includes(s.profile.city)) s.profile.city = origin.city;
    s.profile.flag = origin.flag;

    const oldSupernatural = s.profile.occult || s.profile.supernatural || (s.flags && s.flags.vampire ? "vampire" : "human");
    s.profile.occult = occultId(oldSupernatural);
    s.profile.supernatural = s.profile.occult;
    s.flags = s.flags || {};
    s.flags.vampire = s.profile.occult === "vampire";
    s.flags.wizard = s.profile.occult === "wizard";
    s.profile.avatar = s.profile.avatar || {};
    s.profile.avatar.vampire = s.flags.vampire;
    s.profile.avatar.wizard = s.flags.wizard;

    if (s.flags.wizard) {
      s.magic = Object.assign({ mana: 75, power: 20, spellsCast: 0, source: "inherited", inherited: false, transformationAge: s.age }, s.magic || {});
    } else if (!s.magic || s.profile.occult !== "wizard") {
      s.magic = null;
    }

    s.eventLedger = s.eventLedger || { history: [], lastSeenAge: {}, seenEventIds: {} };
    s.eventLedger.history = Array.isArray(s.eventLedger.history) ? s.eventLedger.history : [];
    s.eventLedger.lastSeenAge = s.eventLedger.lastSeenAge || {};
    s.eventLedger.seenEventIds = s.eventLedger.seenEventIds || {};
    s.eventLedger.history.forEach((entry) => {
      if (!entry || !entry.eventId) return;
      s.eventLedger.seenEventIds[entry.eventId] = true;
      if (!Number.isFinite(s.eventLedger.lastSeenAge[entry.eventId])) s.eventLedger.lastSeenAge[entry.eventId] = Number(entry.age || 0);
    });

    s.timeTravel = s.timeTravel || { snapshots: {}, maxAgeReached: s.age, uses: 0, lastTravel: null, seenEventIds: {}, eventLastSeenAge: {} };
    s.timeTravel.snapshots = s.timeTravel.snapshots || {};
    s.timeTravel.seenEventIds = s.timeTravel.seenEventIds || {};
    s.timeTravel.eventLastSeenAge = s.timeTravel.eventLastSeenAge || {};
    Object.entries(s.eventLedger.seenEventIds).forEach(([id, value]) => { if (value) s.timeTravel.seenEventIds[id] = true; });
    Object.entries(s.timeTravel.seenEventIds).forEach(([id, value]) => { if (value) s.eventLedger.seenEventIds[id] = true; });
    Object.entries(s.eventLedger.lastSeenAge).forEach(([id, age]) => {
      if (!Number.isFinite(s.timeTravel.eventLastSeenAge[id]) || Number(age) > Number(s.timeTravel.eventLastSeenAge[id])) s.timeTravel.eventLastSeenAge[id] = Number(age);
    });
    Object.entries(s.timeTravel.eventLastSeenAge).forEach(([id, age]) => {
      if (!Number.isFinite(s.eventLedger.lastSeenAge[id]) || Number(age) > Number(s.eventLedger.lastSeenAge[id])) s.eventLedger.lastSeenAge[id] = Number(age);
    });
    s.timeTravel.maxAgeReached = Math.max(Number(s.timeTravel.maxAgeReached || 0), s.age);
    s.timeTravel.uses = Number.isFinite(s.timeTravel.uses) ? s.timeTravel.uses : 0;

    s.metrics = Object.assign({
      totalActions: 0, compliments: 0, gifts: 0, timeSpent: 0, countriesVisited: [s.profile.originId],
      thefts: 0, murders: 0, magicSpells: 0, successfulEscapes: 0, prisonStints: 0,
      totalJailYears: 0, promotions: 0, adoptedChildren: 0, fertilityChildren: 0,
      doctorVisits: 0, fameActions: 0, noStakeCasinoVisits: 0
    }, s.metrics || {});
    if (!Array.isArray(s.metrics.countriesVisited)) s.metrics.countriesVisited = [s.profile.originId];
    if (!s.metrics.countriesVisited.includes(s.profile.originId)) s.metrics.countriesVisited.push(s.profile.originId);

    s.legacy = s.legacy || { generation: 1, score: 0, graveyard: [] };
    s.legacy.ribbons = Array.isArray(s.legacy.ribbons) ? s.legacy.ribbons : [];

    s.relationships.forEach((person) => {
      person.identity = ["woman", "man", "nonbinary"].includes(person.identity) ? person.identity : "nonbinary";
      person.gender = genderLabel(person.identity);
      person.pronouns = U.pronouns(person.identity).label;
      person.occult = occultId(person.occult || (person.avatar && person.avatar.vampire ? "vampire" : "human"));
      person.avatar = person.avatar || this.makeRelativeAvatar(person.role);
      person.avatar.vampire = person.occult === "vampire";
      person.avatar.wizard = person.occult === "wizard";
    });
  };

  GP.recordAgeSnapshot = function recordAgeSnapshot() {
    const s = this.state;
    if (!s || !s.timeTravel || this._suppressSnapshot) return;
    s.timeTravel.maxAgeReached = Math.max(Number(s.timeTravel.maxAgeReached || 0), s.age);
    s.timeTravel.snapshots[String(s.age)] = compactSnapshot(s);
    const ages = Object.keys(s.timeTravel.snapshots).map(Number).sort((a, b) => a - b);
    // The normal game caps life at 140. This guard only prevents corrupted saves from growing forever.
    while (ages.length > 141) delete s.timeTravel.snapshots[String(ages.shift())];
  };

  const originalTouch = GP.touch;
  GP.touch = function expandedTouch(reason) {
    this.ensureExpansionState();
    this.recordAgeSnapshot();
    return originalTouch.call(this, reason);
  };

  const originalRandomPerson = GP.randomPerson;
  GP.randomPerson = function countryAwarePerson(role, options) {
    const opts = Object.assign({}, options || {});
    const identity = opts.identity || U.pick(this.state.rng, ["woman", "man", "nonbinary"]);
    const origin = this.origin(this.state.profile.originId);
    const pool = origin.firstNamesByGender && origin.firstNamesByGender[identity] || origin.firstNames;
    opts.identity = identity;
    if (!opts.firstName) opts.firstName = U.pick(this.state.rng, pool);
    const person = originalRandomPerson.call(this, role, opts);
    person.gender = genderLabel(identity);
    let inheritedOccult = opts.occult;
    if (!inheritedOccult && role === "child" && ["wizard", "vampire"].includes(this.state.profile.occult)) {
      inheritedOccult = U.random(this.state.rng) < 0.68 ? this.state.profile.occult : "human";
    }
    person.occult = occultId(inheritedOccult || "human");
    person.avatar.vampire = person.occult === "vampire";
    person.avatar.wizard = person.occult === "wizard";
    return person;
  };

  const originalCreateCharacter = GP.createCharacter;
  GP.createCharacter = function createV15Character(input) {
    const requested = occultId(input.occult || input.supernatural || "human");
    const state = originalCreateCharacter.call(this, Object.assign({}, input, { supernatural: requested === "vampire" ? "vampire" : "human" }));
    state.profile.occult = requested;
    state.profile.supernatural = requested;
    state.flags.vampire = requested === "vampire";
    state.flags.wizard = requested === "wizard";
    state.profile.avatar.vampire = state.flags.vampire;
    state.profile.avatar.wizard = state.flags.wizard;
    state.magic = requested === "wizard" ? { mana: 80, power: 25, spellsCast: 0, source: "born", inherited: true, transformationAge: 0 } : null;
    const origin = this.origin(state.profile.originId);
    state.profile.city = U.pick(state.rng, origin.cities || [origin.city]);
    state.profile.country = origin.country;
    state.profile.currency = origin.currency;
    state.profile.flag = origin.flag;

    if (requested !== "human") {
      const parents = state.relationships.filter((person) => person.role === "parent");
      if (parents.length) {
        parents[0].occult = requested;
        parents[0].avatar.vampire = requested === "vampire";
        parents[0].avatar.wizard = requested === "wizard";
        if (parents[1] && U.random(state.rng) < 0.35) {
          parents[1].occult = requested;
          parents[1].avatar.vampire = requested === "vampire";
          parents[1].avatar.wizard = requested === "wizard";
        }
      }
      const label = requested === "wizard" ? wizardNoun(state.profile.identity) : "vampire";
      this.log("An inherited secret", `${state.profile.firstName} is born as a ${label}, carrying an occult gift through the family line.`, "milestone", requested === "wizard" ? "🪄" : "🦇");
    }
    this.ensureExpansionState();
    this.touch("v1.5-character-created");
    return state;
  };

  GP.occultLabel = function occultLabel() {
    const id = this.state.profile.occult;
    if (id === "wizard") return U.cap(wizardNoun(this.state.profile.identity));
    return NC.OCCULTS[id] ? NC.OCCULTS[id].label : "Human";
  };

  GP.checkOrphanageStatus = function checkOrphanageStatus() {
    const s = this.state;
    if (!s || !s.alive) return false;
    const livingParents = s.relationships.filter((person) => person.role === "parent" && person.alive !== false);
    if (s.age < 18 && livingParents.length === 0 && !s.flags.orphanage) {
      s.flags.orphanage = true;
      s.flags.inParentalCare = false;
      const guardian = this.randomPerson("guardian", { age: U.randomInt(s.rng, 30, 58), closeness: 42, lastName: U.pick(s.rng, this.origin(s.profile.originId).lastNames) });
      guardian.relationshipStatus = "orphanage_guardian";
      s.relationships.push(guardian);
      this.log("Placed in an orphanage", "With no living parent able to care for you before adulthood, local services place you in an orphanage and assign a guardian.", "bad", "🏠");
      s.stats.happiness = U.clamp(s.stats.happiness - 12, 0, 100);
      return true;
    }
    if (s.age >= 18 && s.flags.orphanage) {
      s.flags.orphanage = false;
      s.flags.left_orphanage = true;
      this.log("Left the orphanage", "Now legally an adult, you leave institutional care and begin arranging life independently.", "milestone", "🧳");
      return true;
    }
    return false;
  };

  const originalProgressRelationships = GP.progressRelationships;
  GP.progressRelationships = function expandedRelationships() {
    originalProgressRelationships.call(this);
    this.checkOrphanageStatus();
  };

  const originalAgeUp = GP.ageUp;
  GP.ageUp = function expandedAgeUp() {
    this.recordAgeSnapshot();
    const wasIncarcerated = this.isIncarcerated();
    const result = originalAgeUp.call(this);
    if (this.state && this.state.alive) {
      if (wasIncarcerated) this.state.metrics.totalJailYears += 1;
      if (this.state.flags.wizard && this.state.magic) {
        this.state.magic.mana = U.clamp(this.state.magic.mana + U.randomInt(this.state.rng, 18, 32), 0, 100);
        this.state.magic.power = U.clamp(this.state.magic.power + (this.state.age % 4 === 0 ? 1 : 0), 0, 100);
      }
      this.checkOrphanageStatus();
      this.touch("v1.5-age-up");
    }
    return result;
  };

  GP.availableTimeTravelAges = function availableTimeTravelAges() {
    this.ensureExpansionState();
    return Object.keys(this.state.timeTravel.snapshots).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  };

  GP.timeTravelToAge = function timeTravelToAge(targetAge) {
    this.assertFree("Time travel");
    this.ensureExpansionState();
    const age = U.int(targetAge, -1);
    const archive = U.deepClone(this.state.timeTravel);
    const snapshot = archive.snapshots[String(age)];
    if (!snapshot) throw new Error("That age has not been recorded in this life yet.");
    const fromAge = this.state.age;
    this.state = U.deepClone(snapshot);
    this.state.timeTravel = archive;
    this.state.timeTravel.uses += 1;
    this.state.timeTravel.lastTravel = { fromAge, toAge: age, at: new Date().toISOString() };
    this.ensureExpansionState();
    this.log("The timeline folds", `You travel from age ${fromAge} back to age ${age}. Your relationships, money, history, career, and choices return to how they were at that age.`, "milestone", "⏳");
    this._suppressSnapshot = true;
    try { originalTouch.call(this, "time-travel"); } finally { this._suppressSnapshot = false; }
    return this.state;
  };

  GP.wizardTurningCheck = function wizardTurningCheck(method) {
    const s = this.state;
    if (s.profile.occult === "wizard") return { allowed: false, reason: "You already have magic." };
    if (s.profile.occult !== "human") return { allowed: false, reason: "This life is already bound to a different occult nature." };
    if (s.age < 12) return { allowed: false, reason: "Magical awakening becomes available at age 12." };
    if (s.activityPoints < 1) return { allowed: false, reason: "Age up for more actions." };
    if (method === "family" && !s.relationships.some((p) => p.alive !== false && p.occult === "wizard")) return { allowed: false, reason: "No living magical relative can perform the ritual." };
    return { allowed: true, reason: "" };
  };

  GP.attemptWizardTurning = function attemptWizardTurning(method) {
    const check = this.wizardTurningCheck(method);
    if (!check.allowed) throw new Error(check.reason);
    const s = this.state;
    const methods = {
      grimoire: { label: "an ancient grimoire", chance: .70, cost: 350, source: "grimoire" },
      mentor: { label: "a patient magical mentor", chance: .82, cost: 1800, source: "mentor" },
      awakening: { label: "a spontaneous awakening", chance: .58, cost: 0, source: "awakening" },
      family: { label: "a family inheritance ritual", chance: .92, cost: 500, source: "family ritual" }
    };
    const chosen = methods[method];
    if (!chosen) throw new Error("Choose a valid magical path.");
    if (s.finances.cash < chosen.cost) throw new Error(`You need ${U.formatMoney(chosen.cost, s.profile.currency)} for that path.`);
    s.finances.cash -= chosen.cost;
    s.activityPoints -= 1;
    s.metrics.totalActions += 1;
    const success = s.dev.alwaysWin || U.random(s.rng) < chosen.chance;
    if (success) {
      s.profile.occult = "wizard";
      s.profile.supernatural = "wizard";
      s.flags.wizard = true;
      s.flags.vampire = false;
      s.profile.avatar.wizard = true;
      s.profile.avatar.vampire = false;
      s.magic = { mana: 72, power: 18, spellsCast: 0, source: chosen.source, inherited: method === "family", transformationAge: s.age };
      this.log("Magic awakened", `Through ${chosen.label}, you become a ${wizardNoun(s.profile.identity)}. A new Magic section is now available in Activities.`, "milestone", "🪄");
    } else {
      s.stats.resilience = U.clamp(s.stats.resilience + 2, 0, 100);
      s.stats.happiness = U.clamp(s.stats.happiness - 2, 0, 100);
      this.log("The awakening did not take", `You try to awaken magic through ${chosen.label}, but nothing permanent changes this time.`, "neutral", "🌫️");
    }
    this.touch("wizard-turning");
    return success;
  };

  GP.magicTarget = function magicTarget(targetId) {
    if (targetId === "self") return { kind: "self", id: "self", firstName: this.state.profile.firstName, age: this.state.age, identity: this.state.profile.identity, alive: this.state.alive };
    const person = this.state.relationships.find((p) => p.id === targetId && p.alive !== false);
    if (!person) throw new Error("Choose a living target.");
    return person;
  };

  GP.magicBabyReactions = function magicBabyReactions() {
    const s = this.state;
    const living = s.relationships.filter((p) => p.alive !== false);
    const reactions = {
      parent: "is shocked, checks that you are safe, and immediately starts arranging baby care",
      sibling: "stares in disbelief and asks whether the spell can possibly be reversed",
      child: "is completely confused to see their parent become a baby",
      spouse: "struggles to process the impossible transformation",
      fiance: "asks several times whether this is truly permanent",
      partner: "cannot believe the person they know is suddenly an infant",
      friend: "says this is easily the strangest message they have ever received",
      guardian: "begins working out who is legally responsible for your care"
    };
    living.forEach((person) => {
      const reaction = reactions[person.role] || "reacts with shock and a long list of questions";
      this.log(`${person.firstName} reacts`, `${person.firstName} ${reaction}.`, "relationship", "💬");
    });
  };

  GP.castSpell = function castSpell(spellId, targetId, targetAge) {
    this.assertFree("Magic");
    const s = this.state;
    if (!s.flags.wizard || !s.magic) throw new Error("Only a wizard, witch, or mage can cast spells.");
    if (s.activityPoints < 1) throw new Error("Age up for more actions.");
    const costs = { age_down: 24, age_up: 24, grant_magic: 38, restoration: 14, fortune: 20, charm: 12, inferno: 45 };
    const cost = costs[spellId];
    if (!Number.isFinite(cost)) throw new Error("Unknown spell.");
    if (s.magic.mana < cost) throw new Error(`This spell needs ${cost} mana.`);
    const target = this.magicTarget(targetId || "self");

    // Validate the entire request before spending mana or an action point.
    let chosenAge = null;
    if (spellId === "age_down" || spellId === "age_up") {
      chosenAge = U.clamp(U.int(targetAge, target.age), 0, 140);
      if (spellId === "age_down" && chosenAge >= target.age) throw new Error("Choose an age younger than the target's current age.");
      if (spellId === "age_up" && chosenAge <= target.age) throw new Error("Choose an age older than the target's current age.");
    }
    if (spellId === "grant_magic") {
      if (target.kind === "self") throw new Error("You already possess magic.");
      if (target.occult === "wizard") throw new Error(`${target.firstName} already possesses magic.`);
    }
    if (spellId === "charm" && target.kind === "self") throw new Error("Choose another person for a relationship charm.");
    if (spellId === "inferno" && target.kind === "self") throw new Error("Choose another living person.");

    s.magic.mana -= cost;
    s.magic.spellsCast += 1;
    s.metrics.magicSpells += 1;
    s.metrics.totalActions += 1;
    s.activityPoints -= 1;

    if (spellId === "age_down" || spellId === "age_up") {
      const age = chosenAge;
      const before = target.age;
      if (target.kind === "self") {
        s.age = age;
        if (age < 14 && s.career.active) this.leaveCareer("magical age regression");
        if (age < 5) Object.assign(s.education, { status: "not_started", programId: null, field: null, yearsComplete: 0 });
        s.flags.magicallyAged = true;
        this.log(spellId === "age_down" ? "A spell rewinds your age" : "A spell advances your age", `Your body changes from age ${before} to age ${age}, while the calendar and everyone else's ages remain unchanged.`, "milestone", spellId === "age_down" ? "⏪" : "⏩");
        this.checkOrphanageStatus();
        if (age === 0) {
          const parents = s.relationships.filter((p) => p.role === "parent" && p.alive !== false);
          if (parents.length) {
            s.flags.inParentalCare = true;
            s.flags.orphanage = false;
            this.log("Back in infant care", `Your ${parents.length === 1 ? "living parent is" : "living parents are"} stunned by the transformation. They put you in a diaper, prepare a safe sleeping space, and take over your day-to-day care.`, "relationship", "🍼");
          }
          // Orphanage placement happens first when needed, so the assigned
          // guardian is also included among the people who react.
          this.checkOrphanageStatus();
          this.magicBabyReactions();
        }
      } else {
        target.age = age;
        target.magicallyAged = true;
        this.log("Age spell cast", `${target.firstName} changes from age ${before} to age ${age}. ${U.cap(U.pronouns(target.identity).subject)} remembers the life lived before the spell.`, "milestone", spellId === "age_down" ? "⏪" : "⏩");
      }
    } else if (spellId === "grant_magic") {
      target.occult = "wizard";
      target.avatar.wizard = true;
      target.avatar.vampire = false;
      target.magic = { power: 10, source: "gifted" };
      this.log("Magic shared", `You awaken magical power in ${target.firstName}. ${U.cap(U.pronouns(target.identity).subject)} becomes a ${wizardNoun(target.identity)}.`, "milestone", "✨");
    } else if (spellId === "restoration") {
      if (target.kind === "self") s.stats.health = U.clamp(s.stats.health + 18, 0, 100);
      else target.health = U.clamp(target.health + 24, 0, 100);
      this.log("Restoration spell", `A warm spell settles over ${target.kind === "self" ? "you" : target.firstName}, improving health and easing exhaustion.`, "good", "💚");
    } else if (spellId === "fortune") {
      const amount = U.randomInt(s.rng, 500, 6500);
      s.finances.cash += amount;
      this.log("Fortune spell", `A chain of improbable good luck brings ${U.formatMoney(amount, s.profile.currency)} into your life.`, "money", "🍀");
    } else if (spellId === "charm") {
      target.closeness = U.clamp(target.closeness + 18, 0, 100);
      this.log("Relationship charm", `The tension between you and ${target.firstName} softens, though genuine trust will still require real effort.`, "relationship", "💞");
    } else if (spellId === "inferno") {
      const successChance = U.clamp(.34 + s.magic.power / 250, .18, .75);
      const success = s.dev.alwaysWin || U.random(s.rng) < successChance;
      const caught = s.dev.neverCaught ? false : U.random(s.rng) < (success ? .44 : .58);
      const record = { id: U.uid("crime"), kind: "magic_attack", label: success ? "Murder by magic" : "Attempted murder by magic", age: s.age, success, caught, reward: 0, target: target.id };
      s.crime.record.unshift(record);
      if (success) {
        target.alive = false;
        target.deathAge = target.age;
        target.previousRole = target.role;
        if (target.role === "spouse") target.role = "late_spouse";
        else if (["partner", "fiance"].includes(target.role)) target.role = "late_partner";
        s.crime.successfulCrimes += 1;
        s.crime.uncaughtMurders += caught ? 0 : 1;
        s.metrics.murders += 1;
        this.log("The Inferno spell succeeds", `${target.firstName} dies after the forbidden spell. The event is recorded without graphic detail.`, "bad", "🔥");
      } else {
        target.health = U.clamp(target.health - 25, 1, 100);
        target.closeness = 0;
        this.log("The Inferno spell fails", `${target.firstName} survives the magical attack and immediately understands that you tried to kill them.`, "bad", "⚠️");
      }
      if (caught) {
        s.crime.arrests += 1;
        s.crime.pendingCourt = { crimeId: record.id, label: success ? "Murder by magic" : "Attempted murder", baseSentence: success ? U.randomInt(s.rng, 22, 48) : U.randomInt(s.rng, 7, 18), severity: success ? "murder" : "violent", evidence: U.randomInt(s.rng, 55, 95) };
        this.log("Police investigate the spell", `Authorities connect you to ${success ? "a death" : "an attempted killing"}, and a court case begins.`, "bad", "🚓");
      }
    }

    s.magic.power = U.clamp(s.magic.power + 1, 0, 100);
    this.touch("spell-cast");
    return true;
  };

  GP.emigrate = function emigrate(originId) {
    this.assertFree("Emigration");
    const s = this.state;
    if (s.age < 18) throw new Error("Emigration is available at age 18.");
    if (s.activityPoints < 1) throw new Error("Age up for more actions.");
    const origin = this.data.catalogs.origins.find((item) => item.id === originId);
    if (!origin) throw new Error("Choose a country.");
    if (origin.id === s.profile.originId) throw new Error("You already live in that country.");
    const cost = 2800;
    if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)} to move.`);
    if (s.crime.convictions > 0 && !s.dev.alwaysWin && U.random(s.rng) < Math.min(.75, .18 + s.crime.convictions * .13)) throw new Error("The immigration application was refused because of your criminal record.");
    s.finances.cash -= cost;
    s.activityPoints -= 1;
    s.metrics.totalActions += 1;
    s.profile.originId = origin.id;
    s.profile.country = origin.country;
    s.profile.city = U.pick(s.rng, origin.cities || [origin.city]);
    s.profile.currency = origin.currency;
    s.profile.flag = origin.flag;
    if (!s.metrics.countriesVisited.includes(origin.id)) s.metrics.countriesVisited.push(origin.id);
    this.log("Emigrated", `You move to ${s.profile.city}, ${origin.country}, and begin adapting to a new home.`, "milestone", "🌍");
    this.touch("emigrated");
  };

  GP.adoptChild = function adoptChild() {
    this.assertFree("Adoption");
    const s = this.state;
    if (s.age < 18) throw new Error("Adoption is available at age 18.");
    if (s.activityPoints < 1) throw new Error("Age up for more actions.");
    const cost = 5200;
    if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)} for the application and placement costs.`);
    s.finances.cash -= cost;
    s.activityPoints -= 1;
    s.metrics.totalActions += 1;
    const chance = s.dev.alwaysWin ? 1 : U.clamp(.82 - s.crime.convictions * .17 + Math.min(.08, this.netWorth() / 1000000), .08, .94);
    if (U.random(s.rng) < chance) {
      const child = this.randomPerson("child", { age: U.randomInt(s.rng, 0, 6), closeness: 62, lastName: s.profile.lastName });
      child.adopted = true;
      s.relationships.push(child);
      s.metrics.adoptedChildren += 1;
      this.log("Adoption approved", `${child.firstName} ${child.lastName}, age ${child.age}, joins your family.`, "relationship", "🧸");
      this.touch("adoption-approved");
      return true;
    }
    this.log("Adoption application declined", s.crime.convictions ? "The agency cites concerns connected to your criminal record and current stability." : "The agency decides that the placement is not the right match this year.", "bad", "📋");
    this.touch("adoption-declined");
    return false;
  };

  GP.fertilityAction = function fertilityAction() {
    this.assertFree("Fertility clinic");
    const s = this.state;
    if (s.age < 18) throw new Error("Fertility options are available at age 18.");
    if (s.activityPoints < 1) throw new Error("Age up for more actions.");
    const cost = 4200;
    if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)}.`);
    s.finances.cash -= cost;
    s.activityPoints -= 1;
    s.metrics.totalActions += 1;
    const partner = s.relationships.find((p) => p.alive !== false && ["partner", "fiance", "spouse"].includes(p.role));
    const chance = s.dev.alwaysWin ? 1 : (partner ? .78 : .62);
    if (U.random(s.rng) < chance) {
      const child = this.randomPerson("child", { age: 0, closeness: 72, lastName: s.profile.lastName });
      child.conception = partner ? "fertility treatment with partner" : "assisted fertility treatment";
      s.relationships.push(child);
      s.metrics.fertilityChildren += 1;
      this.log("A new child joins the family", `${child.firstName} ${child.lastName} is born after fertility treatment.`, "relationship", "🍼");
      this.touch("fertility-success");
      return true;
    }
    this.log("Treatment was unsuccessful", "The clinic explains that this attempt did not lead to a child, though another attempt may have a different outcome.", "neutral", "🧬");
    this.touch("fertility-failed");
    return false;
  };

  GP.noStakeCasinoVisit = function noStakeCasinoVisit() {
    this.assertFree("Casino visit");
    const s = this.state;
    if (s.age < 18) throw new Error("This venue is available at age 18.");
    if (s.activityPoints < 1) throw new Error("Age up for more actions.");
    const cost = 120;
    if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)} for entry and food.`);
    s.finances.cash -= cost;
    s.activityPoints -= 1;
    s.metrics.totalActions += 1;
    s.metrics.noStakeCasinoVisits += 1;
    const moments = ["watch a stage show", "explore the decorated halls", "have dinner under bright lights", "listen to a live band"];
    const moment = U.pick(s.rng, moments);
    s.stats.happiness = U.clamp(s.stats.happiness + U.randomInt(s.rng, 2, 5), 0, 100);
    this.log("Visited a casino resort", `You ${moment}. The visit is a no-stakes social outing with no betting or wagering.`, "neutral", "♠️");
    this.touch("casino-social-visit");
  };

  GP.fameActivity = function fameActivity() {
    this.assertFree("Fame activity");
    const s = this.state;
    if (s.age < 13) throw new Error("Fame activities begin at age 13.");
    if (s.activityPoints < 1) throw new Error("Age up for more actions.");
    s.activityPoints -= 1;
    s.metrics.totalActions += 1;
    s.metrics.fameActions += 1;
    const gain = U.randomInt(s.rng, 2, 8) + (s.profile.specialTalent === "acting" || s.profile.specialTalent === "modeling" || s.profile.specialTalent === "music" ? 3 : 0);
    s.fame = U.clamp(s.fame + gain, 0, 100);
    this.log("Managed your public image", `A public appearance increases your fame by ${gain} points.`, "good", "⭐");
    this.updateChallenges();
    this.touch("fame-activity");
  };

  GP.doctorVisit = function doctorVisit() {
    this.assertFree("Doctor visit");
    const s = this.state;
    if (s.activityPoints < 1) throw new Error("Age up for more actions.");
    const cost = s.age < 18 ? 0 : 180;
    if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)}.`);
    s.finances.cash -= cost;
    s.activityPoints -= 1;
    s.metrics.totalActions += 1;
    s.metrics.doctorVisits += 1;
    const gain = U.randomInt(s.rng, 5, 13);
    s.stats.health = U.clamp(s.stats.health + gain, 0, 100);
    this.log("Visited a doctor", `The appointment improves your health by ${gain} points and gives you practical follow-up advice.`, "good", "🩺");
    this.touch("doctor-visit");
  };

  const originalStartActivity = GP.startActivity;
  GP.startActivity = function expandedStartActivity(activityId) {
    const activity = this.data.catalogs.activities.find((item) => item.id === activityId);
    if (activity && activity.wizardOnly && !this.state.flags.wizard) throw new Error("Only a wizard, witch, or mage can do that.");
    const result = originalStartActivity.call(this, activityId);
    this.state.metrics.totalActions += 1;
    this.touch("activity-metrics");
    return result;
  };

  const originalRelationshipAction = GP.relationshipAction;
  GP.relationshipAction = function metricRelationshipAction(personId, action) {
    const result = originalRelationshipAction.call(this, personId, action);
    this.ensureExpansionState();
    this.state.metrics.totalActions += 1;
    if (action === "compliment") this.state.metrics.compliments += 1;
    if (action === "gift") this.state.metrics.gifts += 1;
    if (action === "time") this.state.metrics.timeSpent += 1;
    this.touch("relationship-metrics");
    return result;
  };

  const originalCommitCrime = GP.commitCrime;
  GP.commitCrime = function metricCrime(kind, targetId) {
    const result = originalCommitCrime.call(this, kind, targetId);
    this.ensureExpansionState();
    this.state.metrics.totalActions += 1;
    if (["shoplift", "burglary", "bank"].includes(kind) && result && result.success) this.state.metrics.thefts += 1;
    if (kind === "murder" && result && result.success) this.state.metrics.murders += 1;
    this.touch("crime-metrics");
    return result;
  };

  const originalPrisonAction = GP.prisonAction;
  GP.prisonAction = function metricPrisonAction(kind, personId) {
    const before = this.isIncarcerated();
    const result = originalPrisonAction.call(this, kind, personId);
    if (kind === "escape" && before && !this.isIncarcerated()) {
      this.state.metrics.successfulEscapes += 1;
      this.touch("escape-metrics");
    }
    return result;
  };

  const originalStartIncarceration = GP.startIncarceration;
  GP.startIncarceration = function metricIncarceration(caseInfo, years) {
    this.ensureExpansionState();
    this.state.metrics.prisonStints += 1;
    return originalStartIncarceration.call(this, caseInfo, years);
  };

  const originalPromoteCareer = GP.promoteCareer;
  GP.promoteCareer = function metricPromotion(force) {
    const before = this.state.career.active && this.state.career.active.level;
    const result = originalPromoteCareer.call(this, force);
    const after = this.state.career.active && this.state.career.active.level;
    if (result && Number(after) > Number(before)) this.state.metrics.promotions += 1;
    return result;
  };

  GP.calculateRibbon = function calculateRibbon() {
    const s = this.state;
    const m = s.metrics || {};
    const net = this.netWorth();
    const children = s.relationships.filter((p) => ["child", "stepchild"].includes(p.role)).length;
    const closeFamily = s.relationships.filter((p) => p.alive !== false && ["parent", "child", "sibling", "spouse"].includes(p.role));
    const familyAverage = closeFamily.length ? closeFamily.reduce((sum, p) => sum + Number(p.closeness || 0), 0) / closeFamily.length : 0;
    if (s.flags.wizard && Number(m.magicSpells || 0) >= 20) return "archmage";
    if (Number(s.timeTravel && s.timeTravel.uses || 0) >= 5) return "time_weaver";
    if (Number(m.murders || 0) >= 5) return "notorious";
    if (Number(m.successfulEscapes || 0) >= 3) return "escape_artist";
    if (Number(m.totalJailYears || 0) >= 5 || Number(m.prisonStints || 0) >= 2) return "jailbird";
    if (Number(m.thefts || 0) >= 10) return "master_thief";
    if (s.fame >= 75) return "famous";
    if (net >= 20000000) return "mega_wealthy";
    if (net >= 2500000) return "millionaire";
    if (children >= 6) return "fertile";
    if (m.gifts >= 20) return "generous";
    if (s.education.credentials.includes("graduate")) return "scholar";
    if (s.age >= 100) return "centenarian";
    if ((m.countriesVisited || []).length >= 5) return "wanderer";
    if (children >= 2 && familyAverage >= 70 && s.crime.convictions === 0) return "family_first";
    if (s.age >= 65 && m.promotions >= 2 && s.crime.convictions === 0) return "successful";
    if (s.crime.convictions === 0 && m.compliments >= 10 && m.timeSpent >= 10 && m.gifts >= 5) return "model_citizen";
    if (s.profile.occult === "vampire") return "nightborn";
    if (!s.career.active && !(s.career.history || []).length && s.age >= 50 && m.totalActions < 20) return "quiet_life";
    if (s.age < 30 && !String(s.death && s.death.cause || "").includes("developer")) return "unlucky";
    return "ordinary";
  };

  GP.awardRibbon = function awardRibbon() {
    this.ensureExpansionState();
    const id = this.calculateRibbon();
    const ribbon = NC.RIBBONS[id] || NC.RIBBONS.ordinary;
    if (!this.state.legacy.ribbons.some((item) => item.id === id)) {
      this.state.legacy.ribbons.push({ id, label: ribbon.label, icon: ribbon.icon, description: ribbon.description, generation: this.state.legacy.generation, character: `${this.state.profile.firstName} ${this.state.profile.lastName}`, age: this.state.age, earnedAt: new Date().toISOString() });
    }
    return id;
  };

  const originalDie = GP.die;
  GP.die = function dieWithRibbon(cause, shouldTouch) {
    if (!this.state.alive) return;
    const id = this.awardRibbon();
    originalDie.call(this, cause, false);
    this.state.death.ribbon = id;
    const last = this.state.legacy.graveyard[this.state.legacy.graveyard.length - 1];
    if (last) last.ribbon = id;
    const ribbon = NC.RIBBONS[id];
    this.log(`Ribbon earned: ${ribbon.label}`, ribbon.description, "milestone", ribbon.icon);
    if (shouldTouch !== false) this.touch("death-ribbon");
  };

  const originalContinueAs = GP.continueAs;
  GP.continueAs = function continueWithOccult(personId) {
    const old = this.state;
    const heir = this.eligibleHeirs().find((p) => p.id === personId);
    const inheritedOccult = occultId(heir && heir.occult || "human");
    const ribbons = U.deepClone(old.legacy.ribbons || []);
    const state = originalContinueAs.call(this, personId);
    state.profile.occult = inheritedOccult;
    state.profile.supernatural = inheritedOccult;
    state.flags.vampire = inheritedOccult === "vampire";
    state.flags.wizard = inheritedOccult === "wizard";
    state.profile.avatar.vampire = state.flags.vampire;
    state.profile.avatar.wizard = state.flags.wizard;
    state.magic = state.flags.wizard ? { mana: 75, power: 18, spellsCast: 0, source: "inherited", inherited: true, transformationAge: state.age } : null;
    state.legacy.ribbons = ribbons;
    state.timeTravel = { snapshots: {}, maxAgeReached: state.age, uses: 0, lastTravel: null, seenEventIds: {}, eventLastSeenAge: {} };
    this.ensureExpansionState();
    if (inheritedOccult !== "human") this.log("Occult inheritance", `The family line passes its ${inheritedOccult === "wizard" ? "magic" : "vampiric nature"} to the new generation.`, "milestone", inheritedOccult === "wizard" ? "🪄" : "🦇");
    this.touch("occult-inheritance");
    return state;
  };

  NC.genderLabel = genderLabel;
  NC.wizardNoun = wizardNoun;
})(window);
