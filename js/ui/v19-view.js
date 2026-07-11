(function installNextChapterV19Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);
  const money = (state, value) => U.formatMoney(value, state.profile.currency);

  function row(icon, title, subtitle, action, options) {
    const opts = options || {};
    const attrs = Object.entries(opts.data || {}).map(([key, value]) => ` data-${key}="${esc(value)}"`).join("");
    const lock = opts.disabled ? `<span class="v19-lock">${esc(opts.lock || "Locked")}</span>` : `<span class="v19-row-arrow">›</span>`;
    return `<button class="v19-activity-row" data-action="${esc(action)}"${attrs} ${opts.disabled ? "disabled" : ""}>
      <span class="v19-activity-icon">${icon}</span>
      <span class="v19-activity-copy"><strong>${esc(title)}</strong><small>${esc(opts.reason || subtitle)}</small></span>
      ${lock}
    </button>`;
  }

  function section(title, rows) {
    return `<section class="v19-activity-section"><h3>${esc(title)}</h3><div class="v19-activity-list">${rows.join("")}</div></section>`;
  }

  const previousCreator = V.creator;
  V.creator = function creatorV19(app) {
    const draft = app.creatorDraft;
    const current = NC.REPRODUCTIVE_ROLES[draft.reproductiveRole] ? draft.reproductiveRole : (draft.identity === "woman" ? "carry" : draft.identity === "man" ? "contribute" : "assisted");
    const options = Object.values(NC.REPRODUCTIVE_ROLES).map((item) => `<option value="${esc(item.id)}" ${item.id === current ? "selected" : ""}>${esc(item.label)} — ${esc(item.description)}</option>`).join("");
    const field = `<div class="field full"><label for="reproductive-role">Reproductive role</label><select id="reproductive-role" name="reproductiveRole">${options}</select><small class="field-help">This controls which biological or assisted family-building routes are available. It is separate from gender identity.</small></div>`;
    const html = previousCreator(app);
    const origin = app.data.catalogs.origins.find((item) => item.id === draft.originId) || app.data.catalogs.origins[0];
    return html
      .replace('<p id="creator-origin-preview">', `<img id="creator-flag-preview" class="v19-creator-flag" src="${esc(origin.flag)}" alt="${esc(origin.country)} flag"><p id="creator-origin-preview">`)
      .replace('<div class="field"><label for="origin">Place of birth</label>', `${field}<div class="field"><label for="origin">Place of birth</label>`);
  };

  V.activities = function activitiesV19(app) {
    const game = app.game;
    const s = game.state;
    if (game.isIncarcerated()) return V.jail(app);
    const noActions = s.activityPoints < 1;
    const ageLock = (min) => s.age < min && !s.dev.ignoreActivityAgeLocks;
    const canSpend = (cost) => s.finances.cash >= cost;
    const disabled = (min, cost) => ageLock(min) || noActions || !canSpend(cost || 0);
    const reason = (min, normal, cost) => ageLock(min) ? `Available at age ${min}` : noActions ? "Age up for more actions" : !canSpend(cost || 0) ? `Needs ${money(s, cost)}` : normal;

    const earlyRows = [
      row("👒", "Accessories", "Customize your portrait", "activity", { data: { activity: "accessories" }, disabled: noActions, reason: noActions ? "Age up for more actions" : "Change hair accessories and portrait details" }),
      row("🧸", s.age <= 1 ? "Tummy time" : "Play & childhood activities", "Age-appropriate play", "activity", { data: { activity: s.age <= 1 ? "tummy_time" : s.age <= 5 ? "play_blocks" : "picture_book" }, disabled: noActions || s.age > 7, lock: s.age > 7 ? "Childhood" : "Locked", reason: s.age > 7 ? "Available during early childhood" : noActions ? "Age up for more actions" : "A developmentally suitable activity" }),
      row("🩺", "Doctor", "Visit a doctor", "doctor-visit", { disabled: noActions, reason: noActions ? "Age up for more actions" : "Treat health concerns and receive a check-up" }),
      row("🧘", "Mind & Body", "Meditate, read, walk, or exercise", "lifestyle-action", { data: { kind: "mind_body" }, disabled: disabled(6, 0), lock: "Age 6", reason: reason(6, "Improve health, smarts, and resilience", 0) })
    ];

    const teenRows = [
      row("📱", "Social Media", "Post updates and build followers", "lifestyle-action", { data: { kind: "social_media" }, disabled: disabled(13, 0), lock: "Age 13", reason: reason(13, `${s.social.followers || 0} followers`, 0) }),
      row("🎭", "Clubs & Activities", "Join school or community clubs", "lifestyle-action", { data: { kind: "club" }, disabled: disabled(12, 0), lock: "Age 12", reason: reason(12, "Build skills, friendships, and confidence", 0) }),
      row("💼", "Part-Time Jobs", "Browse teen-friendly jobs", "open-section", { data: { tab: "path" }, disabled: ageLock(16), lock: "Age 16", reason: ageLock(16) ? "Available at age 16" : "Shop assistant and café roles are available" }),
      row("🪪", "Licenses", "Study for a driving license", "lifestyle-action", { data: { kind: "license" }, disabled: disabled(16, 120), lock: "Age 16", reason: reason(16, "Study safe-driving rules", 120) })
    ];

    const healthRows = [
      row("🥗", "Diet", "Choose a balanced meal plan", "lifestyle-action", { data: { kind: "diet" }, disabled: disabled(18, 80), lock: "Age 18", reason: reason(18, "Improve health over the year", 80) }),
      row("✨", "Appearance Consultation", "Make a fictional cosmetic change", "lifestyle-action", { data: { kind: "plastic_surgery" }, disabled: disabled(18, 3500), lock: "Age 18", reason: reason(18, "Optional appearance customization", 3500) })
    ];

    const legalRows = [
      row("🚓", "Crime", "Open the crime and court menu", "open-section", { data: { tab: "crime" }, disabled: ageLock(18), lock: "Age 18", reason: ageLock(18) ? "Major crimes unlock at age 18" : "Criminal choices can lead to arrest, court, and prison" }),
      row("⚖️", "Lawsuits", "Discuss a civil claim with a lawyer", "lifestyle-action", { data: { kind: "lawsuit" }, disabled: disabled(18, 900), lock: "Age 18", reason: reason(18, "Review a possible legal dispute", 900) })
    ];

    const moneyRows = [
      row("🎟️", "Casino Arcade", "Play a no-stakes card minigame", "open-casino", { disabled: disabled(18, 0), lock: "Age 18", reason: reason(18, `Free play tokens · arcade score ${s.casino ? s.casino.score : 0}`, 0) }),
      row("🎫", "Lottery Arcade", "Reveal a free cosmetic-score ticket", "lifestyle-action", { data: { kind: "lottery_arcade" }, disabled: disabled(18, 0), lock: "Age 18", reason: reason(18, "No real-money bets or cash prizes", 0) }),
      row("🛍️", "Shopping", "Browse homes, vehicles, jewellery, and more", "open-section", { data: { tab: "assets" }, disabled: ageLock(18), lock: "Age 18", reason: ageLock(18) ? "Major purchases unlock at age 18" : `Personalized listings for ${s.profile.city}` })
    ];

    const travelRows = [
      row("🌍", "Relocate", "Move to another city or country", "open-relocate", { disabled: disabled(18, 0), lock: "Age 18", reason: reason(18, `${s.profile.city}, ${s.profile.country}`, 0) }),
      row("🏖️", "Vacation", "Take a restorative trip", "lifestyle-action", { data: { kind: "vacation" }, disabled: disabled(18, 1800), lock: "Age 18", reason: reason(18, "Visit a new destination", 1800) })
    ];

    const leisureRows = [
      row("🎬", "Movie Theater", "Watch a film", "lifestyle-action", { data: { kind: "movie" }, disabled: disabled(8, 25), lock: "Age 8", reason: reason(8, `${s.social.movieVisits || 0} lifetime visits`, 25) }),
      row("🌃", "Nightlife", "Go dancing or hear live music", "lifestyle-action", { data: { kind: "nightlife" }, disabled: disabled(18, 100), lock: "Age 18", reason: reason(18, "An adult social outing", 100) }),
      row("⭐", "Fame", "Manage your public image", "fame-activity", { disabled: disabled(13, 0), lock: "Age 13", reason: reason(13, `Current fame: ${Math.round(s.fame)}%`, 0) })
    ];

    const familyRows = [
      row("♥", "Love & Dating", "Manage dates, partners, and marriage", "open-section", { data: { tab: "people" }, disabled: ageLock(16), lock: "Age 16", reason: ageLock(16) ? "Dating unlocks at age 16" : "Open your relationships" }),
      row("🧬", "Fertility & Adoption", "Open the family-building center", "open-family-planning", { disabled: ageLock(18), lock: "Age 18", reason: ageLock(18) ? "Available at age 18" : s.familyPlanning.pendingPregnancy ? `Process in progress; due at age ${s.familyPlanning.pendingPregnancy.dueAge}` : `Biological success score: ${game.biologicalSuccessMetric(s)}%` }),
      row("🐾", "Pets", "Adopt a companion animal", "lifestyle-action", { data: { kind: "pet" }, disabled: disabled(18, 450), lock: "Age 18", reason: reason(18, `${s.social.pets || 0} pets adopted`, 450) })
    ];

    const supernaturalRows = [
      row(s.flags.wizard ? "🪄" : "📜", s.flags.wizard ? "Magic & Spells" : "Awaken Magic", "Use or discover magical ability", "open-magic", { disabled: (!s.flags.wizard && ageLock(12)) || noActions, lock: !s.flags.wizard ? "Age 12" : "Locked", reason: !s.flags.wizard && ageLock(12) ? "Magical awakening begins at age 12" : noActions ? "Age up for more actions" : s.flags.wizard ? `Mana ${s.magic.mana} · Power ${s.magic.power}` : "Choose an awakening path" }),
      row("⏳", "Time Travel", "Return to a recorded age", "open-time-travel", { disabled: game.availableTimeTravelAges().length < 2, lock: "Need history", reason: game.availableTimeTravelAges().length < 2 ? "Age up to record more years" : `${game.availableTimeTravelAges().length} recorded ages` }),
      row("🏆", "Challenges & Ribbons", "View permanent account progress", "open-section", { data: { tab: "challenges" }, reason: "Saved to the active user account" })
    ];

    return `<div class="v19-activities-page">
      <div class="v19-page-banner"><div><h2>Activities</h2><p>${U.cap(game.activityStage())} · age ${s.age}</p></div><span>${s.activityPoints} action${s.activityPoints === 1 ? "" : "s"}</span></div>
      ${section("Childhood & Everyday", earlyRows)}
      ${section("Teen Life", teenRows)}
      ${section("Health & Wellness", healthRows)}
      ${section("Legal & Crime", legalRows)}
      ${section("Lifestyle & Finances", moneyRows)}
      ${section("Travel & Transition", travelRows)}
      ${section("Leisure, Fame & Nightlife", leisureRows)}
      ${section("Relationships & Home", familyRows)}
      ${section("Supernatural & Progress", supernaturalRows)}
    </div>`;
  };

  V.familyPlanningModal = function familyPlanningModal(app) {
    const game = app.game;
    const s = game.state;
    const partner = game.currentPartnerForFamily();
    const role = NC.REPRODUCTIVE_ROLES[s.profile.reproductiveRole];
    const metric = game.biologicalSuccessMetric(s);
    const contraception = NC.CONTRACEPTION[s.familyPlanning.contraception];
    const pending = s.familyPlanning.pendingPregnancy;
    const methodCards = Object.values(NC.FAMILY_METHODS).map((method) => {
      const estimate = game.familyMethodEstimate(method.id);
      const buttonText = estimate.allowed ? `${method.cost ? money(s, method.cost) : "Free"} · Try` : estimate.reason;
      return `<article class="v19-family-method ${estimate.allowed ? "" : "locked"}">
        <span>${method.icon}</span><div><h3>${esc(method.label)}</h3><p>${esc(estimate.reason)}</p><div class="v19-chance"><i style="--chance:${estimate.chance}%"></i></div><small>Estimated success this attempt: <strong>${estimate.chance}%</strong></small></div>
        <button class="button small ${method.id === "adoption" ? "secondary" : ""}" data-action="family-method" data-method="${esc(method.id)}" ${estimate.allowed ? "" : "disabled"}>${esc(buttonText)}</button>
      </article>`;
    }).join("");
    const contraceptionButtons = Object.values(NC.CONTRACEPTION).map((item) => `<button class="v19-contraception ${item.id === contraception.id ? "selected" : ""}" data-action="set-contraception" data-contraception="${esc(item.id)}"><strong>${esc(item.label)}</strong><small>${esc(item.description)}</small></button>`).join("");
    const partnerInfo = partner ? `<div class="v19-family-person"><img src="${U.avatarSvg(partner.avatar)}" alt=""><div><strong>${esc(partner.firstName)} ${esc(partner.lastName)}</strong><span>${esc(partner.pronouns)} · ${esc(NC.REPRODUCTIVE_ROLES[partner.reproductiveRole].label)}</span><small>Biological success score: ${game.biologicalSuccessMetric(partner)}%</small></div></div>` : `<div class="hint-box">No current partner. Natural attempts are unavailable, but assisted routes, surrogacy, and adoption may still be possible.</div>`;
    return `<div class="modal-backdrop"><section class="dialog v19-family-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>Fertility & Adoption</h2><p class="card-subtitle">Dynamic estimates use age, health, reproductive role, legal record, finances, and selected route.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body">
      <div class="v19-family-summary"><div><span>Biological success</span><strong>${metric}%</strong><small>${esc(role.label)}</small></div><div><span>Health</span><strong>${Math.round(s.stats.health)}%</strong><small>Direct modifier</small></div><div><span>Record</span><strong>${s.crime.convictions}</strong><small>${s.crime.convictions ? "Adoption restricted" : "Clean"}</small></div><div><span>Income</span><strong>${money(s, s.finances.annualIncome)}</strong><small>Annual</small></div></div>
      ${pending ? `<div class="v19-pending-family"><span>🍼</span><div><h3>Process in progress</h3><p>${esc(pending.methodLabel)} succeeded at age ${pending.startedAge}. The family event is due when you reach age ${pending.dueAge}.</p></div></div>` : ""}
      <h3 class="v19-modal-heading">Current partner</h3>${partnerInfo}
      <h3 class="v19-modal-heading">Contraception for natural attempts</h3><div class="v19-contraception-grid">${contraceptionButtons}</div>
      <h3 class="v19-modal-heading">Family-building routes</h3><div class="v19-family-methods">${methodCards}</div>
      <div class="v19-family-history"><strong>History:</strong> ${s.familyPlanning.attempts} attempts · ${s.familyPlanning.successfulBirths} successful placements/births · ${s.familyPlanning.failedAttempts} unsuccessful</div>
    </div></section></div>`;
  };

  const previousDeveloper = V.developer;
  V.developer = function developerV19(app) {
    const s = app.game.state;
    const base = previousDeveloper(app);
    const card = `<article class="dev-card"><h3>Family & activity cheats</h3><p>Test the dynamic fertility and age-lock systems.</p><div class="card-actions"><button class="button small secondary" data-action="dev-toggle" data-key="alwaysFertilitySuccess">Fertility always succeeds: ${s.dev.alwaysFertilitySuccess ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="ignoreActivityAgeLocks">Ignore age locks: ${s.dev.ignoreActivityAgeLocks ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-max-fertility">Max fertility</button><button class="button small danger" data-action="dev-clear-family">Clear family-planning history</button></div></article>`;
    return base.replace('<div class="hint-box">', `${card}<div class="hint-box">`);
  };
})(window);
