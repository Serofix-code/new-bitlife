(function installNextChapterV24Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);
  const money = (state, value) => U.formatMoney(value, state.profile.currency);

  function pct(value) { return `${Math.round(U.clamp(Number(value) || 0, 0, 100))}%`; }

  const previousPath = V.path;
  V.path = function pathV24(app) {
    let html = previousPath(app);
    const s = app.game.state;
    app.data.catalogs.education.filter((program) => !["primary", "secondary"].includes(program.id)).forEach((program) => {
      const original = `${money(s, program.cost)}/year · ${program.duration} years`;
      const effective = app.game.educationAnnualCost(program);
      const label = `${effective ? money(s, effective) : "Free"}/year · ${program.duration} years`;
      html = html.split(original).join(label);
    });
    const policy = app.game.countryPolicy();
    const funding = `<div class="hint-box v24-policy-box"><strong>🎓 ${esc(policy.collegeLabel)}:</strong> Tuition shown below uses a simplified country funding model for ${esc(s.profile.country)}.</div>`;
    return html.replace('<div class="path-stack">', `${funding}<div class="path-stack">`);
  };

  V.enrollModal = function enrollModalV24(app, programId) {
    const program = app.data.catalogs.education.find((item) => item.id === programId);
    if (!program) return "";
    const s = app.game.state;
    const fields = (program.fields || []).map((field) => `<option value="${esc(field)}">${esc(field)}</option>`).join("");
    const effective = app.game.educationAnnualCost(program);
    const original = program.cost || 0;
    const policy = app.game.countryPolicy();
    const saved = Math.max(0, original - effective);
    return `<div class="modal-backdrop"><form id="enroll-form" class="dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>${esc(program.label)}</h2><p class="card-subtitle">${effective ? money(s, effective) : "Free"} per year for ${program.duration} years</p></div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button></div><div class="dialog-body"><p>${esc(program.description)}</p>${fields ? `<div class="field"><label for="study-field">Choose a field</label><select id="study-field" name="field">${fields}</select></div>` : ""}<input type="hidden" name="programId" value="${esc(program.id)}"><div class="hint-box"><strong>${esc(policy.collegeLabel)}</strong>${saved ? ` reduces the game tuition by ${money(s, saved)} per year.` : ". This program receives no extra tuition reduction in the current country."} Any amount your cash cannot cover becomes student debt.</div><div class="button-row" style="justify-content:flex-end;margin-top:1rem"><button class="button secondary" type="button" data-action="close-modal">Cancel</button><button class="button" type="submit">Enroll</button></div></div></form></div>`;
  };

  function wellnessModal(app) {
    const game = app.game;
    const s = game.state;
    const center = game.activityCenter("wellness");
    const metric = game.activityCenterMetric("wellness");
    const policy = game.countryPolicy();
    const options = center.options.map((option) => {
      const estimate = game.activityOptionEstimate("wellness", option.id);
      const cost = estimate.cost ? money(s, estimate.cost) : "Free";
      const funding = estimate.coverageLabel || game.healthcareFundingLabel(option.effect === "medical" ? "essential" : option.effect === "therapy" ? "therapy" : "wellness");
      return `<article class="v20-option-card ${estimate.allowed ? "" : "locked"}"><span class="v20-option-icon">${option.icon}</span><div class="v20-option-copy"><h3>${esc(option.label)}</h3><p>${esc(estimate.reason)}</p><div class="v20-chance-track"><i style="--chance:${estimate.chance}%"></i></div><small>Estimated result chance: <strong>${estimate.chance}%</strong> · ${esc(cost)} · ${esc(funding)}</small></div><button class="button small ${estimate.allowed ? "" : "secondary"}" data-action="dynamic-activity" data-center="wellness" data-option="${esc(option.id)}" ${estimate.allowed ? "" : "disabled"}>${estimate.allowed ? `${esc(cost)} · Choose` : esc(estimate.reason)}</button></article>`;
    }).join("");
    const history = s.activitySystems.history.filter((item) => item.center === "wellness").slice(0, 6).map((item) => `<li><span>${item.success ? "✓" : "○"}</span><div><strong>Age ${item.age}</strong><small>${item.success ? "Successful" : "Unsuccessful"}${item.cost ? ` · ${money(s, item.cost)}` : " · Free"}</small></div></li>`).join("");
    const familyFunding = game.hasLivingParentSponsor() ? "A living parent or guardian pays health-related costs while you are under 18." : s.age < 18 && s.flags.orphanage ? "No family sponsor is available in orphanage care, so the country's simplified coverage rules apply." : "Adult costs use the country's simplified coverage rules.";
    return `<div class="modal-backdrop"><section class="dialog v20-center-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>🧘 Health & Mind</h2><p class="card-subtitle">Healthcare prices now change with age, family care, orphanage status, and country policy.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><div class="v24-policy-card"><span>🏥</span><div><h3>${esc(policy.healthcareLabel)}</h3><p>${esc(familyFunding)}</p></div></div><div class="v20-center-summary"><div><span>Wellness readiness</span><strong>${metric}%</strong><small>Changes with your life</small></div><div><span>Age</span><strong>${s.age}</strong><small>${esc(game.activityStage())}</small></div><div><span>Health</span><strong>${Math.round(s.stats.health)}%</strong><small>Direct modifier</small></div><div><span>Family sponsor</span><strong>${game.hasLivingParentSponsor() ? "Yes" : "No"}</strong><small>${s.flags.orphanage ? "Orphanage care" : "Current household"}</small></div></div><section class="v20-center-subsection"><h3>Available options</h3><div class="v20-option-list">${options}</div></section><section class="v20-center-subsection"><h3>Recent history</h3>${history ? `<ul class="v20-history-list">${history}</ul>` : '<p class="v20-empty">No wellness attempts have been recorded yet.</p>'}</section></div></section></div>`;
  }

  const previousActivityModal = V.activityCenterModal;
  V.activityCenterModal = function activityCenterModalV24(app) {
    const centerId = app.modal && app.modal.center;
    if (centerId === "wellness") return wellnessModal(app);
    let html = previousActivityModal(app);
    if (centerId === "appearance") {
      const s = app.game.state;
      const count = s.healthcare.surgeryHistory.length;
      const surgery = `<section class="v24-cosmetic-entry"><div><span class="v24-entry-icon">🏥</span><div><h3>Plastic surgery & gender-affirming care</h3><p>Compare two fictional surgeons, reputation, price, procedure limits, and complication risk. Identity is valid with or without medical treatment.</p><small>${count} procedure${count === 1 ? "" : "s"} recorded · Looks ${Math.round(s.stats.looks)}%</small></div></div><button class="button" data-action="open-cosmetic">Open surgery clinic</button></section>`;
      html = html.replace('<section class="v20-center-subsection"><h3>Available options</h3>', `${surgery}<section class="v20-center-subsection"><h3>Available options</h3>`);
    }
    return html;
  };

  V.cosmeticModal = function cosmeticModal(app) {
    const game = app.game;
    const s = game.state;
    game.ensureExpansionState();
    const procedures = NC.COSMETIC_PROCEDURES.map((procedure) => {
      const doctors = game.surgeonOffers(procedure.id);
      const count = s.healthcare.procedureCounts[procedure.id] || 0;
      const doctorsHtml = doctors.map((doctor) => {
        const check = game.cosmeticEligibility(procedure.id, doctor.id);
        return `<button class="v24-surgeon-choice" data-action="cosmetic-procedure" data-procedure="${procedure.id}" data-surgeon="${doctor.id}" ${check.allowed ? "" : "disabled"}><span><strong>${esc(doctor.name)}</strong><small>Reputation ${doctor.reputation}% · ${money(s, check.cost == null ? doctor.cost : check.cost)}</small></span><b>${check.allowed ? `${check.chance}%` : esc(check.reason)}</b></button>`;
      }).join("");
      const limit = procedure.maxUses == null ? "No lifetime cap" : `${count}/${procedure.maxUses} used`;
      return `<article class="v24-procedure-card"><header><span>${procedure.icon}</span><div><h3>${esc(procedure.label)}</h3><p>${esc(limit)}${procedure.cooldown ? ` · reassessment window ${procedure.cooldown} years` : ""}</p></div></header><div class="v24-doctor-grid">${doctorsHtml}</div></article>`;
    }).join("");
    const history = s.healthcare.surgeryHistory.slice(0, 10).map((record) => `<li><span>${record.success ? "✓" : "!"}</span><div><strong>Age ${record.age}: ${esc(record.procedureLabel)}</strong><small>${esc(record.surgeonName)} · ${record.success ? "successful" : "complications"} · ${money(s, record.cost)}</small></div>${record.canSue && !record.lawsuitFiled ? `<button class="button small secondary" data-action="sue-surgeon" data-record="${record.id}">Sue</button>` : ""}</li>`).join("");
    return `<div class="modal-backdrop"><section class="dialog v23-expansion-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>🏥 Surgery Clinic</h2><p class="card-subtitle">An original game system for adult elective care. It is not medical advice.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><section class="v23-summary-grid"><div><span>Looks</span><strong>${pct(s.stats.looks)}</strong><small>Game statistic</small></div><div><span>Health</span><strong>${pct(s.stats.health)}</strong><small>Affects procedure odds</small></div><div><span>Satisfaction</span><strong>${pct(s.healthcare.appearanceSatisfaction)}</strong><small>Self-expression metric</small></div><div><span>Procedures</span><strong>${s.healthcare.surgeryHistory.length}</strong><small>Lifetime record</small></div></section><div class="hint-box"><strong>Adults only.</strong> Surgeon reputation changes success odds. A lower price does not guarantee failure, and a higher price does not guarantee success. Body procedures are unavailable during a pending pregnancy.</div><div class="v24-procedure-list">${procedures}</div><section><h3>Procedure history</h3>${history ? `<ul class="v20-history-list v24-surgery-history">${history}</ul>` : '<p class="v20-empty">No procedures have been recorded.</p>'}</section></div></section></div>`;
  };

  function vampireAvatar(avatar, label) {
    return `<div class="v24-vampire-avatar"><img src="${U.avatarSvg(avatar)}" alt="${esc(label)}"><strong>${esc(label)}</strong></div>`;
  }

  V.vampireModal = function vampireModal(app) {
    const game = app.game;
    const s = game.state;
    game.ensureExpansionState();
    if (!s.flags.vampire) return `<div class="modal-backdrop"><section class="dialog"><div class="dialog-header"><h2>🦇 Vampire Expansion</h2><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><div class="hint-box">This expansion becomes active for vampire characters.</div></div></section></div>`;
    const v = s.vampire;
    const curse = NC.v24Curse(v.curse);
    const goals = game.vampireGoalStatus().map((goal) => `<li class="${goal.complete ? "complete" : ""}"><span>${goal.complete ? "✓" : "○"}</span><strong>${esc(goal.label)}</strong></li>`).join("");
    const hunts = NC.VAMPIRE_HUNT_LOCATIONS.map((location) => `<article class="v24-hunt-card"><span>${location.icon}</span><div><h3>${esc(location.label)}</h3><p>Risk ${location.risk}% · essence reward around ${location.reward}%</p></div><div class="card-actions"><button class="button small" data-action="vampire-hunt" data-location="${location.id}" data-tactic="ambush">Ambush</button><button class="button small secondary" data-action="vampire-hunt" data-location="${location.id}" data-tactic="befriend">Befriend</button><button class="button small secondary" data-action="vampire-hunt" data-location="${location.id}" data-tactic="entice">Entice</button></div></article>`).join("");
    const targets = game.vampireEligibleTargets().map((person) => `<button class="v24-target-row" data-action="vampire-turn" data-person="${person.id}" ${person.occult === "vampire" ? "disabled" : ""}><span>${U.avatarSvg(person.avatar) ? `<img src="${U.avatarSvg(person.avatar)}" alt="">` : "🧑"}</span><div><strong>${esc(person.firstName)} ${esc(person.lastName)}</strong><small>${esc(U.cap(person.role))} · age ${person.age} · closeness ${Math.round(person.closeness)}%</small></div><b>${person.occult === "vampire" ? "Already vampire" : "Offer turning"}</b></button>`).join("");
    const familiars = v.familiars.map((f) => `<article class="v24-familiar"><div><strong>${esc(f.name)}</strong><small>${f.years} years · loyalty ${Math.round(f.loyalty)}%${f.wantsTurning ? " · asks to be turned" : ""}</small></div><div class="card-actions"><button class="button small secondary" data-action="vampire-familiar" data-familiar="${f.id}" data-kind="promise">Promise</button><button class="button small secondary" data-action="vampire-familiar" data-familiar="${f.id}" data-kind="wait">Wait</button><button class="button small danger" data-action="vampire-familiar" data-familiar="${f.id}" data-kind="threaten">Threaten</button></div></article>`).join("");
    const properties = NC.VAMPIRE_PROPERTIES.map((property) => {
      const owned = v.properties.find((item) => item.id === property.id);
      return `<article class="v24-property-card"><span>${property.icon}</span><div><h3>${esc(property.label)}</h3><p>${money(s, property.cost)} · secrecy +${property.secrecy} · rest +${property.essence} essence</p></div>${owned ? `<button class="button small secondary" data-action="vampire-rest" data-property="${property.id}">Rest</button>` : `<button class="button small" data-action="vampire-property" data-property="${property.id}" ${s.finances.cash < property.cost ? "disabled" : ""}>Buy</button>`}</article>`;
    }).join("");
    return `<div class="modal-backdrop"><section class="dialog v23-expansion-dialog v24-vampire-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>🦇 Vampire Expansion</h2><p class="card-subtitle">${esc(v.title)} ${esc(s.profile.lastName)} · ${esc(v.rank)} · Maker: ${esc(v.makerName)}</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><section class="v24-vampire-forms">${vampireAvatar(v.aristocratForm, "Aristocrat disguise")}${vampireAvatar(v.trueForm, "True vampire form")}<div class="card-actions"><button class="button small secondary" data-action="vampire-toggle-form">Display ${v.displayTrueForm ? "disguise" : "true form"}</button><button class="button small secondary" data-action="vampire-random-form">Randomize true form</button><button class="button small secondary" data-action="vampire-title" data-title="Lord">Use Lord</button><button class="button small secondary" data-action="vampire-title" data-title="Lady">Use Lady</button></div></section><section class="v23-summary-grid"><div><span>Essence</span><strong>${pct(v.essence)}</strong><small>Powers weaken when low</small></div><div><span>Secrecy</span><strong>${pct(v.secrecy)}</strong><small>Protection from discovery</small></div><div><span>Notoriety</span><strong>${pct(v.notoriety)}</strong><small>Vampire influence</small></div><div><span>True age</span><strong>${s.age}</strong><small>Visual aging is suspended</small></div></section><div class="v24-curse"><span>⚠️</span><div><h3>${esc(curse.label)}</h3><p>${esc(curse.text)}</p></div></div><section class="v24-vampire-goals"><div class="section-head compact"><div><h3>Maker's three trials</h3><p>Complete all three to break the blood curse and become a Vampire Lord.</p></div><span class="status-pill neutral">${v.completedGoals.length}/3</span></div><ul>${goals}</ul></section><section><h3>Vampiric power</h3><div class="card-actions"><button class="button small secondary" data-action="vampire-power" data-stat="health">Lock Health</button><button class="button small secondary" data-action="vampire-power" data-stat="happiness">Lock Happiness</button><button class="button small secondary" data-action="vampire-power" data-stat="knowledge">Lock Smarts</button><button class="button small secondary" data-action="vampire-power" data-stat="looks">Lock Looks</button><button class="button small secondary" data-action="vampire-hypnotize">Hypnotize suspicion</button></div><p class="card-subtitle">Current locked stat: ${v.lockedStat ? esc(U.cap(v.lockedStat)) : "None"}</p></section><section><h3>Night hunting</h3><p class="card-subtitle">Fictional, non-graphic encounters restore essence but may expose you to rivals or hunters.</p><div class="v24-hunt-list">${hunts}</div></section><section><h3>Immortal lineage</h3><div class="v24-target-list">${targets || '<p class="v20-empty">No eligible adult partner or child is available.</p>'}</div></section><section><div class="section-head compact"><div><h3>Familiars & thralls</h3><p>Human household aides age normally and may eventually ask to be turned.</p></div><button class="button small" data-action="vampire-recruit-familiar">Recruit familiar</button></div><div class="v24-familiar-list">${familiars || '<p class="v20-empty">No familiars yet.</p>'}</div></section><section><h3>Vampire real estate</h3><div class="v24-property-list">${properties}</div></section></div></section></div>`;
  };

  const previousExpansions = V.expansions;
  V.expansions = function expansionsV24(app) {
    let html = previousExpansions(app);
    const s = app.game.state;
    const vampireCard = `<button class="v23-expansion-card" data-action="open-expansion" data-expansion="vampire"><span class="v23-expansion-card-icon">🦇</span><span><strong>Vampire Expansion</strong><small>${s.flags.vampire ? `${esc(s.vampire.rank)} · essence ${Math.round(s.vampire.essence)}%` : "Activate with a vampire life"}</small></span><b>${s.flags.vampire ? "Manage" : "Locked"} ›</b></button>`;
    html = html.replace('</div></section><section class="v21-investment-summary">', `${vampireCard}</div></section><section class="v21-investment-summary">`);
    return html.replace(/<span>4 installed<\/span>/g, '<span>5 installed</span>').replace(/<span class="status-pill neutral">4 installed<\/span>/g, '<span class="status-pill neutral">5 installed</span>');
  };

  const previousGame = V.game;
  V.game = function gameV24(app) {
    let html = previousGame(app);
    const s = app.game.state;
    const looksRow = `<div class="v18-stat-row${s.stats.looks < 20 ? " low" : ""}"><span class="v18-stat-name">Looks <b>✨</b></span><div class="v18-stat-track"><i style="--stat:${U.clamp(s.stats.looks, 0, 100)}%"></i></div><strong>${Math.round(s.stats.looks)}%</strong></div>`;
    return html.replace('</section>\n      <nav class="v18-bottom-dock"', `${looksRow}</section>\n      <nav class="v18-bottom-dock"`);
  };

  const previousDeveloper = V.developer;
  V.developer = function developerV24(app) {
    const s = app.game.state;
    const base = previousDeveloper(app);
    const card = `<article class="dev-card"><h3>v2.4 healthcare, surgery & vampire cheats</h3><p>Test country funding, elective-care outcomes, vampire essence, powers, and progression.</p><div class="card-actions"><button class="button small secondary" data-action="dev-toggle" data-key="surgeryAlwaysSucceeds">Surgery always succeeds: ${s.dev.surgeryAlwaysSucceeds ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="surgeryNoCost">Free surgery: ${s.dev.surgeryNoCost ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="vampireUnlimitedEssence">Unlimited vampire essence: ${s.dev.vampireUnlimitedEssence ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="vampireAlwaysSucceeds">Vampire actions always succeed: ${s.dev.vampireAlwaysSucceeds ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="vampireGoalsComplete">Complete vampire goals: ${s.dev.vampireGoalsComplete ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-v24-max">Max v2.4 systems</button><button class="button small danger" data-action="dev-surgery-clear">Clear surgery history</button></div></article>`;
    return base.replace('<div class="hint-box">', `${card}<div class="hint-box">`);
  };
})(window);
