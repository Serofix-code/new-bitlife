(function installNextChapterV23Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);
  const money = (state, value) => U.formatMoney(value, state.profile.currency);

  function signedMoney(state, value) {
    const number = Number(value) || 0;
    return `${number >= 0 ? "+" : "−"}${money(state, Math.abs(number))}`;
  }

  function cryptoPrice(state, value) {
    const number = Number(value) || 0;
    if (number >= 100) return money(state, number);
    const decimals = number < 1 ? 4 : 2;
    return `${state.profile.currency || "₡"}${number.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }

  function signedPercent(value) {
    const number = Number(value) || 0;
    return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;
  }

  function sparkline(history, accessor, positive) {
    const source = Array.isArray(history) ? history.slice(0, 12).reverse() : [];
    const values = source.map((item) => Number(accessor(item))).filter(Number.isFinite);
    if (!values.length) return '<div class="v23-empty-chart">No history yet</div>';
    const width = 300;
    const height = 88;
    const pad = 8;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(.0001, max - min);
    const points = values.map((value, index) => {
      const x = pad + (values.length === 1 ? 0 : index * (width - pad * 2) / (values.length - 1));
      const y = height - pad - ((value - min) / span) * (height - pad * 2);
      return [x, y];
    });
    const path = points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(2)} ${point[1].toFixed(2)}`).join(" ");
    const area = `${path} L${points[points.length - 1][0].toFixed(2)} ${height - pad} L${points[0][0].toFixed(2)} ${height - pad} Z`;
    const tone = positive === false ? "negative" : "positive";
    return `<svg class="v23-spark ${tone}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}"></line><path class="area" d="${area}"></path><path class="line" d="${path}"></path><circle cx="${points[points.length - 1][0].toFixed(2)}" cy="${points[points.length - 1][1].toFixed(2)}" r="4"></circle></svg>`;
  }

  function expansionHub(app) {
    const game = app.game;
    const s = game.state;
    const crypto = game.cryptoSummary();
    const businessValue = game.businessPortfolioValue();
    const propertyValue = game.landlordPortfolioValue();
    const cards = [
      { id: "crypto", icon: "🪙", title: "Crypto", text: `${crypto.assetsOwned} assets · ${money(s, crypto.value)}`, badge: s.age < 18 ? "Age 18" : "Open" },
      { id: "business", icon: "🏢", title: "Businesses", text: `${s.businesses.owned.length} owned · ${money(s, businessValue)}`, badge: s.age < 18 ? "Age 18" : "Manage" },
      { id: "housing", icon: "🏘️", title: "Renting & Landlords", text: `${s.housing.landlordProperties.length} rentals · ${money(s, propertyValue)}`, badge: s.age < 18 ? "Age 18" : "Manage" }
    ];
    return `<section class="v23-expansion-hub"><div class="section-head compact"><div><h2>Expansion hub</h2><p>Open a deep system without leaving your current life.</p></div><span class="status-pill neutral">4 installed</span></div><div class="v23-expansion-grid">${cards.map((card) => `<button class="v23-expansion-card" data-action="open-expansion" data-expansion="${card.id}"><span class="v23-expansion-card-icon">${card.icon}</span><span><strong>${esc(card.title)}</strong><small>${esc(card.text)}</small></span><b>${esc(card.badge)} ›</b></button>`).join("")}</div></section>`;
  }

  const previousExpansions = V.expansions;
  V.expansions = function expansionsV23(app) {
    app.game.ensureExpansionState();
    let html = previousExpansions(app);
    const hub = expansionHub(app);
    html = html.replace(/(<section class="v21-expansion-hero"[\s\S]*?<\/section>)/, `$1${hub}`);
    return html.replace("<span>1 installed</span>", "<span>4 installed</span>");
  };

  V.cryptoModal = function cryptoModal(app) {
    const game = app.game;
    const s = game.state;
    game.ensureExpansionState();
    const market = s.crypto;
    const summary = game.cryptoSummary();
    const locked = s.age < 18 && !s.dev.ignoreActivityAgeLocks;
    const jailed = game.isIncarcerated();
    const coins = market.coins.map((coin) => {
      const holding = market.holdings[coin.id];
      const value = holding ? holding.units * coin.price : 0;
      const profit = holding ? value - holding.totalCost : 0;
      const positive = coin.annualChange >= 0;
      return `<article class="v23-coin-card"><header><span class="v23-token-icon">${coin.symbol.slice(0, 1)}</span><div><h3>${esc(coin.name)}</h3><p>${esc(coin.symbol)} · ${esc(U.cap(coin.risk))} risk</p></div><span class="${positive ? "positive" : "negative"}">${signedPercent(coin.annualChange)}</span></header><div class="v23-token-price"><strong>${cryptoPrice(s, coin.price)}</strong><small>Volatility ${coin.volatility}%</small></div>${sparkline(coin.history, (item) => item.price, positive)}<p>${esc(coin.summary)}</p>${holding ? `<div class="v23-owned-strip"><span>${holding.units.toLocaleString(undefined, { maximumFractionDigits: 6 })} units</span><strong class="${profit >= 0 ? "positive" : "negative"}">${money(s, value)} · ${signedMoney(s, profit)}</strong></div>` : ""}<div class="card-actions"><button class="button small" data-action="crypto-buy" data-coin="${coin.id}" ${locked || jailed ? "disabled" : ""}>Buy</button>${holding ? `<button class="button small secondary" data-action="crypto-sell" data-coin="${coin.id}" ${locked || jailed ? "disabled" : ""}>Sell</button>` : ""}</div></article>`;
    }).join("");
    const trades = market.transactions.slice(0, 10).map((trade) => `<li><span>${trade.side === "buy" ? "↘" : "↗"}</span><div><strong>${esc(U.cap(trade.side))} ${trade.units.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${esc(trade.symbol)}</strong><small>Age ${trade.age} · ${cryptoPrice(s, trade.price)} each${Number.isFinite(trade.profit) ? ` · ${trade.profit >= 0 ? "gain" : "loss"} ${money(s, Math.abs(trade.profit))}` : ""}</small></div></li>`).join("");
    return `<div class="modal-backdrop"><section class="dialog v23-expansion-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>🪙 Crypto Expansion</h2><p class="card-subtitle">A volatile market of completely fictional digital assets.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><section class="v23-summary-grid"><div><span>Portfolio</span><strong>${money(s, summary.value)}</strong><small>${summary.assetsOwned} assets</small></div><div><span>Unrealized</span><strong class="${summary.unrealized >= 0 ? "positive" : "negative"}">${signedMoney(s, summary.unrealized)}</strong><small>Against cost</small></div><div><span>Realized</span><strong class="${summary.realized >= 0 ? "positive" : "negative"}">${signedMoney(s, summary.realized)}</strong><small>Completed sales</small></div><div><span>Market</span><strong>${esc(market.marketMood)}</strong><small>Updated ${market.marketYear}</small></div></section>${locked ? '<div class="hint-box"><strong>Trading unlocks at age 18.</strong></div>' : ""}${jailed ? '<div class="hint-box"><strong>Trading is unavailable in custody.</strong></div>' : ""}<section class="v23-news"><h3>Market headlines</h3><ul>${market.marketNews.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></section><section><div class="section-head compact"><div><h3>Digital assets</h3><p>Price previews update whenever you age up.</p></div></div><div class="v23-market-grid">${coins}</div></section><section><h3>Recent trades</h3>${trades ? `<ul class="v20-history-list">${trades}</ul>` : '<p class="v20-empty">No crypto trades yet.</p>'}</section></div></section></div>`;
  };

  V.businessModal = function businessModal(app) {
    const game = app.game;
    const s = game.state;
    game.ensureExpansionState();
    const locked = s.age < 18 && !s.dev.ignoreActivityAgeLocks;
    const jailed = game.isIncarcerated();
    const owned = s.businesses.owned.map((business) => {
      const positive = business.lastProfit >= 0;
      return `<article class="v23-business-card"><header><span>${esc(business.icon)}</span><div><h3>${esc(business.name)}</h3><p>${esc(business.label)} · ${business.employees} employees</p></div><strong>${money(s, business.value)}</strong></header>${sparkline(business.history, (item) => item.value, positive)}<div class="v23-business-metrics"><span>Reputation <b>${Math.round(business.reputation)}%</b></span><span>Quality <b>${Math.round(business.quality)}%</b></span><span>Last revenue <b>${money(s, business.lastRevenue)}</b></span><span>Last result <b class="${positive ? "positive" : "negative"}">${signedMoney(s, business.lastProfit)}</b></span></div><div class="card-actions"><button class="button small secondary" data-action="business-action" data-business="${business.id}" data-kind="invest" ${jailed ? "disabled" : ""}>Invest</button><button class="button small secondary" data-action="business-action" data-business="${business.id}" data-kind="advertise" ${jailed ? "disabled" : ""}>Advertise</button><button class="button small secondary" data-action="business-action" data-business="${business.id}" data-kind="hire" ${jailed ? "disabled" : ""}>Hire</button><button class="button small danger" data-action="business-action" data-business="${business.id}" data-kind="sell" ${jailed ? "disabled" : ""}>Sell</button></div></article>`;
    }).join("");
    const starts = NC.BUSINESS_TYPES.map((type) => `<article class="v23-start-card"><span>${type.icon}</span><div><h3>${esc(type.label)}</h3><p>${esc(U.cap(type.risk))} risk · typical annual revenue ${money(s, type.baseRevenue)}</p><small>Startup cost ${money(s, type.startupCost)} · recommended knowledge ${type.knowledge}%</small></div><button class="button small" data-action="business-start" data-type="${type.id}" ${locked || jailed || s.finances.cash < type.startupCost ? "disabled" : ""}>Start</button></article>`).join("");
    return `<div class="modal-backdrop"><section class="dialog v23-expansion-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>🏢 Business Expansion</h2><p class="card-subtitle">Own up to eight businesses with annual revenue, costs, staff, reputation, and value.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><section class="v23-summary-grid"><div><span>Businesses</span><strong>${s.businesses.owned.length}</strong><small>${s.businesses.businessesStarted} started</small></div><div><span>Total value</span><strong>${money(s, game.businessPortfolioValue())}</strong><small>Included in net worth</small></div><div><span>Lifetime revenue</span><strong>${money(s, s.businesses.totalRevenue)}</strong><small>Before expenses</small></div><div><span>Lifetime profit</span><strong class="${s.businesses.totalProfit >= 0 ? "positive" : "negative"}">${signedMoney(s, s.businesses.totalProfit)}</strong><small>All owned businesses</small></div></section>${locked ? '<div class="hint-box"><strong>Business ownership unlocks at age 18.</strong></div>' : ""}${jailed ? '<div class="hint-box"><strong>Business management is unavailable in custody.</strong></div>' : ""}<section><h3>Your businesses</h3><div class="v23-owned-grid">${owned || '<p class="v20-empty">You do not own a business yet.</p>'}</div></section><section><h3>Start a new business</h3><div class="v23-start-list">${starts}</div></section></div></section></div>`;
  };

  V.housingModal = function housingModal(app) {
    const game = app.game;
    const s = game.state;
    game.ensureExpansionState();
    const locked = s.age < 18 && !s.dev.ignoreActivityAgeLocks;
    const jailed = game.isIncarcerated();
    const rental = s.housing.rentalHome;
    const rentOptions = NC.RENTAL_HOMES.map((home) => `<article class="v23-start-card"><span>${home.icon}</span><div><h3>${esc(home.label)}</h3><p>${money(s, home.annualRent)} per year · deposit ${money(s, home.deposit)}</p></div><button class="button small" data-action="rent-home" data-home="${home.id}" ${locked || jailed || rental || s.finances.cash < home.annualRent + home.deposit ? "disabled" : ""}>Rent</button></article>`).join("");
    const properties = s.housing.landlordProperties.map((property) => {
      const last = property.history[0];
      const positive = !last || last.net >= 0;
      return `<article class="v23-business-card"><header><span>${property.icon}</span><div><h3>${esc(property.label)}</h3><p>${property.occupied ? `Tenant: ${esc(property.tenantName || "Occupied")}` : "Vacant"}</p></div><strong>${money(s, property.value)}</strong></header>${sparkline(property.history, (item) => item.value, positive)}<div class="v23-business-metrics"><span>Monthly rent <b>${money(s, property.monthlyRent)}</b></span><span>Condition <b>${Math.round(property.condition)}%</b></span><span>Last net <b class="${positive ? "positive" : "negative"}">${last ? signedMoney(s, last.net) : "—"}</b></span><span>Status <b>${property.occupied ? "Occupied" : "Vacant"}</b></span></div><div class="card-actions">${!property.occupied ? `<button class="button small" data-action="landlord-action" data-property="${property.id}" data-kind="tenant" ${jailed ? "disabled" : ""}>Find tenant</button>` : ""}<button class="button small secondary" data-action="landlord-action" data-property="${property.id}" data-kind="renovate" ${jailed ? "disabled" : ""}>Renovate</button><button class="button small danger" data-action="landlord-action" data-property="${property.id}" data-kind="sell" ${jailed ? "disabled" : ""}>Sell</button></div></article>`;
    }).join("");
    const buys = NC.LANDLORD_TYPES.map((type) => `<article class="v23-start-card"><span>${type.icon}</span><div><h3>${esc(type.label)}</h3><p>${money(s, type.monthlyRent)} monthly potential · maintenance about ${money(s, type.maintenance)} yearly</p><small>Purchase price ${money(s, type.cost)}</small></div><button class="button small" data-action="landlord-buy" data-type="${type.id}" ${locked || jailed || s.finances.cash < type.cost ? "disabled" : ""}>Buy</button></article>`).join("");
    return `<div class="modal-backdrop"><section class="dialog v23-expansion-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>🏘️ Renting & Landlord Expansion</h2><p class="card-subtitle">Choose where you rent and build a portfolio of income-producing homes.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><section class="v23-summary-grid"><div><span>Your rental</span><strong>${rental ? esc(rental.label) : "None"}</strong><small>${rental ? `${money(s, rental.annualRent)} yearly` : "No active lease"}</small></div><div><span>Landlord properties</span><strong>${s.housing.landlordProperties.length}</strong><small>${money(s, game.landlordPortfolioValue())} value</small></div><div><span>Rent collected</span><strong>${money(s, s.housing.totalRentCollected)}</strong><small>Lifetime gross</small></div><div><span>Maintenance</span><strong>${money(s, s.housing.totalMaintenance)}</strong><small>Lifetime costs</small></div></section>${locked ? '<div class="hint-box"><strong>Renting and landlord ownership unlock at age 18.</strong></div>' : ""}${rental ? `<section class="v23-current-rental"><span>${rental.icon}</span><div><h3>${esc(rental.label)}</h3><p>Leased for ${rental.years} year${rental.years === 1 ? "" : "s"} · deposit ${money(s, rental.deposit)}</p></div><button class="button small danger" data-action="end-lease" ${jailed ? "disabled" : ""}>End lease</button></section>` : `<section><h3>Rent a home</h3><div class="v23-start-list">${rentOptions}</div></section>`}<section><h3>Your landlord portfolio</h3><div class="v23-owned-grid">${properties || '<p class="v20-empty">You do not own any rental properties yet.</p>'}</div></section><section><h3>Buy a rental property</h3><div class="v23-start-list">${buys}</div></section></div></section></div>`;
  };

  const previousLife = V.v16Life;
  V.v16Life = function v16LifeV23(app) {
    const s = app.game.state;
    const entries = s.timeline.slice(0, 12);
    if (!entries.length) return previousLife(app);
    const journal = entries.map((entry, index) => {
      const update = String(entry.type || "").startsWith("update");
      if (update) return `<article class="v23-life-update ${entry.type || "update"}"><span class="v23-life-update-icon">${esc(entry.icon)}</span><div><header><strong>${esc(entry.title)}</strong><small>Age ${entry.age}</small></header><p>${esc(entry.text)}</p></div></article>`;
      return `<article class="v16-journal-entry ${index === 0 ? "latest" : ""}"><header><strong>${index === 0 ? `Age: ${entry.age} years` : `Age ${entry.age}`}</strong><span>${esc(entry.icon)}</span></header><h3>${esc(entry.title)}</h3><p>${esc(entry.text)}</p></article>`;
    }).join("");
    return `<section class="v16-life-feed v23-life-feed"><div class="v23-feed-caption"><span>Life updates</span><small>Milestones, family news, markets, businesses, property, and public life</small></div>${journal}</section>`;
  };

  const previousActivityModal = V.activityCenterModal;
  V.activityCenterModal = function activityCenterModalV23(app) {
    let html = previousActivityModal(app);
    const s = app.game.state;
    const centerId = app.modal && app.modal.center;
    if (centerId === "social") {
      const social = s.social;
      const extra = `<section class="v23-social-dashboard"><div><span>Followers</span><strong>${social.followers.toLocaleString()}</strong><small>${esc(social.platformLevel)}</small></div><div><span>Engagement</span><strong>${Number(social.engagement).toFixed(1)}%</strong><small>Audience response</small></div><div><span>Reputation</span><strong>${Math.round(social.reputation)}%</strong><small>Creator trust</small></div><div><span>Monetization</span><strong>${social.monetized ? "Active" : "Locked"}</strong><small>${money(s, social.lifetimeCreatorIncome)} lifetime income</small></div><div><span>Posting streak</span><strong>${social.contentStreak}</strong><small>Recent active years</small></div><div><span>Best post</span><strong>+${social.bestFollowerGain.toLocaleString()}</strong><small>Followers gained</small></div></section>`;
      html = html.replace('<section class="v20-center-subsection"><h3>Available options</h3>', `${extra}<section class="v20-center-subsection"><h3>Available options</h3>`);
    } else if (centerId === "fame") {
      const fame = s.activitySystems.fame;
      const extra = `<section class="v23-social-dashboard"><div><span>Fame</span><strong>${Math.round(s.fame)}%</strong><small>Current visibility</small></div><div><span>Public image</span><strong>${Math.round(fame.publicImage)}%</strong><small>Audience sentiment</small></div><div><span>Press mentions</span><strong>${fame.pressMentions}</strong><small>Recorded coverage</small></div><div><span>Awards</span><strong>${fame.awards}</strong><small>Public recognition</small></div><div><span>Endorsements</span><strong>${fame.endorsements}</strong><small>Commercial partnerships</small></div><div><span>Fan events</span><strong>${fame.fanEvents}</strong><small>Community appearances</small></div></section>`;
      html = html.replace('<section class="v20-center-subsection"><h3>Available options</h3>', `${extra}<section class="v20-center-subsection"><h3>Available options</h3>`);
    }
    return html;
  };

  const previousDeveloper = V.developer;
  V.developer = function developerV23(app) {
    const s = app.game.state;
    const base = previousDeveloper(app);
    const card = `<article class="dev-card"><h3>v2.3 expansion & public-life cheats</h3><p>Test crypto, businesses, rental properties, social media, fame, and age-up headlines.</p><div class="card-actions"><button class="button small secondary" data-action="dev-toggle" data-key="cryptoAlwaysProfits">Crypto always rises: ${s.dev.cryptoAlwaysProfits ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="cryptoNoFees">No crypto fees: ${s.dev.cryptoNoFees ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-crypto-holdings">Add 10,000 of every crypto</button><button class="button small secondary" data-action="dev-crypto-boom">Crypto moonshot +150%</button><button class="button small secondary" data-action="dev-crypto-crash">Crypto crash −80%</button><button class="button small secondary" data-action="dev-toggle" data-key="businessAlwaysProfits">Businesses always profit: ${s.dev.businessAlwaysProfits ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="landlordAlwaysOccupied">Rentals always occupied: ${s.dev.landlordAlwaysOccupied ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="socialAlwaysViral">Social posts always viral: ${s.dev.socialAlwaysViral ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="fameNeverDecays">Fame never decays: ${s.dev.fameNeverDecays ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-v23-max">Max all v2.3 systems</button><button class="button small danger" data-action="dev-v23-clear">Clear crypto, businesses, and property</button></div></article>`;
    return base.replace('<div class="hint-box">', `${card}<div class="hint-box">`);
  };
})(window);
