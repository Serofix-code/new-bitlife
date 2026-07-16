(function installNextChapterV29Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);

  V.modsModal = function modsModal(app) {
    const records = NC.Mods.list();
    const rows = records.map((record) => {
      const mod = record.package;
      return `<article class="v29-mod-card" style="--mod-color:${esc(mod.color)}"><span class="v29-mod-icon">🧩</span><div><h3>${esc(mod.name)}</h3><p>${esc(mod.description)}</p><small>By ${esc(mod.author)} · ${mod.events.length} custom event${mod.events.length === 1 ? "" : "s"}</small></div><div class="v29-mod-actions"><button class="button small secondary" data-action="toggle-mod" data-mod="${esc(mod.id)}">${record.enabled ? "Enabled" : "Disabled"}</button><button class="button small danger" data-action="remove-mod" data-mod="${esc(mod.id)}">Remove</button></div></article>`;
    }).join("");
    return `<div class="modal-backdrop"><section class="dialog nc-popup-dialog v29-mod-dialog" role="dialog" aria-modal="true" aria-labelledby="mods-title"><div class="dialog-header"><div><h2 id="mods-title">🧩 Mods & Mod Maker</h2><p class="card-subtitle">Early-release tools for creating and playing custom life events.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div><div class="dialog-body"><section class="v29-mod-hero"><div><span>EARLY RELEASE</span><h3>Make your first mod in minutes</h3><p>No coding required. Design choices, outcomes, stat changes, and age ranges in a friendly standalone editor.</p></div><button class="button" data-action="open-mod-maker">Open Mod Maker ↗</button></section><div class="button-row"><button class="button secondary" data-action="import-mod">Install a mod file</button><span class="status-pill neutral">${records.length} installed</span></div><div class="v29-mod-list">${rows || '<div class="empty-state"><div class="empty-icon">🧩</div><h3>No mods installed yet</h3><p>Open the Mod Maker, export a file, then install it here.</p></div>'}</div><div class="hint-box"><strong>Early-release format:</strong> Custom annual life events with two to four choices, outcomes, cash effects, and stat effects. Mod files stay on this device.</div></div></section></div>`;
  };

  const previousLanding = V.landing;
  V.landing = function landingV29(app) {
    let html = previousLanding(app);
    const button = '<a class="button ghost v29-mod-maker-link" href="mod-maker.html" target="_blank" rel="noopener">🧩 Open Mod Maker</a>';
    return html.replace('<button class="button secondary" data-action="import">Import JSON save</button>', `<button class="button secondary" data-action="import">Import JSON save</button>${button}`);
  };

  const previousMainMenu = V.mainMenuModal;
  V.mainMenuModal = function mainMenuModalV29(app) {
    let html = previousMainMenu(app);
    const modButton = '<button class="v16-main-menu-item" data-action="open-mods"><span>🧩</span><strong>Mods & Mod Maker</strong><b>›</b></button>';
    return html.replace('<button class="v16-main-menu-item" data-action="open-changelog">', `${modButton}<button class="v16-main-menu-item" data-action="open-changelog">`);
  };

  const previousActivities = V.activities;
  V.activities = function activitiesV29(app) {
    const s = app.game.state;
    let html = previousActivities(app);
    const items = [
      ["❤️", "Love", s.age >= 16 ? "Find someone new" : "Unlocks at 16", "find-date", "", s.age < 16],
      ["🧘", "Mind & Body", "Wellness and self-improvement", "open-activity-center", 'data-center="wellness"', false],
      ["🐾", "Pets", "Adopt and care for a pet", "open-activity-center", 'data-center="pets"', false],
      ["💇", "Salon & Spa", "Appearance and self-care", "open-activity-center", 'data-center="appearance"', false],
      ["🌍", "Emigrate", s.age >= 18 ? "Choose another country" : "Unlocks at 18", "open-emigrate", "", s.age < 18],
      ["🎰", "Casino", s.age >= 18 ? "A no-stakes social visit" : "Unlocks at 18", "casino-visit", "", s.age < 18]
    ];
    const favorites = `<section class="v29-favorites"><div class="v29-section-title"><div><span>⭐</span><div><h3>Favorite activities</h3><p>Quick access inspired by the recording.</p></div></div><small>∞ actions</small></div><div class="v29-favorite-grid">${items.map(([icon, title, text, action, data, disabled]) => `<button class="v29-favorite-card" data-action="${action}" ${data} ${disabled ? "disabled" : ""}><span>${icon}</span><strong>${esc(title)}</strong><small>${esc(text)}</small><b>›</b></button>`).join("")}</div></section>`;
    if (html.includes('<div class="activity-menu">')) html = html.replace('<div class="activity-menu">', `${favorites}<div class="activity-menu">`);
    else html = html.replace('<section class="v19-activity-section">', `${favorites}<section class="v19-activity-section">`);
    return html.replace(/999 action(?:s)?(?: left)?/g, "∞ actions");
  };

  const previousPeople = V.people;
  V.people = function peopleV29(app) {
    let html = previousPeople(app);
    const marker = '<button class="button small secondary" data-action="find-date"';
    const all = '<button class="button small secondary v29-spend-all" data-action="spend-time-all">🤗 Spend Time With All</button>';
    return html.includes(marker) ? html.replace(marker, `${all}${marker}`) : html;
  };

  const previousGame = V.game;
  V.game = function gameV29(app) {
    return previousGame(app)
      .replace(/999 action(?:s)? left(?: this year)?/g, "∞ actions")
      .replace(/999 jail action(?:s)?/g, "∞ jail actions")
      .replace(/ · 1 action/g, " · unlimited")
      .replace(/Spend action points before aging up\./g, "Actions are unlimited—explore as much as you like before aging up.");
  };
})(window);
