(function installGameEngine(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;

  function nowIso() {
    return new Date().toISOString();
  }

  function personColor(role) {
    const colors = {
      parent: "#6a5acd",
      sibling: "#ef8354",
      friend: "#2f9c95",
      partner: "#d35b73",
      ex: "#8c8796",
      child: "#d8a12b",
      grandparent: "#7569b7"
    };
    return colors[role] || "#2f9c95";
  }

  class GameEngine {
    constructor(data, state) {
      this.data = data;
      this.events = new NC.EventEngine(data);
      this.state = state || null;
      if (this.state) this.ensureExpansionState();
    }

    origin(id) {
      return this.data.catalogs.origins.find((item) => item.id === id) || this.data.catalogs.origins[0];
    }

    isIncarcerated() {
      const incarceration = this.state && this.state.crime && this.state.crime.incarceration;
      return Boolean(incarceration && incarceration.yearsRemaining > 0);
    }

    assertFree(actionLabel) {
      if (this.isIncarcerated()) {
        throw new Error(`${actionLabel || "That activity"} is unavailable while you are incarcerated. Use the Jail tab or age up.`);
      }
    }

    currentSentence() {
      return this.isIncarcerated() ? this.state.crime.incarceration : null;
    }

    ensureExpansionState() {
      const s = this.state;
      s.fame = Number.isFinite(s.fame) ? s.fame : 0;
      s.crime = s.crime || {};
      s.crime.arrests = Number.isFinite(s.crime.arrests) ? s.crime.arrests : 0;
      s.crime.convictions = Number.isFinite(s.crime.convictions) ? s.crime.convictions : 0;
      s.crime.successfulCrimes = Number.isFinite(s.crime.successfulCrimes) ? s.crime.successfulCrimes : 0;
      s.crime.bankRobberies = Number.isFinite(s.crime.bankRobberies) ? s.crime.bankRobberies : 0;
      s.crime.uncaughtBankRobberies = Number.isFinite(s.crime.uncaughtBankRobberies) ? s.crime.uncaughtBankRobberies : 0;
      s.crime.record = Array.isArray(s.crime.record) ? s.crime.record : [];
      s.crime.convictionHistory = Array.isArray(s.crime.convictionHistory) ? s.crime.convictionHistory : [];
      s.crime.pendingCourt = s.crime.pendingCourt || null;
      s.crime.incarceration = s.crime.incarceration || null;
      if (!s.crime.incarceration && Number(s.crime.jailYears) > 0) {
        const years = Math.max(1, U.int(s.crime.jailYears, 1));
        s.crime.incarceration = {
          id: U.uid("sentence"), offense: "Previous conviction", severity: "unknown",
          originalYears: years, yearsRemaining: years, servedYears: 0, startedAge: s.age,
          facility: s.age < 18 ? "Juvenile detention centre" : "Regional correctional facility",
          security: years >= 18 ? "maximum" : years >= 6 ? "medium" : "minimum",
          conduct: 55, appealsUsed: 0, paroleDeniedAtAge: null, escaped: false
        };
      }
      s.crime.jailYears = s.crime.incarceration ? s.crime.incarceration.yearsRemaining : 0;
      s.crime.uncaughtMurders = Number.isFinite(s.crime.uncaughtMurders) ? s.crime.uncaughtMurders : s.crime.record.filter((item) => item.kind === "murder" && item.success && !item.caught).length;
      s.legacy = s.legacy || { generation: 1, score: 0, graveyard: [] };
      s.legacy.completedChallenges = Array.isArray(s.legacy.completedChallenges) ? s.legacy.completedChallenges : [];
      s.challenges = s.challenges || { bankRobber: { id: "bank_robber", completed: false, robberySucceededUncaught: false, famous: false } };
      s.challenges.bankRobber = Object.assign({ id: "bank_robber", completed: false, robberySucceededUncaught: false, famous: false, completedAge: null, completedGeneration: null }, s.challenges.bankRobber || {});
      if (s.challenges.bankRobber.completed && !s.legacy.completedChallenges.includes("bank_robber")) s.legacy.completedChallenges.push("bank_robber");
      if (s.legacy.completedChallenges.includes("bank_robber")) s.challenges.bankRobber.completed = true;
      s.dev = Object.assign({ alwaysWin: false, neverCaught: false, instantFame: false, alwaysHired: false, instantPromotions: false }, s.dev || {});
      s.profile.specialTalent = NC.SPECIAL_TALENTS[s.profile.specialTalent] ? s.profile.specialTalent : "none";
      s.profile.avatar = s.profile.avatar || { skin: "#d8a47f", hair: "#4a3028", eye: "#49392f", accent: "#6a5acd", style: "short", accessory: "none" };
      s.profile.avatar.eye = s.profile.avatar.eye || "#49392f";
      s.profile.avatar.accessory = s.profile.avatar.accessory || "none";
      s.relationships = Array.isArray(s.relationships) ? s.relationships : [];
      s.relationships.forEach((person) => {
        if (!person.avatar) person.avatar = this.makeRelativeAvatar(person.role);
        person.relationshipStatus = person.relationshipStatus || (person.role === "spouse" ? "married" : person.role === "fiance" ? "engaged" : person.role === "partner" ? "dating" : person.role === "ex" ? "ex" : "family");
        person.marriage = person.marriage || null;
        person.wealth = Number.isFinite(person.wealth) ? person.wealth : U.randomInt(s.rng, 0, 90000);
      });
      if (s.career && s.career.active) {
        const active = s.career.active;
        active.illegal = Boolean(active.illegal);
        active.level = Number.isFinite(active.level) ? active.level : (active.illegal ? 1 : 0);
        active.contractSuccesses = Number.isFinite(active.contractSuccesses) ? active.contractSuccesses : 0;
        active.contractsAtLevel = Number.isFinite(active.contractsAtLevel) ? active.contractsAtLevel : 0;
      }
    }

    makeRelativeAvatar(role) {
      const rng = this.state.rng;
      const family = ["parent", "sibling", "child", "grandparent"].includes(role);
      return {
        skin: family ? this.state.profile.avatar.skin : U.pick(rng, ["#f1c7a5", "#d8a47f", "#ad7353", "#754832", "#5a3527"]),
        hair: U.pick(rng, ["#17120f", "#4a3028", "#7b4b2a", "#b7834f", "#d7c1a3", "#8b2735"]),
        eye: U.pick(rng, ["#49392f", "#2f4b38", "#405b73", "#79633f", "#5d3d68"]),
        accent: U.pick(rng, ["#6a5acd", "#2f9c95", "#ef8354", "#d35b73", "#d8a12b"]),
        style: U.pick(rng, ["short", "long", "curly"]),
        accessory: U.pick(rng, ["none", "none", "glasses", "earrings", "hat", "bow"]),
        vampire: Boolean(this.state.flags && this.state.flags.vampire && family)
      };
    }

    randomPerson(role, options) {
      const opts = options || {};
      const state = this.state;
      const origin = this.origin(state.profile.originId);
      const identity = opts.identity || U.pick(state.rng, ["woman", "man", "nonbinary"]);
      const firstName = opts.firstName || U.pick(state.rng, origin.firstNames);
      const lastName = opts.lastName || (["parent", "child", "sibling"].includes(role) ? state.profile.lastName : U.pick(state.rng, origin.lastNames));
      return {
        id: U.uid("person"),
        firstName,
        lastName,
        identity,
        pronouns: U.pronouns(identity).label,
        role,
        age: Math.max(0, Number.isFinite(opts.age) ? opts.age : state.age + U.randomInt(state.rng, -2, 3)),
        closeness: U.clamp(Number.isFinite(opts.closeness) ? opts.closeness : 50, 0, 100),
        health: U.randomInt(state.rng, 55, 90),
        alive: opts.alive !== false,
        color: personColor(role),
        avatar: opts.avatar || this.makeRelativeAvatar(role),
        relationshipStatus: opts.relationshipStatus || (role === "spouse" ? "married" : role === "fiance" ? "engaged" : role === "partner" ? "dating" : role === "ex" ? "ex" : "family"),
        marriage: opts.marriage || null,
        wealth: Number.isFinite(opts.wealth) ? opts.wealth : U.randomInt(state.rng, 0, 90000),
        metAge: state.age,
        createdAge: state.age
      };
    }

    createCharacter(input) {
      const origin = this.origin(input.originId);
      const upbringing = this.data.catalogs.upbringings.find((item) => item.id === input.upbringingId) || this.data.catalogs.upbringings[0];
      const firstName = U.cleanName(input.firstName, U.pick({ seed: U.hashSeed(Date.now()), step: 0 }, origin.firstNames));
      const lastName = U.cleanName(input.lastName, U.pick({ seed: U.hashSeed(Date.now() + 1), step: 0 }, origin.lastNames));
      const identity = ["woman", "man", "nonbinary"].includes(input.identity) ? input.identity : "nonbinary";
      const seed = U.hashSeed(input.seed || `${firstName}|${lastName}|${Date.now()}`);
      const rng = { seed, step: 0 };
      const trait = U.pick(rng, ["Curious", "Warm-hearted", "Unflappable", "Imaginative", "Observant"]);
      const baseStats = {
        health: U.randomInt(rng, 48, 72),
        happiness: U.randomInt(rng, 48, 72),
        knowledge: U.randomInt(rng, 42, 68),
        resilience: U.randomInt(rng, 42, 68)
      };
      Object.entries(upbringing.stats || {}).forEach(([stat, amount]) => {
        baseStats[stat] = U.clamp(baseStats[stat] + amount, 10, 95);
      });

      this.state = {
        schemaVersion: NC.SCHEMA_VERSION,
        dataVersion: this.data.dataVersion,
        saveId: U.uid("life"),
        revision: 1,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        year: new Date().getFullYear(),
        age: 0,
        alive: true,
        death: null,
        profile: {
          firstName,
          lastName,
          identity,
          pronouns: U.pronouns(identity).label,
          supernatural: input.supernatural === "vampire" ? "vampire" : "human",
          specialTalent: NC.SPECIAL_TALENTS[input.specialTalent] ? input.specialTalent : "none",
          avatar: { skin: input.skin || "#d8a47f", hair: input.hair || "#4a3028", eye: input.eye || "#49392f", accent: input.accent || "#6a5acd", style: input.hairStyle || "short", accessory: input.accessory || "none", vampire: input.supernatural === "vampire" },
          originId: origin.id,
          city: origin.city,
          country: origin.country,
          currency: origin.currency,
          upbringingId: upbringing.id,
          traits: [trait, upbringing.label]
        },
        stats: baseStats,
        finances: {
          cash: upbringing.cash,
          debt: 0,
          annualIncome: 0,
          annualExpenses: 0,
          lastNet: 0
        },
        education: {
          status: "not_started",
          programId: null,
          field: null,
          yearsComplete: 0,
          performance: 50,
          credentials: [],
          history: []
        },
        career: { active: null, history: [] },
        assets: [],
        relationships: [],
        activityPoints: 2,
        flags: { vampire: input.supernatural === "vampire" },
        vampire: input.supernatural === "vampire" ? { hunger: 25, secrecy: 80, ageAtTurning: 0 } : null,
        fame: 0,
        crime: { arrests: 0, convictions: 0, successfulCrimes: 0, bankRobberies: 0, uncaughtBankRobberies: 0, uncaughtMurders: 0, jailYears: 0, record: [], convictionHistory: [], pendingCourt: null, incarceration: null },
        challenges: { bankRobber: { id: "bank_robber", completed: false, robberySucceededUncaught: false, famous: false, completedAge: null, completedGeneration: null } },
        dev: { alwaysWin: false, neverCaught: false, instantFame: false, alwaysHired: false, instantPromotions: false },
        timeline: [],
        eventLedger: { history: [], lastSeenAge: {} },
        pendingEvent: null,
        interactionLedger: {},
        rng,
        legacy: { generation: 1, score: 0, graveyard: [], completedChallenges: [] }
      };

      const parentOne = this.randomPerson("parent", {
        age: U.randomInt(rng, 24, 37),
        closeness: U.randomInt(rng, 62, 86)
      });
      const parentTwo = this.randomPerson("parent", {
        age: U.randomInt(rng, 25, 41),
        closeness: U.randomInt(rng, 55, 84)
      });
      this.state.relationships.push(parentOne, parentTwo);
      if (U.random(rng) < 0.48) {
        this.state.relationships.push(this.randomPerson("sibling", {
          age: U.randomInt(rng, 1, 5),
          closeness: U.randomInt(rng, 48, 76)
        }));
      }

      const talent = NC.SPECIAL_TALENTS[this.state.profile.specialTalent];
      this.log("A new chapter begins", `${firstName} ${lastName} is born in ${origin.city}, ${origin.country}${this.state.flags.vampire ? ", carrying a secret vampiric nature" : ""}.${talent.id !== "none" ? ` A natural talent for ${talent.label.toLocaleLowerCase()} begins to show.` : ""}`, "milestone", this.state.flags.vampire ? "🦇" : "🌱");
      this.log("Home at the beginning", `Your early home is shaped by a ${upbringing.label.toLocaleLowerCase()}.`, "relationship", "🏡");
      this.touch("created");
      return this.state;
    }

    touch(reason) {
      if (!this.state) return;
      this.state.revision = (this.state.revision || 0) + 1;
      this.state.updatedAt = nowIso();
      NC.emit("state-changed", { reason: reason || "updated", state: this.state });
    }

    log(title, text, type, icon) {
      this.state.timeline.unshift({
        id: U.uid("log"),
        age: this.state.age,
        year: this.state.year,
        title,
        text,
        type: type || "neutral",
        icon: icon || "•",
        at: nowIso()
      });
      if (this.state.timeline.length > 220) this.state.timeline.length = 220;
    }

    chapter() {
      const age = this.state.age;
      if (age <= 4) return { title: "First pages", subtitle: "A world of beginnings", label: "Early years" };
      if (age <= 12) return { title: "Growing roots", subtitle: "School, family, and discovery", label: "Childhood" };
      if (age <= 17) return { title: "Finding a voice", subtitle: "Choices begin to carry farther", label: "Teen years" };
      if (age <= 29) return { title: "Open roads", subtitle: "Study, work, love, and independence", label: "Young adult" };
      if (age <= 49) return { title: "Building a life", subtitle: "The long work of choosing what matters", label: "Adulthood" };
      if (age <= 64) return { title: "Changing seasons", subtitle: "Experience reshapes the view", label: "Later adult" };
      return { title: "The long view", subtitle: "Legacy lives in ordinary moments", label: "Golden years" };
    }

    currentEducation() {
      return this.data.catalogs.education.find((item) => item.id === this.state.education.programId) || null;
    }

    currentJob() {
      return this.state.career.active;
    }

    occupationLabel() {
      if (this.state.career.active) return this.state.career.active.title;
      const program = this.currentEducation();
      if (program) return `${program.label} student`;
      if (this.state.age < 5) return "Discovering the world";
      if (this.state.age < 16) return "Student";
      if (this.state.flags.retired) return "Retired";
      return "Between paths";
    }

    netWorth() {
      const assetValue = this.state.assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
      return Math.round(this.state.finances.cash + assetValue - this.state.finances.debt);
    }

    enrollAutomatic(programId) {
      const program = this.data.catalogs.education.find((item) => item.id === programId);
      if (!program) return;
      this.state.education.status = "enrolled";
      this.state.education.programId = program.id;
      this.state.education.field = null;
      this.state.education.yearsComplete = 0;
      this.state.education.performance = U.clamp(45 + Math.round(this.state.stats.knowledge / 5), 35, 75);
      this.log(`Started ${program.label.toLocaleLowerCase()}`, program.description, "milestone", program.icon);
    }

    canEnroll(programId) {
      const state = this.state;
      const program = this.data.catalogs.education.find((item) => item.id === programId);
      if (!program) return { allowed: false, reason: "Program not found" };
      if (state.education.status === "enrolled") return { allowed: false, reason: "Already enrolled" };
      if (state.age < program.minAge) return { allowed: false, reason: `Available at age ${program.minAge}` };
      if (["primary", "secondary"].includes(program.id)) return { allowed: false, reason: "Starts automatically" };
      if (program.requires && !state.education.credentials.includes(program.requires)) return { allowed: false, reason: `Requires ${program.requires} education` };
      if (state.education.credentials.includes(program.credential)) return { allowed: false, reason: "Credential already earned" };
      return { allowed: true, reason: "" };
    }

    enroll(programId, field) {
      this.assertFree("Education");
      const check = this.canEnroll(programId);
      if (!check.allowed) throw new Error(check.reason);
      const program = this.data.catalogs.education.find((item) => item.id === programId);
      const chosenField = program.fields && program.fields.includes(field) ? field : (program.fields ? program.fields[0] : null);
      this.state.education.status = "enrolled";
      this.state.education.programId = program.id;
      this.state.education.field = chosenField;
      this.state.education.yearsComplete = 0;
      this.state.education.performance = U.clamp(42 + Math.round(this.state.stats.knowledge / 5), 35, 75);
      this.log(`Enrolled in ${program.label.toLocaleLowerCase()}`, chosenField ? `You chose ${chosenField}.` : program.description, "milestone", program.icon);
      this.touch("education-enrolled");
    }

    leaveEducation() {
      this.assertFree("Leaving education");
      const program = this.currentEducation();
      if (!program) return;
      this.state.education.history.push({ programId: program.id, field: this.state.education.field, outcome: "left", age: this.state.age });
      this.log(`Left ${program.label.toLocaleLowerCase()}`, "You chose a different direction before finishing the program.", "bad", "↩️");
      Object.assign(this.state.education, { status: "not_enrolled", programId: null, field: null, yearsComplete: 0 });
      this.touch("education-left");
    }

    progressEducation() {
      const education = this.state.education;
      const program = this.currentEducation();
      let annualCost = 0;
      if (education.status === "enrolled" && program) {
        education.yearsComplete += 1;
        education.performance = U.clamp(education.performance + U.randomInt(this.state.rng, -4, 5) + Math.round((this.state.stats.knowledge - 50) / 25), 0, 100);
        annualCost = program.cost || 0;
        if (education.yearsComplete >= program.duration) {
          education.credentials.push(program.credential);
          education.history.push({ programId: program.id, field: education.field, outcome: "graduated", age: this.state.age, performance: education.performance });
          this.log(`Completed ${program.label.toLocaleLowerCase()}`, `You graduate${education.field ? ` in ${education.field}` : ""} with ${education.performance >= 70 ? "strong" : "steady"} results.`, "good", "🎓");
          Object.assign(education, { status: "not_enrolled", programId: null, field: null, yearsComplete: 0 });
          this.state.stats.knowledge = U.clamp(this.state.stats.knowledge + 5, 0, 100);
          this.state.legacy.score += 3;
        }
      }

      if (this.state.age === 5 && !education.credentials.includes("primary") && education.status !== "enrolled") {
        this.enrollAutomatic("primary");
      } else if (this.state.age >= 12 && education.credentials.includes("primary") && !education.credentials.includes("secondary") && education.status !== "enrolled") {
        this.enrollAutomatic("secondary");
      }
      return annualCost;
    }

    specialTalent() {
      return NC.SPECIAL_TALENTS[this.state.profile.specialTalent] || NC.SPECIAL_TALENTS.none;
    }

    talentMatchesJob(job) {
      if (!job || !job.talent) return false;
      return this.state.profile.specialTalent === job.talent;
    }

    criminalRecordPenalty(job) {
      const convictions = Math.max(0, this.state.crime.convictions || 0);
      const serious = (this.state.crime.convictionHistory || []).filter((item) => /murder|robbery|assassin|violence/i.test(item.offense || "")).length;
      const sensitiveSector = ["Education", "Health", "Public service"].includes(job.sector) ? 0.09 : 0;
      return U.clamp(convictions * 0.10 + serious * 0.07 + sensitiveSector * Math.min(1, convictions), 0, 0.62);
    }

    jobApplicationChance(job) {
      const talentBonus = this.talentMatchesJob(job) ? 0.24 : (this.state.profile.specialTalent === "business" && job.sector === "Business" ? 0.13 : 0);
      const leadBonus = this.state.flags.job_leads ? 0.08 : 0;
      const recordPenalty = this.criminalRecordPenalty(job);
      if (this.state.dev.alwaysWin || this.state.dev.alwaysHired) return 1;
      return U.clamp(0.43 + this.state.stats.knowledge / 340 + this.state.stats.resilience / 520 + talentBonus + leadBonus - recordPenalty, 0.04, 0.94);
    }

    jobCheck(job) {
      if (this.state.age < job.minAge) return { allowed: false, reason: `Available at age ${job.minAge}` };
      if (this.state.career.active) return { allowed: false, reason: "Leave your current job first" };
      if (job.requires && !this.state.education.credentials.includes(job.requires)) return { allowed: false, reason: `Requires a ${job.requires} credential` };
      if (job.field && this.state.education.history.every((item) => item.field !== job.field)) return { allowed: false, reason: `Requires study in ${job.field}` };
      const chance = this.jobApplicationChance(job);
      const penalty = this.criminalRecordPenalty(job);
      return { allowed: true, reason: "", chance, warning: penalty > 0 ? `Criminal record penalty: -${Math.round(penalty * 100)}%` : "" };
    }

    applyForJob(jobId) {
      this.assertFree("Applying for work");
      const job = this.data.catalogs.jobs.find((item) => item.id === jobId);
      if (!job) throw new Error("Job not found.");
      const check = this.jobCheck(job);
      if (!check.allowed) throw new Error(check.reason);
      if (this.state.activityPoints < 1) throw new Error("Age up to gain more action points.");
      this.state.activityPoints -= 1;
      const chance = check.chance;
      if (this.state.dev.alwaysWin || this.state.dev.alwaysHired || U.random(this.state.rng) <= chance) {
        this.state.career.active = {
          jobId: job.id,
          title: job.title,
          baseTitle: job.title,
          sector: job.sector,
          salary: job.salary,
          performance: U.clamp(45 + Math.round(this.state.stats.resilience / 6) + (this.talentMatchesJob(job) ? 8 : 0), 45, 78),
          years: 0,
          level: 0,
          startedAge: this.state.age,
          icon: job.icon,
          illegal: false
        };
        this.state.flags.job_leads = false;
        this.log(`Hired as ${job.title.toLocaleLowerCase()}`, `You begin work in ${job.sector.toLocaleLowerCase()} with an annual salary of ${U.formatMoney(job.salary, this.state.profile.currency)}.${this.talentMatchesJob(job) ? ` Your ${this.specialTalent().label.toLocaleLowerCase()} talent gives you an early advantage.` : ""}`, "good", job.icon);
      } else {
        const recordCopy = this.criminalRecordPenalty(job) > 0.04 ? " Your criminal record made the employer less willing to take a chance on you." : "";
        this.log(`Application to become ${job.title.toLocaleLowerCase()}`, `The role goes to another applicant.${recordCopy}`, "bad", "📨");
        this.state.stats.resilience = U.clamp(this.state.stats.resilience + 2, 0, 100);
      }
      this.touch("job-application");
    }

    leaveCareer(reason) {
      const active = this.state.career.active;
      if (!active) return;
      this.state.career.history.push(Object.assign({}, active, { endedAge: this.state.age, reason: reason || "resigned" }));
      this.state.career.active = null;
    }

    quitCareer() {
      this.assertFree("Changing careers");
      const active = this.state.career.active;
      if (!active) return;
      this.log(`Left the ${active.title.toLocaleLowerCase()} role`, "You step away and make room for a different direction.", "milestone", "🚪");
      this.leaveCareer("resigned");
      this.touch("career-left");
    }

    retire() {
      this.assertFree("Retiring");
      if (!this.state.career.active || this.state.age < 58) throw new Error("Retirement is available from age 58 while employed.");
      const title = this.state.career.active.title;
      this.leaveCareer("retired");
      this.state.flags.retired = true;
      this.state.legacy.score += 8;
      this.log("Retired from working life", `After years as ${title.toLocaleLowerCase()}, you begin a new rhythm.`, "milestone", "🌤️");
      this.touch("retired");
    }

    promoteCareer(force) {
      const active = this.state.career.active;
      if (!active || active.illegal) return false;
      const job = this.data.catalogs.jobs.find((item) => item.id === active.jobId);
      const ladder = job && Array.isArray(job.promotions) ? job.promotions : [];
      if (active.level >= ladder.length) return false;
      if (!force && active.performance < 62) return false;
      active.level += 1;
      active.title = ladder[active.level - 1];
      active.salary = Math.round(active.salary * (1.10 + Math.max(0, Number(job && job.growth) || 0)));
      active.performance = U.clamp(active.performance - 7, 0, 100);
      this.log("A step forward at work", `You are promoted to ${active.title} with a salary of ${U.formatMoney(active.salary, this.state.profile.currency)}.`, "good", "📈");
      this.state.legacy.score += 2;
      return true;
    }

    workHard() {
      this.assertFree("Working");
      const active = this.state.career.active;
      if (!active) throw new Error("You need a job first.");
      if (active.illegal) throw new Error("Use an underground contract instead.");
      if (this.state.activityPoints < 1) throw new Error("Age up to gain more action points.");
      this.state.activityPoints -= 1;
      const job = this.data.catalogs.jobs.find((item) => item.id === active.jobId);
      const talentBoost = this.talentMatchesJob(job) ? 5 : 0;
      active.performance = U.clamp(active.performance + 8 + talentBoost, 0, 100);
      this.state.stats.health = U.clamp(this.state.stats.health - 3, 0, 100);
      this.state.stats.resilience = U.clamp(this.state.stats.resilience + 2, 0, 100);
      this.log("Put in focused work", `Your performance as ${active.title.toLocaleLowerCase()} improves${talentBoost ? ` quickly because of your ${this.specialTalent().label.toLocaleLowerCase()} talent` : ""}, at the cost of some energy.`, "good", "📈");
      if (this.state.dev.instantPromotions) this.promoteCareer(true);
      this.touch("worked-hard");
    }

    progressCareer() {
      const active = this.state.career.active;
      if (!active) return 0;
      active.years += 1;
      if (active.illegal) {
        active.performance = U.clamp(active.performance + U.randomInt(this.state.rng, -3, 3), 0, 100);
        return active.salary;
      }
      const job = this.data.catalogs.jobs.find((item) => item.id === active.jobId);
      const talentDrift = this.talentMatchesJob(job) ? 3 : 0;
      active.performance = U.clamp(active.performance + U.randomInt(this.state.rng, -5, 4) + Math.round((this.state.stats.resilience - 50) / 30) + talentDrift, 0, 100);
      if ((this.state.dev.instantPromotions || active.years % 3 === 0) && active.performance >= (this.state.dev.instantPromotions ? 0 : 62)) this.promoteCareer(this.state.dev.instantPromotions);
      return active.salary;
    }

    assassinCheck() {
      if (this.state.age < 18) return { allowed: false, reason: "Available at age 18" };
      if (this.isIncarcerated()) return { allowed: false, reason: "Unavailable while in custody" };
      if (this.state.crime.pendingCourt) return { allowed: false, reason: "Resolve the court case first" };
      if (this.state.career.active) return { allowed: false, reason: "Leave your current job first" };
      const count = this.state.crime.uncaughtMurders || 0;
      if (count < 3) return { allowed: false, reason: `Requires 3 uncaught murders (${count}/3)` };
      return { allowed: true, reason: "" };
    }

    joinAssassinCareer() {
      this.assertFree("Joining an underground career");
      const check = this.assassinCheck();
      if (!check.allowed) throw new Error(check.reason);
      this.state.career.active = {
        jobId: "assassin", title: "Contract assassin", baseTitle: "Assassin", sector: "Underground",
        salary: 90000, performance: 52, years: 0, level: 1, startedAge: this.state.age, icon: "🕶️",
        illegal: true, contractSuccesses: 0, contractsAtLevel: 0
      };
      this.log("Entered an underground profession", "A secretive network offers you paid contracts. Every assignment carries the risk of a murder charge and a long prison sentence.", "bad", "🕶️");
      this.touch("assassin-joined");
    }

    assassinContract() {
      this.assertFree("Underground contracts");
      const state = this.state;
      const active = state.career.active;
      if (!active || active.jobId !== "assassin") throw new Error("You are not working as an assassin.");
      if (state.crime.pendingCourt) throw new Error("Resolve the court case first.");
      if (state.activityPoints < 1) throw new Error("Age up for more action points.");
      state.activityPoints -= 1;
      const tiers = {
        1: { label: "private contract", target: "a private target", success: .58, caught: .24, reward: [40000, 125000], next: 3, nextTitle: "High-profile assassin", nextSalary: 190000 },
        2: { label: "high-profile contract", target: "a fictional public figure", success: .43, caught: .38, reward: [160000, 460000], next: 4, nextTitle: "Elite state assassin", nextSalary: 420000 },
        3: { label: "state-level contract", target: "a fictional head of state or royal", success: .29, caught: .54, reward: [600000, 1800000], next: Infinity }
      };
      const tier = tiers[active.level] || tiers[3];
      const crimeTalent = state.profile.specialTalent === "crime";
      const dealingTalent = state.profile.specialTalent === "dealing";
      const successChance = U.clamp(tier.success + (crimeTalent ? .15 : 0) + (dealingTalent ? .03 : 0), .05, .92);
      const caughtChance = U.clamp(tier.caught - (crimeTalent ? .13 : 0) - (state.dev.neverCaught ? 1 : 0), 0, .95);
      const success = state.dev.alwaysWin || U.random(state.rng) < successChance;
      const caught = state.dev.neverCaught ? false : (!state.dev.alwaysWin && U.random(state.rng) < (success ? caughtChance : Math.min(.95, caughtChance + .18)));
      const reward = success && !caught ? Math.round(U.randomInt(state.rng, tier.reward[0], tier.reward[1]) * (dealingTalent ? 1.12 : 1)) : 0;
      const record = { id: U.uid("crime"), kind: "assassin", label: "Murder-for-hire", age: state.age, success, caught, reward, target: tier.target };
      state.crime.record.unshift(record);
      if (caught) {
        state.crime.arrests += 1;
        state.crime.pendingCourt = { crimeId: record.id, label: "Murder-for-hire", baseSentence: U.randomInt(state.rng, 22, 48), severity: "murder", evidence: U.randomInt(state.rng, success ? 42 : 58, 96) };
        active.performance = U.clamp(active.performance - 18, 0, 100);
        this.log("Arrested after an underground contract", "Police linked you to an alleged murder-for-hire. The case will be prosecuted as murder.", "bad", "🚓");
      } else if (success) {
        state.finances.cash += reward;
        state.crime.successfulCrimes += 1;
        active.contractSuccesses += 1;
        active.contractsAtLevel += 1;
        active.performance = U.clamp(active.performance + 10, 0, 100);
        state.fame = U.clamp(state.fame + (active.level === 1 ? 2 : active.level === 2 ? 7 : 14), 0, 100);
        this.log("Underground contract completed", `You complete ${tier.label} involving ${tier.target} and receive ${U.formatMoney(reward, state.profile.currency)} without immediate arrest.`, "money", "🕶️");
        if (active.level < 3 && active.contractsAtLevel >= tier.next) {
          active.level += 1;
          active.title = tier.nextTitle;
          active.salary = tier.nextSalary;
          active.contractsAtLevel = 0;
          active.performance = U.clamp(active.performance - 8, 0, 100);
          this.log("Promoted in the underground network", `Your record earns you access to level ${active.level} contracts as ${active.title.toLocaleLowerCase()}.`, "milestone", "📈");
        }
      } else {
        active.performance = U.clamp(active.performance - 8, 0, 100);
        this.log("Underground contract failed", "The assignment falls apart, but police do not make an immediate arrest.", "bad", "⚠️");
      }
      this.updateChallenges();
      this.touch("assassin-contract");
      return { success, caught, reward };
    }

    settleFinances(income, educationCost) {
      const state = this.state;
      const baseLiving = state.age < 16 ? 0 : state.age < 18 ? 2800 : 12800;
      const upkeep = state.assets.reduce((sum, asset) => sum + (asset.annualCost || 0), 0);
      const tax = Math.round(income * 0.18);
      const debtInterest = Math.round(state.finances.debt * 0.045);
      state.finances.debt += debtInterest;
      let expenses = baseLiving + upkeep + educationCost + tax;
      const available = state.finances.cash + Math.round(income * 0.82);
      if (available >= expenses) {
        state.finances.cash = available - expenses;
      } else {
        const gap = expenses - available;
        state.finances.cash = 0;
        state.finances.debt += gap;
      }

      let debtPayment = 0;
      if (state.finances.debt > 0 && income > 0 && state.finances.cash > 1500) {
        debtPayment = Math.min(state.finances.debt, state.finances.cash - 1500, Math.max(600, Math.round(income * 0.07)));
        state.finances.debt -= debtPayment;
        state.finances.cash -= debtPayment;
        expenses += debtPayment;
      }

      state.finances.annualIncome = income;
      state.finances.annualExpenses = expenses;
      state.finances.lastNet = income - expenses;

      state.assets.forEach((asset) => {
        if (asset.kind === "property") {
          asset.value = Math.max(1000, Math.round(asset.value * (1 + U.randomInt(state.rng, -1, 5) / 100)));
          asset.condition = U.clamp(asset.condition - U.randomInt(state.rng, 1, 3), 20, 100);
        } else {
          asset.value = Math.max(10, Math.round(asset.value * 0.88));
          asset.condition = U.clamp(asset.condition - U.randomInt(state.rng, 2, 7), 5, 100);
        }
      });
    }

    progressRelationships() {
      this.state.relationships.forEach((person) => {
        if (!person.alive) return;
        person.age += 1;
        person.health = U.clamp(person.health + U.randomInt(this.state.rng, -4, 2) - (person.age > 60 ? 1 : 0), 0, 100);
        const married = person.role === "spouse";
        person.closeness = U.clamp(person.closeness + U.randomInt(this.state.rng, married ? -1 : -2, 1), 0, 100);
        if (married && person.marriage) person.marriage.years = Math.max(0, this.state.age - person.marriage.startedAge);
        if (person.role === "fiance" && Number.isFinite(person.engagedAge) && this.state.age - person.engagedAge >= 3) {
          person.closeness = U.clamp(person.closeness - 4, 0, 100);
          this.log(`${person.firstName} wants a wedding date`, `After ${this.state.age - person.engagedAge} years engaged, ${person.firstName} asks whether the wedding is actually going to happen.`, "relationship", "💍");
        }

        if (married && this.state.finances.cash > 600 && U.random(this.state.rng) < 0.025) {
          const taken = Math.min(this.state.finances.cash, U.randomInt(this.state.rng, 80, Math.max(100, Math.round(this.state.finances.cash * 0.06))));
          this.state.finances.cash -= taken;
          person.closeness = U.clamp(person.closeness - 4, 0, 100);
          this.log(`${person.firstName} used shared money`, `${person.firstName} spent ${U.formatMoney(taken, this.state.profile.currency)} without asking first.`, "money", "💸");
        }

        const risk = person.age < 55 ? 0.0005 : person.age < 70 ? 0.004 : person.age < 80 ? 0.025 : person.age < 90 ? 0.07 : 0.16;
        const healthRisk = (100 - person.health) / 700;
        if (person.health <= 0 || U.random(this.state.rng) < risk + healthRisk) {
          person.alive = false;
          person.deathAge = person.age;
          person.previousRole = person.role;
          if (person.role === "spouse") {
            person.role = "late_spouse";
            person.relationshipStatus = "widowed";
            person.funeralPending = true;
            const inheritance = person.closeness >= 35 ? Math.round(person.wealth * U.randomInt(this.state.rng, 25, 80) / 100) : 0;
            if (inheritance > 0) this.state.finances.cash += inheritance;
            this.log(`${person.firstName} ${person.lastName} died`, inheritance > 0 ? `Your spouse died at age ${person.age} and left you ${U.formatMoney(inheritance, this.state.profile.currency)}. Funeral arrangements are waiting in Relationships.` : `Your spouse died at age ${person.age}. Funeral arrangements are waiting in Relationships.`, "bad", "🕯️");
          } else {
            person.role = person.role === "partner" || person.role === "fiance" ? "late_partner" : person.role;
            this.log(`${person.firstName} ${person.lastName} died`, `Your ${person.previousRole || person.role} is remembered at age ${person.age}.`, "bad", "🕯️");
          }
          this.state.stats.happiness = U.clamp(this.state.stats.happiness - Math.round(person.closeness / 10), 0, 100);
        }
      });
    }

    passiveWellbeing() {
      const state = this.state;
      const healthDrift = state.age < 35 ? U.randomInt(state.rng, -1, 2) : state.age < 55 ? U.randomInt(state.rng, -2, 1) : U.randomInt(state.rng, -4, 0);
      state.stats.health = U.clamp(state.stats.health + healthDrift, 0, 100);
      state.stats.happiness = U.clamp(state.stats.happiness + U.randomInt(state.rng, -3, 3), 0, 100);
      state.stats.knowledge = U.clamp(state.stats.knowledge + (state.age < 55 ? 1 : 0), 0, 100);
      state.stats.resilience = U.clamp(state.stats.resilience + (state.age % 3 === 0 ? 1 : 0), 0, 100);
    }

    mortalityCheck() {
      const state = this.state;
      if (state.stats.health <= 0) return "a serious decline in health";
      let base = 0;
      if (state.age >= 45 && state.age < 60) base = 0.001;
      else if (state.age < 70) base = state.age >= 60 ? 0.006 : 0;
      else if (state.age < 80) base = 0.024;
      else if (state.age < 90) base = 0.075;
      else if (state.age < 100) base = 0.18;
      else if (state.age >= 100) base = 0.38;
      const healthModifier = Math.max(0, 50 - state.stats.health) / 260;
      if (U.random(state.rng) < base + healthModifier) return state.age >= 78 ? "natural causes" : "an unexpected medical emergency";
      return null;
    }

    ageUp() {
      const state = this.state;
      if (!state || !state.alive) throw new Error("This life has ended.");
      if (state.pendingEvent) throw new Error("Finish the current event first.");
      if (state.crime && state.crime.pendingCourt) throw new Error("Resolve the active court case before aging up.");

      state.age += 1;
      state.year += 1;
      const wasIncarcerated = this.isIncarcerated();

      if (wasIncarcerated) {
        const sentence = state.crime.incarceration;
        sentence.servedYears += 1;
        sentence.yearsRemaining = Math.max(0, sentence.yearsRemaining - 1);
        sentence.conduct = U.clamp(sentence.conduct + U.randomInt(state.rng, -3, 5), 0, 100);
        state.crime.jailYears = sentence.yearsRemaining;
        state.activityPoints = 2;
        this.progressRelationships();
        state.finances.annualIncome = 0;
        state.finances.annualExpenses = 0;
        state.finances.lastNet = 0;
        state.stats.happiness = U.clamp(state.stats.happiness + U.randomInt(state.rng, -6, 1), 0, 100);
        state.stats.resilience = U.clamp(state.stats.resilience + U.randomInt(state.rng, 0, 3), 0, 100);
        state.stats.health = U.clamp(state.stats.health + U.randomInt(state.rng, -2, 1), 0, 100);

        if (sentence.yearsRemaining > 0) {
          this.log("A year in custody", `${sentence.yearsRemaining} year${sentence.yearsRemaining === 1 ? "" : "s"} remain on your ${sentence.offense.toLocaleLowerCase()} sentence.`, "bad", "🔒");
        } else {
          this.log("Released from custody", `You completed a ${sentence.originalYears}-year sentence for ${sentence.offense.toLocaleLowerCase()} and returned to ordinary life.`, "milestone", "🚪");
          state.crime.incarceration = null;
          state.crime.jailYears = 0;
        }

        this.updateChallenges();
        const cause = state.flags.vampire && state.age < 180 ? null : this.mortalityCheck();
        if (cause) { this.die(cause, false); this.touch("age-up-death"); return { died: true }; }
        this.touch("age-up-custody");
        return { incarcerated: this.isIncarcerated(), released: !this.isIncarcerated() };
      }

      state.activityPoints = 2;
      this.progressRelationships();
      const educationCost = this.progressEducation();
      const income = this.progressCareer();
      this.settleFinances(income, educationCost);
      this.passiveWellbeing();

      if ([1, 5, 13, 16, 18, 21, 30, 40, 50, 60, 70, 80, 90, 100].includes(state.age)) {
        this.log(`Turned ${state.age}`, `A new year begins in ${state.profile.city}.`, "milestone", "🎂");
      }

      if (state.flags.vampire) {
        state.vampire = state.vampire || { hunger: 25, secrecy: 80, ageAtTurning: state.age };
        state.vampire.hunger = U.clamp(state.vampire.hunger + U.randomInt(state.rng, 7, 16), 0, 100);
        if (state.vampire.hunger > 80) { state.stats.happiness = U.clamp(state.stats.happiness - 6, 0, 100); state.stats.resilience = U.clamp(state.stats.resilience - 3, 0, 100); }
        state.stats.health = Math.max(state.stats.health, 35);
      }

      const cause = state.flags.vampire && state.age < 180 ? null : this.mortalityCheck();
      if (cause) {
        this.die(cause, false);
        this.touch("age-up-death");
        return { died: true };
      }

      this.updateChallenges();
      const event = this.events.pickAnnual(state);
      if (event) state.pendingEvent = { eventId: event.id, source: "annual", resolved: null };
      else this.log("A quieter year", "The year passes in routines, small changes, and moments too ordinary for headlines.", "neutral", "🍃");
      this.touch("age-up");
      return { event: event || null };
    }

    resolveChoice(choiceId) {
      const pending = this.state.pendingEvent;
      if (!pending || pending.resolved) throw new Error("There is no unresolved choice.");
      const result = this.events.resolve(this, pending.eventId, choiceId);
      pending.resolved = {
        choiceId,
        outcome: result.outcome,
        effectLabels: result.effectLabels
      };
      this.touch("event-resolved");
      return result;
    }

    completeEvent() {
      const pending = this.state.pendingEvent;
      if (!pending || !pending.resolved) return;
      const event = this.events.byId(pending.eventId);
      const outcome = pending.resolved.outcome;
      this.log(event.title, outcome, this.eventLogType(pending.resolved.effectLabels), event.icon);
      this.state.pendingEvent = null;
      if (this.state.stats.health <= 0) this.die("a serious decline in health", false);
      this.touch("event-complete");
    }

    eventLogType(labels) {
      const negatives = (labels || []).filter((label) => label.negative).length;
      const positives = (labels || []).length - negatives;
      if (negatives > positives) return "bad";
      if (positives > negatives) return "good";
      return "neutral";
    }

    applyEffects(effects) {
      const labels = [];
      const state = this.state;
      Object.entries(effects.stats || {}).forEach(([stat, delta]) => {
        if (!NC.STATS.includes(stat)) return;
        state.stats[stat] = U.clamp(state.stats[stat] + delta, 0, 100);
        labels.push({ text: `${U.cap(stat)} ${delta > 0 ? "+" : ""}${delta}`, negative: delta < 0 });
      });
      if (Number.isFinite(effects.cash) && effects.cash !== 0) {
        state.finances.cash = Math.max(0, state.finances.cash + effects.cash);
        labels.push({ text: `${effects.cash > 0 ? "+" : "−"}${U.formatMoney(Math.abs(effects.cash), state.profile.currency)}`, negative: effects.cash < 0 });
      }
      if (Number.isFinite(effects.debt) && effects.debt !== 0) {
        state.finances.debt = Math.max(0, state.finances.debt + effects.debt);
        labels.push({ text: `Debt ${effects.debt > 0 ? "+" : "−"}${U.formatMoney(Math.abs(effects.debt), state.profile.currency)}`, negative: effects.debt > 0 });
      }
      if (effects.flags) Object.entries(effects.flags).forEach(([key, value]) => { state.flags[key] = value; });
      if (Number.isFinite(effects.educationPerformance)) {
        state.education.performance = U.clamp(state.education.performance + effects.educationPerformance, 0, 100);
        labels.push({ text: `Study ${effects.educationPerformance > 0 ? "+" : ""}${effects.educationPerformance}`, negative: effects.educationPerformance < 0 });
      }
      if (Number.isFinite(effects.careerPerformance) && state.career.active) {
        state.career.active.performance = U.clamp(state.career.active.performance + effects.careerPerformance, 0, 100);
        labels.push({ text: `Work ${effects.careerPerformance > 0 ? "+" : ""}${effects.careerPerformance}`, negative: effects.careerPerformance < 0 });
      }
      if (Number.isFinite(effects.salaryMultiplier) && state.career.active) {
        const before = state.career.active.salary;
        state.career.active.salary = Math.round(before * effects.salaryMultiplier);
        labels.push({ text: `Salary +${Math.round((effects.salaryMultiplier - 1) * 100)}%`, negative: false });
      }
      if (effects.relationship) {
        const person = this.findRelationship(effects.relationship.role);
        if (person) {
          person.closeness = U.clamp(person.closeness + effects.relationship.amount, 0, 100);
          labels.push({ text: `${person.firstName} ${effects.relationship.amount > 0 ? "+" : ""}${effects.relationship.amount}`, negative: effects.relationship.amount < 0 });
        }
      }
      if (effects.addRelationship) {
        const ageOffset = Number(effects.addRelationship.ageOffset || 0);
        const person = this.randomPerson(effects.addRelationship.role, {
          age: Math.max(0, state.age + ageOffset),
          closeness: effects.addRelationship.closeness,
          lastName: effects.addRelationship.role === "child" ? state.profile.lastName : undefined
        });
        state.relationships.push(person);
        labels.push({ text: `New ${person.role}: ${person.firstName}`, negative: false });
        if (person.role === "partner") state.flags.has_partner = true;
      }
      if (effects.endRelationship) {
        const person = this.findRelationship(effects.endRelationship.role);
        if (person) {
          person.role = "ex";
          person.color = personColor("ex");
          person.closeness = U.clamp(person.closeness - 25, 0, 100);
          labels.push({ text: `Separated from ${person.firstName}`, negative: true });
        }
      }
      if (effects.endCareer && state.career.active) {
        const title = state.career.active.title;
        this.leaveCareer("position ended");
        labels.push({ text: `${title} role ended`, negative: true });
      }
      if (effects.addPossession) {
        const catalog = this.data.catalogs.assets.find((asset) => asset.id === effects.addPossession);
        if (catalog) {
          state.assets.push(Object.assign({}, catalog, { instanceId: U.uid("asset"), value: catalog.price, condition: 100, boughtAge: state.age }));
          labels.push({ text: `Received ${catalog.label}`, negative: false });
        }
      }
      if (Number.isFinite(effects.legacy)) {
        state.legacy.score += effects.legacy;
        labels.push({ text: `Legacy +${effects.legacy}`, negative: false });
      }
      return labels;
    }

    findRelationship(role) {
      const living = this.state.relationships.filter((person) => person.alive !== false && (role === "random" || person.role === role));
      return living.length ? U.pick(this.state.rng, living) : null;
    }

    relationshipAction(personId, action) {
      this.assertFree("Regular relationship activities");
      const state = this.state;
      const person = state.relationships.find((item) => item.id === personId);
      if (!person || !person.alive) throw new Error("That person is not available.");
      if (state.activityPoints < 1) throw new Error("Age up to gain more action points.");
      const key = `${person.id}:${action}`;
      if (state.interactionLedger[key] === state.age) throw new Error("You already did that together this year.");
      let title;
      let text;
      if (action === "time") {
        person.closeness = U.clamp(person.closeness + 7, 0, 100);
        state.stats.happiness = U.clamp(state.stats.happiness + 3, 0, 100);
        const moments = state.age < 5 ? ["built a tower from blocks", "drew a wobbly family portrait", "played hide-and-seek behind the curtains"] : state.age < 13 ? ["made snacks and played a board game", "went to the park and invented silly challenges", "watched a film and argued about the best character"] : ["went for coffee and people-watched", "cooked a chaotic meal together", "took a long walk and traded stories"];
        const moment = U.pick(state.rng, moments);
        title = `Spent time with ${person.firstName}`;
        text = `You and ${person.firstName} ${moment}.`;
      } else if (action === "talk") {
        const lowRelationship = person.closeness < 18;
        const agreed = !lowRelationship && U.random(state.rng) < 0.82;
        person.closeness = U.clamp(person.closeness + (agreed ? 4 : -3), 0, 100);
        state.stats.resilience = U.clamp(state.stats.resilience + (agreed ? 2 : -1), 0, 100);
        const topics = state.age < 5 ? ["why the moon follows the car", "whether stuffed animals dream", "what makes thunder so loud"] : state.age < 13 ? ["a worry about school", "the weirdest dream you remember", "who should apologize after a playground argument"] : ["what you want from the next year", "a fear you rarely say aloud", "whether people can genuinely change", "a decision you have been avoiding", "how money should be handled in a family"];
        const topic = U.pick(state.rng, topics);
        const replies = agreed ? [
          `${person.firstName} asks what you think about ${topic}, and you answer honestly.`,
          `You ask ${person.firstName} about ${topic}. ${person.firstName} pauses, then gives you a surprisingly thoughtful answer.`,
          `${person.firstName} brings up ${topic}; the two of you disagree at first, but actually listen.`
        ] : [
          `You try to discuss ${topic}, but ${person.firstName} ends the conversation early.`,
          `${person.firstName} disagrees sharply when you ask about ${topic}, and neither of you handles it well.`
        ];
        title = `${agreed ? "Talked" : "Argued"} with ${person.firstName} about ${topic}`;
        text = U.pick(state.rng, replies);
      } else if (action === "compliment") {
        const mutual = U.random(state.rng) < Math.max(.18, person.closeness / 120);
        person.closeness = U.clamp(person.closeness + (mutual ? 8 : 5), 0, 100);
        state.stats.happiness = U.clamp(state.stats.happiness + (mutual ? 5 : 2), 0, 100);
        const compliments = ["their courage when things become awkward", "the way they make ordinary moments fun", "their sense of style", "how carefully they listen", "their determination"];
        const compliment = U.pick(state.rng, compliments);
        title = `Complimented ${person.firstName}`;
        text = mutual ? `You praise ${person.firstName} for ${compliment}. ${person.firstName} smiles and compliments you back.` : `You tell ${person.firstName} that you admire ${compliment}.`;
      } else if (action === "insult") {
        person.closeness = U.clamp(person.closeness - U.randomInt(state.rng, 9, 18), 0, 100);
        state.stats.happiness = U.clamp(state.stats.happiness - 2, 0, 100);
        const insults = ["their terrible timing", "their habit of making everything about themselves", "their questionable taste", "how stubborn they can be"];
        const insult = U.pick(state.rng, insults);
        title = `Insulted ${person.firstName}`;
        text = `You make a cutting remark about ${insult}. ${person.firstName} does not forget it.`;
      } else if (action === "gift") {
        if (state.finances.cash < 50) throw new Error("You need at least 50 in cash for a thoughtful gift.");
        state.finances.cash -= 50;
        const liked = U.random(state.rng) < Math.max(.35, person.closeness / 110);
        person.closeness = U.clamp(person.closeness + (liked ? 9 : -2), 0, 100);
        title = `Gave ${person.firstName} a gift`;
        text = liked ? "The small gift shows that you pay attention, and they genuinely like it." : `${person.firstName} thanks you politely, but the gift clearly misses the mark.`;
      } else {
        throw new Error("Unknown relationship action.");
      }
      state.activityPoints -= 1;
      state.interactionLedger[key] = state.age;
      this.log(title, text, "relationship", "💛");
      this.touch("relationship-action");
    }

    findDate() {
      this.assertFree("Dating");
      const state = this.state;
      if (state.age < 16) throw new Error("Dating becomes available at age 16.");
      if (state.relationships.some((p) => p.alive !== false && ["partner", "fiance", "spouse"].includes(p.role))) throw new Error("You already have a partner.");
      if (state.activityPoints < 1) throw new Error("Age up to gain more action points.");
      const age = Math.max(16, state.age + U.randomInt(state.rng, -2, 3));
      const person = this.randomPerson("partner", { age, closeness: U.randomInt(state.rng, 42, 68), relationshipStatus: "dating" });
      state.relationships.push(person);
      state.activityPoints -= 1;
      this.log(`Started dating ${person.firstName}`, `You meet ${person.firstName} and agree to see where the relationship goes.`, "relationship", "💞");
      this.touch("find-date");
      return person;
    }

    propose(personId, ringId) {
      this.assertFree("Proposing");
      const state = this.state;
      const person = state.relationships.find((p) => p.id === personId && p.alive !== false);
      if (!person || person.role !== "partner") throw new Error("You can only propose to a current partner.");
      if (state.age < 18 || person.age < 18) throw new Error("Both people must be at least 18 to become engaged.");
      if (state.activityPoints < 1) throw new Error("Age up to gain more action points.");
      const rings = { none: { label: "no ring", cost: 0, bonus: -.04 }, simple: { label: "a simple ring", cost: 900, bonus: .08 }, luxury: { label: "a luxury ring", cost: 12000, bonus: .18 }, fake: { label: "a fake ring", cost: 40, bonus: -.28 } };
      const ring = rings[ringId] || rings.none;
      if (state.finances.cash < ring.cost) throw new Error("You cannot afford that ring.");
      state.finances.cash -= ring.cost;
      state.activityPoints -= 1;
      const acceptance = U.clamp(.18 + person.closeness / 125 + ring.bonus + (state.stats.happiness - 50) / 500, .04, .96);
      const accepted = state.dev.alwaysWin || U.random(state.rng) < acceptance;
      if (accepted) {
        person.role = "fiance";
        person.relationshipStatus = "engaged";
        person.engagedAge = state.age;
        person.engagementRing = ringId || "none";
        person.closeness = U.clamp(person.closeness + 10, 0, 100);
        this.log(`${person.firstName} accepted`, `You proposed with ${ring.label}, and ${person.firstName} said yes.`, "milestone", "💍");
      } else {
        person.closeness = U.clamp(person.closeness - 9, 0, 100);
        this.log(`${person.firstName} declined`, `You proposed with ${ring.label}, but ${person.firstName} was not ready to marry.`, "bad", "💔");
      }
      this.touch("proposal");
      return accepted;
    }

    marry(personId, planId, surnameChoice, prenup) {
      this.assertFree("Planning a wedding");
      const state = this.state;
      const person = state.relationships.find((p) => p.id === personId && p.alive !== false);
      if (!person || person.role !== "fiance") throw new Error("You need an engaged partner before planning a wedding.");
      if (state.age < 18 || person.age < 18) throw new Error("Both people must be at least 18 to marry.");
      const plans = { simple: { label: "small civil wedding", cost: 800 }, classic: { label: "classic wedding", cost: 8500 }, lavish: { label: "lavish wedding and honeymoon", cost: 42000 } };
      const plan = plans[planId] || plans.simple;
      if (state.finances.cash < plan.cost) throw new Error("You cannot afford that wedding plan.");
      state.finances.cash -= plan.cost;
      const originalPlayerName = state.profile.lastName;
      const originalSpouseName = person.lastName;
      if (surnameChoice === "take") state.profile.lastName = originalSpouseName;
      else if (surnameChoice === "spouse-takes") person.lastName = originalPlayerName;
      else if (surnameChoice === "hyphenate") {
        const combined = `${originalPlayerName}-${originalSpouseName}`;
        state.profile.lastName = combined;
        person.lastName = combined;
      }
      person.role = "spouse";
      person.relationshipStatus = "married";
      person.marriage = {
        startedAge: state.age, years: 0, prenup: Boolean(prenup),
        surnameChoice: surnameChoice || "keep", weddingPlan: planId || "simple", lastVowRenewalAge: state.age
      };
      person.closeness = U.clamp(person.closeness + 12, 0, 100);
      this.log(`Married ${person.firstName}`, `You and ${person.firstName} celebrate a ${plan.label}${prenup ? " and sign a prenuptial agreement" : ""}.`, "milestone", "💒");
      if (U.random(state.rng) < .24) {
        const stepchild = this.randomPerson("stepchild", { age: U.randomInt(state.rng, 1, 14), closeness: U.randomInt(state.rng, 25, 55), lastName: person.lastName });
        state.relationships.push(stepchild);
        this.log("A stepchild joins the family", `${stepchild.firstName} ${stepchild.lastName}, ${person.firstName}'s child from an earlier relationship, becomes part of your family.`, "relationship", "🧒");
      }
      this.touch("marriage");
    }

    divorce(personId) {
      this.assertFree("Divorce");
      const state = this.state;
      const person = state.relationships.find((p) => p.id === personId && p.alive !== false);
      if (!person || person.role !== "spouse") throw new Error("That person is not your spouse.");
      const prenup = Boolean(person.marriage && person.marriage.prenup);
      const legalCost = prenup ? 1200 : Math.max(2500, Math.round(Math.max(0, this.netWorth()) * U.randomInt(state.rng, 15, 36) / 100));
      const paid = Math.min(state.finances.cash, legalCost);
      state.finances.cash -= paid;
      if (paid < legalCost) state.finances.debt += legalCost - paid;
      person.role = "ex";
      person.relationshipStatus = "divorced";
      person.divorcedAge = state.age;
      person.closeness = U.clamp(person.closeness - 28, 0, 100);
      state.relationships.filter((p) => p.role === "stepchild" && p.alive !== false).forEach((p) => { p.role = "former_stepchild"; });
      this.log(`Divorced ${person.firstName}`, prenup ? `The prenup limits the financial damage to ${U.formatMoney(legalCost, state.profile.currency)} in legal costs.` : `The divorce settlement and legal costs total ${U.formatMoney(legalCost, state.profile.currency)}.`, "bad", "📄");
      this.touch("divorce");
    }

    renewVows(personId) {
      this.assertFree("Renewing vows");
      const state = this.state;
      const person = state.relationships.find((p) => p.id === personId && p.alive !== false);
      if (!person || person.role !== "spouse" || !person.marriage) throw new Error("That person is not your spouse.");
      const years = state.age - person.marriage.lastVowRenewalAge;
      if (years < 10) throw new Error(`Wait ${10 - years} more year${10 - years === 1 ? "" : "s"} before renewing vows.`);
      if (person.closeness < 65) throw new Error("Your relationship needs to be stronger first.");
      const cost = 2500;
      if (state.finances.cash < cost) throw new Error("You need more money for the celebration.");
      state.finances.cash -= cost;
      person.marriage.lastVowRenewalAge = state.age;
      person.closeness = U.clamp(person.closeness + 10, 0, 100);
      this.log("Renewed wedding vows", `You and ${person.firstName} celebrate the years you have built together.`, "milestone", "💐");
      this.touch("renew-vows");
    }

    reconcile(personId) {
      this.assertFree("Reconciliation");
      const state = this.state;
      const person = state.relationships.find((p) => p.id === personId && p.alive !== false);
      if (!person || person.role !== "ex") throw new Error("That person is not an ex.");
      if (person.closeness < 55) throw new Error("The relationship is not strong enough to try again.");
      if (state.relationships.some((p) => p.alive !== false && ["partner", "fiance", "spouse"].includes(p.role))) throw new Error("You already have a partner.");
      const accepted = state.dev.alwaysWin || U.random(state.rng) < person.closeness / 110;
      if (accepted) { person.role = "partner"; person.relationshipStatus = "dating"; this.log(`Reunited with ${person.firstName}`, "You agree to begin again as partners, not as spouses.", "relationship", "💞"); }
      else { person.closeness = U.clamp(person.closeness - 8, 0, 100); this.log(`${person.firstName} declined`, "Your ex does not want to restart the relationship.", "bad", "💔"); }
      this.touch("reconcile");
      return accepted;
    }

    planFuneral(personId, method) {
      const state = this.state;
      const person = state.relationships.find((p) => p.id === personId && p.alive === false && p.funeralPending);
      if (!person) throw new Error("There is no funeral waiting for that person.");
      const options = { burial: { label: "burial", cost: 6500 }, cremation: { label: "cremation", cost: 2200 }, science: { label: "donation to science", cost: 0 } };
      const option = options[method] || options.cremation;
      const paid = Math.min(state.finances.cash, option.cost);
      state.finances.cash -= paid;
      if (paid < option.cost) state.finances.debt += option.cost - paid;
      person.funeralPending = false;
      person.restingPlace = method || "cremation";
      this.log(`Planned ${person.firstName}'s funeral`, `You choose ${option.label}${option.cost ? ` at a cost of ${U.formatMoney(option.cost, state.profile.currency)}` : ""}.`, "relationship", "🕯️");
      this.touch("funeral");
    }

    startActivity(activityId) {
      this.assertFree("Activities");
      const activity = this.data.catalogs.activities.find((item) => item.id === activityId);
      if (!activity) throw new Error("Activity not found.");
      if (this.state.pendingEvent) throw new Error("Finish the current event first.");
      if (this.state.age < activity.minAge) throw new Error(`Available from age ${activity.minAge}.`);
      if (Number.isFinite(activity.maxAge) && this.state.age > activity.maxAge) throw new Error(`Only available through age ${activity.maxAge}.`);
      if (activity.vampireOnly && !this.state.flags.vampire) throw new Error("Only vampires can do that.");
      if (this.state.activityPoints < 1) throw new Error("Age up to gain more action points.");
      if (this.state.finances.cash < activity.cost) throw new Error(`You need ${U.formatMoney(activity.cost, this.state.profile.currency)}.`);
      this.state.finances.cash -= activity.cost;
      if (activity.humanOnly && this.state.flags.vampire) throw new Error("That activity is unavailable in vampire mode.");
      if (activity.hungerDelta && this.state.vampire) this.state.vampire.hunger = U.clamp(this.state.vampire.hunger + activity.hungerDelta, 0, 100);
      if (this.state.profile.specialTalent === "sports" && ["long_walk", "fitness"].includes(activity.id)) {
        this.state.stats.health = U.clamp(this.state.stats.health + 5, 0, 100);
        this.state.stats.resilience = U.clamp(this.state.stats.resilience + 3, 0, 100);
      }
      if (this.state.profile.specialTalent === "music" && activity.id === "reflection") this.state.stats.happiness = U.clamp(this.state.stats.happiness + 3, 0, 100);
      this.state.activityPoints -= 1;
      this.state.pendingEvent = { eventId: activity.eventId, source: "activity", resolved: null };
      this.touch("activity-started");
    }

    buyAsset(assetId) {
      this.assertFree("Shopping");
      const catalog = this.data.catalogs.assets.find((item) => item.id === assetId);
      if (!catalog) throw new Error("Asset not found.");
      if (this.state.age < catalog.minAge) throw new Error(`Available from age ${catalog.minAge}.`);
      if (catalog.kind === "possession" && this.state.assets.some((item) => item.id === catalog.id)) throw new Error("You already own this.");
      const upfront = catalog.kind === "property" ? catalog.downPayment : catalog.price;
      if (this.state.finances.cash < upfront) throw new Error(`You need ${U.formatMoney(upfront, this.state.profile.currency)} in cash.`);
      this.state.finances.cash -= upfront;
      if (catalog.kind === "property") this.state.finances.debt += catalog.price - catalog.downPayment;
      this.state.assets.push(Object.assign({}, catalog, {
        instanceId: U.uid("asset"),
        value: catalog.price,
        condition: 100,
        boughtAge: this.state.age
      }));
      this.log(`Bought ${catalog.label.toLocaleLowerCase()}`, catalog.kind === "property" ? `You put down ${U.formatMoney(upfront, this.state.profile.currency)} and take on a mortgage.` : catalog.description, "money", catalog.icon);
      this.touch("asset-bought");
    }

    sellAsset(instanceId) {
      this.assertFree("Selling assets");
      const index = this.state.assets.findIndex((item) => item.instanceId === instanceId);
      if (index < 0) throw new Error("Asset not found.");
      const asset = this.state.assets[index];
      let proceeds = Math.round(asset.value * (asset.kind === "property" ? 0.93 : 0.72));
      if (asset.kind === "property" && this.state.finances.debt > 0) {
        const payoff = Math.min(this.state.finances.debt, Math.round(asset.price * 0.8));
        this.state.finances.debt -= payoff;
        proceeds = Math.max(0, proceeds - payoff);
      }
      this.state.finances.cash += proceeds;
      this.state.assets.splice(index, 1);
      this.log(`Sold ${asset.label.toLocaleLowerCase()}`, `After costs and any loan payoff, you receive ${U.formatMoney(proceeds, this.state.profile.currency)}.`, "money", "🏷️");
      this.touch("asset-sold");
    }

    die(cause, shouldTouch) {
      if (!this.state.alive) return;
      const state = this.state;
      const estate = Math.max(0, this.netWorth());
      const record = {
        id: state.saveId,
        name: `${state.profile.firstName} ${state.profile.lastName}`,
        firstName: state.profile.firstName,
        lastName: state.profile.lastName,
        age: state.age,
        year: state.year,
        cause,
        generation: state.legacy.generation,
        legacyScore: state.legacy.score,
        estate
      };
      state.alive = false;
      state.death = { cause, age: state.age, year: state.year, estate };
      state.pendingEvent = null;
      state.legacy.graveyard.push(record);
      this.log("The chapter closes", `${state.profile.firstName} dies at age ${state.age} from ${cause}.`, "bad", "🕯️");
      if (shouldTouch !== false) this.touch("death");
    }

    eligibleHeirs() {
      return this.state.relationships.filter((person) => person.alive !== false && person.role === "child");
    }

    continueAs(personId) {
      const old = this.state;
      const heir = this.eligibleHeirs().find((person) => person.id === personId);
      if (!heir) throw new Error("That heir is not available.");
      const inheritedCash = Math.max(0, Math.round((old.finances.cash - old.finances.debt) * 0.9));
      const inheritedDebt = Math.max(0, Math.round(old.finances.debt - old.finances.cash));
      const inheritedAssets = U.deepClone(old.assets);
      const graveyard = U.deepClone(old.legacy.graveyard);
      const generation = old.legacy.generation + 1;
      const parentRecord = {
        id: U.uid("person"),
        firstName: old.profile.firstName,
        lastName: old.profile.lastName,
        identity: old.profile.identity,
        pronouns: old.profile.pronouns,
        role: "parent",
        age: old.age,
        closeness: heir.closeness,
        health: 0,
        alive: false,
        deathAge: old.age,
        color: personColor("parent")
      };
      const siblingRelations = old.relationships
        .filter((person) => person.role === "child" && person.id !== heir.id)
        .map((person) => Object.assign({}, U.deepClone(person), { role: "sibling", color: personColor("sibling") }));
      const otherParent = old.relationships
        .filter((person) => person.role === "partner" && person.alive !== false)
        .map((person) => Object.assign({}, U.deepClone(person), { role: "parent", color: personColor("parent") }));

      const credentials = [];
      if (heir.age >= 12) credentials.push("primary");
      if (heir.age >= 18) credentials.push("secondary");
      this.state = {
        schemaVersion: NC.SCHEMA_VERSION,
        dataVersion: this.data.dataVersion,
        saveId: U.uid("life"),
        revision: 1,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        year: old.year,
        age: heir.age,
        alive: true,
        death: null,
        profile: {
          firstName: heir.firstName,
          lastName: heir.lastName,
          identity: heir.identity,
          pronouns: heir.pronouns,
          specialTalent: U.random(old.rng) < 0.35 ? (old.profile.specialTalent || "none") : "none",
          avatar: heir.avatar || old.profile.avatar,
          supernatural: "human",
          originId: old.profile.originId,
          city: old.profile.city,
          country: old.profile.country,
          currency: old.profile.currency,
          upbringingId: "legacy",
          traits: ["Second-generation", U.pick(old.rng, ["Reflective", "Determined", "Open-hearted"])]
        },
        stats: {
          health: U.clamp(heir.health + U.randomInt(old.rng, -5, 8), 25, 95),
          happiness: U.clamp(45 + Math.round(heir.closeness / 5), 30, 85),
          knowledge: U.clamp(40 + heir.age, 35, 82),
          resilience: U.clamp(45 + generation * 3, 35, 85)
        },
        finances: { cash: inheritedCash, debt: inheritedDebt, annualIncome: 0, annualExpenses: 0, lastNet: 0 },
        education: { status: "not_enrolled", programId: null, field: null, yearsComplete: 0, performance: 50, credentials, history: [] },
        career: { active: null, history: [] },
        assets: inheritedAssets,
        relationships: [parentRecord].concat(siblingRelations, otherParent),
        activityPoints: 2,
        flags: { inherited_generation: true },
        fame: 0,
        crime: { arrests: 0, convictions: 0, successfulCrimes: 0, bankRobberies: 0, uncaughtBankRobberies: 0, uncaughtMurders: 0, jailYears: 0, record: [], convictionHistory: [], pendingCourt: null, incarceration: null },
        challenges: U.deepClone(old.challenges),
        dev: U.deepClone(old.dev),
        timeline: [],
        eventLedger: { history: [], lastSeenAge: {} },
        pendingEvent: null,
        interactionLedger: {},
        rng: old.rng,
        legacy: { generation, score: old.legacy.score, graveyard, completedChallenges: U.deepClone(old.legacy.completedChallenges || []) }
      };
      this.ensureExpansionState();
      const debtCopy = inheritedDebt > 0 ? ` Property-linked debt of ${U.formatMoney(inheritedDebt, this.state.profile.currency)} also remains with the estate.` : "";
      this.log("A story passed forward", `${heir.firstName} inherits ${U.formatMoney(inheritedCash, this.state.profile.currency)} and begins generation ${generation} of the family story.${debtCopy}`, "milestone", "🌿");
      this.touch("next-generation");
      return this.state;
    }

    updateChallenges() {
      const c = this.state.challenges.bankRobber;
      const completed = this.state.legacy.completedChallenges.includes("bank_robber");
      c.famous = this.state.fame >= 70;
      if (completed) {
        c.completed = true;
        return;
      }
      if (!c.completed && c.robberySucceededUncaught && c.famous) {
        c.completed = true;
        c.completedAge = this.state.age;
        c.completedGeneration = this.state.legacy.generation;
        this.state.legacy.completedChallenges.push("bank_robber");
        this.state.legacy.score += 25;
        this.log("Challenge completed: Bank Robber", "You completed an uncaught bank robbery and became famous. This challenge is now permanently completed for this family line.", "milestone", "🏆");
      }
    }

    crimeCheck(kind) {
      if (this.state.age < 14) return { allowed: false, reason: "Crime options begin at age 14" };
      if (kind === "bank" && this.state.age < 18) return { allowed: false, reason: "Bank robbery requires age 18" };
      if (kind === "murder" && this.state.age < 18) return { allowed: false, reason: "This option requires age 18" };
      if (this.isIncarcerated()) return { allowed: false, reason: "Unavailable while in custody" };
      if (this.state.crime.pendingCourt) return { allowed: false, reason: "Resolve the court case first" };
      if (this.state.activityPoints < 1) return { allowed: false, reason: "Age up for more actions" };
      return { allowed: true, reason: "" };
    }

    commitCrime(kind, targetId) {
      this.ensureExpansionState();
      const check = this.crimeCheck(kind);
      if (!check.allowed) throw new Error(check.reason);
      const state = this.state;
      state.activityPoints -= 1;
      const config = {
        shoplift: { label: "Shoplifting", success: .72, caught: .28, reward: [20, 180], fame: 1, sentence: [0, 1] },
        burglary: { label: "Burglary", success: .54, caught: .42, reward: [500, 6500], fame: 4, sentence: [1, 5] },
        bank: { label: "Bank robbery", success: .34, caught: .57, reward: [18000, 160000], fame: 22, sentence: [6, 22] },
        murder: { label: "Murder", success: .30, caught: .68, reward: [0, 0], fame: 18, sentence: [18, 45] }
      }[kind];
      if (!config) throw new Error("Unknown crime.");
      const target = targetId ? state.relationships.find((p) => p.id === targetId && p.alive !== false) : null;
      if (kind === "murder" && !target) throw new Error("Choose a living person.");
      const crimeTalent = state.profile.specialTalent === "crime";
      const dealingTalent = state.profile.specialTalent === "dealing";
      const successChance = U.clamp(config.success + (crimeTalent ? .13 : 0) + (dealingTalent && kind !== "murder" ? .04 : 0), .05, .95);
      const caughtChance = U.clamp(config.caught - (crimeTalent ? .12 : 0), .02, .95);
      const success = state.dev.alwaysWin || U.random(state.rng) < successChance;
      const caught = state.dev.neverCaught ? false : (!state.dev.alwaysWin && U.random(state.rng) < (success ? caughtChance : Math.min(.92, caughtChance + .18)));
      let reward = 0;
      if (success) {
        reward = Math.round(U.randomInt(state.rng, config.reward[0], config.reward[1]) * (dealingTalent && kind !== "murder" ? 1.10 : 1));
        state.finances.cash += reward;
        state.crime.successfulCrimes += 1;
        state.fame = U.clamp(state.fame + config.fame + U.randomInt(state.rng, 0, 7), 0, 100);
        if (kind === "bank") state.crime.bankRobberies += 1;
        if (kind === "murder") { target.alive = false; target.deathAge = target.age; target.closeness = 0; }
      }
      if (kind === "bank" && success && !caught) {
        state.crime.uncaughtBankRobberies += 1;
        state.challenges.bankRobber.robberySucceededUncaught = true;
      }
      if (kind === "murder" && success && !caught) state.crime.uncaughtMurders += 1;
      const record = { id: U.uid("crime"), kind, label: config.label, age: state.age, success, caught, reward, target: target ? `${target.firstName} ${target.lastName}` : null };
      state.crime.record.unshift(record);
      if (caught) {
        state.crime.arrests += 1;
        state.crime.pendingCourt = { crimeId: record.id, label: config.label, baseSentence: U.randomInt(state.rng, config.sentence[0], config.sentence[1]), severity: kind, evidence: U.randomInt(state.rng, success ? 35 : 55, 92) };
        this.log("Arrested by police", `Police connected you to ${config.label.toLocaleLowerCase()}. Your case is going to court.`, "bad", "🚓");
      } else if (success) {
        this.log(`${config.label} succeeded`, kind === "murder" ? `${target.firstName} ${target.lastName} died as a result of your crime, and police did not make an immediate arrest.` : `You escaped with ${U.formatMoney(reward, state.profile.currency)} and were not caught.`, "bad", "🕶️");
      } else {
        this.log(`${config.label} failed`, "The attempt failed, but police did not make an arrest.", "bad", "⚠️");
      }
      this.updateChallenges();
      this.touch("crime");
      return { success, caught };
    }

    startIncarceration(court, years) {
      const state = this.state;
      const juvenile = state.age < 18;
      const originalYears = Math.max(1, U.int(years, 1));
      const sentence = {
        id: U.uid("sentence"), offense: court.label, severity: court.severity,
        originalYears, yearsRemaining: originalYears, servedYears: 0, startedAge: state.age,
        facility: juvenile ? "Juvenile detention centre" : originalYears >= 18 ? "Central penitentiary" : "Regional correctional facility",
        security: originalYears >= 18 ? "maximum" : originalYears >= 6 ? "medium" : "minimum",
        conduct: 55, appealsUsed: 0, paroleDeniedAtAge: null, escaped: false
      };
      if (state.career.active) this.leaveCareer("conviction");
      if (state.education.status === "enrolled" && !["primary", "secondary"].includes(state.education.programId)) {
        state.education.history.push({ programId: state.education.programId, field: state.education.field, completed: false, years: state.education.yearsComplete, leftAge: state.age, reason: "conviction" });
        state.education.status = "none";
        state.education.programId = null;
        state.education.field = null;
        state.education.yearsComplete = 0;
      }
      state.crime.incarceration = sentence;
      state.crime.jailYears = originalYears;
      state.crime.convictionHistory.unshift({ id: U.uid("conviction"), offense: court.label, age: state.age, years: originalYears, completed: false });
      state.activityPoints = 2;
      return sentence;
    }

    resolveCourt(lawyerId) {
      this.ensureExpansionState();
      const court = this.state.crime.pendingCourt;
      if (!court) throw new Error("There is no active court case.");
      const lawyers = { public: { label: "Public defender", cost: 0, chance: .18 }, local: { label: "Local lawyer", cost: 2500, chance: .38 }, specialist: { label: "Criminal defence specialist", cost: 15000, chance: .62 }, elite: { label: "Elite legal team", cost: 60000, chance: .82 } };
      const lawyer = lawyers[lawyerId];
      if (!lawyer) throw new Error("Choose a lawyer.");
      if (this.state.finances.cash < lawyer.cost) throw new Error("You cannot afford that lawyer.");
      this.state.finances.cash -= lawyer.cost;
      const statBonus = (this.state.stats.knowledge - 50) / 500;
      const evidencePenalty = Number.isFinite(court.evidence) ? court.evidence / 260 : .12;
      const priorPenalty = Math.min(.16, this.state.crime.convictions * .035);
      const severityPenalty = court.severity === "murder" ? .12 : court.severity === "bank" ? .07 : court.severity === "burglary" ? .03 : 0;
      const chance = this.state.dev.alwaysWin ? 1 : Math.min(.95, Math.max(.03, lawyer.chance + statBonus - evidencePenalty - priorPenalty - severityPenalty));
      const acquitted = this.state.dev.alwaysWin || U.random(this.state.rng) < chance;
      if (acquitted) {
        this.log("Found not guilty", `${lawyer.label} persuaded the court. You leave without a conviction.`, "good", "⚖️");
      } else {
        const repeatModifier = Math.min(12, this.state.crime.convictions * 2);
        const years = Math.max(1, court.baseSentence + repeatModifier + U.randomInt(this.state.rng, -1, 3));
        this.state.crime.convictions += 1;
        const sentence = this.startIncarceration(court, years);
        this.state.fame = U.clamp(this.state.fame + 8, 0, 100);
        this.log("Convicted in court", `The court sentenced you to ${sentence.originalYears} year${sentence.originalYears === 1 ? "" : "s"} in ${sentence.facility.toLocaleLowerCase()} for ${court.label.toLocaleLowerCase()}.`, "bad", "🔒");
      }
      this.state.crime.pendingCourt = null;
      this.updateChallenges();
      this.touch("court");
      return acquitted;
    }

    prisonAction(kind, personId) {
      const state = this.state;
      const sentence = this.currentSentence();
      if (!sentence) throw new Error("You are not incarcerated.");
      if (state.activityPoints < 1) throw new Error("Age up to gain more prison actions.");
      if (kind === "exercise") {
        state.stats.health = U.clamp(state.stats.health + 4, 0, 100);
        state.stats.resilience = U.clamp(state.stats.resilience + 3, 0, 100);
        sentence.conduct = U.clamp(sentence.conduct + 2, 0, 100);
        this.log("Exercised in the yard", "You follow a simple training routine and keep your head clear.", "good", "🏃");
      } else if (kind === "read") {
        state.stats.knowledge = U.clamp(state.stats.knowledge + 5, 0, 100);
        sentence.conduct = U.clamp(sentence.conduct + 2, 0, 100);
        this.log("Studied in the prison library", "You spend the afternoon reading and taking notes.", "good", "📚");
      } else if (kind === "work") {
        const pay = U.randomInt(state.rng, 8, 35);
        state.finances.cash += pay;
        sentence.conduct = U.clamp(sentence.conduct + 3, 0, 100);
        this.log("Completed a prison work shift", `You earn ${U.formatMoney(pay, state.profile.currency)} and improve your conduct record.`, "money", "🧹");
      } else if (kind === "call") {
        const person = state.relationships.find((p) => p.id === personId && p.alive !== false);
        if (!person) throw new Error("Choose someone who can receive the call.");
        person.closeness = U.clamp(person.closeness + 5, 0, 100);
        state.stats.happiness = U.clamp(state.stats.happiness + 3, 0, 100);
        this.log(`Called ${person.firstName} from custody`, `${person.firstName} tells you about life outside and promises not to forget you.`, "relationship", "☎️");
      } else if (kind === "parole") {
        const minimumServed = Math.max(1, Math.ceil(sentence.originalYears * .45));
        if (sentence.servedYears < minimumServed) throw new Error(`Parole becomes available after serving ${minimumServed} year${minimumServed === 1 ? "" : "s"}.`);
        if (sentence.paroleDeniedAtAge === state.age) throw new Error("You already requested parole this year.");
        const chance = state.dev.alwaysWin ? 1 : Math.min(.88, Math.max(.08, .18 + sentence.conduct / 170 + state.stats.resilience / 500 - (sentence.security === "maximum" ? .12 : 0)));
        const granted = state.dev.alwaysWin || U.random(state.rng) < chance;
        if (granted) {
          sentence.yearsRemaining = 0;
          state.crime.incarceration = null;
          state.crime.jailYears = 0;
          this.log("Parole granted", "The parole board releases you early under supervision.", "milestone", "🚪");
        } else {
          sentence.paroleDeniedAtAge = state.age;
          sentence.conduct = U.clamp(sentence.conduct - 2, 0, 100);
          this.log("Parole denied", "The board decides that you must serve more of the sentence.", "bad", "📋");
        }
      } else if (kind === "escape") {
        const chance = state.dev.alwaysWin ? 1 : Math.max(.02, .10 + state.stats.resilience / 900 - (sentence.security === "maximum" ? .06 : sentence.security === "medium" ? .03 : 0));
        const escaped = state.dev.alwaysWin || U.random(state.rng) < chance;
        if (escaped) {
          sentence.escaped = true;
          state.crime.incarceration = null;
          state.crime.jailYears = 0;
          state.flags.fugitive = true;
          this.log("Escaped custody", "You slip beyond the facility perimeter and become a fugitive. Police may find you in a later year.", "bad", "🏃");
        } else {
          const added = U.randomInt(state.rng, 1, 5);
          sentence.originalYears += added;
          sentence.yearsRemaining += added;
          sentence.conduct = U.clamp(sentence.conduct - 18, 0, 100);
          state.crime.jailYears = sentence.yearsRemaining;
          this.log("Escape attempt failed", `Security catches the attempt and ${added} year${added === 1 ? " is" : "s are"} added to your sentence.`, "bad", "🚨");
        }
      } else {
        throw new Error("Unknown prison action.");
      }
      state.activityPoints = Math.max(0, state.activityPoints - 1);
      this.touch("prison-action");
    }

    appealSentence(lawyerId) {
      const state = this.state;
      const sentence = this.currentSentence();
      if (!sentence) throw new Error("You are not incarcerated.");
      if (sentence.appealsUsed >= 2) throw new Error("No further appeals are available for this sentence.");
      const lawyers = { public: { label: "Appeal defender", cost: 0, chance: .09 }, local: { label: "Appeal lawyer", cost: 4500, chance: .20 }, specialist: { label: "Appellate specialist", cost: 22000, chance: .36 }, elite: { label: "Elite appellate team", cost: 85000, chance: .52 } };
      const lawyer = lawyers[lawyerId];
      if (!lawyer) throw new Error("Choose an appeal lawyer.");
      if (state.finances.cash < lawyer.cost) throw new Error("You cannot afford that appeal.");
      state.finances.cash -= lawyer.cost;
      sentence.appealsUsed += 1;
      const chance = state.dev.alwaysWin ? 1 : Math.min(.82, Math.max(.02, lawyer.chance + (state.stats.knowledge - 50) / 700 - state.crime.convictions / 50));
      const won = state.dev.alwaysWin || U.random(state.rng) < chance;
      if (won) {
        state.crime.incarceration = null;
        state.crime.jailYears = 0;
        state.crime.convictions = Math.max(0, state.crime.convictions - 1);
        this.log("Appeal successful", `${lawyer.label} overturns the conviction and you are released.`, "milestone", "⚖️");
      } else {
        this.log("Appeal rejected", `${lawyer.label} cannot persuade the appeals court to change the verdict.`, "bad", "⚖️");
      }
      this.touch("appeal");
      return won;
    }

    devToggle(key) {
      if (!["alwaysWin", "neverCaught", "alwaysHired", "instantPromotions"].includes(key)) throw new Error("Unknown developer option.");
      this.state.dev[key] = !this.state.dev[key];
      this.touch("dev-toggle");
    }

    devFame() { this.state.fame = 100; this.updateChallenges(); this.touch("dev-fame"); }
    devClearRecord() { this.state.crime = { arrests: 0, convictions: 0, successfulCrimes: 0, bankRobberies: 0, uncaughtBankRobberies: 0, uncaughtMurders: 0, jailYears: 0, record: [], convictionHistory: [], pendingCourt: null, incarceration: null }; this.state.flags.fugitive = false; this.touch("dev-record"); }
    devCompleteChallenge() {
      if (this.state.legacy.completedChallenges.includes("bank_robber")) return false;
      this.state.fame = 100;
      this.state.challenges.bankRobber.robberySucceededUncaught = true;
      this.updateChallenges();
      this.touch("dev-challenge");
      return true;
    }

    devUnlockAssassin() {
      this.state.crime.uncaughtMurders = Math.max(3, this.state.crime.uncaughtMurders || 0);
      this.touch("dev-assassin-unlock");
    }

    devPromoteCareer() {
      const active = this.state.career.active;
      if (!active) throw new Error("There is no active career.");
      if (active.jobId === "assassin") {
        if (active.level >= 3) throw new Error("The assassin career is already at level 3.");
        active.level += 1;
        active.title = active.level === 2 ? "High-profile assassin" : "Elite state assassin";
        active.salary = active.level === 2 ? 190000 : 420000;
        active.contractsAtLevel = 0;
        this.log("Developer promoted career", `The underground career advanced to level ${active.level}.`, "neutral", "🧪");
      } else if (!this.promoteCareer(true)) {
        throw new Error("This career is already at its highest promotion.");
      }
      this.touch("dev-promotion");
    }

    devSkipSentence() {
      if (!this.isIncarcerated()) throw new Error("There is no active sentence.");
      this.state.crime.incarceration = null;
      this.state.crime.jailYears = 0;
      this.log("Developer released character", "The active sentence was cleared for testing.", "neutral", "🧪");
      this.touch("dev-sentence");
    }

    devAddPartner() {
      if (this.state.relationships.some((p) => p.alive !== false && ["partner", "fiance", "spouse"].includes(p.role))) throw new Error("A current partner already exists.");
      const person = this.randomPerson("partner", { age: Math.max(18, this.state.age), closeness: 90, relationshipStatus: "dating" });
      this.state.relationships.push(person);
      this.touch("dev-partner");
    }

    devSetAge(age) {
      const target = U.clamp(U.int(age, this.state.age), 0, 110);
      const delta = target - this.state.age;
      this.state.age = target;
      this.state.year += delta;
      if (target >= 12 && !this.state.education.credentials.includes("primary")) this.state.education.credentials.push("primary");
      if (target >= 18 && !this.state.education.credentials.includes("secondary")) this.state.education.credentials.push("secondary");
      this.log("Developer adjusted the timeline", `Age was set to ${target} for testing.`, "neutral", "🧪");
      this.touch("dev-age");
    }

    devCash(amount) {
      this.state.finances.cash = Math.max(0, this.state.finances.cash + U.int(amount, 0));
      this.touch("dev-cash");
    }

    devMaxStats() {
      NC.STATS.forEach((stat) => { this.state.stats[stat] = 100; });
      this.touch("dev-stats");
    }

    devAddChild() {
      const child = this.randomPerson("child", { age: 0, closeness: 80, lastName: this.state.profile.lastName });
      this.state.relationships.push(child);
      this.log("Developer added an heir", `${child.firstName} joins the family for testing.`, "relationship", "🧪");
      this.touch("dev-child");
    }

    devTriggerEvent(eventId) {
      const event = this.events.byId(eventId);
      if (!event) throw new Error("Event ID not found.");
      this.state.pendingEvent = { eventId: event.id, source: "developer", resolved: null };
      this.touch("dev-event");
    }
  }

  NC.GameEngine = GameEngine;
})(window);
