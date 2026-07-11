(function installNextChapterV20(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine && NC.GameEngine.prototype;

  NC.APP_VERSION = "2.0.0";
  NC.SCHEMA_VERSION = Math.max(NC.SCHEMA_VERSION || 1, 11);

  const CENTERS = NC.ACTIVITY_CENTERS = {
    wellness: {
      id: "wellness", label: "Health & Mind", icon: "🧘", metricLabel: "Wellness readiness",
      description: "Health, age, resilience, money, and special talents change the result of every option.",
      options: [
        { id: "doctor", label: "Visit a doctor", icon: "🩺", minAge: 0, cost: 180, base: 74, skill: "health", effect: "medical" },
        { id: "gym", label: "Go to the gym", icon: "🏋️", minAge: 12, cost: 35, base: 52, skill: "health", talent: "sports", effect: "gym" },
        { id: "meditate", label: "Meditate", icon: "🧘", minAge: 6, cost: 0, base: 58, skill: "resilience", effect: "meditate" },
        { id: "library", label: "Visit the library", icon: "📚", minAge: 6, cost: 0, base: 56, skill: "knowledge", effect: "library" },
        { id: "therapy", label: "Attend therapy", icon: "💬", minAge: 12, cost: 360, base: 68, skill: "resilience", effect: "therapy" },
        { id: "balanced_diet", label: "Balanced diet", icon: "🥗", minAge: 18, cost: 90, base: 72, skill: "health", effect: "diet", plan: "Balanced" },
        { id: "mediterranean_diet", label: "Mediterranean-style diet", icon: "🫒", minAge: 18, cost: 130, base: 76, skill: "health", effect: "diet", plan: "Mediterranean-style" }
      ]
    },
    social: {
      id: "social", label: "Social Media", icon: "📱", metricLabel: "Audience potential",
      description: "Follower growth depends on age, fame, knowledge, happiness, consistency, and creative talents.",
      options: [
        { id: "status", label: "Post a life update", icon: "✍️", minAge: 13, cost: 0, base: 54, skill: "knowledge", effect: "post", multiplier: 1 },
        { id: "creative", label: "Post a creative video", icon: "🎬", minAge: 13, cost: 25, base: 48, skill: "happiness", talentAny: ["acting", "music", "modeling"], effect: "post", multiplier: 2.2 },
        { id: "livestream", label: "Host a livestream", icon: "🔴", minAge: 16, cost: 45, base: 42, skill: "resilience", requiresFollowers: 500, effect: "post", multiplier: 3 },
        { id: "collaboration", label: "Arrange a collaboration", icon: "🤝", minAge: 16, cost: 220, base: 38, skill: "happiness", requiresFollowers: 5000, effect: "post", multiplier: 6 },
        { id: "brand", label: "Accept a brand campaign", icon: "📣", minAge: 18, cost: 0, base: 34, skill: "resilience", requiresFollowers: 25000, effect: "brand", multiplier: 8 }
      ]
    },
    clubs: {
      id: "clubs", label: "Clubs & Teams", icon: "🎭", metricLabel: "Acceptance chance",
      description: "Age, school stage, skills, talents, and previous club experience affect acceptance.",
      options: [
        { id: "drama", label: "Drama club", icon: "🎭", minAge: 8, maxAge: 22, cost: 0, base: 48, skill: "happiness", talent: "acting", effect: "club" },
        { id: "sports", label: "Sports team", icon: "⚽", minAge: 8, maxAge: 22, cost: 45, base: 42, skill: "health", talent: "sports", effect: "club" },
        { id: "music", label: "Music club", icon: "🎵", minAge: 8, maxAge: 22, cost: 70, base: 44, skill: "knowledge", talent: "music", effect: "club" },
        { id: "debate", label: "Debate society", icon: "🗣️", minAge: 12, maxAge: 30, cost: 0, base: 46, skill: "knowledge", effect: "club" },
        { id: "volunteer", label: "Volunteer group", icon: "🤲", minAge: 12, cost: 0, base: 66, skill: "resilience", effect: "club" }
      ]
    },
    licenses: {
      id: "licenses", label: "Licenses", icon: "🪪", metricLabel: "Test pass chance",
      description: "Knowledge, resilience, age, health, and criminal history affect licensing tests.",
      options: [
        { id: "driver", label: "Driver's license", icon: "🚗", minAge: 16, cost: 260, base: 38, skill: "knowledge", effect: "license" },
        { id: "boat", label: "Boating license", icon: "⛵", minAge: 18, cost: 620, base: 34, skill: "knowledge", effect: "license" },
        { id: "pilot", label: "Pilot's license", icon: "✈️", minAge: 21, cost: 6200, base: 20, skill: "knowledge", minHealth: 65, effect: "license" }
      ]
    },
    legal: {
      id: "legal", label: "Civil Law", icon: "⚖️", metricLabel: "Case success chance",
      description: "Case strength, knowledge, legal spending, record, and previous outcomes shape civil claims.",
      options: [
        { id: "consult", label: "Legal consultation", icon: "📋", minAge: 18, cost: 500, base: 76, skill: "knowledge", effect: "consult" },
        { id: "small_claim", label: "File a small claim", icon: "🧾", minAge: 18, cost: 1200, base: 44, skill: "knowledge", effect: "lawsuit", payout: 6500 },
        { id: "employment", label: "Employment dispute", icon: "💼", minAge: 18, cost: 4800, base: 38, skill: "resilience", requiresCareer: true, effect: "lawsuit", payout: 32000 },
        { id: "property", label: "Property dispute", icon: "🏠", minAge: 18, cost: 9200, base: 34, skill: "knowledge", requiresProperty: true, effect: "lawsuit", payout: 85000 }
      ]
    },
    travel: {
      id: "travel", label: "Vacations", icon: "🏖️", metricLabel: "Trip quality chance",
      description: "Budget, health, happiness, resilience, city, and travel experience affect each trip.",
      options: [
        { id: "day_trip", label: "Local day trip", icon: "🚌", minAge: 12, cost: 180, base: 72, skill: "happiness", effect: "travel", scope: "local" },
        { id: "domestic", label: "Domestic vacation", icon: "🚆", minAge: 18, cost: 1500, base: 66, skill: "resilience", effect: "travel", scope: "domestic" },
        { id: "international", label: "International vacation", icon: "🌍", minAge: 18, cost: 4800, base: 58, skill: "health", effect: "travel", scope: "international" },
        { id: "luxury", label: "Luxury international trip", icon: "🛫", minAge: 18, cost: 18000, base: 70, skill: "happiness", effect: "travel", scope: "luxury" }
      ]
    },
    cinema: {
      id: "cinema", label: "Movie Theater", icon: "🎬", metricLabel: "Enjoyment chance",
      description: "Genre, age, mood, company, and viewing history change the experience.",
      options: [
        { id: "animation", label: "Animated adventure", icon: "🌈", minAge: 4, cost: 25, base: 76, skill: "happiness", effect: "movie" },
        { id: "comedy", label: "Comedy", icon: "😂", minAge: 8, cost: 30, base: 72, skill: "happiness", effect: "movie" },
        { id: "documentary", label: "Documentary", icon: "🌐", minAge: 10, cost: 28, base: 62, skill: "knowledge", effect: "movie" },
        { id: "drama", label: "Drama", icon: "🎞️", minAge: 13, cost: 32, base: 58, skill: "resilience", effect: "movie" },
        { id: "horror", label: "Horror", icon: "👻", minAge: 16, cost: 35, base: 48, skill: "resilience", effect: "movie" }
      ]
    },
    nightlife: {
      id: "nightlife", label: "Nightlife", icon: "🌃", metricLabel: "Good-night chance",
      description: "Mood, health, fame, resilience, city, and chosen venue influence the night.",
      options: [
        { id: "cafe", label: "Late café", icon: "☕", minAge: 16, cost: 45, base: 78, skill: "happiness", effect: "nightlife" },
        { id: "concert", label: "Live concert", icon: "🎤", minAge: 16, cost: 160, base: 66, skill: "happiness", talent: "music", effect: "nightlife" },
        { id: "dance", label: "Dance club", icon: "💃", minAge: 18, cost: 120, base: 54, skill: "health", effect: "nightlife" },
        { id: "private_event", label: "Private celebrity event", icon: "✨", minAge: 18, cost: 800, base: 48, skill: "resilience", requiresFame: 45, effect: "nightlife" }
      ]
    },
    fame: {
      id: "fame", label: "Fame Actions", icon: "⭐", metricLabel: "Publicity success chance",
      description: "Current fame, career, followers, happiness, resilience, and talents affect publicity.",
      options: [
        { id: "interview", label: "Give an interview", icon: "🎙️", minAge: 13, cost: 0, base: 38, skill: "resilience", requiresFame: 10, effect: "fame", gain: 3 },
        { id: "book", label: "Write a public memoir", icon: "📕", minAge: 18, cost: 2400, base: 32, skill: "knowledge", requiresFame: 25, effect: "fame", gain: 7 },
        { id: "commercial", label: "Film a commercial", icon: "📺", minAge: 18, cost: 0, base: 34, skill: "happiness", talentAny: ["acting", "modeling"], requiresFame: 20, effect: "fame", gain: 6 },
        { id: "photoshoot", label: "Do a photoshoot", icon: "📸", minAge: 18, cost: 450, base: 36, skill: "health", talent: "modeling", requiresFame: 15, effect: "fame", gain: 5 },
        { id: "charity", label: "Host a charity appearance", icon: "🤲", minAge: 18, cost: 3500, base: 62, skill: "resilience", requiresFame: 10, effect: "fame", gain: 4 }
      ]
    },
    pets: {
      id: "pets", label: "Pets", icon: "🐾", metricLabel: "Adoption approval chance",
      description: "Age, money, housing, health, criminal record, and existing pets affect adoption.",
      options: [
        { id: "cat", label: "Adopt a cat", icon: "🐈", minAge: 18, cost: 420, base: 62, skill: "resilience", effect: "pet" },
        { id: "dog", label: "Adopt a dog", icon: "🐕", minAge: 18, cost: 650, base: 58, skill: "health", effect: "pet" },
        { id: "rabbit", label: "Adopt a rabbit", icon: "🐇", minAge: 18, cost: 300, base: 66, skill: "resilience", effect: "pet" },
        { id: "bird", label: "Adopt a bird", icon: "🦜", minAge: 18, cost: 520, base: 60, skill: "knowledge", effect: "pet" },
        { id: "care", label: "Spend time with all pets", icon: "♥", minAge: 0, cost: 40, base: 84, skill: "happiness", requiresPet: true, effect: "pet_care" }
      ]
    },
    appearance: {
      id: "appearance", label: "Style & Appearance", icon: "✨", metricLabel: "Satisfaction chance",
      description: "Self-expression options change the portrait and mood without enforcing a body ideal.",
      options: [
        { id: "haircut", label: "Choose a new hairstyle", icon: "✂️", minAge: 6, cost: 80, base: 86, skill: "happiness", effect: "style" },
        { id: "hair_color", label: "Change hair colour", icon: "🎨", minAge: 12, cost: 120, base: 82, skill: "happiness", effect: "hair_color" },
        { id: "wardrobe", label: "Refresh wardrobe", icon: "👗", minAge: 13, cost: 550, base: 76, skill: "happiness", talentAny: ["modeling", "acting"], effect: "wardrobe" },
        { id: "accessory", label: "Pick a new accessory", icon: "👓", minAge: 6, cost: 90, base: 88, skill: "happiness", effect: "accessory" },
        { id: "consultation", label: "Cosmetic consultation", icon: "🪞", minAge: 18, cost: 1400, base: 62, skill: "resilience", effect: "consultation" }
      ]
    }
  };

  if (!GP) return;

  function baseSystems() {
    return {
      history: [],
      wellness: { doctorVisits: 0, gymVisits: 0, meditationSessions: 0, libraryVisits: 0, therapySessions: 0, currentDiet: "None" },
      social: { viralPosts: 0, collaborations: 0, brandDeals: 0, accountStrikes: 0 },
      clubs: { memberships: [], applications: 0, awards: 0 },
      licenses: { owned: [], attempts: 0 },
      legal: { consultations: 0, cases: 0, wins: 0, losses: 0, caseStrength: 55 },
      travel: { trips: 0, countriesVisited: [], citiesVisited: [], excellentTrips: 0 },
      cinema: { visits: 0, genres: {} },
      nightlife: { outings: 0, memorableNights: 0 },
      fame: { actions: 0, successes: 0, failures: 0 },
      pets: { animals: [], adoptions: 0, rejectedApplications: 0 },
      appearance: { changes: 0, consultations: 0 }
    };
  }

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV20State() {
    if (previousEnsure) previousEnsure.call(this);
    const s = this.state;
    if (!s) return;
    s.schemaVersion = NC.SCHEMA_VERSION;
    const defaults = baseSystems();
    s.activitySystems = Object.assign(defaults, s.activitySystems || {});
    Object.keys(defaults).forEach((key) => {
      if (key === "history") return;
      s.activitySystems[key] = Object.assign(defaults[key], s.activitySystems[key] || {});
    });
    s.activitySystems.history = Array.isArray(s.activitySystems.history) ? s.activitySystems.history : [];
    s.activitySystems.clubs.memberships = Array.isArray(s.activitySystems.clubs.memberships) ? s.activitySystems.clubs.memberships : [];
    s.activitySystems.licenses.owned = Array.isArray(s.activitySystems.licenses.owned) ? s.activitySystems.licenses.owned : [];
    s.activitySystems.travel.countriesVisited = Array.isArray(s.activitySystems.travel.countriesVisited) ? s.activitySystems.travel.countriesVisited : [];
    s.activitySystems.travel.citiesVisited = Array.isArray(s.activitySystems.travel.citiesVisited) ? s.activitySystems.travel.citiesVisited : [];
    s.activitySystems.pets.animals = Array.isArray(s.activitySystems.pets.animals) ? s.activitySystems.pets.animals : [];
    if (!s.activitySystems.travel.countriesVisited.includes(s.profile.country)) s.activitySystems.travel.countriesVisited.push(s.profile.country);
    if (!s.activitySystems.travel.citiesVisited.includes(s.profile.city)) s.activitySystems.travel.citiesVisited.push(s.profile.city);
    if (!Number.isFinite(s.activitySystems.legal.caseStrength)) s.activitySystems.legal.caseStrength = U.randomInt(s.rng, 35, 82);
    s.dev = Object.assign({ alwaysActivitySuccess: false, unlimitedActivityPoints: false }, s.dev || {});
  };

  GP.activityCenter = function activityCenter(centerId) {
    return CENTERS[centerId] || null;
  };

  GP.activityCenterMetric = function activityCenterMetric(centerId) {
    this.ensureExpansionState();
    const s = this.state;
    const center = CENTERS[centerId];
    if (!center) return 0;
    const avg = (s.stats.health + s.stats.happiness + s.stats.knowledge + s.stats.resilience) / 4;
    const values = {
      wellness: (s.stats.health + s.stats.resilience) / 2,
      social: U.clamp(25 + s.fame * .45 + Math.log10(Math.max(1, s.social.followers + 1)) * 12 + s.stats.happiness * .15, 0, 100),
      clubs: (s.stats.knowledge + s.stats.health + s.stats.happiness) / 3,
      licenses: (s.stats.knowledge * .65 + s.stats.resilience * .25 + s.stats.health * .1),
      legal: (s.stats.knowledge * .55 + s.stats.resilience * .25 + s.activitySystems.legal.caseStrength * .2),
      travel: (s.stats.health + s.stats.happiness + s.stats.resilience) / 3,
      cinema: (s.stats.happiness * .7 + s.stats.resilience * .3),
      nightlife: (s.stats.happiness * .55 + s.stats.health * .25 + s.stats.resilience * .2),
      fame: U.clamp(s.fame * .55 + s.stats.resilience * .2 + s.stats.happiness * .15 + Math.log10(Math.max(1, s.social.followers + 1)) * 8, 0, 100),
      pets: U.clamp(avg * .55 + (s.assets.some((a) => a.kind === "property") ? 18 : 0) - s.crime.convictions * 12, 0, 100),
      appearance: (s.stats.happiness + s.stats.resilience) / 2
    };
    return Math.round(U.clamp(values[centerId] == null ? avg : values[centerId], 0, 100));
  };

  GP.activityOptionEstimate = function activityOptionEstimate(centerId, optionId) {
    this.ensureExpansionState();
    const s = this.state;
    const center = CENTERS[centerId];
    const option = center && center.options.find((item) => item.id === optionId);
    if (!center || !option) return { allowed: false, reason: "Unknown activity option.", chance: 0, cost: 0 };
    const ignoreAge = Boolean(s.dev.ignoreActivityAgeLocks);
    if (this.isIncarcerated()) return { allowed: false, reason: "Outside activities are unavailable while incarcerated.", chance: 0, cost: option.cost };
    if (!ignoreAge && s.age < option.minAge) return { allowed: false, reason: `Available at age ${option.minAge}.`, chance: 0, cost: option.cost };
    if (!ignoreAge && Number.isFinite(option.maxAge) && s.age > option.maxAge) return { allowed: false, reason: `Available through age ${option.maxAge}.`, chance: 0, cost: option.cost };
    if (!s.dev.unlimitedActivityPoints && s.activityPoints < 1) return { allowed: false, reason: "Age up for more actions.", chance: 0, cost: option.cost };
    if (s.finances.cash < option.cost) return { allowed: false, reason: `Needs ${U.formatMoney(option.cost, s.profile.currency)}.`, chance: 0, cost: option.cost };
    if (option.minHealth && s.stats.health < option.minHealth) return { allowed: false, reason: `Requires at least ${option.minHealth}% health.`, chance: 0, cost: option.cost };
    if (option.requiresFollowers && s.social.followers < option.requiresFollowers) return { allowed: false, reason: `Requires ${option.requiresFollowers.toLocaleString()} followers.`, chance: 0, cost: option.cost };
    if (option.requiresFame && s.fame < option.requiresFame) return { allowed: false, reason: `Requires ${option.requiresFame}% fame.`, chance: 0, cost: option.cost };
    if (option.requiresCareer && !(s.career && s.career.active)) return { allowed: false, reason: "Requires an active career.", chance: 0, cost: option.cost };
    if (option.requiresProperty && !s.assets.some((a) => a.kind === "property")) return { allowed: false, reason: "Requires owned real estate.", chance: 0, cost: option.cost };
    if (option.requiresPet && !s.activitySystems.pets.animals.length) return { allowed: false, reason: "You do not currently own a pet.", chance: 0, cost: option.cost };
    if (centerId === "licenses" && s.activitySystems.licenses.owned.includes(option.id)) return { allowed: false, reason: "Already owned.", chance: 100, cost: option.cost };
    if (centerId === "clubs" && s.activitySystems.clubs.memberships.includes(option.id)) return { allowed: false, reason: "Already a member.", chance: 100, cost: option.cost };
    if (centerId === "pets" && option.effect === "pet" && s.activitySystems.pets.animals.length >= (s.assets.some((a) => a.kind === "property") ? 5 : 2)) return { allowed: false, reason: "Your current home has reached its pet capacity.", chance: 0, cost: option.cost };

    const skill = Number(s.stats[option.skill] || 50);
    let chance = option.base + (skill - 50) * .45;
    chance += (this.activityCenterMetric(centerId) - 50) * .22;
    if (option.talent && s.profile.specialTalent === option.talent) chance += 22;
    if (option.talentAny && option.talentAny.includes(s.profile.specialTalent)) chance += 15;
    if (centerId === "social") chance += Math.min(12, (s.activitySystems.social.viralPosts || 0) * 2);
    if (centerId === "clubs") chance += Math.min(10, s.activitySystems.clubs.memberships.length * 3);
    if (centerId === "licenses") chance -= Math.min(28, s.crime.convictions * 8);
    if (centerId === "legal") chance += (s.activitySystems.legal.caseStrength - 50) * .3 - s.crime.convictions * 3;
    if (centerId === "travel") chance += Math.min(10, s.activitySystems.travel.trips * 1.2);
    if (centerId === "fame") chance += s.fame * .18;
    if (centerId === "pets") chance += s.assets.some((a) => a.kind === "property") ? 15 : -6;
    if (s.dev.alwaysActivitySuccess || s.dev.alwaysWin) chance = 100;
    chance = Math.round(U.clamp(chance, 3, 98));
    return { allowed: true, reason: "Ready", chance, cost: option.cost, center, option };
  };

  GP.activityCenterSummary = function activityCenterSummary(centerId) {
    this.ensureExpansionState();
    const s = this.state;
    const a = s.activitySystems;
    const summaries = {
      wellness: `${a.wellness.doctorVisits || 0} doctor visits · ${a.wellness.gymVisits || 0} gym trips · diet: ${a.wellness.currentDiet || "None"}`,
      social: `${s.social.followers.toLocaleString()} followers · ${s.social.posts} posts · ${a.social.viralPosts || 0} viral posts`,
      clubs: `${a.clubs.memberships.length} memberships · ${a.clubs.awards || 0} awards`,
      licenses: `${a.licenses.owned.length} licenses · ${a.licenses.attempts || 0} tests attempted`,
      legal: `${a.legal.wins || 0} wins · ${a.legal.losses || 0} losses · case strength ${a.legal.caseStrength}%`,
      travel: `${a.travel.trips || 0} trips · ${a.travel.countriesVisited.length} countries · ${a.travel.citiesVisited.length} cities`,
      cinema: `${a.cinema.visits || 0} visits · ${Object.keys(a.cinema.genres || {}).length} genres`,
      nightlife: `${a.nightlife.outings || 0} outings · ${a.nightlife.memorableNights || 0} memorable nights`,
      fame: `${Math.round(s.fame)}% fame · ${a.fame.successes || 0}/${a.fame.actions || 0} successful actions`,
      pets: `${a.pets.animals.length} current pets · ${a.pets.adoptions || 0} lifetime adoptions`,
      appearance: `${a.appearance.changes || 0} style changes · ${a.appearance.consultations || 0} consultations`
    };
    return summaries[centerId] || "Dynamic activity history";
  };

  GP.performDynamicActivity = function performDynamicActivity(centerId, optionId) {
    this.assertFree("Activities");
    this.ensureExpansionState();
    const s = this.state;
    const estimate = this.activityOptionEstimate(centerId, optionId);
    if (!estimate.allowed) throw new Error(estimate.reason);
    const option = estimate.option;
    const sys = s.activitySystems[centerId];
    s.finances.cash -= option.cost;
    if (!s.dev.unlimitedActivityPoints) s.activityPoints -= 1;
    if (s.metrics) s.metrics.totalActions += 1;
    const success = s.dev.alwaysActivitySuccess || s.dev.alwaysWin || U.random(s.rng) < estimate.chance / 100;
    const record = { id: U.uid("activity"), age: s.age, year: s.year, center: centerId, option: optionId, success, chance: estimate.chance, cost: option.cost };
    s.activitySystems.history.unshift(record);
    if (s.activitySystems.history.length > 120) s.activitySystems.history.length = 120;

    let title = option.label;
    let text = "";
    let icon = option.icon;
    const boost = (key, good, weak) => { s.stats[key] = U.clamp(s.stats[key] + (success ? good : weak), 0, 100); };

    if (option.effect === "medical") {
      sys.doctorVisits += 1;
      boost("health", U.randomInt(s.rng, 8, 18), 2);
      text = success ? "The appointment is effective and your health improves." : "The appointment offers useful advice, but there is no major improvement this year.";
    } else if (option.effect === "gym") {
      sys.gymVisits += 1;
      boost("health", 6, 2); boost("resilience", 4, 1);
      text = success ? "The training plan suits you and your fitness improves." : "The session is tiring, but you still learn how to train more safely.";
    } else if (option.effect === "meditate") {
      sys.meditationSessions += 1;
      boost("resilience", 7, 3); boost("happiness", 4, 1);
      text = success ? "You settle into a calm routine and feel more grounded." : "Your thoughts wander, though the quiet break still helps a little.";
    } else if (option.effect === "library") {
      sys.libraryVisits += 1;
      boost("knowledge", 7, 3);
      text = success ? "You find exactly the right books and leave with several new ideas." : "The visit is quiet and useful, even though nothing completely captures you.";
    } else if (option.effect === "therapy") {
      sys.therapySessions += 1;
      boost("happiness", 8, 3); boost("resilience", 6, 2);
      text = success ? "The session helps you understand a difficult pattern and choose a healthier response." : "The first approach does not fully click, but you identify something worth revisiting.";
    } else if (option.effect === "diet") {
      sys.currentDiet = option.plan;
      boost("health", 6, 2);
      text = success ? `The ${option.plan.toLocaleLowerCase()} plan feels sustainable and supports your health.` : `The ${option.plan.toLocaleLowerCase()} plan takes adjustment, but you keep a few useful habits.`;
    } else if (option.effect === "post" || option.effect === "brand") {
      s.social.posts += 1;
      const baseGain = U.randomInt(s.rng, 40, 360) * (option.multiplier || 1);
      const followers = Math.max(1, Math.round(baseGain * (success ? 1 + s.fame / 75 : .16)));
      s.social.followers += followers;
      if (success && followers >= 1200) sys.viralPosts += 1;
      if (option.id === "collaboration" && success) sys.collaborations += 1;
      if (option.effect === "brand" && success) {
        sys.brandDeals += 1;
        const payment = Math.round(800 + s.social.followers * .035);
        s.finances.cash += payment;
        text = `The campaign performs well, adds ${followers.toLocaleString()} followers, and pays ${U.formatMoney(payment, s.profile.currency)}.`;
      } else text = success ? `The post reaches a new audience and adds ${followers.toLocaleString()} followers.` : `The post receives limited attention and adds ${followers.toLocaleString()} followers.`;
      if (s.social.followers >= 10000 && success) s.fame = U.clamp(s.fame + 1, 0, 100);
    } else if (option.effect === "club") {
      sys.applications += 1;
      if (success) {
        sys.memberships.push(option.id);
        boost(option.skill, 5, 0); boost("happiness", 4, 0);
        text = `You are accepted into ${option.label.toLocaleLowerCase()} and begin meeting the group regularly.`;
      } else {
        boost(option.skill, 1, 0);
        text = `The group does not have a place for you this year, but the tryout gives you useful experience.`;
      }
    } else if (option.effect === "license") {
      sys.attempts += 1;
      if (success) {
        sys.owned.push(option.id);
        text = `You pass the ${option.label.toLocaleLowerCase()} test and receive the license.`;
      } else {
        boost("knowledge", 2, 1);
        text = `You do not pass this attempt. The examiner explains what to practise before trying again.`;
      }
    } else if (option.effect === "consult") {
      sys.consultations += 1;
      sys.caseStrength = U.randomInt(s.rng, 35, 90);
      boost("knowledge", 3, 1);
      text = `A lawyer reviews your situation and estimates the next possible case at ${sys.caseStrength}% strength.`;
    } else if (option.effect === "lawsuit") {
      sys.cases += 1;
      if (success) {
        sys.wins += 1;
        const payout = Math.round(option.payout * (.75 + U.random(s.rng) * .5));
        s.finances.cash += payout;
        text = `The case succeeds and the court awards ${U.formatMoney(payout, s.profile.currency)} after costs.`;
      } else {
        sys.losses += 1;
        const extra = Math.round(option.cost * .35);
        s.finances.cash -= extra;
        text = `The claim is unsuccessful, and an additional ${U.formatMoney(extra, s.profile.currency)} is spent closing the case.`;
      }
      sys.caseStrength = U.randomInt(s.rng, 30, 88);
    } else if (option.effect === "travel") {
      sys.trips += 1;
      if (success) sys.excellentTrips += 1;
      boost("happiness", success ? 10 : 4, 2); boost("resilience", success ? 4 : 1, 1);
      if (option.scope === "international" || option.scope === "luxury") {
        const origins = this.data.catalogs.origins.filter((origin) => origin.country !== s.profile.country);
        const destination = U.pick(s.rng, origins);
        if (destination && !sys.countriesVisited.includes(destination.country)) sys.countriesVisited.push(destination.country);
        const city = destination ? U.pick(s.rng, destination.cities || [destination.city]) : "a new city";
        if (city && !sys.citiesVisited.includes(city)) sys.citiesVisited.push(city);
        text = success ? `The trip to ${city}, ${destination.country} becomes one of your best travel memories.` : `The trip to ${city}, ${destination.country} has a few delays, but you still enjoy parts of it.`;
      } else {
        text = success ? `The ${option.label.toLocaleLowerCase()} is relaxing and carefully planned.` : `The trip has a few inconveniences, but the change of scenery still helps.`;
      }
    } else if (option.effect === "movie") {
      sys.visits += 1;
      sys.genres[option.id] = (sys.genres[option.id] || 0) + 1;
      boost("happiness", success ? 6 : 2, 1);
      if (option.id === "documentary") boost("knowledge", 4, 2);
      text = success ? `The ${option.label.toLocaleLowerCase()} completely holds your attention.` : `The film is not quite what you expected, though the outing is still pleasant.`;
    } else if (option.effect === "nightlife") {
      sys.outings += 1;
      if (success) sys.memorableNights += 1;
      boost("happiness", success ? 7 : 2, 1);
      text = success ? `The ${option.label.toLocaleLowerCase()} is lively, friendly, and memorable.` : `The night feels a little awkward, so you leave early and head home safely.`;
    } else if (option.effect === "fame") {
      sys.actions += 1;
      if (success) {
        sys.successes += 1;
        s.fame = U.clamp(s.fame + option.gain, 0, 100);
        const income = option.id === "commercial" ? U.randomInt(s.rng, 1200, 12000) : option.id === "book" ? U.randomInt(s.rng, 600, 8000) : 0;
        if (income) s.finances.cash += income;
        text = `${option.label} lands well with the public and increases your fame${income ? ` while earning ${U.formatMoney(income, s.profile.currency)}` : ""}.`;
      } else {
        sys.failures += 1;
        s.fame = U.clamp(s.fame - 1, 0, 100);
        text = `${option.label} receives little attention this year.`;
      }
    } else if (option.effect === "pet") {
      if (success) {
        const names = ["Milo", "Luna", "Nala", "Theo", "Mochi", "Pepper", "Suki", "Biscuit", "Nova", "Coco"];
        const pet = { id: U.uid("pet"), species: option.id, name: U.pick(s.rng, names), age: 0, health: U.randomInt(s.rng, 72, 96), bond: 55, icon: option.icon, adoptedAge: s.age };
        sys.animals.push(pet); sys.adoptions += 1; s.social.pets = (s.social.pets || 0) + 1;
        boost("happiness", 8, 2);
        text = `${pet.name}, a ${option.id}, is approved for adoption and joins your household.`;
      } else {
        sys.rejectedApplications += 1;
        text = "The shelter decides that another home is a better match this time. You may apply again later.";
      }
    } else if (option.effect === "pet_care") {
      sys.animals.forEach((pet) => { pet.bond = U.clamp(pet.bond + (success ? 12 : 5), 0, 100); pet.health = U.clamp(pet.health + 2, 0, 100); });
      boost("happiness", 6, 2);
      text = success ? "You spend a warm, playful day with every pet and strengthen your bonds." : "The pets are restless, but they appreciate the attention.";
    } else if (["style", "hair_color", "wardrobe", "accessory", "consultation"].includes(option.effect)) {
      if (option.effect === "consultation") sys.consultations += 1;
      else sys.changes += 1;
      if (success) boost("happiness", 5, 1); else boost("resilience", 1, 1);
      if (option.effect === "style" && success) s.profile.avatar.style = U.pick(s.rng, ["short", "long", "curly"]);
      if (option.effect === "hair_color" && success) s.profile.avatar.hair = U.pick(s.rng, ["#17120f", "#4a3028", "#7b4b2a", "#b7834f", "#d7c1a3", "#8b2735", "#395a8b", "#7b4e91"]);
      if (option.effect === "accessory" && success) s.profile.avatar.accessory = U.pick(s.rng, ["none", "glasses", "earrings", "hat", "bow", "crown"]);
      text = success ? `${option.label} feels expressive and suits the look you wanted.` : `${option.label} does not feel quite right, but the experiment helps clarify your style.`;
    }

    this.log(title, text, success ? "relationship" : "neutral", icon);
    this.touch(`dynamic-activity-${centerId}-${optionId}`);
    return success;
  };

  const previousAgeUp = GP.ageUp;
  GP.ageUp = function ageUpV20() {
    const before = this.state && this.state.age;
    const result = previousAgeUp.call(this);
    const s = this.state;
    if (s && s.alive && s.age !== before) {
      this.ensureExpansionState();
      s.activitySystems.pets.animals.forEach((pet) => {
        pet.age += 1;
        pet.health = U.clamp(pet.health - U.randomInt(s.rng, 0, pet.age > 12 ? 5 : 2), 0, 100);
        pet.bond = U.clamp(pet.bond - 2, 0, 100);
      });
      s.activitySystems.legal.caseStrength = U.randomInt(s.rng, 30, 90);
    }
    return result;
  };

  GP.devMaxActivitySystems = function devMaxActivitySystems() {
    this.ensureExpansionState();
    const s = this.state;
    s.dev.alwaysActivitySuccess = true;
    s.dev.unlimitedActivityPoints = true;
    s.activityPoints = Math.max(s.activityPoints, 99);
    s.social.followers = Math.max(s.social.followers, 1000000);
    s.fame = 100;
    s.activitySystems.licenses.owned = ["driver", "boat", "pilot"];
    s.activitySystems.clubs.memberships = ["drama", "sports", "music", "debate", "volunteer"];
    s.activitySystems.legal.caseStrength = 100;
    this.touch("dev-max-activity-systems");
  };

  GP.devClearActivitySystems = function devClearActivitySystems() {
    const travelCountry = this.state.profile.country;
    const travelCity = this.state.profile.city;
    this.state.activitySystems = baseSystems();
    this.state.activitySystems.travel.countriesVisited = [travelCountry];
    this.state.activitySystems.travel.citiesVisited = [travelCity];
    this.touch("dev-clear-activity-systems");
  };
})(window);
