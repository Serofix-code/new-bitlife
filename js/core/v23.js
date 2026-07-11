(function installNextChapterV23(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine && NC.GameEngine.prototype;
  if (!GP) return;

  NC.APP_VERSION = "2.3.0";
  NC.SCHEMA_VERSION = Math.max(NC.SCHEMA_VERSION || 1, 14);

  NC.EXPANSIONS = Object.assign({}, NC.EXPANSIONS || {}, {
    crypto: { id: "crypto", label: "Crypto Expansion", icon: "🪙", description: "Trade fictional digital assets with extreme price swings.", minAge: 18, included: true },
    businesses: { id: "businesses", label: "Business Expansion", icon: "🏢", description: "Start, grow, improve, and sell companies.", minAge: 18, included: true },
    property: { id: "property", label: "Renting & Landlord Expansion", icon: "🏘️", description: "Rent a home or own income-producing rental properties.", minAge: 18, included: true }
  });

  const CRYPTO_FIRST = ["Aurora", "Pixel", "Nova", "Fjord", "Orbit", "Lumen", "Cobalt", "Echo", "Atlas", "Comet", "Quartz", "Violet", "Nimbus", "Polar", "Solar", "Mango"];
  const CRYPTO_SECOND = ["Coin", "Byte", "Chain", "Token", "Cash", "Ledger", "Node", "Spark", "Wave", "Mint"];

  const BUSINESS_TYPES = NC.BUSINESS_TYPES = [
    { id: "cafe", label: "Neighbourhood Café", icon: "☕", startupCost: 30000, baseRevenue: 52000, margin: .18, risk: "low", knowledge: 25 },
    { id: "online_store", label: "Online Store", icon: "📦", startupCost: 18000, baseRevenue: 41000, margin: .22, risk: "medium", knowledge: 35 },
    { id: "creative_studio", label: "Creative Studio", icon: "🎨", startupCost: 28000, baseRevenue: 56000, margin: .25, risk: "medium", knowledge: 40 },
    { id: "salon", label: "Style Salon", icon: "✂️", startupCost: 52000, baseRevenue: 88000, margin: .20, risk: "low", knowledge: 30 },
    { id: "gym", label: "Fitness Centre", icon: "🏋️", startupCost: 85000, baseRevenue: 132000, margin: .18, risk: "medium", knowledge: 35 },
    { id: "logistics", label: "Logistics Company", icon: "🚚", startupCost: 145000, baseRevenue: 245000, margin: .14, risk: "medium", knowledge: 50 },
    { id: "tech", label: "Technology Startup", icon: "💻", startupCost: 180000, baseRevenue: 310000, margin: .30, risk: "high", knowledge: 65 },
    { id: "hotel", label: "Boutique Hotel", icon: "🏨", startupCost: 420000, baseRevenue: 610000, margin: .16, risk: "high", knowledge: 55 }
  ];

  const RENTAL_HOMES = NC.RENTAL_HOMES = [
    { id: "room", label: "Shared Room", icon: "🛏️", annualRent: 7200, deposit: 600, happiness: -1 },
    { id: "studio", label: "City Studio", icon: "🏙️", annualRent: 14400, deposit: 1400, happiness: 1 },
    { id: "apartment", label: "Two-Bed Apartment", icon: "🏢", annualRent: 25200, deposit: 2400, happiness: 3 },
    { id: "house", label: "Family House", icon: "🏡", annualRent: 39600, deposit: 3800, happiness: 5 },
    { id: "penthouse", label: "Luxury Penthouse", icon: "🌆", annualRent: 96000, deposit: 9000, happiness: 8 }
  ];

  const LANDLORD_TYPES = NC.LANDLORD_TYPES = [
    { id: "small_flat", label: "Small Rental Flat", icon: "🏢", cost: 120000, monthlyRent: 1050, maintenance: 2400, appreciation: 2.2 },
    { id: "city_apartment", label: "City Apartment", icon: "🌇", cost: 240000, monthlyRent: 1850, maintenance: 4200, appreciation: 2.8 },
    { id: "family_home", label: "Suburban Family Home", icon: "🏡", cost: 360000, monthlyRent: 2550, maintenance: 6200, appreciation: 3.1 },
    { id: "duplex", label: "Residential Duplex", icon: "🏘️", cost: 520000, monthlyRent: 3900, maintenance: 9600, appreciation: 3.4 },
    { id: "apartment_block", label: "Small Apartment Block", icon: "🏬", cost: 1250000, monthlyRent: 9800, maintenance: 26000, appreciation: 3.6 }
  ];

  function seeded(state, suffix) {
    return { seed: U.hashSeed(`${state.saveId}|v23|${suffix}`), step: 0 };
  }

  function uniqueSymbol(name, used) {
    let base = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "COIN";
    let symbol = base;
    let n = 2;
    while (used.has(symbol)) symbol = `${base.slice(0, 3)}${n++}`;
    used.add(symbol);
    return symbol;
  }

  function makeCryptoMarket(state) {
    const rng = seeded(state, "crypto-assets");
    const usedNames = new Set();
    const usedSymbols = new Set();
    const coins = [];
    for (let index = 0; index < 8; index += 1) {
      let name;
      do name = `${U.pick(rng, CRYPTO_FIRST)} ${U.pick(rng, CRYPTO_SECOND)}`;
      while (usedNames.has(name));
      usedNames.add(name);
      const riskRoll = U.random(rng);
      const risk = riskRoll < .18 ? "moderate" : riskRoll < .68 ? "high" : "extreme";
      const volatility = risk === "moderate" ? U.randomInt(rng, 18, 35) : risk === "high" ? U.randomInt(rng, 35, 68) : U.randomInt(rng, 68, 120);
      const price = Number((U.randomInt(rng, 25, 850000) / 100).toFixed(2));
      coins.push({
        id: `crypto_${index}_${U.hashSeed(name).toString(36)}`,
        name,
        symbol: uniqueSymbol(name, usedSymbols),
        risk,
        volatility,
        price,
        previousPrice: price,
        annualChange: 0,
        allTimeHigh: price,
        allTimeLow: price,
        status: "active",
        summary: `${name} is a completely fictional digital asset in the Next Chapter market.`,
        history: [{ year: state.year, price, change: 0 }]
      });
    }
    return coins;
  }

  function emptyCrypto(state) {
    return {
      enabled: true,
      marketYear: state.year,
      marketMood: "Speculative",
      marketNews: ["The fictional crypto market opens with unpredictable demand."],
      coins: makeCryptoMarket(state),
      holdings: {},
      transactions: [],
      realizedProfit: 0,
      totalInvested: 0,
      totalSales: 0,
      yearlyReturns: []
    };
  }

  function emptyBusinesses() {
    return { owned: [], history: [], totalProfit: 0, totalRevenue: 0, businessesStarted: 0, businessesSold: 0 };
  }

  function emptyHousing() {
    return { rentalHome: null, rentalHistory: [], landlordProperties: [], landlordHistory: [], totalRentCollected: 0, totalMaintenance: 0 };
  }

  function addOption(center, option) {
    if (!center || center.options.some((item) => item.id === option.id)) return;
    center.options.push(option);
  }

  function extendActivityCenters() {
    const centers = NC.ACTIVITY_CENTERS;
    if (!centers) return;
    addOption(centers.social, { id: "photo_story", label: "Post a photo story", icon: "📷", minAge: 13, cost: 10, base: 56, skill: "happiness", effect: "post", multiplier: 1.6, v23: true });
    addOption(centers.social, { id: "podcast", label: "Publish a podcast episode", icon: "🎧", minAge: 16, cost: 120, base: 44, skill: "knowledge", requiresFollowers: 2000, effect: "post", multiplier: 4.2, v23: true });
    addOption(centers.social, { id: "community", label: "Host a fan community event", icon: "💬", minAge: 16, cost: 500, base: 52, skill: "resilience", requiresFollowers: 10000, effect: "post", multiplier: 5.4, v23: true });
    addOption(centers.social, { id: "premium_brand", label: "Premium sponsorship", icon: "💎", minAge: 18, cost: 0, base: 32, skill: "resilience", requiresFollowers: 100000, effect: "brand", multiplier: 14, v23: true });
    addOption(centers.fame, { id: "red_carpet", label: "Attend a red-carpet event", icon: "🎟️", minAge: 18, cost: 1800, base: 45, skill: "happiness", requiresFame: 30, effect: "fame", gain: 6, v23: true });
    addOption(centers.fame, { id: "fan_meet", label: "Host a fan meet-up", icon: "🤩", minAge: 16, cost: 1200, base: 58, skill: "resilience", requiresFame: 15, effect: "fame", gain: 4, v23: true });
    addOption(centers.fame, { id: "merch", label: "Launch public merchandise", icon: "🛍️", minAge: 18, cost: 8500, base: 36, skill: "knowledge", requiresFame: 35, effect: "fame", gain: 7, v23: true });
    addOption(centers.fame, { id: "documentary", label: "Release a personal documentary", icon: "🎥", minAge: 18, cost: 22000, base: 31, skill: "resilience", requiresFame: 55, effect: "fame", gain: 10, v23: true });
  }
  extendActivityCenters();

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV23State() {
    if (previousEnsure) previousEnsure.call(this);
    const s = this.state;
    if (!s) return;
    s.schemaVersion = NC.SCHEMA_VERSION;
    if (!s.crypto || !Array.isArray(s.crypto.coins) || !s.crypto.coins.length) s.crypto = emptyCrypto(s);
    s.crypto.holdings = s.crypto.holdings && typeof s.crypto.holdings === "object" ? s.crypto.holdings : {};
    s.crypto.transactions = Array.isArray(s.crypto.transactions) ? s.crypto.transactions : [];
    s.crypto.marketNews = Array.isArray(s.crypto.marketNews) ? s.crypto.marketNews : [];
    s.crypto.yearlyReturns = Array.isArray(s.crypto.yearlyReturns) ? s.crypto.yearlyReturns : [];
    s.crypto.coins.forEach((coin) => {
      coin.history = Array.isArray(coin.history) && coin.history.length ? coin.history : [{ year: s.year, price: coin.price, change: 0 }];
      coin.previousPrice = Number.isFinite(coin.previousPrice) ? coin.previousPrice : coin.price;
      coin.annualChange = Number.isFinite(coin.annualChange) ? coin.annualChange : 0;
      coin.allTimeHigh = Number.isFinite(coin.allTimeHigh) ? coin.allTimeHigh : coin.price;
      coin.allTimeLow = Number.isFinite(coin.allTimeLow) ? coin.allTimeLow : coin.price;
      coin.status = coin.status || "active";
    });
    if (!s.businesses || !Array.isArray(s.businesses.owned)) s.businesses = emptyBusinesses();
    s.businesses.history = Array.isArray(s.businesses.history) ? s.businesses.history : [];
    ["totalProfit", "totalRevenue", "businessesStarted", "businessesSold"].forEach((key) => {
      if (!Number.isFinite(s.businesses[key])) s.businesses[key] = 0;
    });
    s.businesses.owned.forEach((business) => {
      business.history = Array.isArray(business.history) ? business.history : [];
      business.reputation = Number.isFinite(business.reputation) ? business.reputation : 50;
      business.value = Number.isFinite(business.value) ? business.value : business.startupCost || 0;
      business.employees = Number.isFinite(business.employees) ? business.employees : 1;
      business.cashReserve = Number.isFinite(business.cashReserve) ? business.cashReserve : 0;
      business.status = business.status || "open";
    });
    if (!s.housing || !Array.isArray(s.housing.landlordProperties)) s.housing = emptyHousing();
    s.housing.rentalHistory = Array.isArray(s.housing.rentalHistory) ? s.housing.rentalHistory : [];
    s.housing.landlordHistory = Array.isArray(s.housing.landlordHistory) ? s.housing.landlordHistory : [];
    ["totalRentCollected", "totalMaintenance"].forEach((key) => { if (!Number.isFinite(s.housing[key])) s.housing[key] = 0; });
    s.housing.landlordProperties.forEach((property) => {
      property.history = Array.isArray(property.history) ? property.history : [];
      property.condition = Number.isFinite(property.condition) ? property.condition : 80;
      property.value = Number.isFinite(property.value) ? property.value : property.purchasePrice;
      property.occupied = property.occupied !== false;
      property.tenantName = property.tenantName || null;
    });
    s.social = Object.assign({ followers: 0, posts: 0 }, s.social || {});
    s.social.reputation = Number.isFinite(s.social.reputation) ? s.social.reputation : 60;
    s.social.engagement = Number.isFinite(s.social.engagement) ? s.social.engagement : 4;
    s.social.contentStreak = Number.isFinite(s.social.contentStreak) ? s.social.contentStreak : 0;
    s.social.platformLevel = s.social.platformLevel || "New account";
    s.social.monetized = Boolean(s.social.monetized);
    s.social.lifetimeCreatorIncome = Number.isFinite(s.social.lifetimeCreatorIncome) ? s.social.lifetimeCreatorIncome : 0;
    s.social.bestFollowerGain = Number.isFinite(s.social.bestFollowerGain) ? s.social.bestFollowerGain : 0;
    s.social.lastPostAge = Number.isFinite(s.social.lastPostAge) ? s.social.lastPostAge : null;
    s.social.niche = s.social.niche || "Lifestyle";
    s.activitySystems.fame = Object.assign({ publicImage: 60, pressMentions: 0, awards: 0, endorsements: 0, fanEvents: 0, lastActionAge: null }, s.activitySystems.fame || {});
    s.activitySystems.social = Object.assign({ viralPosts: 0, collaborations: 0, brandDeals: 0, accountStrikes: 0 }, s.activitySystems.social || {});
    s.lifeUpdateLedger = s.lifeUpdateLedger && typeof s.lifeUpdateLedger === "object" ? s.lifeUpdateLedger : {};
    s.dev = Object.assign({
      cryptoAlwaysProfits: false,
      cryptoNoFees: false,
      businessAlwaysProfits: false,
      landlordAlwaysOccupied: false,
      socialAlwaysViral: false,
      fameNeverDecays: false
    }, s.dev || {});
  };

  GP.logUpdate = function logUpdate(title, text, icon, tone) {
    this.log(title, text, tone || "update", icon || "•");
  };

  GP.cryptoCoin = function cryptoCoin(id) {
    this.ensureExpansionState();
    return this.state.crypto.coins.find((coin) => coin.id === id) || null;
  };

  GP.cryptoHolding = function cryptoHolding(id) {
    this.ensureExpansionState();
    return this.state.crypto.holdings[id] || null;
  };

  GP.cryptoPortfolioValue = function cryptoPortfolioValue() {
    this.ensureExpansionState();
    return Object.entries(this.state.crypto.holdings).reduce((sum, [id, holding]) => {
      const coin = this.cryptoCoin(id);
      return sum + (coin && coin.status === "active" ? coin.price * holding.units : 0);
    }, 0);
  };

  GP.cryptoCostBasis = function cryptoCostBasis() {
    this.ensureExpansionState();
    return Object.values(this.state.crypto.holdings).reduce((sum, holding) => sum + (holding.totalCost || holding.averageCost * holding.units || 0), 0);
  };

  GP.cryptoSummary = function cryptoSummary() {
    this.ensureExpansionState();
    const value = this.cryptoPortfolioValue();
    return { value, cost: this.cryptoCostBasis(), unrealized: value - this.cryptoCostBasis(), realized: this.state.crypto.realizedProfit, assetsOwned: Object.keys(this.state.crypto.holdings).length };
  };

  GP.buyCrypto = function buyCrypto(id, units) {
    this.ensureExpansionState();
    const s = this.state;
    const coin = this.cryptoCoin(id);
    const count = Number(units);
    if (this.isIncarcerated()) throw new Error("Crypto trading is unavailable while incarcerated.");
    if (s.age < 18 && !s.dev.ignoreActivityAgeLocks) throw new Error("Crypto trading unlocks at age 18.");
    if (!coin || coin.status !== "active") throw new Error("That digital asset is unavailable.");
    if (!Number.isFinite(count) || count <= 0 || count > 1000000000) throw new Error("Enter a positive number of units.");
    const fee = s.dev.cryptoNoFees ? 0 : Math.max(1, coin.price * count * .01);
    const total = coin.price * count + fee;
    if (s.finances.cash < total) throw new Error(`You need ${U.formatMoney(total, s.profile.currency)}.`);
    s.finances.cash -= total;
    const holding = s.crypto.holdings[id] || { coinId: id, units: 0, averageCost: 0, totalCost: 0, firstBoughtAge: s.age };
    holding.units += count;
    holding.totalCost += total;
    holding.averageCost = holding.totalCost / holding.units;
    s.crypto.holdings[id] = holding;
    s.crypto.totalInvested += total;
    s.crypto.transactions.unshift({ id: U.uid("crypto-trade"), side: "buy", coinId: id, name: coin.name, symbol: coin.symbol, units: count, price: coin.price, total, fee, age: s.age, year: s.year });
    this.log("Crypto purchased", `You bought ${count.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${coin.symbol} for ${U.formatMoney(total, s.profile.currency)} including fees.`, "milestone", "🪙");
    this.touch("crypto-buy");
    return holding;
  };

  GP.sellCrypto = function sellCrypto(id, units) {
    this.ensureExpansionState();
    const s = this.state;
    const coin = this.cryptoCoin(id);
    const holding = this.cryptoHolding(id);
    const count = Number(units);
    if (this.isIncarcerated()) throw new Error("Crypto trading is unavailable while incarcerated.");
    if (!coin || !holding) throw new Error("You do not own that digital asset.");
    if (!Number.isFinite(count) || count <= 0 || count > holding.units + 1e-9) throw new Error("Enter a valid number of units to sell.");
    const gross = coin.price * count;
    const fee = s.dev.cryptoNoFees ? 0 : Math.max(1, gross * .01);
    const proceeds = gross - fee;
    const basis = holding.averageCost * count;
    const profit = proceeds - basis;
    s.finances.cash += proceeds;
    holding.units -= count;
    holding.totalCost = Math.max(0, holding.totalCost - basis);
    if (holding.units <= 1e-8) delete s.crypto.holdings[id];
    s.crypto.realizedProfit += profit;
    s.crypto.totalSales += proceeds;
    s.crypto.transactions.unshift({ id: U.uid("crypto-trade"), side: "sell", coinId: id, name: coin.name, symbol: coin.symbol, units: count, price: coin.price, total: proceeds, fee, profit, age: s.age, year: s.year });
    this.log("Crypto sold", `You sold ${count.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${coin.symbol}, ${profit >= 0 ? "making" : "losing"} ${U.formatMoney(Math.abs(profit), s.profile.currency)} after fees.`, profit >= 0 ? "milestone" : "neutral", profit >= 0 ? "🚀" : "📉");
    this.touch("crypto-sell");
    return profit;
  };

  GP.advanceCryptoMarket = function advanceCryptoMarket() {
    this.ensureExpansionState();
    const s = this.state;
    const market = s.crypto;
    if (market.marketYear === s.year) return null;
    const before = this.cryptoPortfolioValue();
    const rng = seeded(s, `crypto-${s.year}-${s.rng.step}`);
    const moodRoll = U.randomInt(rng, -20, 24);
    const news = [];
    market.coins.forEach((coin) => {
      coin.previousPrice = coin.price;
      let change = (U.random(rng) + U.random(rng) - 1) * coin.volatility + moodRoll * .45;
      const event = U.random(rng);
      if (event < .04) { change -= U.randomInt(rng, 35, 88); news.push(`${coin.symbol} is hit by a fictional confidence crisis.`); }
      else if (event > .95) { change += U.randomInt(rng, 45, 170); news.push(`${coin.symbol} suddenly surges after a wave of fictional attention.`); }
      if (s.dev.cryptoAlwaysProfits) change = Math.max(change, U.randomInt(rng, 15, 85));
      change = U.clamp(change, -94, 260);
      coin.price = Number(Math.max(.0001, coin.previousPrice * (1 + change / 100)).toFixed(4));
      coin.annualChange = Number(((coin.price / coin.previousPrice - 1) * 100).toFixed(1));
      coin.allTimeHigh = Math.max(coin.allTimeHigh, coin.price);
      coin.allTimeLow = Math.min(coin.allTimeLow, coin.price);
      coin.history.unshift({ year: s.year, price: coin.price, change: coin.annualChange });
      if (coin.history.length > 40) coin.history.length = 40;
    });
    market.marketMood = moodRoll > 10 ? "Frenzied" : moodRoll < -10 ? "Fearful" : "Speculative";
    if (!news.length) news.push(market.marketMood === "Frenzied" ? "Digital assets attract a rush of fictional buyers." : market.marketMood === "Fearful" ? "Traders retreat from risky fictional assets." : "The digital market moves unevenly across the year.");
    const after = this.cryptoPortfolioValue();
    const returnPercent = before > 0 ? ((after - before) / before) * 100 : 0;
    market.yearlyReturns.unshift({ year: s.year, value: after, returnPercent: Number(returnPercent.toFixed(1)) });
    if (market.yearlyReturns.length > 40) market.yearlyReturns.length = 40;
    market.marketYear = s.year;
    market.marketNews = news.slice(0, 6);
    return { before, after, returnPercent, news, mood: market.marketMood };
  };

  GP.businessType = function businessType(typeId) {
    return BUSINESS_TYPES.find((item) => item.id === typeId) || null;
  };

  GP.startBusiness = function startBusiness(typeId, requestedName) {
    this.ensureExpansionState();
    const s = this.state;
    const type = this.businessType(typeId);
    if (this.isIncarcerated()) throw new Error("You cannot operate an outside business while incarcerated.");
    if (s.age < 18 && !s.dev.ignoreActivityAgeLocks) throw new Error("Business ownership unlocks at age 18.");
    if (!type) throw new Error("Unknown business type.");
    if (s.businesses.owned.length >= 8) throw new Error("You already manage the maximum of eight businesses.");
    if (s.finances.cash < type.startupCost) throw new Error(`You need ${U.formatMoney(type.startupCost, s.profile.currency)}.`);
    const name = U.cleanName(requestedName, `${s.profile.lastName} ${type.label}`);
    s.finances.cash -= type.startupCost;
    const business = {
      id: U.uid("business"), typeId, name, icon: type.icon, label: type.label, startupCost: type.startupCost,
      value: Math.round(type.startupCost * .85), reputation: 50, employees: Math.max(1, Math.round(type.startupCost / 50000)),
      cashReserve: 0, openedAge: s.age, lastRevenue: 0, lastProfit: 0, totalProfit: 0, totalRevenue: 0,
      advertising: 0, quality: 50, status: "open", history: []
    };
    s.businesses.owned.push(business);
    s.businesses.businessesStarted += 1;
    s.businesses.history.unshift({ age: s.age, year: s.year, action: "started", businessId: business.id, name });
    this.log("Business opened", `${name}, a ${type.label.toLocaleLowerCase()}, begins trading with ${business.employees} employee${business.employees === 1 ? "" : "s"}.`, "milestone", type.icon);
    this.touch("business-start");
    return business;
  };

  GP.businessAction = function businessAction(id, action) {
    this.ensureExpansionState();
    const s = this.state;
    const business = s.businesses.owned.find((item) => item.id === id);
    if (!business) throw new Error("That business was not found.");
    if (this.isIncarcerated()) throw new Error("Business management is unavailable while incarcerated.");
    if (action === "invest") {
      const cost = Math.max(5000, Math.round(business.value * .08));
      if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)}.`);
      s.finances.cash -= cost;
      business.value += Math.round(cost * .8);
      business.quality = U.clamp(business.quality + 8, 0, 100);
      business.cashReserve += Math.round(cost * .2);
      this.log("Business improved", `${U.formatMoney(cost, s.profile.currency)} is invested into ${business.name}, improving quality and long-term value.`, "money", "🛠️");
    } else if (action === "advertise") {
      const cost = Math.max(1200, Math.round(business.value * .025));
      if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)}.`);
      s.finances.cash -= cost;
      business.advertising = U.clamp(business.advertising + 14, 0, 100);
      business.reputation = U.clamp(business.reputation + 4, 0, 100);
      this.log("Advertising campaign", `${business.name} launches a new campaign designed to improve demand next year.`, "milestone", "📣");
    } else if (action === "hire") {
      const cost = 12000;
      if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)}.`);
      s.finances.cash -= cost;
      business.employees += 1;
      business.quality = U.clamp(business.quality + 3, 0, 100);
      this.log("New employee hired", `${business.name} grows to ${business.employees} employees.`, "relationship", "🧑‍💼");
    } else if (action === "sell") {
      const sale = Math.max(0, Math.round(business.value * (.82 + business.reputation / 500)));
      s.finances.cash += sale;
      business.status = "sold";
      s.businesses.owned = s.businesses.owned.filter((item) => item.id !== id);
      s.businesses.businessesSold += 1;
      s.businesses.history.unshift({ age: s.age, year: s.year, action: "sold", businessId: id, name: business.name, value: sale });
      this.log("Business sold", `${business.name} is sold for ${U.formatMoney(sale, s.profile.currency)}.`, "money", "🤝");
    } else throw new Error("Unknown business action.");
    this.touch(`business-${action}`);
    return business;
  };

  GP.businessPortfolioValue = function businessPortfolioValue() {
    this.ensureExpansionState();
    return this.state.businesses.owned.reduce((sum, business) => sum + Math.max(0, business.value || 0), 0);
  };

  GP.advanceBusinesses = function advanceBusinesses() {
    this.ensureExpansionState();
    const s = this.state;
    const updates = [];
    s.businesses.owned.forEach((business) => {
      const type = this.businessType(business.typeId) || BUSINESS_TYPES[0];
      const rng = seeded(s, `business-${business.id}-${s.year}`);
      const knowledge = s.stats.knowledge / 100;
      const demand = .68 + U.random(rng) * .7 + business.reputation / 280 + business.advertising / 240 + knowledge * .25;
      let revenue = Math.round(type.baseRevenue * demand * (1 + Math.max(0, business.employees - 1) * .055));
      const wageCost = business.employees * 10500;
      const operating = Math.round(revenue * (1 - type.margin)) + wageCost;
      let profit = revenue - operating;
      const eventRoll = U.random(rng);
      let eventText = "";
      if (eventRoll < .05 && type.risk === "high") { profit -= Math.round(type.startupCost * .22); eventText = " after an expensive failed project"; }
      else if (eventRoll > .94) { profit += Math.round(type.baseRevenue * .3); eventText = " after an unexpectedly popular year"; }
      if (s.dev.businessAlwaysProfits) profit = Math.max(profit, Math.round(type.baseRevenue * .2));
      business.lastRevenue = revenue;
      business.lastProfit = profit;
      business.totalRevenue += revenue;
      business.totalProfit += profit;
      s.businesses.totalRevenue += revenue;
      s.businesses.totalProfit += profit;
      if (profit >= 0) s.finances.cash += profit;
      else {
        const available = Math.min(s.finances.cash, Math.abs(profit));
        s.finances.cash -= available;
        if (available < Math.abs(profit)) s.finances.debt += Math.abs(profit) - available;
      }
      const growth = U.clamp(profit / Math.max(1, type.baseRevenue) * 30 + U.randomInt(rng, -5, 6), -30, 42);
      business.value = Math.max(500, Math.round(business.value * (1 + growth / 100)));
      business.reputation = U.clamp(business.reputation + (profit > 0 ? U.randomInt(rng, 0, 5) : U.randomInt(rng, -6, 1)), 0, 100);
      business.advertising = Math.max(0, business.advertising - 8);
      business.history.unshift({ year: s.year, revenue, profit, value: business.value, reputation: business.reputation });
      if (business.history.length > 30) business.history.length = 30;
      updates.push({ business, revenue, profit, eventText });
    });
    return updates;
  };

  GP.rentHome = function rentHome(typeId) {
    this.ensureExpansionState();
    const s = this.state;
    const type = RENTAL_HOMES.find((item) => item.id === typeId);
    if (this.isIncarcerated()) throw new Error("You cannot sign a lease while incarcerated.");
    if (s.age < 18 && !s.dev.ignoreActivityAgeLocks) throw new Error("Renting unlocks at age 18.");
    if (!type) throw new Error("Unknown rental home.");
    if (s.housing.rentalHome) throw new Error("End your current lease first.");
    const moveInCost = type.deposit + type.annualRent;
    if (s.finances.cash < moveInCost) throw new Error(`You need ${U.formatMoney(moveInCost, s.profile.currency)} for the deposit and first year.`);
    s.finances.cash -= moveInCost;
    s.housing.rentalHome = { typeId, label: type.label, icon: type.icon, annualRent: type.annualRent, deposit: type.deposit, startedAge: s.age, years: 0 };
    s.housing.rentalHistory.unshift({ action: "lease-started", age: s.age, year: s.year, typeId, label: type.label });
    s.stats.happiness = U.clamp(s.stats.happiness + type.happiness, 0, 100);
    this.log("New home rented", `You sign a lease for a ${type.label.toLocaleLowerCase()} and pay ${U.formatMoney(moveInCost, s.profile.currency)} to move in.`, "milestone", type.icon);
    this.touch("rent-home");
  };

  GP.endLease = function endLease() {
    this.ensureExpansionState();
    const s = this.state;
    const rental = s.housing.rentalHome;
    if (!rental) throw new Error("You do not currently rent a home.");
    const refund = Math.round(rental.deposit * .75);
    s.finances.cash += refund;
    s.housing.rentalHistory.unshift({ action: "lease-ended", age: s.age, year: s.year, typeId: rental.typeId, label: rental.label, refund });
    s.housing.rentalHome = null;
    this.log("Lease ended", `You move out of the ${rental.label.toLocaleLowerCase()} and receive ${U.formatMoney(refund, s.profile.currency)} of the deposit back.`, "neutral", "📦");
    this.touch("end-lease");
  };

  GP.buyLandlordProperty = function typeIdBuyLandlordProperty(typeId) {
    this.ensureExpansionState();
    const s = this.state;
    const type = LANDLORD_TYPES.find((item) => item.id === typeId);
    if (this.isIncarcerated()) throw new Error("Property purchases are unavailable while incarcerated.");
    if (s.age < 18 && !s.dev.ignoreActivityAgeLocks) throw new Error("Landlord properties unlock at age 18.");
    if (!type) throw new Error("Unknown rental property.");
    if (s.finances.cash < type.cost) throw new Error(`You need ${U.formatMoney(type.cost, s.profile.currency)}.`);
    s.finances.cash -= type.cost;
    const occupied = s.dev.landlordAlwaysOccupied || U.random(s.rng) < .72;
    const tenant = occupied ? this.randomPerson("tenant", { age: U.randomInt(s.rng, 20, 68), closeness: 30 }) : null;
    const property = { id: U.uid("rental-property"), typeId, label: type.label, icon: type.icon, purchasePrice: type.cost, value: type.cost, monthlyRent: type.monthlyRent, maintenance: type.maintenance, condition: U.randomInt(s.rng, 70, 94), occupied, tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : null, purchasedAge: s.age, history: [] };
    s.housing.landlordProperties.push(property);
    s.housing.landlordHistory.unshift({ action: "bought", age: s.age, year: s.year, propertyId: property.id, label: property.label, value: property.value });
    this.log("Rental property purchased", `You buy a ${type.label.toLocaleLowerCase()} for ${U.formatMoney(type.cost, s.profile.currency)}${occupied ? ` with ${property.tenantName} moving in` : " and begin looking for a tenant"}.`, "money", type.icon);
    this.touch("landlord-buy");
    return property;
  };

  GP.landlordAction = function landlordAction(id, action) {
    this.ensureExpansionState();
    const s = this.state;
    const property = s.housing.landlordProperties.find((item) => item.id === id);
    if (!property) throw new Error("That rental property was not found.");
    if (this.isIncarcerated()) throw new Error("Landlord management is unavailable while incarcerated.");
    if (action === "tenant") {
      const cost = 700;
      if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)}.`);
      s.finances.cash -= cost;
      const tenant = this.randomPerson("tenant", { age: U.randomInt(s.rng, 20, 68), closeness: 30 });
      property.occupied = true;
      property.tenantName = `${tenant.firstName} ${tenant.lastName}`;
      this.log("Tenant found", `${property.tenantName} signs a lease for your ${property.label.toLocaleLowerCase()}.`, "relationship", "🔑");
    } else if (action === "renovate") {
      const cost = Math.max(5000, Math.round(property.value * .06));
      if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)}.`);
      s.finances.cash -= cost;
      property.condition = U.clamp(property.condition + 25, 0, 100);
      property.value += Math.round(cost * .7);
      property.monthlyRent = Math.round(property.monthlyRent * 1.07);
      this.log("Rental renovated", `You spend ${U.formatMoney(cost, s.profile.currency)} improving the ${property.label.toLocaleLowerCase()}.`, "money", "🛠️");
    } else if (action === "sell") {
      const sale = Math.round(property.value * .94);
      s.finances.cash += sale;
      s.housing.landlordProperties = s.housing.landlordProperties.filter((item) => item.id !== id);
      s.housing.landlordHistory.unshift({ action: "sold", age: s.age, year: s.year, propertyId: id, label: property.label, value: sale });
      this.log("Rental property sold", `The ${property.label.toLocaleLowerCase()} sells for ${U.formatMoney(sale, s.profile.currency)}.`, "money", "🏷️");
    } else throw new Error("Unknown landlord action.");
    this.touch(`landlord-${action}`);
  };

  GP.landlordPortfolioValue = function landlordPortfolioValue() {
    this.ensureExpansionState();
    return this.state.housing.landlordProperties.reduce((sum, property) => sum + Math.max(0, property.value || 0), 0);
  };

  GP.advanceHousing = function advanceHousing() {
    this.ensureExpansionState();
    const s = this.state;
    const updates = [];
    if (s.housing.rentalHome) {
      const rental = s.housing.rentalHome;
      rental.years += 1;
      const rent = Math.round(rental.annualRent * (1 + Math.min(.25, rental.years * .018)));
      if (s.finances.cash >= rent) s.finances.cash -= rent;
      else { const gap = rent - s.finances.cash; s.finances.cash = 0; s.finances.debt += gap; }
      updates.push({ kind: "tenant-rent", rental, amount: rent });
    }
    s.housing.landlordProperties.forEach((property) => {
      const type = LANDLORD_TYPES.find((item) => item.id === property.typeId) || LANDLORD_TYPES[0];
      const rng = seeded(s, `landlord-${property.id}-${s.year}`);
      if (s.dev.landlordAlwaysOccupied && !property.occupied) property.occupied = true;
      if (property.occupied && !s.dev.landlordAlwaysOccupied && U.random(rng) < .09) {
        property.occupied = false;
        property.tenantName = null;
      }
      if (!property.occupied && (s.dev.landlordAlwaysOccupied || U.random(rng) < .5)) {
        const tenant = this.randomPerson("tenant", { age: U.randomInt(s.rng, 20, 68), closeness: 30 });
        property.occupied = true;
        property.tenantName = `${tenant.firstName} ${tenant.lastName}`;
      }
      const rent = property.occupied ? property.monthlyRent * 12 : 0;
      let maintenance = Math.round(type.maintenance * (.7 + U.random(rng) * .9));
      if (U.random(rng) < .08) maintenance += Math.round(property.value * .025);
      const net = rent - maintenance;
      if (net >= 0) s.finances.cash += net;
      else if (s.finances.cash >= -net) s.finances.cash += net;
      else { const gap = -net - s.finances.cash; s.finances.cash = 0; s.finances.debt += gap; }
      s.housing.totalRentCollected += rent;
      s.housing.totalMaintenance += maintenance;
      property.condition = U.clamp(property.condition - U.randomInt(rng, 1, 5), 20, 100);
      const appreciation = type.appreciation + U.randomInt(rng, -4, 5) + (property.condition - 70) / 25;
      property.value = Math.max(1000, Math.round(property.value * (1 + appreciation / 100)));
      property.history.unshift({ year: s.year, rent, maintenance, net, value: property.value, occupied: property.occupied });
      if (property.history.length > 30) property.history.length = 30;
      updates.push({ kind: "landlord", property, rent, maintenance, net });
    });
    return updates;
  };

  function platformLevel(followers) {
    if (followers >= 10000000) return "Global celebrity";
    if (followers >= 1000000) return "Major creator";
    if (followers >= 100000) return "Verified creator";
    if (followers >= 10000) return "Growing creator";
    if (followers >= 1000) return "Emerging account";
    return "New account";
  }

  const previousDynamicActivity = GP.performDynamicActivity;
  GP.performDynamicActivity = function performDynamicActivityV23(centerId, optionId) {
    const beforeFollowers = this.state.social ? this.state.social.followers : 0;
    const beforeCash = this.state.finances.cash;
    const beforeFame = this.state.fame;
    const result = previousDynamicActivity.call(this, centerId, optionId);
    this.ensureExpansionState();
    const s = this.state;
    if (centerId === "social") {
      const gain = Math.max(0, s.social.followers - beforeFollowers);
      s.social.lastPostAge = s.age;
      s.social.contentStreak += 1;
      s.social.bestFollowerGain = Math.max(s.social.bestFollowerGain, gain);
      s.social.engagement = U.clamp(s.social.engagement + (result ? U.randomInt(s.rng, 1, 5) : U.randomInt(s.rng, -2, 1)), .1, 40);
      s.social.reputation = U.clamp(s.social.reputation + (result ? 2 : -1), 0, 100);
      s.social.platformLevel = platformLevel(s.social.followers);
      if (s.social.followers >= 10000) s.social.monetized = true;
      if (s.social.monetized && gain > 0) {
        const creatorIncome = Math.round(Math.max(15, gain * .15 + s.social.followers * .0015));
        s.finances.cash += creatorIncome;
        s.social.lifetimeCreatorIncome += creatorIncome;
      }
      if (s.dev.socialAlwaysViral && gain < 50000) {
        const extra = 50000 - gain;
        s.social.followers += extra;
        s.activitySystems.social.viralPosts += 1;
        s.social.platformLevel = platformLevel(s.social.followers);
      }
    } else if (centerId === "fame") {
      const fameSystem = s.activitySystems.fame;
      fameSystem.lastActionAge = s.age;
      fameSystem.pressMentions += result ? U.randomInt(s.rng, 3, 16) : 1;
      fameSystem.publicImage = U.clamp(fameSystem.publicImage + (result ? 4 : -3), 0, 100);
      if (optionId === "fan_meet" && result) fameSystem.fanEvents += 1;
      if (["commercial", "red_carpet", "merch"].includes(optionId) && result) fameSystem.endorsements += 1;
      if (result && s.fame >= 65 && U.random(s.rng) < .18) {
        fameSystem.awards += 1;
        this.logUpdate("Public award received", `Your recent fame work earns a new public award, bringing your total to ${fameSystem.awards}.`, "🏆", "update-good");
      }
      if (optionId === "merch" && result) {
        const income = Math.round(2500 + s.social.followers * .04 + s.fame * 180);
        s.finances.cash += income;
        this.logUpdate("Merchandise sells out", `Your public merchandise earns ${U.formatMoney(income, s.profile.currency)}.`, "🛍️", "update-good");
      }
      if (optionId === "documentary" && result) {
        const income = Math.round(12000 + s.fame * 900);
        s.finances.cash += income;
        this.logUpdate("Documentary release", `Your documentary reaches a wide audience and earns ${U.formatMoney(income, s.profile.currency)}.`, "🎥", "update-good");
      }
    }
    if (centerId === "social" || centerId === "fame") this.touch("v23-social-fame");
    return result;
  };

  GP.advanceSocialAndFame = function advanceSocialAndFame() {
    this.ensureExpansionState();
    const s = this.state;
    if (s.age < 13) return null;
    const activeThisAge = s.social.lastPostAge === s.age || s.social.lastPostAge === s.age - 1;
    let followerChange = 0;
    if (s.social.followers > 0) {
      const organic = Math.round((s.social.followers * (s.social.reputation - 45) / 1000) + s.fame * 8 + s.social.engagement * 15);
      const churn = activeThisAge ? 0 : Math.round(s.social.followers * .035);
      followerChange = Math.max(-Math.round(s.social.followers * .2), organic - churn + U.randomInt(s.rng, -50, 180));
      s.social.followers = Math.max(0, s.social.followers + followerChange);
    }
    if (!activeThisAge) s.social.contentStreak = 0;
    s.social.platformLevel = platformLevel(s.social.followers);
    const fameSystem = s.activitySystems.fame;
    let fameChange = 0;
    if (!s.dev.fameNeverDecays && s.fame > 0 && fameSystem.lastActionAge !== s.age && fameSystem.lastActionAge !== s.age - 1) {
      fameChange = s.fame >= 70 ? -2 : -1;
      s.fame = U.clamp(s.fame + fameChange, 0, 100);
    }
    return { followerChange, fameChange, activeThisAge };
  };

  function relativeLabel(person) {
    if (person.role === "sibling") return person.identity === "woman" ? "sister" : person.identity === "man" ? "brother" : "sibling";
    if (person.role === "child" || person.role === "stepchild") return person.identity === "woman" ? "daughter" : person.identity === "man" ? "son" : "child";
    if (person.role === "parent") return person.identity === "woman" ? "mother" : person.identity === "man" ? "father" : "parent";
    if (person.role === "spouse") return "spouse";
    return person.role || "relative";
  }

  GP.emitLifeUpdateOnce = function emitLifeUpdateOnce(key, title, text, icon, tone) {
    this.ensureExpansionState();
    if (this.state.lifeUpdateLedger[key]) return false;
    this.state.lifeUpdateLedger[key] = true;
    this.logUpdate(title, text, icon, tone);
    return true;
  };

  GP.generateAgeUpUpdates = function generateAgeUpUpdates(context) {
    this.ensureExpansionState();
    const s = this.state;
    let count = 0;
    const relatives = s.relationships.filter((person) => person.alive && ["sibling", "child", "stepchild", "parent", "spouse"].includes(person.role));
    for (const person of relatives) {
      const relation = relativeLabel(person);
      const base = `${person.id}:${person.age}`;
      if (person.age === 1 && ["child", "stepchild"].includes(person.role)) count += this.emitLifeUpdateOnce(`${base}:steps`, `${person.firstName} took their first steps!`, `Your ${relation}, ${person.firstName}, is beginning to explore the world independently.`, "👣", "update-good") ? 1 : 0;
      if (person.age === 6) count += this.emitLifeUpdateOnce(`${base}:kindergarten`, `${person.firstName} graduated kindergarten!`, `Your ${relation}, ${person.firstName}, finished kindergarten and is ready for the next stage of school.`, "🎒", "update-good") ? 1 : 0;
      if (person.age === 13) count += this.emitLifeUpdateOnce(`${base}:secondary`, `${person.firstName} started secondary school`, `Your ${relation}, ${person.firstName}, began a new stage of education.`, "🏫", "update") ? 1 : 0;
      if (person.age === 18) count += this.emitLifeUpdateOnce(`${base}:graduation`, `${person.firstName} graduated from school!`, `Your ${relation}, ${person.firstName}, completed upper secondary education.`, "🎓", "update-good") ? 1 : 0;
      if (person.age === 22 && U.random(s.rng) < .72) {
        const fields = ["business", "engineering", "arts", "health sciences", "law", "technology", "education"];
        count += this.emitLifeUpdateOnce(`${base}:university`, `${person.firstName} earned a degree!`, `Your ${relation}, ${person.firstName}, graduated in ${U.pick(s.rng, fields)}.`, "🎓", "update-good") ? 1 : 0;
      }
      if (person.age === 25 && U.random(s.rng) < .8) {
        const careers = ["designer", "teacher", "engineer", "nurse", "analyst", "chef", "developer", "manager"];
        const career = U.pick(s.rng, careers);
        person.occupation = career;
        count += this.emitLifeUpdateOnce(`${base}:career`, `${person.firstName} started a new career`, `Your ${relation}, ${person.firstName}, began working as a ${career}.`, "💼", "update-good") ? 1 : 0;
      }
      if (person.age === 65 && person.role === "parent") count += this.emitLifeUpdateOnce(`${base}:retired`, `${person.firstName} retired`, `Your ${relation}, ${person.firstName}, entered retirement after a long working life.`, "🌤️", "update") ? 1 : 0;
      if (count >= 2) break;
    }

    const heldCompanies = Object.keys(s.investment.holdings || {}).map((id) => this.investmentCompany(id)).filter(Boolean).sort((a, b) => Math.abs(b.annualChange) - Math.abs(a.annualChange));
    if (heldCompanies.length) {
      const company = heldCompanies[0];
      const change = company.annualChange;
      const holding = s.investment.holdings[company.id];
      if (Math.abs(change) >= 8) {
        const key = `investment:${company.id}:${s.year}`;
        const value = holding.shares * company.price;
        const title = change >= 35 ? `Your investment in ${company.name} went to the sky!` : change >= 8 ? `${company.name} climbed this year` : change <= -35 ? `${company.name} plunged!` : `${company.name} lost ground`;
        const text = `${company.ticker} moved ${change >= 0 ? "+" : ""}${change.toFixed(1)}%, leaving your holding worth ${U.formatMoney(value, s.profile.currency)}.`;
        this.emitLifeUpdateOnce(key, title, text, change >= 0 ? "🚀" : "📉", change >= 0 ? "update-good" : "update-bad");
      }
    }

    const heldCoins = Object.keys(s.crypto.holdings || {}).map((id) => this.cryptoCoin(id)).filter(Boolean).sort((a, b) => Math.abs(b.annualChange) - Math.abs(a.annualChange));
    if (heldCoins.length) {
      const coin = heldCoins[0];
      const holding = s.crypto.holdings[coin.id];
      if (Math.abs(coin.annualChange) >= 15) {
        const value = holding.units * coin.price;
        const title = coin.annualChange >= 60 ? `${coin.name} blasted upward!` : coin.annualChange >= 15 ? `${coin.name} rallied` : coin.annualChange <= -60 ? `${coin.name} crashed hard` : `${coin.name} fell this year`;
        this.emitLifeUpdateOnce(`crypto:${coin.id}:${s.year}`, title, `${coin.symbol} moved ${coin.annualChange >= 0 ? "+" : ""}${coin.annualChange.toFixed(1)}%, leaving your holding worth ${U.formatMoney(value, s.profile.currency)}.`, coin.annualChange >= 0 ? "🌕" : "💥", coin.annualChange >= 0 ? "update-good" : "update-bad");
      }
    }

    (context.businessUpdates || []).slice(0, 2).forEach(({ business, profit, eventText }) => {
      const positive = profit >= 0;
      this.emitLifeUpdateOnce(`business:${business.id}:${s.year}`, positive ? `${business.name} had a profitable year!` : `${business.name} struggled this year`, `${business.name} ${positive ? "earned" : "lost"} ${U.formatMoney(Math.abs(profit), s.profile.currency)}${eventText}.`, positive ? "🏢" : "📉", positive ? "update-good" : "update-bad");
    });

    (context.housingUpdates || []).slice(0, 2).forEach((update) => {
      if (update.kind === "tenant-rent") {
        this.emitLifeUpdateOnce(`lease:${s.year}`, "Your yearly rent was paid", `${U.formatMoney(update.amount, s.profile.currency)} was paid for your ${update.rental.label.toLocaleLowerCase()}.`, "🏠", "update");
      } else {
        const property = update.property;
        this.emitLifeUpdateOnce(`landlord:${property.id}:${s.year}`, update.net >= 0 ? `${property.label} produced rental income` : `${property.label} needed costly work`, update.net >= 0 ? `After maintenance, the property added ${U.formatMoney(update.net, s.profile.currency)} to your finances.` : `Maintenance and vacancy created a ${U.formatMoney(Math.abs(update.net), s.profile.currency)} loss.`, update.net >= 0 ? "🔑" : "🛠️", update.net >= 0 ? "update-good" : "update-bad");
      }
    });

    const social = context.socialUpdate;
    if (social && Math.abs(social.followerChange) >= 100) {
      this.emitLifeUpdateOnce(`social:${s.year}`, social.followerChange >= 0 ? "Your audience grew this year" : "Your audience became quieter", `${social.followerChange >= 0 ? "+" : "−"}${Math.abs(social.followerChange).toLocaleString()} followers. You now have ${s.social.followers.toLocaleString()} followers and are ranked as a ${s.social.platformLevel.toLocaleLowerCase()}.`, social.followerChange >= 0 ? "📱" : "📵", social.followerChange >= 0 ? "update-good" : "update-bad");
    }
    if (social && social.fameChange < 0) {
      this.emitLifeUpdateOnce(`fame-decay:${s.year}`, "Your fame cooled a little", `Without a major public appearance this year, your fame slipped to ${Math.round(s.fame)}%.`, "🌙", "update");
    }
  };

  const previousAgeUp = GP.ageUp;
  GP.ageUp = function ageUpV23() {
    const before = this.state && this.state.age;
    const result = previousAgeUp.call(this);
    const s = this.state;
    if (s && s.alive && s.age !== before) {
      this.ensureExpansionState();
      const cryptoUpdate = this.advanceCryptoMarket();
      const businessUpdates = this.advanceBusinesses();
      const housingUpdates = this.advanceHousing();
      const socialUpdate = this.advanceSocialAndFame();
      this.generateAgeUpUpdates({ cryptoUpdate, businessUpdates, housingUpdates, socialUpdate });
      this.touch("v23-age-up-systems");
    }
    return result;
  };

  const previousNetWorth = GP.netWorth;
  GP.netWorth = function netWorthV23() {
    return previousNetWorth.call(this) + this.cryptoPortfolioValue() + this.businessPortfolioValue() + this.landlordPortfolioValue();
  };

  const previousContinueAs = GP.continueAs;
  GP.continueAs = function continueAsV23(personId) {
    this.ensureExpansionState();
    const inheritedCrypto = U.deepClone(this.state.crypto);
    const inheritedBusinesses = U.deepClone(this.state.businesses);
    const inheritedHousing = U.deepClone(this.state.housing);
    const state = previousContinueAs.call(this, personId);
    state.crypto = inheritedCrypto;
    state.crypto.marketYear = state.year;
    state.businesses = inheritedBusinesses;
    state.housing = inheritedHousing;
    if (state.housing) state.housing.rentalHome = null;
    this.ensureExpansionState();
    const inheritedValue = this.cryptoPortfolioValue() + this.businessPortfolioValue() + this.landlordPortfolioValue();
    if (inheritedValue > 0) this.logUpdate("Expansion assets inherited", `Digital assets, businesses, and rental properties worth approximately ${U.formatMoney(inheritedValue, state.profile.currency)} pass to the new generation.`, "🌿", "update-good");
    this.touch("v23-inheritance");
    return state;
  };

  GP.devMoveCryptoMarket = function devMoveCryptoMarket(percent) {
    this.ensureExpansionState();
    const amount = U.clamp(Number(percent) || 0, -99, 1000);
    this.state.crypto.coins.forEach((coin) => {
      coin.previousPrice = coin.price;
      coin.price = Number(Math.max(.0001, coin.price * (1 + amount / 100)).toFixed(4));
      coin.annualChange = amount;
      coin.history.unshift({ year: this.state.year, price: coin.price, change: amount, developer: true });
    });
    this.state.crypto.marketMood = amount >= 0 ? "Developer moonshot" : "Developer crash";
    this.state.crypto.marketNews = [`Developer tools moved every fictional crypto asset by ${amount}%.`];
    this.touch("dev-crypto-market");
  };

  GP.devAddCryptoHoldings = function devAddCryptoHoldings(units) {
    this.ensureExpansionState();
    const count = Math.max(.001, Number(units) || 1000);
    this.state.crypto.coins.forEach((coin) => {
      const holding = this.state.crypto.holdings[coin.id] || { coinId: coin.id, units: 0, averageCost: coin.price, totalCost: 0, firstBoughtAge: this.state.age };
      holding.units += count;
      holding.totalCost += count * coin.price;
      holding.averageCost = holding.totalCost / holding.units;
      this.state.crypto.holdings[coin.id] = holding;
    });
    this.touch("dev-crypto-holdings");
  };

  GP.devMaxV23Expansions = function devMaxV23Expansions() {
    this.ensureExpansionState();
    const s = this.state;
    const previousIgnoreAgeLocks = Boolean(s.dev.ignoreActivityAgeLocks);
    s.dev.ignoreActivityAgeLocks = true;
    s.finances.cash = Math.max(s.finances.cash, 1000000000);
    s.dev.cryptoAlwaysProfits = true;
    s.dev.cryptoNoFees = true;
    s.dev.businessAlwaysProfits = true;
    s.dev.landlordAlwaysOccupied = true;
    s.dev.socialAlwaysViral = true;
    s.dev.fameNeverDecays = true;
    this.devAddCryptoHoldings(10000);
    if (!s.businesses.owned.length) BUSINESS_TYPES.slice(0, 4).forEach((type, index) => this.startBusiness(type.id, `${s.profile.lastName} ${type.label} ${index + 1}`));
    if (!s.housing.landlordProperties.length) LANDLORD_TYPES.slice(0, 3).forEach((type) => this.buyLandlordProperty(type.id));
    s.social.followers = Math.max(s.social.followers, 10000000);
    s.social.reputation = 100;
    s.social.engagement = 40;
    s.social.monetized = true;
    s.social.platformLevel = platformLevel(s.social.followers);
    s.fame = 100;
    s.activitySystems.fame.publicImage = 100;
    s.dev.ignoreActivityAgeLocks = previousIgnoreAgeLocks;
    this.touch("dev-max-v23");
  };

  GP.devClearV23Expansions = function devClearV23Expansions() {
    this.state.crypto = emptyCrypto(this.state);
    this.state.businesses = emptyBusinesses();
    this.state.housing = emptyHousing();
    this.touch("dev-clear-v23");
  };
})(window);
