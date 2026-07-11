(function installNextChapterV16Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);
  const money = (state, value) => U.formatMoney(value, state.profile.currency);
  const pct = (value) => U.clamp(value, 0, 100);

  function activityRow(icon, title, subtitle, action, opts) {
    const options = opts || {};
    const attrs = Object.entries(options.data || {}).map(([key, value]) => ` data-${key}="${esc(value)}"`).join("");
    return `<button class="v16-menu-row" data-action="${esc(action)}"${attrs} ${options.disabled ? "disabled" : ""}>
      <span class="v16-menu-icon">${icon}</span>
      <span class="v16-menu-copy"><strong>${esc(title)}</strong><small>${esc(options.reason || subtitle)}</small></span>
      <span class="v16-menu-arrow">${options.ellipsis ? "•••" : "›"}</span>
    </button>`;
  }

  function statRow(state, key, label, icon) {
    const value = pct(state.stats[key]);
    return `<div class="v16-stat-row"><span class="v16-stat-name">${esc(label)} <b>${icon}</b></span><div class="v16-stat-track"><i style="--stat:${value}%"></i></div><strong>${Math.round(value)}%</strong></div>`;
  }

  V.v16Life = function v16Life(app) {
    const s = app.game.state;
    const entries = s.timeline.slice(0, 5);
    const journal = entries.map((entry, index) => `<article class="v16-journal-entry ${index === 0 ? "latest" : ""}">
      <header><strong>${index === 0 ? `Age: ${entry.age} years` : `Age ${entry.age}`}</strong><span>${esc(entry.icon)}</span></header>
      <h3>${esc(entry.title)}</h3><p>${esc(entry.text)}</p>
    </article>`).join("");
    return `<section class="v16-life-feed">${journal || `<article class="v16-journal-entry latest"><header><strong>Age: ${s.age} years</strong><span>🌱</span></header><h3>A new life</h3><p>Press Age to begin writing this chapter.</p></article>`}</section>`;
  };

  V.game = function v16Game(app) {
    const game = app.game;
    const s = game.state;
    const incarcerated = game.isIncarcerated();
    const occupation = game.occupationLabel();
    const occult = s.profile.occult === "wizard" ? `🪄 ${U.cap(NC.wizardNoun(s.profile.identity))}` : s.profile.occult === "vampire" ? "🦇 Vampire" : "🌱 Human";
    const content = app.tab === "life" ? V.v16Life(app) : V.tabContent(app);
    const navItems = incarcerated
      ? [["life", "📖", "Life"], ["jail", "🔒", "Jail"], ["age", "+", "Age"], ["developer", "🧪", "Dev"]]
      : [["path", "💼", "Job"], ["assets", "💰", "Assets"], ["age", "+", "Age"], ["people", "♥", "Relationships"], ["activities", "•••", "Activities"]];
    const nav = navItems.map(([id, icon, label]) => id === "age"
      ? `<button class="v16-age-button" data-action="age-up" ${s.pendingEvent || s.crime.pendingCourt ? "disabled" : ""}><span>${icon}</span><strong>Age</strong></button>`
      : `<button class="v16-dock-button ${app.tab === id ? "active" : ""}" data-action="tab" data-tab="${id}"><span>${icon}</span><small>${esc(label)}</small></button>`).join("");
    const location = s.flags.orphanage ? "Orphanage care" : `${s.profile.city}, ${s.profile.country}`;
    const fugitive = s.flags.fugitive ? `<span class="v16-alert-pill">🚨 Fugitive</span>` : "";
    const custody = incarcerated ? `<span class="v16-alert-pill">🔒 ${s.crime.incarceration.yearsRemaining} years left</span>` : "";

    return `<main class="v16-game-shell ${incarcerated ? "is-incarcerated" : ""}">
      <header class="v16-brandbar">
        <button class="v16-round-button" data-action="open-main-menu" aria-label="Open menu">☰</button>
        <a class="v16-brand" href="#" data-action="tab" data-tab="life"><img src="assets/mark.svg" alt=""><span>Next Chapter</span></a>
        <div class="v16-header-actions"><button data-action="toggle-theme" title="Toggle appearance">◐</button><button data-action="open-saves" title="Save and export">💾</button></div>
      </header>
      <section class="v16-profilebar">
        <img class="v16-profile-avatar" src="${U.avatarSvg(s.profile.avatar)}" alt="Portrait of ${esc(s.profile.firstName)}">
        <div class="v16-profile-copy"><h1><img src="${esc(s.profile.flag)}" alt=""> ${esc(s.profile.firstName)} ${esc(s.profile.lastName)}</h1><p>${esc(occupation)} · ${esc(occult)}</p><small>${esc(location)}</small></div>
        <div class="v16-balance"><strong>${money(s, s.finances.cash)}</strong><span>Bank balance</span><small>${esc(s.profile.currency)} · FX ref. ${esc(s.profile.fxReferenceDate || "bundled")}</small></div>
      </section>
      <div class="v16-statusline">${fugitive}${custody}<span>Generation ${s.legacy.generation}</span><span>Fame ${Math.round(s.fame)}%</span></div>
      <section class="v16-main-content">${content}</section>
      <section class="v16-stat-panel">
        ${statRow(s, "happiness", "Happiness", "🙂")}
        ${statRow(s, "health", "Health", "♥")}
        ${statRow(s, "knowledge", "Smarts", "🧠")}
        ${statRow(s, "resilience", "Resilience", "◆")}
      </section>
      <nav class="v16-bottom-dock" aria-label="Main life controls">${nav}</nav>
    </main>`;
  };

  V.activities = function v16Activities(app) {
    const s = app.game.state;
    if (app.game.isIncarcerated()) return V.jail(app);
    const noActions = s.activityPoints < 1;
    const rows = [
      activityRow("👒", "Accessories", "Customize your portrait", "activity", { data: { activity: "accessories" }, disabled: noActions, reason: noActions ? "Age up for more actions" : "Accessorize your portrait" }),
      activityRow("🧸", "Adoption", "Apply to adopt a child", "adopt-child", { disabled: s.age < 18 || noActions, reason: s.age < 18 ? "Available at age 18" : noActions ? "Age up for more actions" : "Apply to adopt a child", ellipsis: true }),
      activityRow("🎟️", "Casino Arcade", "Play a no-stakes luck minigame", "open-casino", { disabled: s.age < 18 || noActions, reason: s.age < 18 ? "Available at age 18" : noActions ? "Age up for more actions" : `Free play tokens · arcade score ${s.casino ? s.casino.score : 0}`, ellipsis: true }),
      activityRow("👹", "Crime", "Commit a crime", "open-section", { data: { tab: "crime" } }),
      activityRow("🩺", "Doctor", "Visit a doctor", "doctor-visit", { disabled: noActions, reason: noActions ? "Age up for more actions" : "Book a health appointment" }),
      activityRow("🌍", "Relocate", "Move to another city or country", "open-relocate", { disabled: s.age < 18 || noActions, reason: s.age < 18 ? "Available at age 18" : noActions ? "Age up for more actions" : `${s.profile.city}, ${s.profile.country}`, ellipsis: true }),
      activityRow("⭐", "Fame", "Manage your public image", "fame-activity", { disabled: s.age < 13 || noActions, reason: s.age < 13 ? "Available at age 13" : noActions ? "Age up for more actions" : `Current fame: ${Math.round(s.fame)}%` }),
      activityRow("🧬", "Fertility", "Visit a fertility clinic", "fertility", { disabled: s.age < 18 || noActions, reason: s.age < 18 ? "Available at age 18" : noActions ? "Age up for more actions" : "Explore family-building options" }),
      activityRow("🏠", "Shopping", "Browse changing homes and possessions", "open-section", { data: { tab: "assets" } }),
      activityRow(s.flags.wizard ? "🪄" : "📜", s.flags.wizard ? "Magic & Spells" : "Awaken Magic", "Use or discover magic", "open-magic", { disabled: (!s.flags.wizard && s.age < 12) || noActions, reason: !s.flags.wizard && s.age < 12 ? "Magical awakening begins at age 12" : noActions ? "Age up for more actions" : s.flags.wizard ? `Mana ${s.magic.mana} · Power ${s.magic.power}` : "Choose an awakening path" }),
      activityRow("⏳", "Time Travel", "Return to a recorded age", "open-time-travel", { disabled: app.game.availableTimeTravelAges().length < 2, reason: app.game.availableTimeTravelAges().length < 2 ? "Age up to record more ages" : `${app.game.availableTimeTravelAges().length} recorded ages` }),
      activityRow("🏆", "Challenges & Ribbons", "View permanent achievements", "open-section", { data: { tab: "challenges" } })
    ].join("");

    const reserved = new Set(["accessories", "doctor_visit", "fame_publicity", "occult_research"]);
    const generic = app.data.catalogs.activities.filter((activity) => !reserved.has(activity.id)).map((activity) => {
      const ageOkay = s.age >= activity.minAge && (!Number.isFinite(activity.maxAge) || s.age <= activity.maxAge);
      const modeOkay = (!activity.vampireOnly || s.flags.vampire) && (!activity.wizardOnly || s.flags.wizard);
      const cashOkay = s.finances.cash >= activity.cost;
      let reason = activity.description;
      if (!ageOkay) reason = s.age < activity.minAge ? `Available at age ${activity.minAge}` : `Available for ages ${activity.minAge}–${activity.maxAge}`;
      else if (!modeOkay) reason = activity.vampireOnly ? "Vampire only" : "Wizard / witch only";
      else if (!cashOkay) reason = `Needs ${money(s, activity.cost)}`;
      else if (noActions) reason = "Age up for more actions";
      return activityRow(activity.icon, activity.label, activity.description, "activity", { data: { activity: activity.id }, disabled: !ageOkay || !modeOkay || !cashOkay || noActions, reason });
    }).join("");

    return `<div class="v16-list-page"><div class="v16-page-heading"><div><h2>Activities</h2><p>Options unlock with age and change with your life.</p></div><span>${s.activityPoints} action${s.activityPoints === 1 ? "" : "s"}</span></div><div class="v16-menu-list">${rows}</div><h3 class="v16-section-divider">More activities</h3><div class="v16-menu-list">${generic}</div></div>`;
  };

  V.assets = function v16Assets(app) {
    const s = app.game.state;
    app.game.refreshAssetMarket(false);
    const owned = s.assets.map((asset) => `<article class="v16-owned-asset"><img src="${U.assetSvg(asset)}" alt=""><div><h3>${esc(asset.label)}</h3><p>${esc(asset.location || s.profile.city)} · condition ${Math.round(asset.condition || 100)}%</p><strong>${money(s, asset.value || asset.price)}</strong></div><button class="button small danger" data-action="sell-asset" data-instance="${esc(asset.instanceId)}">Sell</button></article>`).join("");
    const categories = [...new Set(s.market.listings.map((item) => item.category))];
    const market = categories.map((category) => {
      const listings = s.market.listings.filter((item) => item.category === category);
      return `<section class="v16-market-section"><h3>${esc(category)}</h3>${listings.map((item) => {
        const upfront = item.kind === "property" ? item.downPayment : item.price;
        const disabled = s.age < item.minAge || s.finances.cash < upfront || app.game.isIncarcerated();
        return `<article class="v16-market-card"><img src="${U.assetSvg(item)}" alt="Illustration of ${esc(item.label)}"><div class="v16-market-copy"><h4>${esc(item.label)}</h4><p>${esc(item.description)}</p><small>${esc(item.location)} · ${item.kind === "property" ? `Down payment ${money(s, item.downPayment)} · value ${money(s, item.price)}` : money(s, item.price)}</small></div><button class="v16-buy-button" data-action="buy-market" data-listing="${esc(item.id)}" ${disabled ? "disabled" : ""}>${disabled ? (s.age < item.minAge ? `Age ${item.minAge}` : "Unavailable") : "Buy"}</button></article>`;
      }).join("")}</section>`;
    }).join("");
    return `<div class="v16-list-page assets-page"><div class="v16-page-heading"><div><h2>Assets & Shopping</h2><p>Listings refresh every in-game year and are personalized to ${esc(s.profile.city)}.</p></div><span>${money(s, s.finances.cash)}</span></div><div class="v16-fx-note">All catalog values use a common USD-equivalent base and are displayed in ${esc(s.profile.currency)} using bundled reference rates.</div><section class="v16-owned-section"><h3>My assets</h3>${owned || `<p class="v16-empty-copy">You do not own any assets yet.</p>`}</section>${market}</div>`;
  };

  V.relocateModal = function relocateModal(app) {
    const s = app.game.state;
    const sections = app.data.catalogs.origins.map((origin) => {
      const sameCountry = origin.id === s.profile.originId;
      const cities = origin.cities.map((city) => {
        const current = sameCountry && city === s.profile.city;
        const cost = sameCountry ? 850 : 2800;
        return `<button class="v16-city-choice" data-action="relocate" data-country="${esc(origin.id)}" data-city="${esc(city)}" ${current ? "disabled" : ""}><strong>${esc(city)}</strong><span>${current ? "Current city" : money(s, cost)}</span></button>`;
      }).join("");
      return `<section class="v16-country-block"><header><img src="${esc(origin.flag)}" alt=""><div><h3>${esc(origin.country)}</h3><p>${esc(origin.currencyCode || origin.currency)} · ${sameCountry ? "Domestic move" : "International move"}</p></div></header><div class="v16-city-grid">${cities}</div></section>`;
    }).join("");
    return `<div class="modal-backdrop"><section class="dialog v16-relocate-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>Relocate</h2><p class="card-subtitle">Choose an exact city. Molde and Lille are included.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body">${sections}</div></section></div>`;
  };

  V.casinoModal = function casinoModal(app) {
    const s = app.game.state;
    const round = s.casino && s.casino.round;
    let body;
    if (!round) {
      body = `<div class="v16-arcade-intro"><span>🎟️</span><h3>Lucky Lights</h3><p>Pick one of three cards and try to find the glowing star. This uses free, non-purchasable play tokens only—there are no wagers, cash prizes, or cash-out.</p><button class="button" data-action="casino-start" ${s.activityPoints < 1 ? "disabled" : ""}>Start a round</button></div>`;
    } else {
      const cards = [0, 1, 2].map((index) => {
        const revealed = round.resolved;
        const star = index === round.winningIndex;
        const selected = index === round.selectedIndex;
        return `<button class="v16-arcade-card ${revealed ? "revealed" : ""} ${selected ? "selected" : ""} ${revealed && star ? "winner" : ""}" data-action="casino-pick" data-index="${index}" ${revealed ? "disabled" : ""}><span>${revealed ? (star ? "⭐" : "🌙") : "?"}</span><small>Card ${index + 1}</small></button>`;
      }).join("");
      body = `<div class="v16-arcade-board"><div class="v16-arcade-score"><span>Arcade score <strong>${s.casino.score}</strong></span><span>Best streak <strong>${s.casino.bestStreak}</strong></span></div><div class="v16-arcade-cards">${cards}</div>${round.resolved ? `<p>${round.selectedIndex === round.winningIndex ? `You found the star and earned ${round.reward} arcade points!` : "The star was behind another card."}</p><button class="button secondary" data-action="casino-reset">Close round</button>` : `<p>Choose a card.</p>`}</div>`;
    }
    return `<div class="modal-backdrop"><section class="dialog v16-casino-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>Casino Arcade</h2><p class="card-subtitle">A no-stakes mini-game for fun and happiness.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body">${body}</div></section></div>`;
  };

  V.mainMenuModal = function mainMenuModal(app) {
    const incarcerated = app.game.isIncarcerated();
    const items = incarcerated
      ? [["life", "📖", "Life journal"], ["jail", "🔒", "Jail"], ["developer", "🧪", "Developer"]]
      : [["life", "📖", "Life journal"], ["path", "💼", "Job & education"], ["assets", "🏠", "Assets & shopping"], ["people", "♥", "Relationships"], ["activities", "✨", "Activities"], ["crime", "🚓", "Crime & court"], ["challenges", "🏆", "Challenges & ribbons"], ["developer", "🧪", "Developer"]];
    const buttons = items.map(([tab, icon, label]) => `<button class="v16-main-menu-item" data-action="menu-tab" data-tab="${tab}"><span>${icon}</span><strong>${esc(label)}</strong><b>›</b></button>`).join("");
    return `<div class="modal-backdrop"><section class="dialog v16-menu-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>Next Chapter</h2><p class="card-subtitle">Jump to a section.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><div class="v16-main-menu-list">${buttons}<button class="v16-main-menu-item" data-action="open-saves"><span>💾</span><strong>Save & export</strong><b>›</b></button></div></div></section></div>`;
  };
})(window);
