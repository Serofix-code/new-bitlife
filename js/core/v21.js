(function installNextChapterV21(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine && NC.GameEngine.prototype;

  NC.APP_VERSION = "2.1.0";
  NC.SCHEMA_VERSION = Math.max(NC.SCHEMA_VERSION || 1, 12);

  NC.EXPANSIONS = Object.assign({}, NC.EXPANSIONS || {}, {
    investment: {
      id: "investment",
      label: "Investment Expansion",
      icon: "📈",
      description: "Buy and sell shares in a changing market of fictional companies.",
      minAge: 18,
      included: true
    }
  });

  const SECTORS = [
    { id: "technology", label: "Technology", icon: "💻", drift: 1.2 },
    { id: "energy", label: "Energy", icon: "⚡", drift: .4 },
    { id: "health", label: "Healthcare", icon: "🧬", drift: .8 },
    { id: "finance", label: "Finance", icon: "🏦", drift: .45 },
    { id: "consumer", label: "Consumer", icon: "🛍️", drift: .35 },
    { id: "transport", label: "Transport", icon: "🚆", drift: .25 },
    { id: "media", label: "Media", icon: "🎬", drift: .6 },
    { id: "food", label: "Food & Hospitality", icon: "🍽️", drift: .3 },
    { id: "property", label: "Property", icon: "🏙️", drift: .5 },
    { id: "industry", label: "Industry", icon: "🏭", drift: .25 }
  ];

  const NAME_FIRST = [
    "Aurora", "Northstar", "Bluehaven", "Silverline", "Sunspire", "Evergreen", "Nova", "Cobalt",
    "Redwood", "Cloudberry", "Moonrise", "Ironwood", "Clearwater", "Lumen", "Harbor", "Polar",
    "Summit", "Meadow", "Brightpath", "Violet", "Atlas", "Meridian", "Solstice", "Fjord"
  ];
  const NAME_SECOND = [
    "Systems", "Holdings", "Works", "Group", "Labs", "Industries", "Networks", "Foods", "Mobility",
    "Health", "Media", "Properties", "Capital", "Energy", "Studios", "Markets", "Logistics", "Homes"
  ];

  function tickerFor(name, used) {
    const words = name.toUpperCase().replace(/[^A-Z ]/g, "").split(/\s+/).filter(Boolean);
    let ticker = words.map((word) => word[0]).join("").slice(0, 4);
    if (ticker.length < 3) ticker = words.join("").slice(0, 4);
    ticker = ticker || "NCHP";
    let candidate = ticker;
    let number = 2;
    while (used.has(candidate)) candidate = `${ticker.slice(0, 3)}${number++}`;
    used.add(candidate);
    return candidate;
  }

  function marketSeed(state, suffix) {
    return { seed: U.hashSeed(`${state.saveId}|investment|${suffix}`), step: 0 };
  }

  function makeCompanies(state) {
    const rng = marketSeed(state, "companies");
    const usedNames = new Set();
    const usedTickers = new Set();
    const companies = [];
    for (let index = 0; index < 12; index += 1) {
      let name;
      do {
        name = `${U.pick(rng, NAME_FIRST)} ${U.pick(rng, NAME_SECOND)}`;
      } while (usedNames.has(name));
      usedNames.add(name);
      const sector = U.pick(rng, SECTORS);
      const riskRoll = U.random(rng);
      const risk = riskRoll < .30 ? "low" : riskRoll < .75 ? "medium" : "high";
      const volatility = risk === "low" ? U.randomInt(rng, 6, 12) : risk === "medium" ? U.randomInt(rng, 12, 22) : U.randomInt(rng, 22, 38);
      const price = Number((U.randomInt(rng, 900, 24000) / 100).toFixed(2));
      const dividendYield = risk === "high" ? U.randomInt(rng, 0, 180) / 10000 : U.randomInt(rng, 40, 420) / 10000;
      companies.push({
        id: `company_${index}_${U.hashSeed(name).toString(36)}`,
        name,
        ticker: tickerFor(name, usedTickers),
        sector: sector.id,
        sectorLabel: sector.label,
        sectorIcon: sector.icon,
        risk,
        volatility,
        dividendYield,
        price,
        previousPrice: price,
        allTimeHigh: price,
        allTimeLow: price,
        annualChange: 0,
        status: "active",
        foundedYear: state.year - U.randomInt(rng, 2, 95),
        summary: `${name} operates in the fictional ${sector.label.toLocaleLowerCase()} sector.`,
        history: [{ year: state.year, price, change: 0 }]
      });
    }
    return companies;
  }

  function emptyInvestmentState(state) {
    return {
      enabled: true,
      unlocked: state.age >= 18,
      companies: makeCompanies(state),
      holdings: {},
      transactions: [],
      research: {},
      totalInvested: 0,
      totalSales: 0,
      realizedProfit: 0,
      dividendsEarned: 0,
      marketYear: state.year,
      marketMood: "Balanced",
      marketNews: ["The fictional market opens with mixed expectations."],
      yearlyReturns: [],
      lastPortfolioValue: 0
    };
  }

  function riskLabel(risk) {
    return risk === "low" ? "Lower risk" : risk === "high" ? "Higher risk" : "Moderate risk";
  }

  if (!GP) return;

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV21State() {
    if (previousEnsure) previousEnsure.call(this);
    const s = this.state;
    if (!s) return;
    s.schemaVersion = NC.SCHEMA_VERSION;
    if (!s.investment || !Array.isArray(s.investment.companies) || !s.investment.companies.length) {
      s.investment = emptyInvestmentState(s);
    }
    const inv = s.investment;
    inv.enabled = inv.enabled !== false;
    inv.unlocked = s.age >= 18;
    inv.holdings = inv.holdings && typeof inv.holdings === "object" ? inv.holdings : {};
    inv.transactions = Array.isArray(inv.transactions) ? inv.transactions : [];
    inv.research = inv.research && typeof inv.research === "object" ? inv.research : {};
    inv.marketNews = Array.isArray(inv.marketNews) ? inv.marketNews : [];
    inv.yearlyReturns = Array.isArray(inv.yearlyReturns) ? inv.yearlyReturns : [];
    ["totalInvested", "totalSales", "realizedProfit", "dividendsEarned", "lastPortfolioValue"].forEach((key) => {
      if (!Number.isFinite(inv[key])) inv[key] = 0;
    });
    inv.companies.forEach((company) => {
      company.status = company.status || "active";
      company.history = Array.isArray(company.history) ? company.history : [{ year: s.year, price: company.price, change: 0 }];
      company.previousPrice = Number.isFinite(company.previousPrice) ? company.previousPrice : company.price;
      company.allTimeHigh = Number.isFinite(company.allTimeHigh) ? company.allTimeHigh : company.price;
      company.allTimeLow = Number.isFinite(company.allTimeLow) ? company.allTimeLow : company.price;
      company.annualChange = Number.isFinite(company.annualChange) ? company.annualChange : 0;
    });
    Object.keys(inv.holdings).forEach((companyId) => {
      const holding = inv.holdings[companyId];
      if (!holding || !Number.isFinite(holding.shares) || holding.shares <= 0) delete inv.holdings[companyId];
      else {
        holding.shares = Math.max(0, Math.floor(holding.shares));
        holding.averageCost = Number.isFinite(holding.averageCost) ? holding.averageCost : 0;
        holding.totalCost = Number.isFinite(holding.totalCost) ? holding.totalCost : holding.shares * holding.averageCost;
      }
    });
    s.dev = Object.assign({
      investmentAlwaysProfits: false,
      investmentNoFees: false,
      revealInvestmentOutlook: false
    }, s.dev || {});
  };

  GP.investmentCompany = function investmentCompany(companyId) {
    this.ensureExpansionState();
    return this.state.investment.companies.find((company) => company.id === companyId) || null;
  };

  GP.investmentHolding = function investmentHolding(companyId) {
    this.ensureExpansionState();
    return this.state.investment.holdings[companyId] || null;
  };

  GP.investmentPortfolioValue = function investmentPortfolioValue() {
    this.ensureExpansionState();
    return Object.entries(this.state.investment.holdings).reduce((sum, [companyId, holding]) => {
      const company = this.investmentCompany(companyId);
      return sum + (company && company.status === "active" ? company.price * holding.shares : 0);
    }, 0);
  };

  GP.investmentCostBasis = function investmentCostBasis() {
    this.ensureExpansionState();
    return Object.values(this.state.investment.holdings).reduce((sum, holding) => sum + (holding.totalCost || holding.averageCost * holding.shares || 0), 0);
  };

  GP.investmentUnrealizedProfit = function investmentUnrealizedProfit() {
    return this.investmentPortfolioValue() - this.investmentCostBasis();
  };

  GP.investmentSummary = function investmentSummary() {
    this.ensureExpansionState();
    const inv = this.state.investment;
    return {
      portfolioValue: this.investmentPortfolioValue(),
      costBasis: this.investmentCostBasis(),
      unrealizedProfit: this.investmentUnrealizedProfit(),
      realizedProfit: inv.realizedProfit,
      dividends: inv.dividendsEarned,
      companiesOwned: Object.keys(inv.holdings).length
    };
  };

  GP.investmentCanTrade = function investmentCanTrade(companyId, shares, side) {
    this.ensureExpansionState();
    const s = this.state;
    const company = this.investmentCompany(companyId);
    const count = Math.floor(Number(shares));
    if (this.isIncarcerated()) return { allowed: false, reason: "Investing is unavailable while incarcerated." };
    if (s.age < 18 && !s.dev.ignoreActivityAgeLocks) return { allowed: false, reason: "The Investment Expansion unlocks at age 18." };
    if (!company || company.status !== "active") return { allowed: false, reason: "That company is not currently tradable." };
    if (!Number.isFinite(count) || count < 1 || count > 1000000) return { allowed: false, reason: "Choose between 1 and 1,000,000 shares." };
    const fee = s.dev.investmentNoFees ? 0 : Math.max(1, Math.round(company.price * count * .0025));
    if (side === "buy") {
      const total = company.price * count + fee;
      if (s.finances.cash < total) return { allowed: false, reason: `You need ${U.formatMoney(total, s.profile.currency)}.` };
      return { allowed: true, company, shares: count, fee, total };
    }
    const holding = this.investmentHolding(companyId);
    if (!holding || holding.shares < count) return { allowed: false, reason: "You do not own that many shares." };
    const proceeds = Math.max(0, company.price * count - fee);
    return { allowed: true, company, holding, shares: count, fee, proceeds };
  };

  GP.buyInvestmentShares = function buyInvestmentShares(companyId, shares) {
    this.assertFree("Investments");
    const check = this.investmentCanTrade(companyId, shares, "buy");
    if (!check.allowed) throw new Error(check.reason);
    const s = this.state;
    const inv = s.investment;
    const existing = inv.holdings[companyId] || { companyId, shares: 0, averageCost: 0, totalCost: 0, firstBoughtAge: s.age };
    const purchaseValue = check.company.price * check.shares;
    const newShares = existing.shares + check.shares;
    existing.totalCost += purchaseValue + check.fee;
    existing.shares = newShares;
    existing.averageCost = existing.totalCost / newShares;
    existing.lastTradeAge = s.age;
    inv.holdings[companyId] = existing;
    inv.totalInvested += purchaseValue + check.fee;
    s.finances.cash -= check.total;
    inv.transactions.unshift({
      id: U.uid("trade"), side: "buy", companyId, companyName: check.company.name, ticker: check.company.ticker,
      shares: check.shares, price: check.company.price, fee: check.fee, total: check.total, age: s.age, year: s.year
    });
    if (inv.transactions.length > 200) inv.transactions.length = 200;
    this.log("Investment purchased", `You bought ${check.shares.toLocaleString()} share${check.shares === 1 ? "" : "s"} of ${check.company.name} (${check.company.ticker}) for ${U.formatMoney(check.total, s.profile.currency)} including fees.`, "milestone", "📈");
    this.touch("investment-buy");
    return existing;
  };

  GP.sellInvestmentShares = function sellInvestmentShares(companyId, shares) {
    this.assertFree("Investments");
    const check = this.investmentCanTrade(companyId, shares, "sell");
    if (!check.allowed) throw new Error(check.reason);
    const s = this.state;
    const inv = s.investment;
    const costRemoved = check.holding.averageCost * check.shares;
    const profit = check.proceeds - costRemoved;
    check.holding.shares -= check.shares;
    check.holding.totalCost = Math.max(0, check.holding.totalCost - costRemoved);
    check.holding.lastTradeAge = s.age;
    if (check.holding.shares <= 0) delete inv.holdings[companyId];
    else check.holding.averageCost = check.holding.totalCost / check.holding.shares;
    inv.totalSales += check.proceeds;
    inv.realizedProfit += profit;
    s.finances.cash += check.proceeds;
    inv.transactions.unshift({
      id: U.uid("trade"), side: "sell", companyId, companyName: check.company.name, ticker: check.company.ticker,
      shares: check.shares, price: check.company.price, fee: check.fee, total: check.proceeds, profit, age: s.age, year: s.year
    });
    if (inv.transactions.length > 200) inv.transactions.length = 200;
    this.log("Investment sold", `You sold ${check.shares.toLocaleString()} share${check.shares === 1 ? "" : "s"} of ${check.company.name} for ${U.formatMoney(check.proceeds, s.profile.currency)}, ${profit >= 0 ? "realizing a gain of" : "realizing a loss of"} ${U.formatMoney(Math.abs(profit), s.profile.currency)}.`, profit >= 0 ? "milestone" : "neutral", profit >= 0 ? "💹" : "📉");
    this.touch("investment-sell");
    return profit;
  };

  GP.researchInvestmentCompany = function researchInvestmentCompany(companyId) {
    this.assertFree("Investments");
    this.ensureExpansionState();
    const s = this.state;
    const company = this.investmentCompany(companyId);
    if (!company) throw new Error("That company was not found.");
    if (s.age < 16 && !s.dev.ignoreActivityAgeLocks) throw new Error("Company research unlocks at age 16.");
    if (!s.dev.unlimitedActivityPoints && s.activityPoints < 1) throw new Error("Age up for more actions.");
    if (!s.dev.unlimitedActivityPoints) s.activityPoints -= 1;
    const confidence = Math.round(U.clamp(25 + s.stats.knowledge * .65 + (s.profile.specialTalent === "business" ? 20 : 0), 0, 100));
    const trend = company.annualChange > 8 ? "strong recent momentum" : company.annualChange < -8 ? "weak recent momentum" : "mixed recent momentum";
    const outlookRoll = U.random(s.rng) * 100;
    const outlook = outlookRoll < confidence * .45 ? "positive" : outlookRoll > 100 - confidence * .35 ? "negative" : "uncertain";
    s.investment.research[companyId] = { age: s.age, year: s.year, confidence, outlook, trend };
    this.log("Company research", `You review ${company.name}. Your report has ${confidence}% confidence and describes a ${outlook} outlook with ${trend}. Research can still be wrong.`, "neutral", "🔎");
    this.touch("investment-research");
    return s.investment.research[companyId];
  };

  GP.advanceInvestmentMarket = function advanceInvestmentMarket() {
    this.ensureExpansionState();
    const s = this.state;
    const inv = s.investment;
    if (inv.marketYear === s.year) return null;
    const previousPortfolio = this.investmentPortfolioValue();
    const marketRng = marketSeed(s, `market-${s.year}-${s.rng.step}`);
    let marketDrift = U.randomInt(marketRng, -7, 10);
    if (s.dev.investmentAlwaysProfits) marketDrift = U.randomInt(marketRng, 18, 35);
    const mood = marketDrift >= 7 ? "Optimistic" : marketDrift <= -5 ? "Nervous" : "Balanced";
    inv.marketMood = mood;
    const news = [];
    let dividends = 0;

    inv.companies.forEach((company) => {
      if (company.status !== "active") return;
      company.previousPrice = company.price;
      const sector = SECTORS.find((item) => item.id === company.sector) || SECTORS[0];
      const randomSwing = (U.random(marketRng) + U.random(marketRng) + U.random(marketRng) - 1.5) * company.volatility;
      let change = marketDrift * .42 + sector.drift + randomSwing;
      const eventRoll = U.random(marketRng);
      if (eventRoll < .035 && company.risk === "high") {
        const shock = U.randomInt(marketRng, 20, 52);
        change -= shock;
        news.push(`${company.ticker} suffers a major setback and falls sharply.`);
      } else if (eventRoll > .94) {
        const jump = U.randomInt(marketRng, 10, 30);
        change += jump;
        news.push(`${company.ticker} reports unexpectedly strong fictional results.`);
      }
      if (s.dev.investmentAlwaysProfits) change = Math.max(change, U.randomInt(marketRng, 8, 25));
      change = U.clamp(change, -78, 95);
      company.price = Number(Math.max(.25, company.previousPrice * (1 + change / 100)).toFixed(2));
      company.annualChange = Number(((company.price / company.previousPrice - 1) * 100).toFixed(1));
      company.allTimeHigh = Math.max(company.allTimeHigh, company.price);
      company.allTimeLow = Math.min(company.allTimeLow, company.price);
      company.history.unshift({ year: s.year, price: company.price, change: company.annualChange });
      if (company.history.length > 40) company.history.length = 40;
      const holding = inv.holdings[company.id];
      if (holding && holding.shares > 0 && company.dividendYield > 0) {
        const payment = holding.shares * company.price * company.dividendYield;
        dividends += payment;
      }
    });

    if (!news.length) {
      news.push(mood === "Optimistic" ? "Most sectors finish the year higher." : mood === "Nervous" ? "Investors react cautiously and several sectors decline." : "The fictional market ends the year with mixed results.");
    }
    dividends = Number(dividends.toFixed(2));
    if (dividends > 0) {
      inv.dividendsEarned += dividends;
      s.finances.cash += dividends;
      news.push(`Your portfolio pays ${U.formatMoney(dividends, s.profile.currency)} in dividends.`);
    }
    const currentPortfolio = this.investmentPortfolioValue();
    const annualReturn = previousPortfolio > 0 ? ((currentPortfolio + dividends - previousPortfolio) / previousPortfolio) * 100 : 0;
    inv.yearlyReturns.unshift({ year: s.year, value: currentPortfolio, dividends, returnPercent: Number(annualReturn.toFixed(1)) });
    if (inv.yearlyReturns.length > 40) inv.yearlyReturns.length = 40;
    inv.lastPortfolioValue = currentPortfolio;
    inv.marketYear = s.year;
    inv.marketNews = news.slice(0, 6);
    if (Object.keys(inv.holdings).length) {
      this.log("Investment market update", `${mood} market conditions leave your portfolio worth ${U.formatMoney(currentPortfolio, s.profile.currency)}${dividends ? ` after ${U.formatMoney(dividends, s.profile.currency)} in dividends` : ""}.`, annualReturn >= 0 ? "milestone" : "neutral", annualReturn >= 0 ? "💹" : "📉");
    }
    return { mood, news, dividends, annualReturn, portfolioValue: currentPortfolio };
  };

  const previousAgeUp = GP.ageUp;
  GP.ageUp = function ageUpV21() {
    const before = this.state && this.state.age;
    const result = previousAgeUp.call(this);
    if (this.state && this.state.alive && this.state.age !== before) {
      this.ensureExpansionState();
      const marketUpdate = this.advanceInvestmentMarket();
      if (marketUpdate) this.touch("investment-market-age-up");
    }
    return result;
  };


  const previousNetWorth = GP.netWorth;
  GP.netWorth = function netWorthV21() {
    const base = previousNetWorth.call(this);
    return base + this.investmentPortfolioValue();
  };

  const previousContinueAs = GP.continueAs;
  GP.continueAs = function continueWithInvestmentsV21(personId) {
    this.ensureExpansionState();
    const inheritedInvestment = U.deepClone(this.state.investment);
    const inheritedValue = this.investmentPortfolioValue();
    const state = previousContinueAs.call(this, personId);
    state.investment = inheritedInvestment;
    state.investment.unlocked = state.age >= 18;
    state.investment.marketYear = state.year;
    this.ensureExpansionState();
    if (inheritedValue > 0) {
      this.log("Portfolio inherited", `The family investment portfolio, currently worth ${U.formatMoney(inheritedValue, state.profile.currency)}, passes into the new generation.`, "milestone", "📈");
    }
    this.touch("investment-inheritance");
    return state;
  };

  GP.devInvestmentCash = function devInvestmentCash(amount) {
    const value = Math.max(0, Number(amount) || 1000000);
    this.state.finances.cash += value;
    this.touch("dev-investment-cash");
  };

  GP.devMoveInvestmentMarket = function devMoveInvestmentMarket(percent) {
    this.ensureExpansionState();
    const amount = U.clamp(Number(percent) || 0, -95, 500);
    this.state.investment.companies.forEach((company) => {
      company.previousPrice = company.price;
      company.price = Number(Math.max(.25, company.price * (1 + amount / 100)).toFixed(2));
      company.annualChange = Number(amount.toFixed(1));
      company.allTimeHigh = Math.max(company.allTimeHigh, company.price);
      company.allTimeLow = Math.min(company.allTimeLow, company.price);
      company.history.unshift({ year: this.state.year, price: company.price, change: company.annualChange, developer: true });
    });
    this.state.investment.marketMood = amount >= 0 ? "Developer boom" : "Developer crash";
    this.state.investment.marketNews = [`Developer tools moved every company by ${amount}%.`];
    this.touch("dev-investment-market");
  };

  GP.devAddInvestmentShares = function devAddInvestmentShares(shares) {
    this.ensureExpansionState();
    const count = Math.max(1, Math.floor(Number(shares) || 100));
    this.state.investment.companies.forEach((company) => {
      const holding = this.state.investment.holdings[company.id] || { companyId: company.id, shares: 0, averageCost: company.price, totalCost: 0, firstBoughtAge: this.state.age };
      holding.totalCost += company.price * count;
      holding.shares += count;
      holding.averageCost = holding.totalCost / holding.shares;
      this.state.investment.holdings[company.id] = holding;
    });
    this.touch("dev-investment-shares");
  };

  GP.devMaxInvestmentPortfolio = function devMaxInvestmentPortfolio() {
    this.ensureExpansionState();
    this.state.dev.investmentAlwaysProfits = true;
    this.state.dev.investmentNoFees = true;
    this.state.dev.revealInvestmentOutlook = true;
    this.state.finances.cash = Math.max(this.state.finances.cash, 1000000000);
    this.devAddInvestmentShares(10000);
    this.devMoveInvestmentMarket(45);
    this.touch("dev-max-investments");
  };

  GP.devClearInvestmentPortfolio = function devClearInvestmentPortfolio() {
    this.ensureExpansionState();
    this.state.investment.holdings = {};
    this.state.investment.transactions = [];
    this.state.investment.research = {};
    this.state.investment.totalInvested = 0;
    this.state.investment.totalSales = 0;
    this.state.investment.realizedProfit = 0;
    this.state.investment.dividendsEarned = 0;
    this.state.investment.yearlyReturns = [];
    this.state.investment.lastPortfolioValue = 0;
    this.touch("dev-clear-investments");
  };

  NC.investmentRiskLabel = riskLabel;
})(window);
