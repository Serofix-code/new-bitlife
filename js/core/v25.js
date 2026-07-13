(function installNextChapterV25(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine && NC.GameEngine.prototype;
  if (!GP) return;

  NC.APP_VERSION = "2.5.0";
  NC.SCHEMA_VERSION = Math.max(NC.SCHEMA_VERSION || 1, 18);

  NC.EXPANSIONS = Object.assign({}, NC.EXPANSIONS || {}, {
    enterprises: { id: "enterprises", label: "Enterprise Expansion", icon: "🏛️", description: "Manage major public-facing venues with staff, inspections, reputation, and annual results.", minAge: 18, included: true },
    collections: { id: "collections", label: "Collections & Auctions", icon: "🖼️", description: "Build a collection through a changing fictional auction market.", minAge: 18, included: true },
    specialCareers: { id: "specialCareers", label: "Special Careers", icon: "🚀", description: "Train for long-form careers with ranks, contracts, missions, and awards.", minAge: 18, included: true }
  });

  NC.ENTERPRISE_TYPES = [
    { id: "museum", label: "Culture Museum", icon: "🏛️", startupCost: 650000, baseRevenue: 215000, margin: .18, specialLabel: "Curation", annualUpkeep: 78000 },
    { id: "wildlife", label: "Wildlife Sanctuary", icon: "🦒", startupCost: 900000, baseRevenue: 295000, margin: .15, specialLabel: "Animal welfare", annualUpkeep: 120000 },
    { id: "resort", label: "Entertainment Resort", icon: "🎰", startupCost: 1250000, baseRevenue: 460000, margin: .21, specialLabel: "Guest experience", annualUpkeep: 185000 }
  ];

  NC.COLLECTIBLE_CATEGORIES = [
    { id: "art", label: "Original Artwork", icon: "🎨", base: 18000, volatility: 12 },
    { id: "history", label: "Historical Curio", icon: "🏺", base: 24000, volatility: 9 },
    { id: "sports", label: "Sports Memorabilia", icon: "🏆", base: 12500, volatility: 18 },
    { id: "jewelry", label: "Rare Jewelry", icon: "💎", base: 32000, volatility: 14 },
    { id: "science", label: "Science Collectible", icon: "🔭", base: 27000, volatility: 16 }
  ];

  NC.SPECIAL_CAREERS = [
    { id: "astronaut", label: "Space Explorer", icon: "🚀", cost: 45000, stat: "knowledge", threshold: 68, talent: "business", ranks: ["Academy candidate", "Flight trainee", "Mission specialist", "Space commander"], basePay: 62000, action: "mission" },
    { id: "model", label: "Professional Model", icon: "👠", cost: 12000, stat: "looks", threshold: 55, talent: "modeling", ranks: ["Agency newcomer", "Campaign model", "Runway headliner", "Global fashion icon"], basePay: 38000, action: "booking" },
    { id: "actor", label: "Screen Performer", icon: "🎬", cost: 18000, stat: "happiness", threshold: 52, talent: "acting", ranks: ["Background performer", "Supporting actor", "Lead performer", "Award-winning star"], basePay: 42000, action: "production" },
    { id: "musician", label: "Recording Artist", icon: "🎤", cost: 16000, stat: "knowledge", threshold: 48, talent: "music", ranks: ["Local performer", "Touring artist", "Charting musician", "Music legend"], basePay: 39000, action: "release" },
    { id: "athlete", label: "Professional Athlete", icon: "🏅", cost: 14000, stat: "health", threshold: 65, talent: "sports", ranks: ["Development squad", "League professional", "All-star athlete", "Sporting legend"], basePay: 52000, action: "season" },
    { id: "politics", label: "Public Service Career", icon: "🏛️", cost: 22000, stat: "knowledge", threshold: 60, talent: "business", ranks: ["Campaign volunteer", "Local representative", "National legislator", "Head of government"], basePay: 48000, action: "campaign" },
    { id: "intelligence", label: "Intelligence Officer", icon: "🕵️", cost: 30000, stat: "resilience", threshold: 65, talent: "crime", ranks: ["Analyst trainee", "Field officer", "Senior operative", "Agency director"], basePay: 58000, action: "assignment" }
  ];

  const COLLECTIBLE_FIRST = ["Silver", "Midnight", "Aurora", "Royal", "Forgotten", "Golden", "Polar", "Crimson", "Emerald", "Lunar", "Vintage", "Celestial"];
  const COLLECTIBLE_SECOND = ["Portrait", "Medal", "Chronicle", "Telescope", "Brooch", "Sculpture", "Helmet", "Manuscript", "Compass", "Jersey", "Relic", "Camera"];

  function seeded(state, suffix) {
    return { seed: U.hashSeed(`${state.saveId}|v25|${suffix}`), step: 0 };
  }

  function uniqueName(rng, used) {
    let name;
    do name = `${U.pick(rng, COLLECTIBLE_FIRST)} ${U.pick(rng, COLLECTIBLE_SECOND)}`;
    while (used.has(name));
    used.add(name);
    return name;
  }

  function makeAuctionLots(state, year) {
    const rng = seeded(state, `auction-${year}`);
    const used = new Set();
    return Array.from({ length: 10 }, (_, index) => {
      const category = U.pick(rng, NC.COLLECTIBLE_CATEGORIES);
      const rarityRoll = U.random(rng);
      const rarity = rarityRoll < .55 ? "uncommon" : rarityRoll < .86 ? "rare" : "exceptional";
      const rarityMultiplier = rarity === "exceptional" ? 4.2 : rarity === "rare" ? 2.1 : 1;
      const trueValue = Math.round(category.base * rarityMultiplier * (U.randomInt(rng, 72, 145) / 100));
      const authenticity = U.random(rng) < .86;
      const askingPrice = Math.round(trueValue * (U.randomInt(rng, 78, 128) / 100));
      return {
        id: `lot_${year}_${index}_${U.hashSeed(String(index) + category.id).toString(36)}`,
        name: uniqueName(rng, used),
        categoryId: category.id,
        categoryLabel: category.label,
        icon: category.icon,
        rarity,
        trueValue,
        currentValue: trueValue,
        askingPrice,
        authentic: authenticity,
        appraised: false,
        year
      };
    });
  }

  function emptyEnterpriseState() {
    return { owned: [], history: [], totalRevenue: 0, totalProfit: 0, started: 0, sold: 0 };
  }

  function emptyCollectionState(state) {
    return { marketYear: state.year, market: makeAuctionLots(state, state.year), owned: [], history: [], spent: 0, sales: 0, appraisals: 0 };
  }

  function emptySpecialCareerState() {
    return { active: null, history: [], applications: 0, completedActions: 0, awards: 0, lifetimeIncome: 0 };
  }

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV25State() {
    if (previousEnsure) previousEnsure.call(this);
    const s = this.state;
    if (!s) return;
    s.schemaVersion = NC.SCHEMA_VERSION;
    if (!s.enterprises || !Array.isArray(s.enterprises.owned)) s.enterprises = emptyEnterpriseState();
    s.enterprises.history = Array.isArray(s.enterprises.history) ? s.enterprises.history : [];
    ["totalRevenue", "totalProfit", "started", "sold"].forEach((key) => { if (!Number.isFinite(s.enterprises[key])) s.enterprises[key] = 0; });
    s.enterprises.owned.forEach((item) => {
      item.history = Array.isArray(item.history) ? item.history : [];
      item.reputation = Number.isFinite(item.reputation) ? item.reputation : 50;
      item.appeal = Number.isFinite(item.appeal) ? item.appeal : 50;
      item.security = Number.isFinite(item.security) ? item.security : 50;
      item.special = Number.isFinite(item.special) ? item.special : 50;
      item.staff = Number.isFinite(item.staff) ? item.staff : 8;
      item.value = Number.isFinite(item.value) ? item.value : 0;
      item.lastRevenue = Number.isFinite(item.lastRevenue) ? item.lastRevenue : 0;
      item.lastProfit = Number.isFinite(item.lastProfit) ? item.lastProfit : 0;
    });
    if (!s.collections || !Array.isArray(s.collections.market)) s.collections = emptyCollectionState(s);
    s.collections.owned = Array.isArray(s.collections.owned) ? s.collections.owned : [];
    s.collections.history = Array.isArray(s.collections.history) ? s.collections.history : [];
    ["spent", "sales", "appraisals"].forEach((key) => { if (!Number.isFinite(s.collections[key])) s.collections[key] = 0; });
    if (!s.specialCareer || !Array.isArray(s.specialCareer.history)) s.specialCareer = emptySpecialCareerState();
    s.specialCareer.applications = Number.isFinite(s.specialCareer.applications) ? s.specialCareer.applications : 0;
    s.specialCareer.completedActions = Number.isFinite(s.specialCareer.completedActions) ? s.specialCareer.completedActions : 0;
    s.specialCareer.awards = Number.isFinite(s.specialCareer.awards) ? s.specialCareer.awards : 0;
    s.specialCareer.lifetimeIncome = Number.isFinite(s.specialCareer.lifetimeIncome) ? s.specialCareer.lifetimeIncome : 0;
    if (s.specialCareer.active) {
      const career = s.specialCareer.active;
      career.rank = Number.isFinite(career.rank) ? career.rank : 0;
      career.performance = Number.isFinite(career.performance) ? career.performance : 45;
      career.reputation = Number.isFinite(career.reputation) ? career.reputation : 35;
      career.training = Number.isFinite(career.training) ? career.training : 0;
      career.years = Number.isFinite(career.years) ? career.years : 0;
      career.lastIncome = Number.isFinite(career.lastIncome) ? career.lastIncome : 0;
    }
    s.dev = Object.assign({ enterpriseAlwaysProfits: false, collectionAlwaysAuthentic: false, specialCareerAlwaysSucceeds: false }, s.dev || {});
  };

  GP.enterpriseType = function enterpriseType(id) {
    return NC.ENTERPRISE_TYPES.find((item) => item.id === id) || null;
  };

  GP.enterprisePortfolioValue = function enterprisePortfolioValue() {
    this.ensureExpansionState();
    return this.state.enterprises.owned.reduce((sum, item) => sum + Math.max(0, Number(item.value) || 0), 0);
  };

  GP.collectionPortfolioValue = function collectionPortfolioValue() {
    this.ensureExpansionState();
    return this.state.collections.owned.reduce((sum, item) => sum + Math.max(0, Number(item.currentValue) || 0), 0);
  };

  GP.startEnterprise = function startEnterprise(typeId, requestedName) {
    this.assertFree("Enterprise ownership");
    this.ensureExpansionState();
    const s = this.state;
    if (s.age < 18 && !s.dev.ignoreActivityAgeLocks) throw new Error("Enterprise ownership unlocks at age 18.");
    if (s.enterprises.owned.length >= 6) throw new Error("You can own up to six major enterprises.");
    const type = this.enterpriseType(typeId);
    if (!type) throw new Error("Enterprise type not found.");
    if (s.finances.cash < type.startupCost) throw new Error(`You need ${U.formatMoney(type.startupCost, s.profile.currency)}.`);
    const name = String(requestedName || `${s.profile.lastName} ${type.label}`).trim().slice(0, 48) || `${s.profile.lastName} ${type.label}`;
    s.finances.cash -= type.startupCost;
    const item = {
      id: U.uid("enterprise"), typeId: type.id, label: type.label, icon: type.icon, name,
      startedAge: s.age, years: 0, reputation: 48, appeal: 45, security: 52, special: 50,
      staff: 8, value: type.startupCost, lastRevenue: 0, lastProfit: 0, annualUpkeep: type.annualUpkeep,
      displayedCollectibles: [], history: []
    };
    s.enterprises.owned.push(item);
    s.enterprises.started += 1;
    this.log(`Opened ${name}`, `You launch a new ${type.label.toLocaleLowerCase()} and begin recruiting staff.`, "money", type.icon);
    this.touch("enterprise-start");
    return item;
  };

  GP.enterpriseAction = function enterpriseAction(id, kind) {
    this.assertFree("Enterprise management");
    this.ensureExpansionState();
    const s = this.state;
    const item = s.enterprises.owned.find((entry) => entry.id === id);
    if (!item) throw new Error("Enterprise not found.");
    const type = this.enterpriseType(item.typeId);
    if (kind === "sell") {
      const sale = Math.max(1000, Math.round(item.value * (U.randomInt(s.rng, 88, 112) / 100)));
      s.finances.cash += sale;
      s.enterprises.owned = s.enterprises.owned.filter((entry) => entry.id !== id);
      s.enterprises.sold += 1;
      s.enterprises.history.unshift({ age: s.age, year: s.year, kind: "sale", name: item.name, amount: sale });
      this.log(`Sold ${item.name}`, `The enterprise sells for ${U.formatMoney(sale, s.profile.currency)}.`, "money", "🤝");
      this.touch("enterprise-sell");
      return sale;
    }
    if (!s.dev.unlimitedActivityPoints && s.activityPoints < 1) throw new Error("Age up for another action.");
    const costs = { improve: Math.round(item.value * .035), advertise: 24000, hire: 32000, security: 28000, specialty: 30000, event: 18000 };
    const cost = costs[kind];
    if (!Number.isFinite(cost)) throw new Error("Unknown enterprise action.");
    if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)}.`);
    s.finances.cash -= cost;
    if (!s.dev.unlimitedActivityPoints) s.activityPoints -= 1;
    if (kind === "improve") { item.appeal = U.clamp(item.appeal + U.randomInt(s.rng, 7, 14), 0, 100); item.value += Math.round(cost * .82); }
    if (kind === "advertise") { item.reputation = U.clamp(item.reputation + U.randomInt(s.rng, 5, 12), 0, 100); }
    if (kind === "hire") { item.staff += U.randomInt(s.rng, 2, 6); item.special = U.clamp(item.special + 3, 0, 100); }
    if (kind === "security") { item.security = U.clamp(item.security + U.randomInt(s.rng, 8, 16), 0, 100); }
    if (kind === "specialty") { item.special = U.clamp(item.special + U.randomInt(s.rng, 8, 15), 0, 100); }
    if (kind === "event") { item.appeal = U.clamp(item.appeal + 5, 0, 100); item.reputation = U.clamp(item.reputation + 4, 0, 100); s.stats.happiness = U.clamp(s.stats.happiness + 3, 0, 100); }
    item.value = Math.round(item.value * 1.006);
    const labels = { improve: "facility upgrade", advertise: "advertising campaign", hire: "staff expansion", security: "security review", specialty: type.specialLabel.toLocaleLowerCase(), event: "public event" };
    this.log(`Improved ${item.name}`, `You spend ${U.formatMoney(cost, s.profile.currency)} on ${labels[kind]}.`, "money", item.icon);
    this.touch("enterprise-action");
    return item;
  };

  GP.advanceEnterprisesV25 = function advanceEnterprisesV25() {
    this.ensureExpansionState();
    const s = this.state;
    const updates = [];
    for (const item of s.enterprises.owned) {
      const type = this.enterpriseType(item.typeId);
      item.years += 1;
      const quality = (item.reputation + item.appeal + item.security + item.special) / 4;
      const demand = U.randomInt(s.rng, 72, 132) / 100;
      const revenue = Math.round(type.baseRevenue * demand * (.55 + quality / 100) * (1 + item.staff / 140));
      let costs = Math.round(type.annualUpkeep + item.staff * 4700 + item.value * .018);
      let eventText = "";
      const eventRoll = U.random(s.rng);
      if (eventRoll < .08 && item.security < 60) { costs += Math.round(item.value * .045); item.reputation = U.clamp(item.reputation - 8, 0, 100); eventText = " after an inspection uncovered expensive safety work"; }
      else if (eventRoll < .16) { item.reputation = U.clamp(item.reputation + 7, 0, 100); eventText = item.typeId === "museum" ? " after a popular exhibition drew attention" : item.typeId === "wildlife" ? " after a successful conservation project" : " after a major entertainment event"; }
      else if (eventRoll < .23) { costs += 18000; item.special = U.clamp(item.special + 4, 0, 100); eventText = " after staff handled an unexpected operational challenge"; }
      let profit = revenue - costs;
      if (s.dev.enterpriseAlwaysProfits) profit = Math.max(profit, Math.round(revenue * .22));
      s.finances.cash += profit;
      item.lastRevenue = revenue;
      item.lastProfit = profit;
      item.value = Math.max(10000, Math.round(item.value * (1 + U.randomInt(s.rng, -2, 7) / 100) + Math.max(-profit * .08, profit * .18)));
      item.history.unshift({ year: s.year, age: s.age, revenue, profit, value: item.value, eventText });
      item.history = item.history.slice(0, 20);
      s.enterprises.totalRevenue += revenue;
      s.enterprises.totalProfit += profit;
      updates.push({ item, profit, revenue, eventText });
    }
    return updates;
  };

  GP.refreshAuctionMarket = function refreshAuctionMarket() {
    this.ensureExpansionState();
    this.state.collections.marketYear = this.state.year;
    this.state.collections.market = makeAuctionLots(this.state, this.state.year);
    this.touch("auction-refresh");
  };

  GP.buyCollectible = function buyCollectible(lotId) {
    this.assertFree("Auction purchase");
    this.ensureExpansionState();
    const s = this.state;
    if (s.age < 18 && !s.dev.ignoreActivityAgeLocks) throw new Error("Auctions unlock at age 18.");
    const lot = s.collections.market.find((item) => item.id === lotId);
    if (!lot) throw new Error("That auction lot is no longer available.");
    if (s.finances.cash < lot.askingPrice) throw new Error(`You need ${U.formatMoney(lot.askingPrice, s.profile.currency)}.`);
    s.finances.cash -= lot.askingPrice;
    const owned = U.deepClone(lot);
    owned.id = U.uid("collectible");
    owned.purchasePrice = lot.askingPrice;
    owned.purchaseAge = s.age;
    owned.authentic = s.dev.collectionAlwaysAuthentic ? true : owned.authentic;
    owned.displayedAt = null;
    s.collections.owned.push(owned);
    s.collections.market = s.collections.market.filter((item) => item.id !== lotId);
    s.collections.spent += lot.askingPrice;
    s.collections.history.unshift({ age: s.age, year: s.year, kind: "buy", name: owned.name, amount: lot.askingPrice });
    this.log(`Won ${owned.name} at auction`, `The ${owned.rarity} ${owned.categoryLabel.toLocaleLowerCase()} costs ${U.formatMoney(lot.askingPrice, s.profile.currency)}.`, "money", owned.icon);
    this.touch("collectible-buy");
    return owned;
  };

  GP.appraiseCollectible = function appraiseCollectible(id) {
    this.assertFree("Collectible appraisal");
    this.ensureExpansionState();
    const s = this.state;
    const item = s.collections.owned.find((entry) => entry.id === id);
    if (!item) throw new Error("Collectible not found.");
    const cost = 650;
    if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)}.`);
    s.finances.cash -= cost;
    item.appraised = true;
    if (!item.authentic) item.currentValue = Math.max(25, Math.round(item.currentValue * .08));
    s.collections.appraisals += 1;
    this.log(item.authentic ? "Appraisal confirmed authenticity" : "Appraisal found a reproduction", item.authentic ? `${item.name} is valued near ${U.formatMoney(item.currentValue, s.profile.currency)}.` : `${item.name} is not authentic and is worth far less than expected.`, "neutral", item.authentic ? "✅" : "🔎");
    this.touch("collectible-appraise");
    return item;
  };

  GP.sellCollectible = function sellCollectible(id) {
    this.assertFree("Collectible sale");
    this.ensureExpansionState();
    const s = this.state;
    const item = s.collections.owned.find((entry) => entry.id === id);
    if (!item) throw new Error("Collectible not found.");
    const sale = Math.max(10, Math.round(item.currentValue * (U.randomInt(s.rng, 82, 112) / 100)));
    s.finances.cash += sale;
    s.collections.owned = s.collections.owned.filter((entry) => entry.id !== id);
    s.collections.sales += sale;
    s.collections.history.unshift({ age: s.age, year: s.year, kind: "sell", name: item.name, amount: sale });
    this.log(`Sold ${item.name}`, `A collector pays ${U.formatMoney(sale, s.profile.currency)}.`, "money", "🤝");
    this.touch("collectible-sell");
    return sale;
  };

  GP.displayCollectible = function displayCollectible(id, enterpriseId) {
    this.assertFree("Museum display");
    this.ensureExpansionState();
    const s = this.state;
    const item = s.collections.owned.find((entry) => entry.id === id);
    const museum = s.enterprises.owned.find((entry) => entry.id === enterpriseId && entry.typeId === "museum");
    if (!item || !museum) throw new Error("Choose an owned collectible and museum.");
    item.displayedAt = museum.id;
    if (!museum.displayedCollectibles.includes(item.id)) museum.displayedCollectibles.push(item.id);
    museum.appeal = U.clamp(museum.appeal + (item.rarity === "exceptional" ? 8 : item.rarity === "rare" ? 5 : 3), 0, 100);
    museum.value += Math.round(item.currentValue * .15);
    this.log(`${item.name} went on display`, `${museum.name} adds the item to a public exhibition.`, "milestone", "🖼️");
    this.touch("collectible-display");
  };

  GP.advanceCollectionsV25 = function advanceCollectionsV25() {
    this.ensureExpansionState();
    const s = this.state;
    let best = null;
    for (const item of s.collections.owned) {
      const category = NC.COLLECTIBLE_CATEGORIES.find((entry) => entry.id === item.categoryId) || NC.COLLECTIBLE_CATEGORIES[0];
      const previous = item.currentValue;
      const move = U.randomInt(s.rng, -category.volatility, category.volatility + 7);
      item.currentValue = Math.max(10, Math.round(item.currentValue * (1 + move / 100)));
      const change = previous ? ((item.currentValue / previous) - 1) * 100 : 0;
      if (!best || Math.abs(change) > Math.abs(best.change)) best = { item, change };
    }
    s.collections.marketYear = s.year;
    s.collections.market = makeAuctionLots(s, s.year);
    return best;
  };

  GP.specialCareerTrack = function specialCareerTrack(id) {
    return NC.SPECIAL_CAREERS.find((item) => item.id === id) || null;
  };

  GP.startSpecialCareer = function startSpecialCareer(trackId) {
    this.assertFree("Special career");
    this.ensureExpansionState();
    const s = this.state;
    if (s.age < 18 && !s.dev.ignoreActivityAgeLocks) throw new Error("Special careers unlock at age 18.");
    if (s.specialCareer.active) throw new Error("Leave your current special career before beginning another one.");
    const track = this.specialCareerTrack(trackId);
    if (!track) throw new Error("Special career not found.");
    if (s.finances.cash < track.cost) throw new Error(`Training and applications cost ${U.formatMoney(track.cost, s.profile.currency)}.`);
    s.specialCareer.applications += 1;
    s.finances.cash -= track.cost;
    const stat = Number(s.stats[track.stat]) || 0;
    const talentBonus = s.profile.specialTalent === track.talent ? 24 : 0;
    const chance = U.clamp(28 + (stat - track.threshold) * 1.25 + talentBonus + s.fame * .15, 5, 96);
    const success = s.dev.specialCareerAlwaysSucceeds || U.random(s.rng) * 100 < chance;
    if (!success) {
      this.log("Special-career application declined", `The ${track.label.toLocaleLowerCase()} selection board recommends more preparation before applying again.`, "neutral", "📄");
      this.touch("special-career-declined");
      return null;
    }
    s.specialCareer.active = { trackId: track.id, rank: 0, performance: 48 + talentBonus / 3, reputation: 35, training: 0, years: 0, lastIncome: 0, startedAge: s.age };
    this.log(`Began a ${track.label.toLocaleLowerCase()} path`, `You enter the ${track.ranks[0].toLocaleLowerCase()} stage.`, "milestone", track.icon);
    this.touch("special-career-start");
    return s.specialCareer.active;
  };

  GP.specialCareerAction = function specialCareerAction(kind) {
    this.assertFree("Special career action");
    this.ensureExpansionState();
    const s = this.state;
    const active = s.specialCareer.active;
    if (!active) throw new Error("You do not have an active special career.");
    const track = this.specialCareerTrack(active.trackId);
    if (kind === "leave") {
      this.log(`Left the ${track.label.toLocaleLowerCase()} path`, `Your special-career record closes at ${track.ranks[active.rank]}.`, "neutral", "🚪");
      s.specialCareer.history.unshift({ age: s.age, year: s.year, kind: "leave", trackId: track.id, rank: active.rank });
      s.specialCareer.active = null;
      this.touch("special-career-leave");
      return null;
    }
    if (!s.dev.unlimitedActivityPoints && s.activityPoints < 1) throw new Error("Age up for another action.");
    if (!s.dev.unlimitedActivityPoints) s.activityPoints -= 1;
    let cost = 0;
    if (kind === "train") cost = 2400;
    if (kind === "network") cost = 4200;
    if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)}.`);
    s.finances.cash -= cost;
    if (kind === "train") { active.training += U.randomInt(s.rng, 7, 14); active.performance = U.clamp(active.performance + U.randomInt(s.rng, 4, 9), 0, 100); }
    else if (kind === "network") { active.reputation = U.clamp(active.reputation + U.randomInt(s.rng, 5, 11), 0, 100); s.fame = U.clamp(s.fame + 2, 0, 100); }
    else if (kind === "work") {
      const chance = U.clamp(38 + active.performance * .42 + active.training * .18 + active.reputation * .22 + (s.profile.specialTalent === track.talent ? 16 : 0), 8, 98);
      const success = s.dev.specialCareerAlwaysSucceeds || U.random(s.rng) * 100 < chance;
      if (success) {
        const income = Math.round(track.basePay * (.18 + active.rank * .12) * (U.randomInt(s.rng, 70, 145) / 100));
        s.finances.cash += income;
        active.lastIncome = income;
        active.performance = U.clamp(active.performance + U.randomInt(s.rng, 3, 9), 0, 100);
        active.reputation = U.clamp(active.reputation + U.randomInt(s.rng, 2, 7), 0, 100);
        s.fame = U.clamp(s.fame + Math.max(1, active.rank + 1), 0, 100);
        s.specialCareer.completedActions += 1;
        s.specialCareer.lifetimeIncome += income;
        if (U.random(s.rng) < .08 + active.rank * .04) { s.specialCareer.awards += 1; s.fame = U.clamp(s.fame + 5, 0, 100); }
        this.log(`${U.cap(track.action)} completed`, `The opportunity succeeds and pays ${U.formatMoney(income, s.profile.currency)}.`, "money", track.icon);
      } else {
        active.performance = U.clamp(active.performance - 3, 0, 100);
        this.log(`${U.cap(track.action)} did not go to plan`, "You gain experience, but the result does not advance your career this time.", "neutral", track.icon);
      }
    } else if (!["train", "network"].includes(kind)) throw new Error("Unknown special-career action.");
    const promotionThreshold = 72 + active.rank * 8;
    if (active.rank < track.ranks.length - 1 && active.performance + active.reputation * .35 + active.training * .2 >= promotionThreshold) {
      active.rank += 1;
      active.performance = Math.max(48, active.performance - 12);
      active.training = Math.max(0, active.training - 10);
      s.fame = U.clamp(s.fame + 6, 0, 100);
      this.log(`Advanced to ${track.ranks[active.rank]}`, `Your progress in the ${track.label.toLocaleLowerCase()} path reaches a new rank.`, "milestone", "🏅");
    }
    this.touch("special-career-action");
    return active;
  };

  GP.advanceSpecialCareerV25 = function advanceSpecialCareerV25() {
    this.ensureExpansionState();
    const s = this.state;
    const active = s.specialCareer.active;
    if (!active) return null;
    const track = this.specialCareerTrack(active.trackId);
    active.years += 1;
    const salary = Math.round(track.basePay * (1 + active.rank * .75) * (.75 + active.performance / 170));
    s.finances.cash += salary;
    s.specialCareer.lifetimeIncome += salary;
    active.lastIncome = salary;
    active.performance = U.clamp(active.performance + U.randomInt(s.rng, -4, 5), 0, 100);
    active.reputation = U.clamp(active.reputation + U.randomInt(s.rng, -2, 4), 0, 100);
    return { track, active, salary };
  };

  const previousAgeUp = GP.ageUp;
  GP.ageUp = function ageUpV25() {
    const before = this.state && this.state.age;
    const result = previousAgeUp.call(this);
    const s = this.state;
    if (s && s.alive && s.age !== before) {
      this.ensureExpansionState();
      const enterpriseUpdates = this.advanceEnterprisesV25();
      const collectionUpdate = this.advanceCollectionsV25();
      const careerUpdate = this.advanceSpecialCareerV25();
      enterpriseUpdates.slice(0, 2).forEach(({ item, profit, eventText }) => {
        this.emitLifeUpdateOnce(`v25-enterprise:${item.id}:${s.year}`, profit >= 0 ? `${item.name} had a strong year` : `${item.name} reported a difficult year`, `${item.name} ${profit >= 0 ? "earned" : "lost"} ${U.formatMoney(Math.abs(profit), s.profile.currency)}${eventText}.`, item.icon, profit >= 0 ? "update-good" : "update-bad");
      });
      if (collectionUpdate && Math.abs(collectionUpdate.change) >= 8) {
        const item = collectionUpdate.item;
        this.emitLifeUpdateOnce(`v25-collectible:${item.id}:${s.year}`, collectionUpdate.change >= 0 ? `${item.name} gained collector interest` : `${item.name} lost some market value`, `Its estimated value moved ${collectionUpdate.change >= 0 ? "+" : ""}${collectionUpdate.change.toFixed(1)}% to ${U.formatMoney(item.currentValue, s.profile.currency)}.`, item.icon, collectionUpdate.change >= 0 ? "update-good" : "update-bad");
      }
      if (careerUpdate) {
        this.emitLifeUpdateOnce(`v25-career:${s.year}`, `${careerUpdate.track.label} yearly update`, `You earned ${U.formatMoney(careerUpdate.salary, s.profile.currency)} as ${careerUpdate.track.ranks[careerUpdate.active.rank].toLocaleLowerCase()}.`, careerUpdate.track.icon, "update-good");
      }
      this.touch("v25-age-up");
    }
    return result;
  };

  const previousNetWorth = GP.netWorth;
  GP.netWorth = function netWorthV25() {
    return previousNetWorth.call(this) + this.enterprisePortfolioValue() + this.collectionPortfolioValue();
  };

  const previousContinueAs = GP.continueAs;
  GP.continueAs = function continueAsV25(personId) {
    this.ensureExpansionState();
    const inheritedEnterprises = U.deepClone(this.state.enterprises);
    const inheritedCollections = U.deepClone(this.state.collections);
    const state = previousContinueAs.call(this, personId);
    state.enterprises = inheritedEnterprises;
    state.collections = inheritedCollections;
    state.specialCareer = emptySpecialCareerState();
    this.ensureExpansionState();
    const value = this.enterprisePortfolioValue() + this.collectionPortfolioValue();
    if (value > 0) this.logUpdate("Enterprises and collections inherited", `Managed venues and collectibles worth about ${U.formatMoney(value, state.profile.currency)} pass to the new generation.`, "🏛️", "update-good");
    this.touch("v25-inheritance");
    return state;
  };

  GP.devMaxV25Systems = function devMaxV25Systems() {
    this.ensureExpansionState();
    const s = this.state;
    s.dev.enterpriseAlwaysProfits = true;
    s.dev.collectionAlwaysAuthentic = true;
    s.dev.specialCareerAlwaysSucceeds = true;
    s.finances.cash = Math.max(s.finances.cash, 10000000);
    if (!s.enterprises.owned.length) {
      NC.ENTERPRISE_TYPES.forEach((type) => {
        const item = { id: U.uid("enterprise"), typeId: type.id, label: type.label, icon: type.icon, name: `${s.profile.lastName} ${type.label}`, startedAge: s.age, years: 5, reputation: 100, appeal: 100, security: 100, special: 100, staff: 50, value: type.startupCost * 3, lastRevenue: type.baseRevenue * 2, lastProfit: type.baseRevenue, annualUpkeep: type.annualUpkeep, displayedCollectibles: [], history: [] };
        s.enterprises.owned.push(item);
      });
    } else s.enterprises.owned.forEach((item) => { item.reputation = item.appeal = item.security = item.special = 100; item.staff = Math.max(item.staff, 50); item.value = Math.max(item.value, 2000000); });
    s.collections.market.forEach((lot) => { lot.authentic = true; lot.appraised = true; });
    if (!s.specialCareer.active) s.specialCareer.active = { trackId: "astronaut", rank: 3, performance: 100, reputation: 100, training: 100, years: 10, lastIncome: 250000, startedAge: s.age };
    else { s.specialCareer.active.rank = 3; s.specialCareer.active.performance = 100; s.specialCareer.active.reputation = 100; s.specialCareer.active.training = 100; }
    this.touch("dev-max-v25");
  };

  GP.devAddAllCollectibles = function devAddAllCollectibles() {
    this.ensureExpansionState();
    const s = this.state;
    s.collections.market.forEach((lot) => {
      const item = U.deepClone(lot);
      item.id = U.uid("collectible");
      item.purchasePrice = 0;
      item.purchaseAge = s.age;
      item.authentic = true;
      item.appraised = true;
      item.displayedAt = null;
      s.collections.owned.push(item);
    });
    s.collections.market = makeAuctionLots(s, s.year + 1);
    this.touch("dev-collectibles");
  };

  GP.devClearV25Systems = function devClearV25Systems() {
    this.ensureExpansionState();
    this.state.enterprises = emptyEnterpriseState();
    this.state.collections = emptyCollectionState(this.state);
    this.state.specialCareer = emptySpecialCareerState();
    this.touch("dev-clear-v25");
  };
})(window);
