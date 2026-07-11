(function installNextChapterV19(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine && NC.GameEngine.prototype;

  NC.APP_VERSION = "1.9.0";
  NC.SCHEMA_VERSION = Math.max(NC.SCHEMA_VERSION || 1, 10);

  NC.REPRODUCTIVE_ROLES = {
    carry: { id: "carry", label: "Can carry a pregnancy", description: "Uses the carrying-age fertility curve." },
    contribute: { id: "contribute", label: "Can contribute genetic material", description: "Uses the contributing-age fertility curve." },
    both: { id: "both", label: "Can carry or contribute", description: "Uses the best compatible role for each family-building route." },
    assisted: { id: "assisted", label: "Assisted routes only", description: "Natural attempts are unavailable; medical, surrogacy, and adoption routes remain available." }
  };

  NC.CONTRACEPTION = {
    none: { id: "none", label: "None", multiplier: 1, description: "No reduction to natural attempt chance." },
    barrier: { id: "barrier", label: "Barrier protection", multiplier: 0.15, description: "Strongly reduces the chance of a natural pregnancy." },
    pill: { id: "pill", label: "Hormonal contraception", multiplier: 0.04, description: "Very strongly reduces the chance of a natural pregnancy." },
    implant: { id: "implant", label: "Long-acting contraception", multiplier: 0.01, description: "Reduces the natural attempt chance to around one percent of its usual value." }
  };

  NC.FAMILY_METHODS = {
    natural: { id: "natural", label: "Try naturally", icon: "💞", cost: 0, requiresPartner: true, type: "biological" },
    iui: { id: "iui", label: "Artificial insemination", icon: "🧬", cost: 2400, requiresPartner: false, type: "medical" },
    ivf: { id: "ivf", label: "IVF treatment", icon: "🧫", cost: 9200, requiresPartner: false, type: "medical" },
    surrogacy: { id: "surrogacy", label: "Surrogacy arrangement", icon: "🤝", cost: 26000, requiresPartner: false, type: "surrogacy" },
    adoption: { id: "adoption", label: "Adoption application", icon: "🧸", cost: 5200, requiresPartner: false, type: "adoption" }
  };

  function defaultRole(identity) {
    if (identity === "woman") return "carry";
    if (identity === "man") return "contribute";
    return "assisted";
  }

  function carryingCurve(age) {
    if (age < 18) return 0;
    if (age <= 24) return 92;
    if (age <= 29) return 86;
    if (age <= 34) return 74;
    if (age <= 39) return 52;
    if (age <= 44) return 24;
    if (age <= 49) return 6;
    return 0;
  }

  function contributingCurve(age) {
    if (age < 18) return 0;
    if (age <= 34) return 92;
    if (age <= 44) return 86;
    if (age <= 54) return 74;
    if (age <= 64) return 58;
    if (age <= 74) return 38;
    if (age <= 84) return 18;
    if (age <= 89) return 6;
    return 0;
  }

  function roleSupportsCarry(role) { return role === "carry" || role === "both"; }
  function roleSupportsContribute(role) { return role === "contribute" || role === "both"; }

  U.personTemplate = function personTemplate(text, state, person, extra) {
    const p = U.pronouns(person && person.identity || "nonbinary");
    return U.template(text, state, Object.assign({
      personFirstName: person && person.firstName || "They",
      personLastName: person && person.lastName || "",
      personSubject: p.subject,
      PersonSubject: U.cap(p.subject),
      personObject: p.object,
      personPossessive: p.possessive,
      personReflexive: p.reflexive,
      personNoun: person && person.age < 18 ? p.childNoun : p.noun
    }, extra || {}));
  };

  if (!GP) return;

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV19State() {
    if (previousEnsure) previousEnsure.call(this);
    const s = this.state;
    if (!s) return;
    s.schemaVersion = NC.SCHEMA_VERSION;
    s.profile.reproductiveRole = NC.REPRODUCTIVE_ROLES[s.profile.reproductiveRole]
      ? s.profile.reproductiveRole
      : defaultRole(s.profile.identity);
    s.familyPlanning = Object.assign({
      contraception: "none",
      attempts: 0,
      successfulBirths: 0,
      failedAttempts: 0,
      medicalAttempts: 0,
      surrogacyAttempts: 0,
      adoptionApplications: 0,
      pendingPregnancy: null,
      lastEstimate: null,
      history: []
    }, s.familyPlanning || {});
    if (!NC.CONTRACEPTION[s.familyPlanning.contraception]) s.familyPlanning.contraception = "none";
    s.familyPlanning.history = Array.isArray(s.familyPlanning.history) ? s.familyPlanning.history : [];
    s.social = Object.assign({ followers: 0, posts: 0, clubYears: 0, movieVisits: 0, vacations: 0, pets: 0 }, s.social || {});
    s.dev = Object.assign({ alwaysFertilitySuccess: false, ignoreActivityAgeLocks: false }, s.dev || {});
    s.relationships.forEach((person) => {
      person.reproductiveRole = NC.REPRODUCTIVE_ROLES[person.reproductiveRole]
        ? person.reproductiveRole
        : defaultRole(person.identity);
    });
    s.familyPlanning.fertilityMetric = this.biologicalSuccessMetric(s);
  };

  const previousCreateCharacter = GP.createCharacter;
  GP.createCharacter = function createV19Character(input) {
    const state = previousCreateCharacter.call(this, input);
    state.profile.reproductiveRole = NC.REPRODUCTIVE_ROLES[input.reproductiveRole]
      ? input.reproductiveRole
      : defaultRole(state.profile.identity);
    this.ensureExpansionState();
    this.touch("v1.9-character-created");
    return state;
  };

  const previousRandomPerson = GP.randomPerson;
  GP.randomPerson = function randomV19Person(role, options) {
    const person = previousRandomPerson.call(this, role, options);
    person.reproductiveRole = NC.REPRODUCTIVE_ROLES[person.reproductiveRole]
      ? person.reproductiveRole
      : defaultRole(person.identity);
    return person;
  };

  GP.biologicalSuccessMetric = function biologicalSuccessMetric(subject, forcedRole) {
    const s = this.state;
    const isMain = !subject || subject === s;
    const age = isMain ? s.age : Number(subject.age || 0);
    const health = isMain ? Number(s.stats.health || 0) : Number(subject.health || 65);
    const role = forcedRole || (isMain ? s.profile.reproductiveRole : subject.reproductiveRole) || defaultRole(isMain ? s.profile.identity : subject.identity);
    if (age < 18 || role === "assisted") return 0;
    let base;
    if (role === "carry") base = carryingCurve(age);
    else if (role === "contribute") base = contributingCurve(age);
    else base = Math.max(carryingCurve(age), contributingCurve(age));
    const healthMultiplier = U.clamp(0.45 + health / 180, 0.35, 1.05);
    const occultMultiplier = isMain && s.flags && s.flags.wizard ? 1.08 : 1;
    return Math.round(U.clamp(base * healthMultiplier * occultMultiplier, 0, 100));
  };

  GP.currentPartnerForFamily = function currentPartnerForFamily() {
    return this.state.relationships.find((person) => person.alive !== false && ["partner", "fiance", "spouse"].includes(person.role)) || null;
  };

  GP.familyMethodEstimate = function familyMethodEstimate(methodId) {
    this.ensureExpansionState();
    const s = this.state;
    const method = NC.FAMILY_METHODS[methodId];
    if (!method) return { allowed: false, reason: "Unknown family-building route.", chance: 0, cost: 0 };
    if (this.isIncarcerated()) return { allowed: false, reason: "Family-building activities are unavailable while incarcerated.", chance: 0, cost: method.cost };
    if (s.age < 18 && !s.dev.ignoreActivityAgeLocks) return { allowed: false, reason: "Available at age 18.", chance: 0, cost: method.cost };
    if (s.familyPlanning.pendingPregnancy) return { allowed: false, reason: "A family-building process is already in progress.", chance: 0, cost: method.cost };
    if (s.activityPoints < 1) return { allowed: false, reason: "Age up for more actions.", chance: 0, cost: method.cost };
    if (s.finances.cash < method.cost) return { allowed: false, reason: `Needs ${U.formatMoney(method.cost, s.profile.currency)}.`, chance: 0, cost: method.cost };

    const selfRole = s.profile.reproductiveRole;
    const selfMetric = this.biologicalSuccessMetric(s);
    const partner = this.currentPartnerForFamily();
    let chance = 0;
    let reason = "";

    if (methodId === "natural") {
      if (!partner) return { allowed: false, reason: "A partner is required for this route.", chance: 0, cost: 0 };
      const partnerRole = partner.reproductiveRole || defaultRole(partner.identity);
      const compatible = (roleSupportsCarry(selfRole) && roleSupportsContribute(partnerRole)) || (roleSupportsContribute(selfRole) && roleSupportsCarry(partnerRole));
      if (!compatible) return { allowed: false, reason: "The selected reproductive roles require an assisted route.", chance: 0, cost: 0, partner };
      const selfUseRole = roleSupportsCarry(selfRole) && roleSupportsContribute(partnerRole) ? "carry" : "contribute";
      const partnerUseRole = selfUseRole === "carry" ? "contribute" : "carry";
      const a = this.biologicalSuccessMetric(s, selfUseRole);
      const b = this.biologicalSuccessMetric(partner, partnerUseRole);
      const contraception = NC.CONTRACEPTION[s.familyPlanning.contraception] || NC.CONTRACEPTION.none;
      chance = Math.round(U.clamp(Math.sqrt(a * b) * 0.42 * contraception.multiplier, 0, 94));
      reason = contraception.id === "none" ? "Based on both characters' age and health." : `${contraception.label} reduces the normal chance.`;
    } else if (methodId === "iui") {
      const carryMetric = roleSupportsCarry(selfRole) ? this.biologicalSuccessMetric(s, "carry") : 76;
      chance = Math.round(U.clamp(12 + carryMetric * 0.55, 5, 70));
      reason = "Uses an assisted donor or partner route and the carrying-health score.";
    } else if (methodId === "ivf") {
      const carryMetric = roleSupportsCarry(selfRole) ? this.biologicalSuccessMetric(s, "carry") : 80;
      chance = Math.round(U.clamp(20 + carryMetric * 0.72, 12, 86));
      reason = "A stronger medical intervention with a higher cost and success ceiling.";
    } else if (methodId === "surrogacy") {
      chance = Math.round(U.clamp(74 + s.stats.knowledge / 10 + Math.min(6, this.netWorth() / 500000), 65, 92));
      reason = "Includes screening, a contract, and a separate gestational carrier.";
    } else if (methodId === "adoption") {
      const stableIncome = s.finances.annualIncome >= 24000 || this.netWorth() >= 50000;
      if (s.crime.convictions > 0 && !s.dev.alwaysWin) return { allowed: false, reason: "A clean criminal record is required for this adoption program.", chance: 0, cost: method.cost };
      if (!stableIncome && !s.dev.alwaysWin) return { allowed: false, reason: "The agency requires stable income or sufficient savings.", chance: 0, cost: method.cost };
      chance = Math.round(U.clamp(72 + s.stats.resilience / 8 + Math.min(8, this.netWorth() / 250000), 68, 96));
      reason = "Based on legal record, financial stability, health, and home readiness.";
    }

    if (s.dev.alwaysFertilitySuccess || s.dev.alwaysWin) chance = 100;
    return { allowed: true, reason, chance, cost: method.cost, partner, selfMetric };
  };

  GP.setContraception = function setContraception(id) {
    this.assertFree("Contraception settings");
    if (!NC.CONTRACEPTION[id]) throw new Error("Choose a valid option.");
    this.ensureExpansionState();
    this.state.familyPlanning.contraception = id;
    this.log("Family-planning setting changed", `You set contraception to ${NC.CONTRACEPTION[id].label.toLocaleLowerCase()}.`, "neutral", "🛡️");
    this.touch("contraception-changed");
  };

  GP.addPendingFamily = function addPendingFamily(methodId, estimate) {
    const s = this.state;
    const partner = estimate.partner;
    const method = NC.FAMILY_METHODS[methodId];
    s.familyPlanning.pendingPregnancy = {
      id: U.uid("family"),
      method: methodId,
      methodLabel: method.label,
      startedAge: s.age,
      dueAge: s.age + 1,
      partnerId: partner ? partner.id : null,
      chance: estimate.chance,
      surrogateName: methodId === "surrogacy" ? U.pick(s.rng, ["Elena", "Maya", "Sofia", "Nora", "Camille", "Avery"]) : null
    };
    const partnerText = partner
      ? U.personTemplate(" {personFirstName} says {personSubject} feels hopeful about the next year.", s, partner)
      : " The clinic schedules careful follow-up for the next year.";
    this.log("A family-building attempt succeeded", `${method.label} leads to a pregnancy.${partnerText}`, "relationship", method.icon);
  };

  GP.familyPlanningAction = function familyPlanningAction(methodId) {
    this.assertFree("Family planning");
    const s = this.state;
    const method = NC.FAMILY_METHODS[methodId];
    const estimate = this.familyMethodEstimate(methodId);
    if (!estimate.allowed) throw new Error(estimate.reason);

    s.finances.cash -= method.cost;
    s.activityPoints -= 1;
    s.metrics.totalActions += 1;
    s.familyPlanning.attempts += 1;
    if (method.type === "medical") s.familyPlanning.medicalAttempts += 1;
    if (method.type === "surrogacy") s.familyPlanning.surrogacyAttempts += 1;
    if (method.type === "adoption") s.familyPlanning.adoptionApplications += 1;

    // Surrogacy has a small chance of a non-graphic legal or scheduling complication.
    if (methodId === "surrogacy" && !s.dev.alwaysFertilitySuccess && !s.dev.alwaysWin) {
      const complication = U.random(s.rng);
      if (complication < 0.08) {
        const refund = Math.round(method.cost * 0.55);
        s.finances.cash += refund;
        s.familyPlanning.failedAttempts += 1;
        s.familyPlanning.history.push({ age: s.age, method: methodId, result: "contract_dispute", chance: estimate.chance });
        this.log("Surrogacy contract delayed", `A contract dispute pauses the arrangement. After partial refunds, the net cost is ${U.formatMoney(method.cost - refund, s.profile.currency)}.`, "bad", "📄");
        this.touch("surrogacy-dispute");
        return false;
      }
      if (complication < 0.14) {
        s.familyPlanning.failedAttempts += 1;
        s.familyPlanning.history.push({ age: s.age, method: methodId, result: "medical_delay", chance: estimate.chance });
        this.log("Surrogacy cycle postponed", "A routine medical screening means the process must be postponed. No graphic details are shown, and the clinic recommends trying again later.", "neutral", "🩺");
        this.touch("surrogacy-delay");
        return false;
      }
    }

    const success = s.dev.alwaysFertilitySuccess || s.dev.alwaysWin || U.random(s.rng) < estimate.chance / 100;
    s.familyPlanning.lastEstimate = { age: s.age, method: methodId, chance: estimate.chance };
    s.familyPlanning.history.push({ age: s.age, method: methodId, result: success ? "success" : "failed", chance: estimate.chance });

    if (success && methodId === "adoption") {
      const child = this.randomPerson("child", { age: U.randomInt(s.rng, 0, 6), closeness: 62, lastName: s.profile.lastName });
      child.adopted = true;
      child.conception = "adoption";
      s.relationships.push(child);
      s.metrics.adoptedChildren += 1;
      s.familyPlanning.successfulBirths += 1;
      this.log("Adoption approved", `${child.firstName} ${child.lastName}, age ${child.age}, joins your family after the legal placement process.`, "relationship", "🧸");
      this.touch("adoption-approved-v19");
      return true;
    }

    if (success) {
      this.addPendingFamily(methodId, estimate);
      this.touch("family-attempt-success");
      return true;
    }

    s.familyPlanning.failedAttempts += 1;
    const failureTexts = {
      natural: "This attempt does not lead to a pregnancy. Age, health, compatibility, and contraception all affect future odds.",
      iui: "The artificial insemination attempt is unsuccessful. The clinic explains that another cycle may have a different outcome.",
      ivf: "The IVF cycle does not succeed this year. The clinic reviews the plan before another attempt.",
      surrogacy: "The surrogacy cycle does not result in a pregnancy this year.",
      adoption: "The agency decides that the placement is not the right match this year."
    };
    this.log(`${method.label} was unsuccessful`, failureTexts[methodId], "neutral", method.icon);
    this.touch("family-attempt-failed");
    return false;
  };

  GP.completePendingFamily = function completePendingFamily() {
    const s = this.state;
    const pending = s.familyPlanning && s.familyPlanning.pendingPregnancy;
    if (!pending || !s.alive || s.age < pending.dueAge) return false;
    const child = this.randomPerson("child", { age: 0, closeness: 72, lastName: s.profile.lastName });
    child.conception = pending.methodLabel;
    child.surrogate = pending.surrogateName || null;
    s.relationships.push(child);
    s.familyPlanning.pendingPregnancy = null;
    s.familyPlanning.successfulBirths += 1;
    if (s.metrics) s.metrics.fertilityChildren += 1;
    const via = pending.method === "natural" ? "after a successful family-planning year" : `through ${pending.methodLabel.toLocaleLowerCase()}`;
    this.log("A child joins the family", `${child.firstName} ${child.lastName} is born ${via}.`, "relationship", "🍼");
    return true;
  };

  const previousAgeUp = GP.ageUp;
  GP.ageUp = function ageUpV19() {
    const result = previousAgeUp.call(this);
    if (this.state && this.state.alive) {
      this.ensureExpansionState();
      const completed = this.completePendingFamily();
      this.state.familyPlanning.fertilityMetric = this.biologicalSuccessMetric(this.state);
      if (completed) this.touch("family-arrival");
    }
    return result;
  };

  // Keeps the old one-button call compatible while routing it through the new probability system.
  GP.fertilityAction = function fertilityActionV19() {
    return this.familyPlanningAction("ivf");
  };

  GP.adoptChild = function adoptChildV19() {
    return this.familyPlanningAction("adoption");
  };

  GP.activityStage = function activityStage() {
    const age = this.state.age;
    if (age <= 4) return "infancy";
    if (age <= 11) return "childhood";
    if (age <= 17) return "adolescence";
    if (age <= 64) return "adulthood";
    return "seniority";
  };

  GP.lifestyleAction = function lifestyleAction(kind) {
    this.assertFree("Activities");
    const s = this.state;
    const actions = {
      mind_body: { minAge: 6, cost: 0, icon: "🧘", title: "Mind & body", texts: ["You meditate and take a long walk.", "You stretch, breathe slowly, and clear your thoughts.", "You exercise gently and spend time reading."], stats: { health: 4, resilience: 4, knowledge: 2 } },
      social_media: { minAge: 13, cost: 0, icon: "📱", title: "Social media", texts: ["You post a short life update.", "You share a creative photo and answer comments.", "You post a harmless challenge video."], stats: { happiness: 2 }, social: "posts" },
      club: { minAge: 12, cost: 0, icon: "🎭", title: "Joined a club", texts: ["You attend a drama club meeting.", "You join a school or community interest club.", "You help organize a club activity."], stats: { knowledge: 3, happiness: 3 }, social: "clubYears" },
      movie: { minAge: 8, cost: 25, icon: "🎬", title: "Movie theater", texts: ["You watch a comedy at the cinema.", "You see a dramatic film and discuss the ending.", "You watch an animated adventure."], stats: { happiness: 5 }, social: "movieVisits" },
      vacation: { minAge: 18, cost: 1800, icon: "🏖️", title: "Vacation", texts: ["You take a peaceful coastal vacation.", "You explore a new city for a week.", "You book a quiet countryside escape."], stats: { happiness: 10, resilience: 4 }, social: "vacations" },
      nightlife: { minAge: 18, cost: 100, icon: "🌃", title: "Nightlife", texts: ["You go dancing with friends and head home safely.", "You visit a late-night music venue.", "You spend an evening at a busy city club."], stats: { happiness: 5 } },
      diet: { minAge: 18, cost: 80, icon: "🥗", title: "Diet plan", texts: ["You begin a balanced meal plan.", "You plan healthier meals for the year.", "You choose a sustainable everyday diet."], stats: { health: 5 } },
      lawsuit: { minAge: 18, cost: 900, icon: "⚖️", title: "Legal consultation", texts: ["A lawyer reviews whether you have a valid civil claim.", "You discuss a possible dispute with a legal adviser.", "You ask for advice about a civil complaint."], stats: { knowledge: 2 } },
      license: { minAge: 16, cost: 120, icon: "🪪", title: "License study", texts: ["You study road signs and safe driving rules.", "You practise for a license theory test.", "You complete a supervised safety lesson."], stats: { knowledge: 4 } },
      pet: { minAge: 18, cost: 450, icon: "🐾", title: "Adopted a pet", texts: ["You adopt a friendly rescue cat.", "You bring home a gentle rescue dog.", "You adopt a small companion animal."], stats: { happiness: 8 }, social: "pets" },
      plastic_surgery: { minAge: 18, cost: 3500, icon: "✨", title: "Appearance consultation", texts: ["You have a cosmetic consultation and choose a subtle, fictional appearance update."], stats: { happiness: 3 } },
      lottery_arcade: { minAge: 18, cost: 0, icon: "🎫", title: "Lottery arcade", texts: ["You reveal a free arcade ticket and earn a few cosmetic points.", "Your free daily ticket does not win this time.", "A free ticket awards a small arcade-score bonus."], stats: { happiness: 2 } }
    };
    const action = actions[kind];
    if (!action) throw new Error("Unknown activity.");
    if (s.age < action.minAge && !s.dev.ignoreActivityAgeLocks) throw new Error(`Available at age ${action.minAge}.`);
    if (s.activityPoints < 1) throw new Error("Age up for more actions.");
    if (s.finances.cash < action.cost) throw new Error(`You need ${U.formatMoney(action.cost, s.profile.currency)}.`);
    s.finances.cash -= action.cost;
    s.activityPoints -= 1;
    if (s.metrics) s.metrics.totalActions += 1;
    Object.entries(action.stats || {}).forEach(([key, amount]) => { s.stats[key] = U.clamp(s.stats[key] + amount, 0, 100); });
    if (action.social) s.social[action.social] = (s.social[action.social] || 0) + 1;
    if (kind === "social_media") {
      const gain = U.randomInt(s.rng, 15, 240) + (s.profile.specialTalent === "acting" || s.profile.specialTalent === "modeling" ? 120 : 0);
      s.social.followers += gain;
      if (s.social.followers > 5000) s.fame = U.clamp(s.fame + 1, 0, 100);
    }
    this.log(action.title, U.pick(s.rng, action.texts), "neutral", action.icon);
    this.touch(`lifestyle-${kind}`);
  };

  GP.devMaxFertility = function devMaxFertility() {
    this.state.stats.health = 100;
    this.state.dev.alwaysFertilitySuccess = true;
    this.state.familyPlanning.contraception = "none";
    this.state.familyPlanning.fertilityMetric = 100;
    this.touch("dev-max-fertility");
  };

  GP.devClearFamilyPlanning = function devClearFamilyPlanning() {
    this.state.familyPlanning.pendingPregnancy = null;
    this.state.familyPlanning.history = [];
    this.state.familyPlanning.attempts = 0;
    this.state.familyPlanning.successfulBirths = 0;
    this.state.familyPlanning.failedAttempts = 0;
    this.touch("dev-clear-family-planning");
  };
})(window);
