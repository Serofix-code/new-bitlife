(function installNextChapterV21Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);
  const money = (state, value) => U.formatMoney(value, state.profile.currency);

  function signedMoney(state, value) {
    const amount = Number(value) || 0;
    return `${amount >= 0 ? "+" : "−"}${money(state, Math.abs(amount))}`;
  }

  function percent(value) {
    const number = Number(value) || 0;
    return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;
  }

  function portfolioCard(state, company, holding) {
    const value = holding.shares * company.price;
    const profit = value - holding.totalCost;
    return `<article class="v21-holding-card">
      <div class="v21-company-badge">${esc(company.sectorIcon)}</div>
      <div class="v21-holding-copy"><h3>${esc(company.name)} <small>${esc(company.ticker)}</small></h3><p>${holding.shares.toLocaleString()} shares · average ${money(state, holding.averageCost)} · current ${money(state, company.price)}</p><strong class="${profit >= 0 ? "positive" : "negative"}">${money(state, value)} · ${signedMoney(state, profit)}</strong></div>
      <button class="button small secondary" data-action="investment-sell" data-company="${esc(company.id)}">Sell</button>
    </article>`;
  }

  V.expansions = function expansionsV21(app) {
    const game = app.game;
    const s = game.state;
    game.ensureExpansionState();
    const inv = s.investment;
    const summary = game.investmentSummary();
    const jailed = game.isIncarcerated();
    const locked = s.age < 18 && !s.dev.ignoreActivityAgeLocks;
    const holdings = Object.entries(inv.holdings).map(([companyId, holding]) => {
      const company = game.investmentCompany(companyId);
      return company ? portfolioCard(s, company, holding) : "";
    }).join("");

    const companies = inv.companies.map((company) => {
      const holding = inv.holdings[company.id];
      const research = inv.research[company.id];
      const reveal = research || s.dev.revealInvestmentOutlook;
      const disabled = jailed || locked || company.status !== "active";
      const changeClass = company.annualChange >= 0 ? "positive" : "negative";
      const riskClass = company.risk === "high" ? "risk-high" : company.risk === "low" ? "risk-low" : "risk-medium";
      return `<article class="v21-company-card">
        <header><div class="v21-company-badge">${esc(company.sectorIcon)}</div><div><h3>${esc(company.name)}</h3><p>${esc(company.ticker)} · ${esc(company.sectorLabel)}</p></div><span class="v21-risk ${riskClass}">${esc(NC.investmentRiskLabel(company.risk))}</span></header>
        <div class="v21-quote"><strong>${money(s, company.price)}</strong><span class="${changeClass}">${percent(company.annualChange)}</span></div>
        <p>${esc(company.summary)}</p>
        <div class="v21-company-meta"><span>Volatility ${company.volatility}%</span><span>Dividend ${(company.dividendYield * 100).toFixed(2)}%</span><span>Founded ${company.foundedYear}</span></div>
        ${reveal ? `<div class="v21-research-result"><strong>Research:</strong> ${research ? `${esc(U.cap(research.outlook))} outlook · ${research.confidence}% confidence · ${esc(research.trend)}` : "Developer outlook reveal enabled"}</div>` : ""}
        ${holding ? `<small class="v21-owned-line">Owned: ${holding.shares.toLocaleString()} shares worth ${money(s, holding.shares * company.price)}</small>` : ""}
        <div class="card-actions"><button class="button small" data-action="investment-buy" data-company="${esc(company.id)}" ${disabled ? "disabled" : ""}>Buy shares</button><button class="button small secondary" data-action="investment-research" data-company="${esc(company.id)}" ${jailed || s.age < 16 ? "disabled" : ""}>Research</button>${holding ? `<button class="button small secondary" data-action="investment-sell" data-company="${esc(company.id)}" ${disabled ? "disabled" : ""}>Sell</button>` : ""}</div>
      </article>`;
    }).join("");

    const transactions = inv.transactions.slice(0, 12).map((trade) => `<li><span>${trade.side === "buy" ? "↘" : "↗"}</span><div><strong>${esc(U.cap(trade.side))} ${trade.shares.toLocaleString()} ${esc(trade.ticker)}</strong><small>Age ${trade.age} · ${money(s, trade.price)} per share · ${trade.side === "sell" && Number.isFinite(trade.profit) ? `${trade.profit >= 0 ? "gain" : "loss"} ${money(s, Math.abs(trade.profit))}` : money(s, trade.total)}</small></div></li>`).join("");
    const news = inv.marketNews.map((item) => `<li>${esc(item)}</li>`).join("");
    const ageMessage = locked ? `<div class="hint-box"><strong>Locked until age 18.</strong> Company research becomes available at age 16, but trading requires adulthood.</div>` : "";
    const jailMessage = jailed ? `<div class="hint-box"><strong>Trading unavailable in custody.</strong> Your existing shares still change value each year.</div>` : "";

    return `<div class="v21-expansions-page">
      <div class="v19-page-banner"><div><h2>Expansions</h2><p>Optional deep systems for longer lives.</p></div><span>1 installed</span></div>
      <section class="v21-expansion-hero"><div class="v21-expansion-icon">📈</div><div><span class="tag">Included expansion</span><h2>Investment Expansion</h2><p>Trade fictional companies in a random market that changes every time you age up. Prices, dividends, volatility, news, gains, and losses are stored in your save.</p></div></section>
      ${ageMessage}${jailMessage}
      <section class="v21-investment-summary">
        <div><span>Portfolio value</span><strong>${money(s, summary.portfolioValue)}</strong><small>${summary.companiesOwned} companies owned</small></div>
        <div><span>Unrealized result</span><strong class="${summary.unrealizedProfit >= 0 ? "positive" : "negative"}">${signedMoney(s, summary.unrealizedProfit)}</strong><small>Current value minus cost</small></div>
        <div><span>Realized result</span><strong class="${summary.realizedProfit >= 0 ? "positive" : "negative"}">${signedMoney(s, summary.realizedProfit)}</strong><small>From completed sales</small></div>
        <div><span>Dividends</span><strong>${money(s, summary.dividends)}</strong><small>Lifetime income</small></div>
      </section>
      <section class="v21-market-news"><header><div><h3>Market: ${esc(inv.marketMood)}</h3><p>Prices last changed in ${inv.marketYear}. This is a fictional game market, not financial advice.</p></div><span>📰</span></header><ul>${news}</ul></section>
      <section class="v21-section"><div class="section-head compact"><div><h2>Your portfolio</h2><p>Average cost, current value, and unrealized result.</p></div><span class="status-pill neutral">${Object.keys(inv.holdings).length} holdings</span></div><div class="v21-holdings-list">${holdings || '<p class="v20-empty">You do not own any shares yet.</p>'}</div></section>
      <section class="v21-section"><div class="section-head compact"><div><h2>Company market</h2><p>The twelve companies are generated for this life and move independently each year.</p></div><span class="status-pill neutral">${inv.companies.length} listings</span></div><div class="v21-company-grid">${companies}</div></section>
      <section class="v21-section"><div class="section-head compact"><div><h2>Trade history</h2><p>Your latest purchases and sales.</p></div></div>${transactions ? `<ul class="v20-history-list">${transactions}</ul>` : '<p class="v20-empty">No trades have been made yet.</p>'}</section>
      <section class="v21-coming-soon"><span>＋</span><div><h3>More expansions can be added here</h3><p>The system is ready for future packs such as businesses, landlord management, politics, or space careers.</p></div></section>
    </div>`;
  };

  const previousTabContent = V.tabContent;
  V.tabContent = function tabContentV21(app) {
    if (app.tab === "expansions") return V.expansions(app);
    return previousTabContent(app);
  };

  const previousActivities = V.activities;
  V.activities = function activitiesV21(app) {
    const html = previousActivities(app);
    if (app.game.isIncarcerated()) return html;
    const s = app.game.state;
    const disabled = s.age < 18 && !s.dev.ignoreActivityAgeLocks;
    const expansionSection = `<section class="v19-activity-section"><h3>Expansions</h3><div class="v19-activity-list"><button class="v19-activity-row" data-action="open-section" data-tab="expansions" ${disabled ? "disabled" : ""}><span class="v19-activity-icon">📈</span><span class="v19-activity-copy"><strong>Investment Expansion</strong><small>${disabled ? "Trading unlocks at age 18" : `${Object.keys(s.investment.holdings).length} holdings · portfolio ${money(s, app.game.investmentPortfolioValue())}`}</small></span><span class="v19-activity-arrow">${disabled ? "Age 18" : "›"}</span></button></div></section>`;
    return html.replace(/<\/div>\s*$/, `${expansionSection}</div>`);
  };

  const previousMainMenu = V.mainMenuModal;
  V.mainMenuModal = function mainMenuV21(app) {
    let html = previousMainMenu(app);
    if (!app.game.isIncarcerated()) {
      const expansion = `<button class="v16-main-menu-item" data-action="menu-tab" data-tab="expansions"><span>📈</span><strong>Expansions</strong><b>›</b></button>`;
      html = html.replace('<button class="v16-main-menu-item" data-action="menu-tab" data-tab="developer">', `${expansion}<button class="v16-main-menu-item" data-action="menu-tab" data-tab="developer">`);
    }
    const guide = `<a class="v16-main-menu-item v21-guide-link" href="guide.html"><span>📖</span><strong>Game Guide & Wiki</strong><b>›</b></a>`;
    html = html.replace('<button class="v16-main-menu-item" data-action="open-saves">', `${guide}<button class="v16-main-menu-item" data-action="open-saves">`);
    return html;
  };

  const previousGame = V.game;
  V.game = function gameV21(app) {
    let html = previousGame(app);
    if (app.tab === "expansions") html = html.replace('<h2>Life</h2>', '<h2>Expansions</h2>');
    return html;
  };

  const previousDeveloper = V.developer;
  V.developer = function developerV21(app) {
    const s = app.game.state;
    const base = previousDeveloper(app);
    const card = `<article class="dev-card"><h3>Investment expansion cheats</h3><p>Test portfolio values, company prices, and long-term returns.</p><div class="card-actions"><button class="button small secondary" data-action="dev-investment-cash">Add ${money(s, 1000000)} investment cash</button><button class="button small secondary" data-action="dev-investment-shares">Add 100 shares of every company</button><button class="button small secondary" data-action="dev-investment-boom">Market boom +50%</button><button class="button small secondary" data-action="dev-investment-crash">Market crash −50%</button><button class="button small secondary" data-action="dev-toggle" data-key="investmentAlwaysProfits">Always profitable market: ${s.dev.investmentAlwaysProfits ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="investmentNoFees">No trading fees: ${s.dev.investmentNoFees ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="revealInvestmentOutlook">Reveal outlooks: ${s.dev.revealInvestmentOutlook ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-investment-max">Max investment expansion</button><button class="button small danger" data-action="dev-investment-clear">Clear investment portfolio</button></div></article>`;
    return base.replace('<div class="hint-box">', `${card}<div class="hint-box">`);
  };
})(window);
