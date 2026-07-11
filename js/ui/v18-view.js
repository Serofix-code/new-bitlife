(function installNextChapterV18Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);
  const money = (state, value) => U.formatMoney(value, state.profile.currency);
  const pct = (value) => U.clamp(Number(value) || 0, 0, 100);

  function statRow(state, key, label, icon) {
    const value = pct(state.stats[key]);
    const low = value < 20 ? " low" : "";
    return `<div class="v18-stat-row${low}"><span class="v18-stat-name">${esc(label)} <b>${icon}</b></span><div class="v18-stat-track"><i style="--stat:${value}%"></i></div><strong>${Math.round(value)}%</strong></div>`;
  }

  function pageTitle(tab) {
    const titles = {
      path: "Job & Education",
      assets: "Assets",
      people: "Relationships",
      activities: "Activities",
      crime: "Crime & Court",
      jail: "Prison",
      challenges: "Challenges & Ribbons",
      developer: "Developer Tools"
    };
    return titles[tab] || "Life";
  }

  V.v16Life = function v18Life(app) {
    const s = app.game.state;
    const entries = s.timeline.slice(0, 24);
    if (!entries.length) {
      return `<section class="v18-life-feed"><article class="v18-life-entry latest"><header><strong>Age: ${s.age} years</strong></header><p>A new life has begun. Press the green Age button to write the next chapter.</p></article></section>`;
    }
    return `<section class="v18-life-feed">${entries.map((entry, index) => `<article class="v18-life-entry ${index === 0 ? "latest" : ""}"><header><strong>${index === 0 ? `Age: ${entry.age} years` : `Age ${entry.age}`}</strong><span>${esc(entry.icon || "•")}</span></header><h3>${esc(entry.title)}</h3><p>${esc(entry.text)}</p></article>`).join("")}</section>`;
  };

  V.game = function v18Game(app) {
    const game = app.game;
    const s = game.state;
    const incarcerated = game.isIncarcerated();
    const occupation = game.occupationLabel();
    const account = app.store.getCurrentAccount ? app.store.getCurrentAccount() : { name: "Player" };
    const progress = app.store.getProfileProgress ? app.store.getProfileProgress() : { ribbons: [], completedChallenges: [] };
    const content = app.tab === "life" ? V.v16Life(app) : V.tabContent(app);
    const navItems = incarcerated
      ? [["life", "📖", "Life"], ["jail", "🔒", "Jail"], ["age", "+", "Age"], ["developer", "🧪", "Dev"]]
      : [["path", "💼", "Job"], ["assets", "💰", "Assets"], ["age", "+", "Age"], ["people", "♥", "Relationships"], ["activities", "•••", "Activities"]];
    const nav = navItems.map(([id, icon, label]) => id === "age"
      ? `<button class="v18-age-button" data-action="age-up" ${s.pendingEvent || s.crime.pendingCourt ? "disabled" : ""}><span>${icon}</span><strong>Age</strong></button>`
      : `<button class="v18-dock-button ${app.tab === id ? "active" : ""}" data-action="tab" data-tab="${id}"><span>${icon}</span><small>${esc(label)}</small></button>`).join("");
    const occult = s.profile.occult === "wizard" ? `🪄 ${U.cap(NC.wizardNoun(s.profile.identity))}` : s.profile.occult === "vampire" ? "🦇 Vampire" : "";
    const location = s.flags.orphanage ? "Orphanage care" : `${s.profile.city}, ${s.profile.country}`;
    const warning = incarcerated ? `<span>🔒 ${s.crime.incarceration.yearsRemaining} years left</span>` : s.flags.fugitive ? `<span>🚨 Fugitive</span>` : `<span>Generation ${s.legacy.generation}</span>`;
    const subpageHeader = app.tab === "life" ? "" : `<header class="v18-subpage-header"><button data-action="tab" data-tab="life" aria-label="Back to life">×</button><h2>${esc(pageTitle(app.tab))}</h2><span></span></header>`;

    return `<main class="v18-game-shell ${incarcerated ? "is-incarcerated" : ""}">
      <header class="v18-brandbar">
        <button class="v18-circle-button" data-action="open-main-menu" aria-label="Open menu">☰</button>
        <a class="v18-brand" href="#" data-action="tab" data-tab="life"><img src="assets/mark.svg" alt=""><span>NEXT CHAPTER</span></a>
        <div class="v18-header-actions"><button data-action="toggle-theme" title="Toggle dark mode">◐</button><button data-action="open-saves" title="Save">💾</button></div>
      </header>
      <section class="v18-profilebar">
        <img class="v18-profile-avatar" src="${U.avatarSvg(s.profile.avatar)}" alt="Portrait of ${esc(s.profile.firstName)}">
        <div class="v18-profile-copy"><h1><img src="${esc(s.profile.flag)}" alt=""> <span>${esc(s.profile.firstName)} ${esc(s.profile.lastName)}</span></h1><p>${esc(occupation)}${occult ? ` · ${esc(occult)}` : ""}</p><small>${esc(location)}</small></div>
        <div class="v18-balance"><strong>${money(s, s.finances.cash)}</strong><span>Bank Balance</span></div>
      </section>
      <section class="v18-account-strip"><span>👤 ${esc(account.name)}</span><span>🏆 ${(progress.ribbons || []).length} ribbons</span><span>⭐ Fame ${Math.round(s.fame)}%</span>${warning}</section>
      ${subpageHeader}
      <section class="v18-main-content">${content}</section>
      <section class="v18-stat-panel">
        ${statRow(s, "happiness", "Happiness", "🙂")}
        ${statRow(s, "health", "Health", "♥")}
        ${statRow(s, "knowledge", "Smarts", "🤓")}
        ${statRow(s, "resilience", "Resilience", "☀")}
      </section>
      <nav class="v18-bottom-dock" aria-label="Main life controls">${nav}</nav>
    </main>`;
  };

  const previousDeveloper = V.developer;
  V.developer = function developerV18(app) {
    const base = previousDeveloper(app);
    const progress = app.store.getProfileProgress ? app.store.getProfileProgress() : { ribbons: [] };
    const cheatCard = `<article class="dev-card v18-master-cheats"><h3>Collection & master cheats</h3><p>Unlock account-level collections or instantly prepare a test life.</p><div class="card-actions"><button class="button small secondary" data-action="dev-all-ribbons">Get all ribbons (${(progress.ribbons || []).length}/${Object.keys(NC.RIBBONS).length})</button><button class="button small secondary" data-action="dev-all-challenges">Complete all challenges</button><button class="button small secondary" data-action="dev-billionaire">Become billionaire</button><button class="button small secondary" data-action="dev-everything">Unlock everything</button><button class="button small danger" data-action="dev-clear-ribbons">Clear account ribbons</button></div></article>`;
    return base.replace('<div class="dev-grid">', `<div class="dev-grid">${cheatCard}`);
  };
})(window);
