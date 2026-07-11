(function installNextChapterV20Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);
  const money = (state, value) => U.formatMoney(value, state.profile.currency);

  const previousActivities = V.activities;
  V.activities = function activitiesV20(app) {
    let html = previousActivities(app);
    if (app.game.isIncarcerated()) return html;
    const replacements = [
      ['data-action="doctor-visit"', 'data-action="open-activity-center" data-center="wellness"'],
      ['data-action="lifestyle-action" data-kind="mind_body"', 'data-action="open-activity-center" data-center="wellness"'],
      ['data-action="lifestyle-action" data-kind="social_media"', 'data-action="open-activity-center" data-center="social"'],
      ['data-action="lifestyle-action" data-kind="club"', 'data-action="open-activity-center" data-center="clubs"'],
      ['data-action="lifestyle-action" data-kind="license"', 'data-action="open-activity-center" data-center="licenses"'],
      ['data-action="lifestyle-action" data-kind="diet"', 'data-action="open-activity-center" data-center="wellness"'],
      ['data-action="lifestyle-action" data-kind="plastic_surgery"', 'data-action="open-activity-center" data-center="appearance"'],
      ['data-action="lifestyle-action" data-kind="lawsuit"', 'data-action="open-activity-center" data-center="legal"'],
      ['data-action="lifestyle-action" data-kind="vacation"', 'data-action="open-activity-center" data-center="travel"'],
      ['data-action="lifestyle-action" data-kind="movie"', 'data-action="open-activity-center" data-center="cinema"'],
      ['data-action="lifestyle-action" data-kind="nightlife"', 'data-action="open-activity-center" data-center="nightlife"'],
      ['data-action="fame-activity"', 'data-action="open-activity-center" data-center="fame"'],
      ['data-action="lifestyle-action" data-kind="pet"', 'data-action="open-activity-center" data-center="pets"']
    ];
    replacements.forEach(([from, to]) => { html = html.split(from).join(to); });
    html = html.replace('<p>Adulthood · age', '<p>Dynamic systems · age');
    return html;
  };

  function extraCenterContent(game, centerId) {
    const s = game.state;
    const sys = s.activitySystems[centerId];
    if (centerId === "pets") {
      const pets = sys.animals.map((pet) => `<div class="v20-owned-item"><span>${esc(pet.icon || "🐾")}</span><div><strong>${esc(pet.name)}</strong><small>${esc(U.cap(pet.species))} · age ${pet.age} · health ${Math.round(pet.health)}% · bond ${Math.round(pet.bond)}%</small></div></div>`).join("");
      return `<section class="v20-center-subsection"><h3>Current pets</h3>${pets || '<p class="v20-empty">No pets currently live with you.</p>'}</section>`;
    }
    if (centerId === "licenses") {
      const owned = sys.owned.map((id) => {
        const option = NC.ACTIVITY_CENTERS.licenses.options.find((item) => item.id === id);
        return `<span class="v20-chip">${option ? option.icon : "🪪"} ${esc(option ? option.label : id)}</span>`;
      }).join("");
      return `<section class="v20-center-subsection"><h3>Owned licenses</h3><div class="v20-chip-row">${owned || '<span class="v20-empty">No licenses yet.</span>'}</div></section>`;
    }
    if (centerId === "clubs") {
      const owned = sys.memberships.map((id) => {
        const option = NC.ACTIVITY_CENTERS.clubs.options.find((item) => item.id === id);
        return `<span class="v20-chip">${option ? option.icon : "🎭"} ${esc(option ? option.label : id)}</span>`;
      }).join("");
      return `<section class="v20-center-subsection"><h3>Memberships</h3><div class="v20-chip-row">${owned || '<span class="v20-empty">You have not joined a club yet.</span>'}</div></section>`;
    }
    if (centerId === "travel") {
      return `<section class="v20-center-subsection"><h3>Travel record</h3><div class="v20-chip-row">${sys.countriesVisited.map((country) => `<span class="v20-chip">🌍 ${esc(country)}</span>`).join("")}</div></section>`;
    }
    if (centerId === "wellness") {
      return `<section class="v20-center-subsection"><h3>Current plan</h3><div class="v20-chip-row"><span class="v20-chip">🥗 ${esc(sys.currentDiet || "No diet plan")}</span><span class="v20-chip">🏋️ ${sys.gymVisits || 0} gym visits</span><span class="v20-chip">💬 ${sys.therapySessions || 0} therapy sessions</span></div></section>`;
    }
    return "";
  }

  V.activityCenterModal = function activityCenterModal(app) {
    const game = app.game;
    const s = game.state;
    const centerId = app.modal && app.modal.center;
    const center = game.activityCenter(centerId);
    if (!center) return "";
    const metric = game.activityCenterMetric(centerId);
    const options = center.options.map((option) => {
      const estimate = game.activityOptionEstimate(centerId, option.id);
      const cost = option.cost ? money(s, option.cost) : "Free";
      const buttonText = estimate.allowed ? `${cost} · Choose` : estimate.reason;
      return `<article class="v20-option-card ${estimate.allowed ? "" : "locked"}">
        <span class="v20-option-icon">${option.icon}</span>
        <div class="v20-option-copy"><h3>${esc(option.label)}</h3><p>${esc(estimate.reason)}</p><div class="v20-chance-track"><i style="--chance:${estimate.chance}%"></i></div><small>Estimated result chance: <strong>${estimate.chance}%</strong> · ${esc(cost)}</small></div>
        <button class="button small ${estimate.allowed ? "" : "secondary"}" data-action="dynamic-activity" data-center="${esc(centerId)}" data-option="${esc(option.id)}" ${estimate.allowed ? "" : "disabled"}>${esc(buttonText)}</button>
      </article>`;
    }).join("");
    const history = s.activitySystems.history.filter((item) => item.center === centerId).slice(0, 6).map((item) => {
      const option = center.options.find((entry) => entry.id === item.option);
      return `<li><span>${item.success ? "✓" : "○"}</span><div><strong>Age ${item.age}: ${esc(option ? option.label : item.option)}</strong><small>${item.success ? "Successful" : "Unsuccessful"} · estimated ${item.chance}%${item.cost ? ` · ${money(s, item.cost)}` : ""}</small></div></li>`;
    }).join("");
    return `<div class="modal-backdrop"><section class="dialog v20-center-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>${center.icon} ${esc(center.label)}</h2><p class="card-subtitle">${esc(center.description)}</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body">
      <div class="v20-center-summary"><div><span>${esc(center.metricLabel)}</span><strong>${metric}%</strong><small>Changes with your life</small></div><div><span>Age</span><strong>${s.age}</strong><small>${esc(game.activityStage())}</small></div><div><span>Health</span><strong>${Math.round(s.stats.health)}%</strong><small>Direct modifier</small></div><div><span>Legal record</span><strong>${s.crime.convictions}</strong><small>${s.crime.convictions ? "Can restrict options" : "Clean"}</small></div></div>
      <div class="v20-system-summary">${esc(game.activityCenterSummary(centerId))}</div>
      ${extraCenterContent(game, centerId)}
      <section class="v20-center-subsection"><h3>Available options</h3><div class="v20-option-list">${options}</div></section>
      <section class="v20-center-subsection"><h3>Recent history</h3>${history ? `<ul class="v20-history-list">${history}</ul>` : '<p class="v20-empty">No attempts have been recorded in this system yet.</p>'}</section>
    </div></section></div>`;
  };

  const previousDeveloper = V.developer;
  V.developer = function developerV20(app) {
    const s = app.game.state;
    const base = previousDeveloper(app);
    const card = `<article class="dev-card"><h3>Dynamic activity cheats</h3><p>Control every new activity center and its success checks.</p><div class="card-actions"><button class="button small secondary" data-action="dev-toggle" data-key="alwaysActivitySuccess">Activities always succeed: ${s.dev.alwaysActivitySuccess ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="unlimitedActivityPoints">Unlimited activity points: ${s.dev.unlimitedActivityPoints ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-max-activities">Max activity systems</button><button class="button small danger" data-action="dev-clear-activities">Clear activity histories</button></div></article>`;
    return base.replace('<div class="hint-box">', `${card}<div class="hint-box">`);
  };
})(window);
