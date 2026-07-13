(function installNextChapterV25Views(global) {
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

  function sparkline(history, accessor, positive) {
    const values = (Array.isArray(history) ? history.slice(0, 12).reverse() : []).map((item) => Number(accessor(item))).filter(Number.isFinite);
    if (!values.length) return '<div class="v23-empty-chart">No annual history yet</div>';
    const width = 300, height = 88, pad = 8;
    const min = Math.min(...values), max = Math.max(...values), span = Math.max(.0001, max - min);
    const points = values.map((value, index) => {
      const x = pad + (values.length === 1 ? 0 : index * (width - pad * 2) / (values.length - 1));
      const y = height - pad - ((value - min) / span) * (height - pad * 2);
      return [x, y];
    });
    const path = points.map((point, index) => `${index ? "L" : "M"}${point[0].toFixed(2)} ${point[1].toFixed(2)}`).join(" ");
    const area = `${path} L${points[points.length - 1][0].toFixed(2)} ${height - pad} L${points[0][0].toFixed(2)} ${height - pad} Z`;
    return `<svg class="v23-spark ${positive === false ? "negative" : "positive"}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}"></line><path class="area" d="${area}"></path><path class="line" d="${path}"></path><circle cx="${points[points.length - 1][0].toFixed(2)}" cy="${points[points.length - 1][1].toFixed(2)}" r="4"></circle></svg>`;
  }

  function extraExpansionHub(app) {
    const game = app.game;
    const s = game.state;
    const active = s.specialCareer.active;
    const activeTrack = active && game.specialCareerTrack(active.trackId);
    const cards = [
      { id: "enterprises", icon: "🏛️", title: "Major Enterprises", text: `${s.enterprises.owned.length} venues · ${money(s, game.enterprisePortfolioValue())}`, badge: s.age < 18 ? "Age 18" : "Manage" },
      { id: "collections", icon: "🖼️", title: "Collections & Auctions", text: `${s.collections.owned.length} items · ${money(s, game.collectionPortfolioValue())}`, badge: s.age < 18 ? "Age 18" : "Browse" },
      { id: "special-careers", icon: "🚀", title: "Special Careers", text: activeTrack ? `${activeTrack.label} · ${activeTrack.ranks[active.rank]}` : "Seven advanced career paths", badge: s.age < 18 ? "Age 18" : "Open" }
    ];
    return `<section class="v25-expansion-hub"><div class="section-head compact"><div><h2>More expansion systems</h2><p>Venue ownership, auction collecting, and long-form special careers.</p></div><span class="status-pill neutral">3 new</span></div><div class="v23-expansion-grid">${cards.map((card) => `<button class="v23-expansion-card" data-action="open-expansion" data-expansion="${card.id}"><span class="v23-expansion-card-icon">${card.icon}</span><span><strong>${esc(card.title)}</strong><small>${esc(card.text)}</small></span><b>${esc(card.badge)} ›</b></button>`).join("")}</div></section>`;
  }

  const previousExpansions = V.expansions;
  V.expansions = function expansionsV25(app) {
    app.game.ensureExpansionState();
    let html = previousExpansions(app);
    html = html.replace(/(<section class="v23-expansion-hub"[\s\S]*?<\/section>)/, `$1${extraExpansionHub(app)}`);
    html = html.replaceAll("4 installed", "7 installed");
    return html;
  };

  V.enterpriseModal = function enterpriseModal(app) {
    const game = app.game;
    const s = game.state;
    game.ensureExpansionState();
    const locked = s.age < 18 && !s.dev.ignoreActivityAgeLocks;
    const jailed = game.isIncarcerated();
    const owned = s.enterprises.owned.map((item) => {
      const type = game.enterpriseType(item.typeId);
      const positive = item.lastProfit >= 0;
      const displayCount = item.displayedCollectibles ? item.displayedCollectibles.length : 0;
      return `<article class="v25-enterprise-card"><header><span>${item.icon}</span><div><h3>${esc(item.name)}</h3><p>${esc(item.label)} · ${item.staff} staff · ${item.years} years</p></div><strong>${money(s, item.value)}</strong></header>${sparkline(item.history, (entry) => entry.value, positive)}<div class="v25-metric-grid"><span>Reputation <b>${Math.round(item.reputation)}%</b></span><span>Appeal <b>${Math.round(item.appeal)}%</b></span><span>Security <b>${Math.round(item.security)}%</b></span><span>${esc(type.specialLabel)} <b>${Math.round(item.special)}%</b></span><span>Last revenue <b>${money(s, item.lastRevenue)}</b></span><span>Last result <b class="${positive ? "positive" : "negative"}">${signedMoney(s, item.lastProfit)}</b></span>${item.typeId === "museum" ? `<span>Displayed items <b>${displayCount}</b></span>` : ""}</div><div class="card-actions"><button class="button small secondary" data-action="enterprise-action" data-enterprise="${item.id}" data-kind="improve" ${jailed ? "disabled" : ""}>Upgrade</button><button class="button small secondary" data-action="enterprise-action" data-enterprise="${item.id}" data-kind="advertise" ${jailed ? "disabled" : ""}>Advertise</button><button class="button small secondary" data-action="enterprise-action" data-enterprise="${item.id}" data-kind="hire" ${jailed ? "disabled" : ""}>Hire</button><button class="button small secondary" data-action="enterprise-action" data-enterprise="${item.id}" data-kind="security" ${jailed ? "disabled" : ""}>Security</button><button class="button small secondary" data-action="enterprise-action" data-enterprise="${item.id}" data-kind="specialty" ${jailed ? "disabled" : ""}>${esc(type.specialLabel)}</button><button class="button small secondary" data-action="enterprise-action" data-enterprise="${item.id}" data-kind="event" ${jailed ? "disabled" : ""}>Host event</button><button class="button small danger" data-action="enterprise-action" data-enterprise="${item.id}" data-kind="sell" ${jailed ? "disabled" : ""}>Sell</button></div></article>`;
    }).join("");
    const starts = NC.ENTERPRISE_TYPES.map((type) => `<article class="v23-start-card"><span>${type.icon}</span><div><h3>${esc(type.label)}</h3><p>Annual base revenue around ${money(s, type.baseRevenue)} · upkeep ${money(s, type.annualUpkeep)}</p><small>Opening cost ${money(s, type.startupCost)}</small></div><button class="button small" data-action="enterprise-start" data-type="${type.id}" ${locked || jailed || s.finances.cash < type.startupCost || s.enterprises.owned.length >= 6 ? "disabled" : ""}>Open</button></article>`).join("");
    return `<div class="modal-backdrop"><section class="dialog v23-expansion-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>🏛️ Major Enterprise Expansion</h2><p class="card-subtitle">Manage original public venues with staff, inspections, reputation, and annual finances.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><section class="v23-summary-grid"><div><span>Owned venues</span><strong>${s.enterprises.owned.length}</strong><small>${s.enterprises.started} opened</small></div><div><span>Portfolio value</span><strong>${money(s, game.enterprisePortfolioValue())}</strong><small>Included in net worth</small></div><div><span>Lifetime revenue</span><strong>${money(s, s.enterprises.totalRevenue)}</strong><small>Before costs</small></div><div><span>Lifetime result</span><strong class="${s.enterprises.totalProfit >= 0 ? "positive" : "negative"}">${signedMoney(s, s.enterprises.totalProfit)}</strong><small>All venues</small></div></section>${locked ? '<div class="hint-box"><strong>Major enterprise ownership unlocks at age 18.</strong></div>' : ""}${jailed ? '<div class="hint-box"><strong>Direct management is unavailable in custody.</strong></div>' : ""}<section><h3>Your enterprises</h3><div class="v23-owned-grid">${owned || '<p class="v20-empty">You do not own a major enterprise yet.</p>'}</div></section><section><h3>Open a venue</h3><div class="v23-start-list">${starts}</div></section></div></section></div>`;
  };

  V.collectionModal = function collectionModal(app) {
    const game = app.game;
    const s = game.state;
    game.ensureExpansionState();
    const locked = s.age < 18 && !s.dev.ignoreActivityAgeLocks;
    const jailed = game.isIncarcerated();
    const museums = s.enterprises.owned.filter((item) => item.typeId === "museum");
    const owned = s.collections.owned.map((item) => {
      const profit = item.currentValue - (item.purchasePrice || 0);
      const displayButtons = museums.length && !item.displayedAt ? museums.map((museum) => `<button class="button small secondary" data-action="collectible-display" data-collectible="${item.id}" data-enterprise="${museum.id}">Display at ${esc(museum.name)}</button>`).join("") : "";
      const authenticity = item.appraised ? (item.authentic ? "Authentic" : "Reproduction") : "Not appraised";
      return `<article class="v25-collectible-card"><header><span>${item.icon}</span><div><h3>${esc(item.name)}</h3><p>${esc(item.categoryLabel)} · ${esc(U.cap(item.rarity))}</p></div><strong>${money(s, item.currentValue)}</strong></header><div class="v25-metric-grid"><span>Purchase price <b>${money(s, item.purchasePrice || 0)}</b></span><span>Value change <b class="${profit >= 0 ? "positive" : "negative"}">${signedMoney(s, profit)}</b></span><span>Appraisal <b>${esc(authenticity)}</b></span><span>Display <b>${item.displayedAt ? "Museum display" : "Private collection"}</b></span></div><div class="card-actions">${!item.appraised ? `<button class="button small secondary" data-action="collectible-appraise" data-collectible="${item.id}" ${jailed ? "disabled" : ""}>Appraise</button>` : ""}${displayButtons}<button class="button small danger" data-action="collectible-sell" data-collectible="${item.id}" ${jailed ? "disabled" : ""}>Sell</button></div></article>`;
    }).join("");
    const market = s.collections.market.map((lot) => `<article class="v23-start-card v25-auction-lot"><span>${lot.icon}</span><div><h3>${esc(lot.name)}</h3><p>${esc(lot.categoryLabel)} · ${esc(U.cap(lot.rarity))}</p><small>Asking price ${money(s, lot.askingPrice)} · authenticity unconfirmed</small></div><button class="button small" data-action="collectible-buy" data-lot="${lot.id}" ${locked || jailed || s.finances.cash < lot.askingPrice ? "disabled" : ""}>Bid</button></article>`).join("");
    return `<div class="modal-backdrop"><section class="dialog v23-expansion-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>🖼️ Collections & Auctions</h2><p class="card-subtitle">A changing fictional market with rarity, appraisals, uncertain authenticity, and museum displays.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><section class="v23-summary-grid"><div><span>Owned items</span><strong>${s.collections.owned.length}</strong><small>Private and displayed</small></div><div><span>Collection value</span><strong>${money(s, game.collectionPortfolioValue())}</strong><small>Included in net worth</small></div><div><span>Auction spending</span><strong>${money(s, s.collections.spent)}</strong><small>Lifetime purchases</small></div><div><span>Sale proceeds</span><strong>${money(s, s.collections.sales)}</strong><small>Lifetime sales</small></div></section>${locked ? '<div class="hint-box"><strong>Auctions unlock at age 18.</strong></div>' : ""}<section><h3>Your collection</h3><div class="v23-owned-grid">${owned || '<p class="v20-empty">Your collection is empty.</p>'}</div></section><section><div class="section-head compact"><div><h3>Current auction market</h3><p>Lots refresh every time you age up.</p></div><span class="status-pill neutral">Year ${s.collections.marketYear}</span></div><div class="v23-start-list">${market}</div></section></div></section></div>`;
  };

  V.specialCareerModal = function specialCareerModal(app) {
    const game = app.game;
    const s = game.state;
    game.ensureExpansionState();
    const locked = s.age < 18 && !s.dev.ignoreActivityAgeLocks;
    const jailed = game.isIncarcerated();
    const active = s.specialCareer.active;
    let current = '<p class="v20-empty">You are not currently pursuing a special career.</p>';
    if (active) {
      const track = game.specialCareerTrack(active.trackId);
      current = `<article class="v25-career-card"><header><span>${track.icon}</span><div><h3>${esc(track.label)}</h3><p>${esc(track.ranks[active.rank])} · ${active.years} years</p></div><strong>${money(s, active.lastIncome)}</strong></header><div class="v25-progress"><span>Performance <b>${Math.round(active.performance)}%</b></span><progress value="${active.performance}" max="100"></progress><span>Reputation <b>${Math.round(active.reputation)}%</b></span><progress value="${active.reputation}" max="100"></progress><span>Training <b>${Math.round(active.training)}%</b></span><progress value="${active.training}" max="100"></progress></div><div class="card-actions"><button class="button small secondary" data-action="special-career-action" data-kind="train" ${jailed ? "disabled" : ""}>Train</button><button class="button small secondary" data-action="special-career-action" data-kind="network" ${jailed ? "disabled" : ""}>Network</button><button class="button small" data-action="special-career-action" data-kind="work" ${jailed ? "disabled" : ""}>Take ${esc(track.action)}</button><button class="button small danger" data-action="special-career-action" data-kind="leave" ${jailed ? "disabled" : ""}>Leave career</button></div></article>`;
    }
    const tracks = NC.SPECIAL_CAREERS.map((track) => `<article class="v23-start-card"><span>${track.icon}</span><div><h3>${esc(track.label)}</h3><p>${esc(track.ranks.join(" → "))}</p><small>Application and training cost ${money(s, track.cost)} · recommended ${esc(U.cap(track.stat))} ${track.threshold}%</small></div><button class="button small" data-action="special-career-start" data-track="${track.id}" ${locked || jailed || active || s.finances.cash < track.cost ? "disabled" : ""}>Apply</button></article>`).join("");
    return `<div class="modal-backdrop"><section class="dialog v23-expansion-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>🚀 Special Careers</h2><p class="card-subtitle">Advanced paths with applications, training, ranks, opportunities, income, reputation, and awards.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><section class="v23-summary-grid"><div><span>Applications</span><strong>${s.specialCareer.applications}</strong><small>Lifetime attempts</small></div><div><span>Completed opportunities</span><strong>${s.specialCareer.completedActions}</strong><small>Missions, gigs, and seasons</small></div><div><span>Awards</span><strong>${s.specialCareer.awards}</strong><small>Public recognition</small></div><div><span>Lifetime income</span><strong>${money(s, s.specialCareer.lifetimeIncome)}</strong><small>Special-career earnings</small></div></section>${locked ? '<div class="hint-box"><strong>Special careers unlock at age 18.</strong></div>' : ""}<section><h3>Current path</h3>${current}</section><section><h3>Available paths</h3><div class="v23-start-list">${tracks}</div></section></div></section></div>`;
  };

  const previousDeveloper = V.developer;
  V.developer = function developerV25(app) {
    const s = app.game.state;
    const base = previousDeveloper(app);
    const card = `<article class="dev-card"><h3>v2.5 enterprises, auctions & careers</h3><p>Test managed venues, collectibles, appraisal outcomes, and advanced careers.</p><div class="card-actions"><button class="button small secondary" data-action="dev-toggle" data-key="enterpriseAlwaysProfits">Enterprises always profit: ${s.dev.enterpriseAlwaysProfits ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="collectionAlwaysAuthentic">All collectibles authentic: ${s.dev.collectionAlwaysAuthentic ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="specialCareerAlwaysSucceeds">Career actions always succeed: ${s.dev.specialCareerAlwaysSucceeds ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-v25-collectibles">Add every current auction lot</button><button class="button small secondary" data-action="dev-v25-max">Max all v2.5 systems</button><button class="button small danger" data-action="dev-v25-clear">Clear v2.5 systems</button></div></article>`;
    return base.replace('<div class="hint-box">', `${card}<div class="hint-box">`);
  };
})(window);
