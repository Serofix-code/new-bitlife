(function installNextChapterV24(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine && NC.GameEngine.prototype;
  if (!GP) return;

  NC.APP_VERSION = "2.4.0";
  NC.SCHEMA_VERSION = Math.max(NC.SCHEMA_VERSION || 1, 16);

  NC.COSMETIC_PROCEDURES = [
    { id: "botox", label: "Botox treatment", icon: "💉", baseCost: 900, complexity: 0.08, maxUses: null, cooldown: 0, lookGain: [1, 4], bodyProcedure: false },
    { id: "body_contouring", label: "Lower-body contouring", icon: "🧍", baseCost: 14500, complexity: 0.42, maxUses: 2, cooldown: 12, lookGain: [5, 12], bodyProcedure: true },
    { id: "chest_augmentation", label: "Chest augmentation", icon: "🩺", baseCost: 11000, complexity: 0.35, maxUses: 1, cooldown: 99, lookGain: [4, 11], bodyProcedure: true },
    { id: "eyelid", label: "Eyelid surgery", icon: "👁️", baseCost: 6500, complexity: 0.24, maxUses: 3, cooldown: 10, lookGain: [3, 8], bodyProcedure: false },
    { id: "facelift", label: "Face lift", icon: "🙂", baseCost: 12500, complexity: 0.31, maxUses: null, cooldown: 8, lookGain: [4, 10], bodyProcedure: false },
    { id: "liposuction", label: "Liposuction", icon: "🩺", baseCost: 9800, complexity: 0.36, maxUses: 3, cooldown: 10, lookGain: [4, 10], bodyProcedure: true },
    { id: "genital_enhancement", label: "Genital enhancement surgery", icon: "🏥", baseCost: 13000, complexity: 0.4, maxUses: 1, cooldown: 99, lookGain: [2, 7], bodyProcedure: true, role: "contribute" },
    { id: "gender_affirming", label: "Gender-affirming surgery", icon: "🏳️‍⚧️", baseCost: 24000, complexity: 0.48, maxUses: 1, cooldown: 99, lookGain: [3, 9], bodyProcedure: true, genderAffirming: true },
    { id: "nose", label: "Nose surgery", icon: "👃", baseCost: 7200, complexity: 0.27, maxUses: 3, cooldown: 10, lookGain: [3, 9], bodyProcedure: false },
    { id: "abdominal", label: "Abdominal contouring", icon: "🏥", baseCost: 12500, complexity: 0.4, maxUses: 2, cooldown: 12, lookGain: [4, 11], bodyProcedure: true }
  ];

  NC.VAMPIRE_HUNT_LOCATIONS = [
    { id: "old_quarter", label: "Old quarter", icon: "🌙", risk: 18, reward: 24 },
    { id: "night_market", label: "Night market", icon: "🏮", risk: 25, reward: 31 },
    { id: "riverside", label: "Riverside paths", icon: "🌉", risk: 31, reward: 38 },
    { id: "exclusive_club", label: "Exclusive night venue", icon: "🎭", risk: 38, reward: 46 },
    { id: "abandoned_estate", label: "Abandoned estate", icon: "🏚️", risk: 48, reward: 58 }
  ];

  NC.VAMPIRE_PROPERTIES = [
    { id: "lair", label: "Vampire Lair", icon: "🕯️", cost: 650000, secrecy: 12, essence: 8 },
    { id: "castle", label: "Vampire Castle", icon: "🏰", cost: 2800000, secrecy: 24, essence: 15 }
  ];

  const SURGEON_FIRST = ["Amelia", "Noah", "Mina", "Theo", "Sofia", "Julian", "Ari", "Nora", "Elias", "Camille", "Mika", "Leonie"];
  const SURGEON_LAST = ["Laurent", "Hansen", "Weber", "Moretti", "Sato", "Morgan", "Dubois", "Keller", "Navarro", "Berg", "Kim", "Rossi"];
  const CURSES = [
    { id: "sunlight", label: "Daylight weakness", text: "Daytime actions drain additional essence." },
    { id: "restless", label: "Restless immortality", text: "Happiness falls slightly when essence is low." },
    { id: "echoes", label: "Echoes of the Maker", text: "Secrecy is harder to maintain after public fame actions." },
    { id: "thirst", label: "Relentless thirst", text: "Essence declines faster each year." }
  ];
  const VAMPIRE_GOALS = [
    { id: "hunts", label: "Complete five successful hunts", check: (s) => (s.vampire.huntsSuccessful || 0) >= 5 },
    { id: "secrecy", label: "Maintain at least 80% secrecy", check: (s) => s.vampire.secrecy >= 80 },
    { id: "essence", label: "Reach 95% essence", check: (s) => s.vampire.essence >= 95 },
    { id: "notoriety", label: "Reach 70% notoriety", check: (s) => s.vampire.notoriety >= 70 },
    { id: "progeny", label: "Create two adult progeny", check: (s) => (s.vampire.progeny || []).length >= 2 },
    { id: "familiar", label: "Keep a familiar for five years", check: (s) => (s.vampire.familiars || []).some((f) => f.years >= 5) },
    { id: "property", label: "Own a vampire property", check: (s) => (s.vampire.properties || []).length >= 1 }
  ];

  function seeded(state, suffix) {
    return { seed: U.hashSeed(`${state.saveId}|v24|${suffix}`), step: 0 };
  }

  function countryPolicyFromState(state, data) {
    const origin = data.catalogs.origins.find((item) => item.id === state.profile.originId) || data.catalogs.origins.find((item) => item.country === state.profile.country) || data.catalogs.origins[0];
    return {
      healthcareModel: origin.healthcareModel || "mixed",
      healthcareLabel: origin.healthcareLabel || "Mixed healthcare",
      healthcareCostMultiplier: Number.isFinite(origin.healthcareCostMultiplier) ? origin.healthcareCostMultiplier : .5,
      collegeModel: origin.collegeModel || "subsidized",
      collegeLabel: origin.collegeLabel || "Subsidized college",
      collegeCostMultiplier: Number.isFinite(origin.collegeCostMultiplier) ? origin.collegeCostMultiplier : .5
    };
  }

  function chooseGoals(state) {
    const rng = seeded(state, "vampire-goals");
    const pool = VAMPIRE_GOALS.slice();
    const selected = [];
    while (selected.length < 3 && pool.length) selected.push(pool.splice(U.randomInt(rng, 0, pool.length - 1), 1)[0].id);
    return selected;
  }

  function vampireMakerName(state, data) {
    const rng = seeded(state, "maker");
    const origin = U.pick(rng, data.catalogs.origins);
    const first = U.pick(rng, origin.firstNames || ["Avery"]);
    const last = U.pick(rng, origin.lastNames || ["Vale"]);
    return `${first} ${last}`;
  }

  function ensureVampireDetails(game) {
    const s = game.state;
    if (!s.flags.vampire) return;
    s.vampire = Object.assign({
      hunger: 25,
      essence: 75,
      secrecy: 80,
      notoriety: 10,
      ageAtTurning: s.age,
      makerName: vampireMakerName(s, game.data),
      rank: "Newly Turned",
      title: s.profile.identity === "woman" ? "Lady" : "Lord",
      curse: U.pick(seeded(s, "curse"), CURSES).id,
      goals: chooseGoals(s),
      completedGoals: [],
      lockedStat: null,
      powersUnlocked: false,
      huntsAttempted: 0,
      huntsSuccessful: 0,
      progeny: [],
      familiars: [],
      properties: [],
      history: [],
      displayTrueForm: false,
      aristocratForm: U.deepClone(s.profile.avatar),
      trueForm: Object.assign({}, U.deepClone(s.profile.avatar), { vampire: true, eye: "#9b1c31", accent: "#24132f", accessory: "crown" })
    }, s.vampire || {});
    s.vampire.essence = Number.isFinite(s.vampire.essence) ? U.clamp(s.vampire.essence, 0, 100) : U.clamp(100 - (s.vampire.hunger || 25), 0, 100);
    s.vampire.secrecy = Number.isFinite(s.vampire.secrecy) ? U.clamp(s.vampire.secrecy, 0, 100) : 80;
    s.vampire.notoriety = Number.isFinite(s.vampire.notoriety) ? U.clamp(s.vampire.notoriety, 0, 100) : 10;
    s.vampire.goals = Array.isArray(s.vampire.goals) && s.vampire.goals.length ? s.vampire.goals : chooseGoals(s);
    s.vampire.completedGoals = Array.isArray(s.vampire.completedGoals) ? s.vampire.completedGoals : [];
    s.vampire.progeny = Array.isArray(s.vampire.progeny) ? s.vampire.progeny : [];
    s.vampire.familiars = Array.isArray(s.vampire.familiars) ? s.vampire.familiars : [];
    s.vampire.properties = Array.isArray(s.vampire.properties) ? s.vampire.properties : [];
    s.vampire.history = Array.isArray(s.vampire.history) ? s.vampire.history : [];
    s.vampire.aristocratForm = s.vampire.aristocratForm || U.deepClone(s.profile.avatar);
    s.vampire.trueForm = s.vampire.trueForm || Object.assign({}, U.deepClone(s.profile.avatar), { vampire: true, eye: "#9b1c31", accent: "#24132f" });
    s.vampire.hunger = U.clamp(100 - s.vampire.essence, 0, 100);
  }

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV24State() {
    if (previousEnsure) previousEnsure.call(this);
    const s = this.state;
    if (!s) return;
    s.schemaVersion = NC.SCHEMA_VERSION;
    s.stats.looks = Number.isFinite(s.stats.looks) ? U.clamp(s.stats.looks, 0, 100) : U.clamp(Math.round((s.stats.happiness + s.stats.health) / 2), 0, 100);
    s.healthcare = Object.assign({
      surgeryHistory: [],
      procedureCounts: {},
      lastProcedureAge: {},
      suedSurgeons: [],
      malpracticeCases: [],
      surgeonOffers: {},
      genderAffirmingComplete: false,
      appearanceSatisfaction: 50,
      lastFundingLabel: ""
    }, s.healthcare || {});
    s.healthcare.surgeryHistory = Array.isArray(s.healthcare.surgeryHistory) ? s.healthcare.surgeryHistory : [];
    s.healthcare.procedureCounts = s.healthcare.procedureCounts && typeof s.healthcare.procedureCounts === "object" ? s.healthcare.procedureCounts : {};
    s.healthcare.lastProcedureAge = s.healthcare.lastProcedureAge && typeof s.healthcare.lastProcedureAge === "object" ? s.healthcare.lastProcedureAge : {};
    s.healthcare.suedSurgeons = Array.isArray(s.healthcare.suedSurgeons) ? s.healthcare.suedSurgeons : [];
    s.healthcare.malpracticeCases = Array.isArray(s.healthcare.malpracticeCases) ? s.healthcare.malpracticeCases : [];
    s.healthcare.surgeonOffers = s.healthcare.surgeonOffers && typeof s.healthcare.surgeonOffers === "object" ? s.healthcare.surgeonOffers : {};
    s.education.funding = Object.assign({ lastAnnualCost: 0, lifetimeSubsidy: 0 }, s.education.funding || {});
    s.dev = Object.assign({
      surgeryAlwaysSucceeds: false,
      surgeryNoCost: false,
      vampireUnlimitedEssence: false,
      vampireAlwaysSucceeds: false,
      vampireGoalsComplete: false
    }, s.dev || {});
    ensureVampireDetails(this);
  };

  GP.countryPolicy = function countryPolicy() {
    return countryPolicyFromState(this.state, this.data);
  };

  GP.hasLivingParentSponsor = function hasLivingParentSponsor() {
    const s = this.state;
    return s.age < 18 && !s.flags.orphanage && s.relationships.some((person) => person.role === "parent" && person.alive !== false);
  };

  GP.healthcareCost = function healthcareCost(baseCost, kind) {
    this.ensureExpansionState();
    const base = Math.max(0, Number(baseCost) || 0);
    if (kind === "cosmetic") return this.state.dev.surgeryNoCost ? 0 : base;
    if (this.hasLivingParentSponsor()) return 0;
    const policy = this.countryPolicy();
    const multiplier = kind === "essential" || kind === "therapy" ? policy.healthcareCostMultiplier : 1;
    return Math.max(0, Math.round(base * multiplier));
  };

  GP.healthcareFundingLabel = function healthcareFundingLabel(kind) {
    if (kind !== "cosmetic" && this.hasLivingParentSponsor()) return "Paid by parent or guardian";
    const policy = this.countryPolicy();
    if (kind === "cosmetic") return "Elective care is self-funded";
    if (this.state.flags.orphanage && this.state.age < 18) return `${policy.healthcareLabel} · no family sponsor`;
    return policy.healthcareLabel;
  };

  GP.educationAnnualCost = function educationAnnualCost(program) {
    if (!program || ["primary", "secondary"].includes(program.id)) return 0;
    const policy = this.countryPolicy();
    const multiplier = Number.isFinite(policy.collegeCostMultiplier) ? policy.collegeCostMultiplier : 1;
    const tierModifier = program.id === "graduate" ? Math.max(multiplier, .15) : multiplier;
    return Math.max(0, Math.round((program.cost || 0) * tierModifier));
  };

  GP.educationFundingLabel = function educationFundingLabel(program) {
    if (!program || ["primary", "secondary"].includes(program.id)) return "Public school";
    return this.countryPolicy().collegeLabel;
  };

  const previousActivityEstimate = GP.activityOptionEstimate;
  GP.activityOptionEstimate = function activityOptionEstimateV24(centerId, optionId) {
    const center = NC.ACTIVITY_CENTERS && NC.ACTIVITY_CENTERS[centerId];
    const option = center && center.options.find((item) => item.id === optionId);
    if (!option || centerId !== "wellness") return previousActivityEstimate.call(this, centerId, optionId);
    const healthKind = option.effect === "medical" ? "essential" : option.effect === "therapy" ? "therapy" : "wellness";
    const effective = this.healthcareCost(option.cost, healthKind);
    const originalCash = this.state.finances.cash;
    if (effective < option.cost) this.state.finances.cash = Math.max(originalCash, option.cost);
    let result;
    try { result = previousActivityEstimate.call(this, centerId, optionId); }
    finally { this.state.finances.cash = originalCash; }
    if (result) {
      result.cost = effective;
      result.coverageLabel = this.healthcareFundingLabel(healthKind);
      if (result.allowed && originalCash < effective) {
        result.allowed = false;
        result.reason = `Needs ${U.formatMoney(effective, this.state.profile.currency)} after coverage.`;
      } else if (result.allowed) result.reason = result.coverageLabel;
    }
    return result;
  };

  const previousPerformActivity = GP.performDynamicActivity;
  GP.performDynamicActivity = function performDynamicActivityV24(centerId, optionId) {
    const center = NC.ACTIVITY_CENTERS && NC.ACTIVITY_CENTERS[centerId];
    const option = center && center.options.find((item) => item.id === optionId);
    if (!option || centerId !== "wellness") return previousPerformActivity.call(this, centerId, optionId);
    const kind = option.effect === "medical" ? "essential" : option.effect === "therapy" ? "therapy" : "wellness";
    const original = option.cost;
    option.cost = this.healthcareCost(original, kind);
    this.state.healthcare.lastFundingLabel = this.healthcareFundingLabel(kind);
    try { return previousPerformActivity.call(this, centerId, optionId); }
    finally { option.cost = original; }
  };

  const previousProgressEducation = GP.progressEducation;
  GP.progressEducation = function progressEducationV24() {
    this.ensureExpansionState();
    const program = this.currentEducation();
    if (!program) return previousProgressEducation.call(this);
    const originalCost = program.cost;
    const effective = this.educationAnnualCost(program);
    program.cost = effective;
    let result;
    try { result = previousProgressEducation.call(this); }
    finally { program.cost = originalCost; }
    this.state.education.funding.lastAnnualCost = effective;
    this.state.education.funding.lifetimeSubsidy += Math.max(0, originalCost - effective);
    if (originalCost > effective && effective === 0) this.emitLifeUpdateOnce(`tuition:${this.state.year}`, "Your public tuition was covered", `${program.label} charged no tuition this year under the simplified ${this.countryPolicy().collegeLabel.toLocaleLowerCase()} system.`, "🎓", "update-good");
    return result;
  };

  GP.cosmeticProcedure = function cosmeticProcedure(id) {
    return NC.COSMETIC_PROCEDURES.find((item) => item.id === id) || null;
  };

  GP.surgeonOffers = function surgeonOffers(procedureId) {
    this.ensureExpansionState();
    const s = this.state;
    const existing = s.healthcare.surgeonOffers[procedureId];
    if (existing && existing.age === s.age && Array.isArray(existing.doctors)) return existing.doctors;
    const rng = seeded(s, `surgeons:${procedureId}:${s.age}`);
    const procedure = this.cosmeticProcedure(procedureId);
    const doctors = [0, 1].map((index) => {
      const reputation = index === 0 ? U.randomInt(rng, 42, 68) : U.randomInt(rng, 72, 96);
      const priceMultiplier = index === 0 ? U.randomInt(rng, 72, 96) / 100 : U.randomInt(rng, 108, 155) / 100;
      return {
        id: `surgeon_${procedureId}_${s.age}_${index}_${U.randomInt(rng, 1000, 9999)}`,
        name: `Dr. ${U.pick(rng, SURGEON_FIRST)} ${U.pick(rng, SURGEON_LAST)}`,
        reputation,
        cost: Math.round((procedure ? procedure.baseCost : 5000) * priceMultiplier)
      };
    }).sort((a, b) => a.cost - b.cost);
    s.healthcare.surgeonOffers[procedureId] = { age: s.age, doctors };
    return doctors;
  };

  GP.cosmeticEligibility = function cosmeticEligibility(procedureId, surgeonId) {
    this.ensureExpansionState();
    const s = this.state;
    const procedure = this.cosmeticProcedure(procedureId);
    if (!procedure) return { allowed: false, reason: "Procedure not found." };
    if (this.isIncarcerated()) return { allowed: false, reason: "Elective surgery is unavailable in custody." };
    if (s.age < 18 && !s.dev.ignoreActivityAgeLocks) return { allowed: false, reason: "Available at age 18." };
    if (!s.dev.unlimitedActivityPoints && s.activityPoints < 1) return { allowed: false, reason: "Age up for another action." };
    if (procedure.bodyProcedure && s.familyPlanning && s.familyPlanning.pendingPregnancy) return { allowed: false, reason: "Body surgery is unavailable during a pending pregnancy." };
    if (procedure.genderAffirming && s.healthcare.genderAffirmingComplete) return { allowed: false, reason: "This one-time transition procedure is already complete." };
    if (procedure.role === "contribute" && !["contribute", "both"].includes(s.profile.reproductiveRole)) return { allowed: false, reason: "This procedure is not compatible with the current body profile." };
    const count = s.healthcare.procedureCounts[procedureId] || 0;
    const lastAge = s.healthcare.lastProcedureAge[procedureId];
    if (Number.isFinite(procedure.maxUses) && count >= procedure.maxUses) {
      if (!Number.isFinite(lastAge) || s.age - lastAge < procedure.cooldown) return { allowed: false, reason: `Procedure limit reached. Reassessment becomes available after ${procedure.cooldown} years.` };
    }
    const doctors = this.surgeonOffers(procedureId);
    const surgeon = doctors.find((item) => item.id === surgeonId) || doctors[0];
    if (s.healthcare.suedSurgeons.includes(surgeon.id)) return { allowed: false, reason: "This surgeon refuses further appointments after the lawsuit." };
    const cost = this.state.dev.surgeryNoCost ? 0 : surgeon.cost;
    if (s.finances.cash < cost) return { allowed: false, reason: `Needs ${U.formatMoney(cost, s.profile.currency)}.` };
    let chance = surgeon.reputation * .76 + s.stats.health * .19 - procedure.complexity * 30;
    if (s.dev.surgeryAlwaysSucceeds || s.dev.alwaysWin) chance = 100;
    return { allowed: true, reason: "Ready", procedure, surgeon, cost, chance: Math.round(U.clamp(chance, 22, 99)) };
  };

  GP.performCosmeticProcedure = function performCosmeticProcedure(procedureId, surgeonId, targetIdentity) {
    this.assertFree("Cosmetic surgery");
    const check = this.cosmeticEligibility(procedureId, surgeonId);
    if (!check.allowed) throw new Error(check.reason);
    const s = this.state;
    const { procedure, surgeon, cost, chance } = check;
    s.finances.cash -= cost;
    if (!s.dev.unlimitedActivityPoints) s.activityPoints -= 1;
    const success = s.dev.surgeryAlwaysSucceeds || s.dev.alwaysWin || U.random(s.rng) < chance / 100;
    const record = { id: U.uid("surgery"), age: s.age, procedureId, procedureLabel: procedure.label, surgeonId: surgeon.id, surgeonName: surgeon.name, reputation: surgeon.reputation, cost, chance, success, outcome: success ? "successful" : "complication" };
    s.healthcare.surgeryHistory.unshift(record);
    s.healthcare.procedureCounts[procedureId] = (s.healthcare.procedureCounts[procedureId] || 0) + 1;
    s.healthcare.lastProcedureAge[procedureId] = s.age;
    if (success) {
      const gain = U.randomInt(s.rng, procedure.lookGain[0], procedure.lookGain[1]);
      s.stats.looks = U.clamp(s.stats.looks + gain, 0, 100);
      s.healthcare.appearanceSatisfaction = U.clamp(s.healthcare.appearanceSatisfaction + U.randomInt(s.rng, 4, 11), 0, 100);
      s.stats.happiness = U.clamp(s.stats.happiness + U.randomInt(s.rng, 1, 5), 0, 100);
      if (procedure.genderAffirming) {
        const identity = ["woman", "man", "nonbinary"].includes(targetIdentity) ? targetIdentity : s.profile.identity;
        s.profile.identity = identity;
        s.profile.pronouns = U.pronouns(identity).label;
        s.profile.avatar.identity = identity;
        s.healthcare.genderAffirmingComplete = true;
      }
      this.log(`${procedure.label} completed`, `${surgeon.name} completes the procedure successfully. Appearance satisfaction and the game Looks statistic improve.`, "milestone", procedure.icon);
      this.emitLifeUpdateOnce(`surgery:${record.id}`, `${procedure.label} went well`, `${surgeon.name} completed the procedure successfully.`, procedure.icon, "update-good");
    } else {
      const severity = U.randomInt(s.rng, 1, 100);
      const looksLoss = severity > 75 ? U.randomInt(s.rng, 18, 35) : U.randomInt(s.rng, 6, 18);
      s.stats.looks = U.clamp(s.stats.looks - looksLoss, 0, 100);
      s.stats.happiness = U.clamp(s.stats.happiness - U.randomInt(s.rng, 5, 16), 0, 100);
      s.stats.health = U.clamp(s.stats.health - U.randomInt(s.rng, 4, severity > 75 ? 24 : 13), 0, 100);
      record.severity = severity;
      record.canSue = true;
      this.log(`${procedure.label} had complications`, `${surgeon.name}'s procedure does not go as planned. Your health, happiness, and Looks statistic are affected.`, "bad", "⚕️");
      if (severity > 96 && !s.dev.surgeryAlwaysSucceeds) {
        this.die("rare complications from an elective medical procedure", false);
      }
    }
    this.touch("cosmetic-procedure");
    return record;
  };

  GP.sueCosmeticSurgeon = function sueCosmeticSurgeon(recordId) {
    this.assertFree("Malpractice claim");
    this.ensureExpansionState();
    const s = this.state;
    const record = s.healthcare.surgeryHistory.find((item) => item.id === recordId);
    if (!record || !record.canSue || record.lawsuitFiled) throw new Error("No eligible malpractice claim was found.");
    if (!s.dev.unlimitedActivityPoints && s.activityPoints < 1) throw new Error("Age up for another action.");
    if (!s.dev.unlimitedActivityPoints) s.activityPoints -= 1;
    record.lawsuitFiled = true;
    s.healthcare.suedSurgeons.push(record.surgeonId);
    const winChance = U.clamp(44 + (100 - record.reputation) * .35 + (record.severity || 50) * .25 + s.stats.knowledge * .12, 20, 92);
    const won = s.dev.alwaysWin || U.random(s.rng) < winChance / 100;
    const payout = won ? Math.round(record.cost * (1.2 + U.random(s.rng) * 2.3)) : 0;
    if (payout) s.finances.cash += payout;
    s.healthcare.malpracticeCases.unshift({ age: s.age, recordId, surgeonId: record.surgeonId, won, payout });
    this.log(won ? "Malpractice claim succeeded" : "Malpractice claim dismissed", won ? `The civil claim succeeds and awards ${U.formatMoney(payout, s.profile.currency)}.` : "The court does not award compensation.", won ? "money" : "neutral", "⚖️");
    this.touch("surgery-lawsuit");
    return { won, payout, chance: Math.round(winChance) };
  };

  GP.vampireGoalStatus = function vampireGoalStatus() {
    this.ensureExpansionState();
    if (!this.state.flags.vampire) return [];
    const s = this.state;
    return s.vampire.goals.map((id) => {
      const goal = VAMPIRE_GOALS.find((item) => item.id === id);
      const complete = goal ? goal.check(s) : false;
      if (complete && !s.vampire.completedGoals.includes(id)) s.vampire.completedGoals.push(id);
      return { id, label: goal ? goal.label : id, complete };
    });
  };

  GP.updateVampireLordRank = function updateVampireLordRank() {
    if (!this.state.flags.vampire) return false;
    const status = this.vampireGoalStatus();
    const v = this.state.vampire;
    if ((status.every((goal) => goal.complete) || this.state.dev.vampireGoalsComplete) && v.rank !== "Vampire Lord") {
      v.rank = "Vampire Lord";
      v.notoriety = 100;
      v.powersUnlocked = true;
      this.emitLifeUpdateOnce(`vampire-lord:${this.state.year}`, `${v.title} ${this.state.profile.lastName} became a Vampire Lord`, "The Maker's three trials are complete, the blood curse breaks, and dominance abilities unlock.", "👑", "update-good");
      return true;
    }
    return false;
  };

  GP.vampireChooseLockedStat = function vampireChooseLockedStat(stat) {
    this.assertFree("Vampiric power");
    this.ensureExpansionState();
    const allowed = ["health", "happiness", "knowledge", "resilience", "looks"];
    if (!this.state.flags.vampire) throw new Error("Only vampires can use vampiric powers.");
    if (!allowed.includes(stat)) throw new Error("Choose a valid statistic.");
    this.state.vampire.lockedStat = stat;
    this.state.stats[stat] = 100;
    this.log("Vampiric power chosen", `${U.cap(stat)} is now held at 100% by supernatural power.`, "milestone", "🩸");
    this.touch("vampire-power");
  };

  GP.vampireSetTitle = function vampireSetTitle(title) {
    this.ensureExpansionState();
    if (!this.state.flags.vampire) throw new Error("Only vampires use noble titles.");
    this.state.vampire.title = title === "Lady" ? "Lady" : "Lord";
    this.touch("vampire-title");
  };

  GP.vampireToggleForm = function vampireToggleForm() {
    this.ensureExpansionState();
    if (!this.state.flags.vampire) throw new Error("Only vampires have a true form.");
    const v = this.state.vampire;
    v.displayTrueForm = !v.displayTrueForm;
    this.state.profile.avatar = U.deepClone(v.displayTrueForm ? v.trueForm : v.aristocratForm);
    this.state.profile.avatar.vampire = true;
    this.touch("vampire-form");
  };

  GP.vampireRandomizeTrueForm = function vampireRandomizeTrueForm() {
    this.ensureExpansionState();
    if (!this.state.flags.vampire) throw new Error("Only vampires have a true form.");
    const rng = seeded(this.state, `true-form:${this.state.age}:${this.state.vampire.history.length}`);
    const v = this.state.vampire;
    v.trueForm = Object.assign({}, U.deepClone(v.trueForm), {
      vampire: true,
      eye: U.pick(rng, ["#9b1c31", "#ff2d55", "#d8b4fe", "#f59e0b", "#f8fafc"]),
      accent: U.pick(rng, ["#24132f", "#3f0d1d", "#111827", "#312e81", "#4c1d1d"]),
      hair: U.pick(rng, ["#0f0f10", "#3a1722", "#d1d5db", "#4a3028", "#5b2147"]),
      style: U.pick(rng, ["short", "long", "curly"]),
      accessory: U.pick(rng, ["none", "crown", "earrings"])
    });
    if (v.displayTrueForm) this.state.profile.avatar = U.deepClone(v.trueForm);
    this.touch("vampire-form-customized");
  };

  GP.vampireHunt = function vampireHunt(locationId, tactic) {
    this.assertFree("Vampire hunting");
    this.ensureExpansionState();
    const s = this.state;
    if (!s.flags.vampire) throw new Error("Only vampires can hunt for essence.");
    if (!s.dev.unlimitedActivityPoints && s.activityPoints < 1) throw new Error("Age up for another action.");
    const location = NC.VAMPIRE_HUNT_LOCATIONS.find((item) => item.id === locationId) || NC.VAMPIRE_HUNT_LOCATIONS[0];
    const tacticBonus = tactic === "befriend" ? 12 : tactic === "entice" ? 7 : 0;
    let chance = 58 + s.stats.resilience * .18 + s.vampire.secrecy * .12 - location.risk + tacticBonus;
    if (s.dev.vampireAlwaysSucceeds || s.dev.alwaysWin) chance = 100;
    if (!s.dev.unlimitedActivityPoints) s.activityPoints -= 1;
    s.vampire.huntsAttempted += 1;
    const success = U.random(s.rng) < U.clamp(chance, 8, 98) / 100;
    let text;
    if (success) {
      const gain = U.randomInt(s.rng, Math.max(10, location.reward - 8), location.reward + 8);
      s.vampire.essence = U.clamp(s.vampire.essence + gain, 0, 100);
      s.vampire.secrecy = U.clamp(s.vampire.secrecy - U.randomInt(s.rng, 0, Math.max(2, Math.floor(location.risk / 8))), 0, 100);
      s.vampire.notoriety = U.clamp(s.vampire.notoriety + U.randomInt(s.rng, 2, 8), 0, 100);
      s.vampire.huntsSuccessful += 1;
      text = `The ${location.label.toLocaleLowerCase()} hunt succeeds without graphic violence. Essence rises by ${gain}%.`;
      this.log("A successful night hunt", text, "milestone", "🌙");
    } else {
      s.vampire.secrecy = U.clamp(s.vampire.secrecy - U.randomInt(s.rng, 5, 16), 0, 100);
      s.vampire.essence = U.clamp(s.vampire.essence - U.randomInt(s.rng, 2, 8), 0, 100);
      const threat = U.random(s.rng) < .45 ? "a rival vampire" : "a vampire hunter";
      text = `The hunt fails and ${threat} notices suspicious activity. You escape, but secrecy falls.`;
      this.log("A dangerous night encounter", text, "bad", "⚠️");
    }
    s.vampire.hunger = 100 - s.vampire.essence;
    s.vampire.history.unshift({ age: s.age, kind: "hunt", location: location.id, tactic, success, text });
    this.updateVampireLordRank();
    this.touch("vampire-hunt");
    return { success, chance: Math.round(U.clamp(chance, 8, 98)), text };
  };

  GP.vampireEligibleTargets = function vampireEligibleTargets() {
    return this.state.relationships.filter((person) => person.alive !== false && person.age >= 18 && ["partner", "fiance", "spouse", "child"].includes(person.role));
  };

  GP.vampireTurnPerson = function vampireTurnPerson(personId) {
    this.assertFree("Create progeny");
    this.ensureExpansionState();
    const s = this.state;
    if (!s.flags.vampire) throw new Error("Only vampires can create progeny.");
    const person = this.vampireEligibleTargets().find((item) => item.id === personId);
    if (!person) throw new Error("Choose an adult partner, spouse, or child.");
    if (person.occult === "vampire") throw new Error("That person is already a vampire.");
    if (!s.dev.unlimitedActivityPoints && s.activityPoints < 1) throw new Error("Age up for another action.");
    if (s.vampire.essence < 30 && !s.dev.vampireUnlimitedEssence) throw new Error("At least 30% essence is required.");
    if (!s.dev.unlimitedActivityPoints) s.activityPoints -= 1;
    let chance = 32 + person.closeness * .5 + s.vampire.notoriety * .15;
    if (s.dev.vampireAlwaysSucceeds || s.dev.alwaysWin) chance = 100;
    const success = U.random(s.rng) < U.clamp(chance, 10, 96) / 100;
    if (!s.dev.vampireUnlimitedEssence) s.vampire.essence = U.clamp(s.vampire.essence - 24, 0, 100);
    if (success) {
      person.occult = "vampire";
      person.avatar = Object.assign({}, person.avatar || {}, { vampire: true });
      s.vampire.progeny.push({ personId: person.id, name: `${person.firstName} ${person.lastName}`, ageTurned: s.age });
      this.log("A new immortal joins the lineage", `${person.firstName} accepts the transformation and becomes your progeny.`, "relationship", "🦇");
    } else {
      person.closeness = U.clamp(person.closeness - 12, 0, 100);
      this.log("The transformation was refused", `${person.firstName} rejects the offer and needs time to rebuild trust.`, "neutral", "🌑");
    }
    s.vampire.hunger = 100 - s.vampire.essence;
    this.updateVampireLordRank();
    this.touch("vampire-progeny");
    return { success, chance: Math.round(U.clamp(chance, 10, 96)) };
  };

  GP.vampireRecruitFamiliar = function vampireRecruitFamiliar() {
    this.assertFree("Recruit familiar");
    this.ensureExpansionState();
    const s = this.state;
    if (!s.flags.vampire) throw new Error("Only vampires can recruit familiars.");
    if (!s.dev.unlimitedActivityPoints && s.activityPoints < 1) throw new Error("Age up for another action.");
    if (s.vampire.familiars.length >= 3) throw new Error("The household already has three familiars.");
    if (!s.dev.unlimitedActivityPoints) s.activityPoints -= 1;
    const person = this.randomPerson("friend", { identity: U.pick(s.rng, ["woman", "man", "nonbinary"]) });
    s.vampire.familiars.push({ id: U.uid("familiar"), name: `${person.firstName} ${person.lastName}`, years: 0, loyalty: U.randomInt(s.rng, 48, 78), wantsTurning: false });
    this.log("A familiar joins the household", `${person.firstName} agrees to serve as a trusted human aide.`, "relationship", "🕯️");
    this.touch("vampire-familiar");
  };

  GP.vampireFamiliarAction = function vampireFamiliarAction(familiarId, action) {
    this.assertFree("Familiar interaction");
    this.ensureExpansionState();
    const f = this.state.vampire.familiars.find((item) => item.id === familiarId);
    if (!f) throw new Error("Familiar not found.");
    if (!this.state.dev.unlimitedActivityPoints && this.state.activityPoints < 1) throw new Error("Age up for another action.");
    if (!this.state.dev.unlimitedActivityPoints) this.state.activityPoints -= 1;
    if (action === "promise") { f.loyalty = U.clamp(f.loyalty + 10, 0, 100); f.wantsTurning = true; }
    else if (action === "wait") { f.loyalty = U.clamp(f.loyalty - 2, 0, 100); }
    else if (action === "threaten") { f.loyalty = U.clamp(f.loyalty - 14, 0, 100); this.state.vampire.notoriety = U.clamp(this.state.vampire.notoriety + 5, 0, 100); }
    this.touch("vampire-familiar-action");
  };

  GP.vampireHypnotize = function vampireHypnotize() {
    this.assertFree("Hypnotize suspicion away");
    this.ensureExpansionState();
    const s = this.state;
    if (!s.flags.vampire) throw new Error("Only vampires can hypnotize.");
    if (s.vampire.essence < 20 && !s.dev.vampireUnlimitedEssence) throw new Error("At least 20% essence is required.");
    if (!s.dev.unlimitedActivityPoints && s.activityPoints < 1) throw new Error("Age up for another action.");
    if (!s.dev.unlimitedActivityPoints) s.activityPoints -= 1;
    if (!s.dev.vampireUnlimitedEssence) s.vampire.essence -= 20;
    s.vampire.secrecy = U.clamp(s.vampire.secrecy + 18, 0, 100);
    if (s.crime) s.crime.heat = Math.max(0, (s.crime.heat || 0) - 25);
    s.vampire.hunger = 100 - s.vampire.essence;
    this.log("Suspicion faded", "A brief supernatural suggestion makes witnesses doubt what they noticed.", "milestone", "🌀");
    this.touch("vampire-hypnotize");
  };

  GP.buyVampireProperty = function buyVampireProperty(propertyId) {
    this.assertFree("Vampire property");
    this.ensureExpansionState();
    const s = this.state;
    if (!s.flags.vampire) throw new Error("Only vampires can buy vampire properties.");
    const property = NC.VAMPIRE_PROPERTIES.find((item) => item.id === propertyId);
    if (!property) throw new Error("Property not found.");
    if (s.vampire.properties.some((item) => item.id === propertyId)) throw new Error("You already own that property type.");
    if (s.finances.cash < property.cost) throw new Error(`Needs ${U.formatMoney(property.cost, s.profile.currency)}.`);
    s.finances.cash -= property.cost;
    s.vampire.properties.push(Object.assign({}, property, { boughtAge: s.age, value: property.cost }));
    s.vampire.secrecy = U.clamp(s.vampire.secrecy + property.secrecy, 0, 100);
    this.log(`Bought ${property.label.toLocaleLowerCase()}`, "The secluded property adds secure resting space and strengthens secrecy.", "money", property.icon);
    this.updateVampireLordRank();
    this.touch("vampire-property");
  };

  GP.vampireRest = function vampireRest(propertyId) {
    this.assertFree("Vampire rest");
    this.ensureExpansionState();
    const property = this.state.vampire.properties.find((item) => item.id === propertyId);
    if (!property) throw new Error("You do not own that vampire property.");
    if (!this.state.dev.unlimitedActivityPoints && this.state.activityPoints < 1) throw new Error("Age up for another action.");
    if (!this.state.dev.unlimitedActivityPoints) this.state.activityPoints -= 1;
    this.state.vampire.essence = U.clamp(this.state.vampire.essence + property.essence, 0, 100);
    this.state.vampire.secrecy = U.clamp(this.state.vampire.secrecy + 3, 0, 100);
    this.state.vampire.hunger = 100 - this.state.vampire.essence;
    this.log(`Rested in the ${property.label.toLocaleLowerCase()}`, "The secure retreat restores composure and a little essence.", "neutral", property.icon);
    this.touch("vampire-rest");
  };

  const previousFamilyEstimate = GP.familyMethodEstimate;
  GP.familyMethodEstimate = function familyMethodEstimateV24(methodId) {
    if (this.state && this.state.flags && this.state.flags.vampire && methodId !== "adoption") {
      return { allowed: false, reason: "Biological family-building is unavailable after becoming a vampire. Adoption remains available.", chance: 0, cost: (NC.FAMILY_METHODS[methodId] || {}).cost || 0 };
    }
    return previousFamilyEstimate.call(this, methodId);
  };

  const previousAgeUp = GP.ageUp;
  GP.ageUp = function ageUpV24() {
    const before = this.state && this.state.age;
    const result = previousAgeUp.call(this);
    const s = this.state;
    if (s && s.alive && s.age !== before) {
      this.ensureExpansionState();
      if (s.flags.vampire) {
        const v = s.vampire;
        const curse = CURSES.find((item) => item.id === v.curse) || CURSES[0];
        const drain = s.dev.vampireUnlimitedEssence ? 0 : U.randomInt(s.rng, curse.id === "thirst" ? 14 : 8, curse.id === "thirst" ? 22 : 16);
        v.essence = U.clamp(v.essence - drain, 0, 100);
        v.hunger = 100 - v.essence;
        v.familiars.forEach((f) => { f.years += 1; if (f.years >= 3 && U.random(s.rng) < .32) f.wantsTurning = true; });
        if (v.essence < 20) {
          s.stats.health = U.clamp(s.stats.health - 8, 0, 100);
          s.stats.happiness = U.clamp(s.stats.happiness - (curse.id === "restless" ? 9 : 5), 0, 100);
          v.secrecy = U.clamp(v.secrecy - 5, 0, 100);
          this.emitLifeUpdateOnce(`vampire-low:${s.year}`, "Your essence is dangerously low", "Vampiric powers weaken until you restore essence through supernatural activities.", "🩸", "update-bad");
        }
        if (v.lockedStat) s.stats[v.lockedStat] = 100;
        if (v.displayTrueForm) s.profile.avatar = U.deepClone(v.trueForm);
        else s.profile.avatar = U.deepClone(v.aristocratForm);
        s.profile.avatar.vampire = true;
        this.updateVampireLordRank();
      }
      this.touch("v24-age-up");
    }
    return result;
  };

  const previousPassive = GP.passiveWellbeing;
  GP.passiveWellbeing = function passiveWellbeingV24() {
    previousPassive.call(this);
    if (this.state.flags.vampire && this.state.vampire && this.state.vampire.lockedStat) this.state.stats[this.state.vampire.lockedStat] = 100;
  };

  GP.devMaxV24Systems = function devMaxV24Systems() {
    this.ensureExpansionState();
    const s = this.state;
    s.stats.looks = 100;
    s.healthcare.appearanceSatisfaction = 100;
    s.dev.surgeryAlwaysSucceeds = true;
    s.dev.surgeryNoCost = true;
    if (s.flags.vampire) {
      s.vampire.essence = 100;
      s.vampire.secrecy = 100;
      s.vampire.notoriety = 100;
      s.vampire.rank = "Vampire Lord";
      s.vampire.powersUnlocked = true;
      s.dev.vampireUnlimitedEssence = true;
      s.dev.vampireAlwaysSucceeds = true;
      s.dev.vampireGoalsComplete = true;
    }
    this.touch("dev-max-v24");
  };

  GP.devClearCosmeticHistory = function devClearCosmeticHistory() {
    this.ensureExpansionState();
    this.state.healthcare.surgeryHistory = [];
    this.state.healthcare.procedureCounts = {};
    this.state.healthcare.lastProcedureAge = {};
    this.state.healthcare.suedSurgeons = [];
    this.state.healthcare.malpracticeCases = [];
    this.state.healthcare.genderAffirmingComplete = false;
    this.touch("dev-clear-surgery");
  };

  NC.v24Curse = function v24Curse(id) { return CURSES.find((item) => item.id === id) || CURSES[0]; };
  NC.v24VampireGoal = function v24VampireGoal(id) { return VAMPIRE_GOALS.find((item) => item.id === id) || null; };
})(window);
