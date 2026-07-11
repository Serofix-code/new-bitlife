(function installExpandedViews(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);
  const money = (state, value) => U.formatMoney(value, state.profile.currency);
  const pct = (value) => U.clamp(value, 0, 100);

  function identityLabel(person) {
    return `${NC.genderLabel(person.identity)} · ${U.pronouns(person.identity).label}`;
  }

  function roleLabel(person) {
    if (person.role === "parent") return person.identity === "woman" ? "Mother" : person.identity === "man" ? "Father" : "Parent";
    if (person.role === "guardian") return "Orphanage guardian";
    if (person.role === "child") return person.identity === "woman" ? "Daughter" : person.identity === "man" ? "Son" : "Child";
    if (person.role === "stepchild") return person.identity === "woman" ? "Stepdaughter" : person.identity === "man" ? "Stepson" : "Stepchild";
    if (person.role === "former_stepchild") return "Former stepchild";
    if (person.role === "sibling") return person.identity === "woman" ? "Sister" : person.identity === "man" ? "Brother" : "Sibling";
    if (person.role === "grandparent") return person.identity === "woman" ? "Grandmother" : person.identity === "man" ? "Grandfather" : "Grandparent";
    if (person.role === "partner") return "Partner";
    if (person.role === "fiance") return person.identity === "woman" ? "Fiancée" : person.identity === "man" ? "Fiancé" : "Fiancé(e)";
    if (person.role === "spouse") return person.identity === "woman" ? "Wife" : person.identity === "man" ? "Husband" : "Spouse";
    if (person.role === "late_spouse") return `Late ${person.identity === "woman" ? "wife" : person.identity === "man" ? "husband" : "spouse"}`;
    if (person.role === "late_partner") return "Late partner";
    if (person.role === "ex") return "Ex";
    if (person.role === "friend") return "Friend";
    return U.cap(String(person.role || "relationship").replaceAll("_", " "));
  }

  function occultBadge(person) {
    const id = person.occult || "human";
    if (id === "wizard") return `<span class="mini-occult">🪄 ${esc(U.cap(NC.wizardNoun(person.identity)))}</span>`;
    if (id === "vampire") return `<span class="mini-occult">🦇 Vampire</span>`;
    return "";
  }

  V.creator = function expandedCreator(app) {
    const data = app.data.catalogs;
    const draft = app.creatorDraft;
    const countryCards = data.origins.map((origin) => `<label class="country-choice"><input type="radio" name="originId" value="${esc(origin.id)}" ${origin.id === draft.originId ? "checked" : ""}><span><img src="${esc(origin.flag)}" alt=""><strong>${esc(origin.country)}</strong><small>${esc((origin.cities || [origin.city]).slice(0, 3).join(" · "))}</small></span></label>`).join("");
    const upbringings = data.upbringings.map((item) => `<option value="${esc(item.id)}" ${item.id === draft.upbringingId ? "selected" : ""}>${esc(item.label)} — ${esc(item.description)}</option>`).join("");
    const talents = Object.values(NC.SPECIAL_TALENTS).map((talent) => `<option value="${esc(talent.id)}" ${talent.id === (draft.specialTalent || "none") ? "selected" : ""}>${talent.icon} ${esc(talent.label)} — ${esc(talent.description)}</option>`).join("");
    const occult = draft.occult || draft.supernatural || "human";
    return `<main class="creator-shell"><section class="welcome-copy"><img class="welcome-mark" src="assets/mark.svg" alt=""><span class="welcome-kicker">Your story, your choices</span><h1>Where will this life lead?</h1><p>Choose a real country, an identity, an occult nature, and the details that make this character yours.</p><div class="feature-cloud"><span>Real countries</span><span>Inherited occult</span><span>Magic & time travel</span><span>Family portraits</span><span>Ribbons</span></div></section><form id="creator-form" class="creator-card"><div class="section-head"><div><h2>Create a character</h2><p>Family names and portraits are generated from these choices.</p></div><button class="icon-button" type="button" data-action="randomize-character" title="Randomize" aria-label="Randomize character">↻</button></div><div class="form-grid">
      <div class="field"><label for="first-name">First name</label><input id="first-name" name="firstName" maxlength="32" required value="${esc(draft.firstName)}" autocomplete="off"></div>
      <div class="field"><label for="last-name">Last name</label><input id="last-name" name="lastName" maxlength="32" required value="${esc(draft.lastName)}" autocomplete="off"></div>
      <div class="field full"><span class="field-label">Identity</span><div class="segmented"><label><input type="radio" name="identity" value="woman" ${draft.identity === "woman" ? "checked" : ""}><span>Woman · she/her</span></label><label><input type="radio" name="identity" value="man" ${draft.identity === "man" ? "checked" : ""}><span>Man · he/him</span></label><label><input type="radio" name="identity" value="nonbinary" ${draft.identity === "nonbinary" ? "checked" : ""}><span>Nonbinary · they/them</span></label></div></div>
      <div class="field full"><span class="field-label">Country of birth</span><div class="country-grid">${countryCards}</div></div>
      <div class="field full"><label for="upbringing">Early home</label><select id="upbringing" name="upbringingId">${upbringings}</select></div>
      <div class="field full"><span class="field-label">Occult nature</span><div class="segmented occult-segmented"><label><input type="radio" name="occult" value="human" ${occult === "human" ? "checked" : ""}><span>Human 🌱</span></label><label><input type="radio" name="occult" value="vampire" ${occult === "vampire" ? "checked" : ""}><span>Vampire 🦇</span></label><label><input type="radio" name="occult" value="wizard" ${occult === "wizard" ? "checked" : ""}><span>Wizard / Witch 🪄</span></label></div><small class="field-help">Wizard and vampire traits may be inherited by children. Humans can later attempt to awaken magic.</small></div>
      <div class="field full"><label for="special-talent">Special talent</label><select id="special-talent" name="specialTalent">${talents}</select></div>
      <div class="field"><label for="skin">Skin tone</label><input id="skin" name="skin" type="color" value="${esc(draft.skin || "#d8a47f")}"></div>
      <div class="field"><label for="hair">Hair colour</label><input id="hair" name="hair" type="color" value="${esc(draft.hair || "#4a3028")}"></div>
      <div class="field"><label for="eye">Eye colour</label><input id="eye" name="eye" type="color" value="${esc(draft.eye || "#49392f")}"></div>
      <div class="field"><label for="accent">Avatar background</label><input id="accent" name="accent" type="color" value="${esc(draft.accent || "#6a5acd")}"></div>
      <div class="field"><label for="hair-style">Hair style</label><select id="hair-style" name="hairStyle"><option value="short" ${draft.hairStyle === "short" ? "selected" : ""}>Short</option><option value="long" ${draft.hairStyle === "long" ? "selected" : ""}>Long</option><option value="curly" ${draft.hairStyle === "curly" ? "selected" : ""}>Curly</option></select></div>
      <div class="field"><label for="accessory">Accessory</label><select id="accessory" name="accessory"><option value="none">None</option><option value="glasses">Glasses</option><option value="earrings">Earrings</option><option value="hat">Hat</option><option value="bow">Hair bow</option><option value="crown">Crown</option></select></div>
      <div class="field full"><label for="seed">Story seed <span class="muted-inline">(optional)</span></label><input id="seed" name="seed" maxlength="48" placeholder="Leave blank for a fresh surprise" value="${esc(draft.seed || "")}" autocomplete="off"></div>
    </div><div class="creator-footer"><small>Names are drawn from the selected country and close family members inherit the selected skin tone.</small><div class="button-row"><button class="button ghost" type="button" data-action="back-to-landing">Back</button><button class="button" type="submit">Begin this life →</button></div></div></form></main>`;
  };

  function menuRow(icon, title, subtitle, action, options) {
    const opts = options || {};
    const attrs = Object.entries(opts.data || {}).map(([key, value]) => ` data-${key}="${esc(value)}"`).join("");
    return `<button class="activity-menu-row" data-action="${esc(action)}"${attrs} ${opts.disabled ? "disabled" : ""}><span class="activity-menu-icon">${icon}</span><span class="activity-menu-copy"><strong>${esc(title)}</strong><small>${esc(opts.reason || subtitle)}</small></span><span class="activity-menu-arrow">${opts.ellipsis ? "•••" : "›"}</span></button>`;
  }

  V.activities = function expandedActivities(app) {
    const state = app.game.state;
    const noActions = state.activityPoints < 1;
    const hasPartner = state.relationships.some((p) => p.alive !== false && ["partner", "fiance", "spouse"].includes(p.role));
    const special = [
      menuRow("👒", "Accessories", "Customize your portrait accessories", "activity", { data: { activity: "accessories" }, disabled: noActions, reason: noActions ? "Age up for more actions" : "Customize your portrait" }),
      menuRow("🧸", "Adoption", "Apply to adopt a child", "adopt-child", { disabled: state.age < 18 || noActions, reason: state.age < 18 ? "Available at age 18" : noActions ? "Age up for more actions" : "Apply to adopt a child", ellipsis: true }),
      menuRow("♠️", "Casino", "Visit a casino resort", "casino-visit", { disabled: state.age < 18 || noActions, reason: state.age < 18 ? "Available at age 18" : noActions ? "Age up for more actions" : "No-stakes social visit; no wagering", ellipsis: true }),
      menuRow("👹", "Crime", "Commit a crime", "open-section", { data: { tab: "crime" } }),
      menuRow("🩺", "Doctor", "Visit a doctor", "doctor-visit", { disabled: noActions, reason: noActions ? "Age up for more actions" : "Book a health appointment" }),
      menuRow("🌍", "Emigrate", "Move to another country", "open-emigrate", { disabled: state.age < 18 || noActions, reason: state.age < 18 ? "Available at age 18" : noActions ? "Age up for more actions" : "Choose another country", ellipsis: true }),
      menuRow("⭐", "Fame", "Manage your fame", "fame-activity", { disabled: state.age < 13 || noActions, reason: state.age < 13 ? "Available at age 13" : noActions ? "Age up for more actions" : `Current fame: ${state.fame}%` }),
      menuRow("🧬", "Fertility", "Visit a fertility clinic", "fertility", { disabled: state.age < 18 || noActions, reason: state.age < 18 ? "Available at age 18" : noActions ? "Age up for more actions" : hasPartner ? "Try for a child with clinic support" : "Use assisted fertility treatment" }),
      menuRow(state.flags.wizard ? "🪄" : "📜", state.flags.wizard ? "Magic & Spells" : "Awaken Magic", state.flags.wizard ? "Cast spells or train your power" : "Choose how to become a wizard, witch, or mage", "open-magic", { disabled: (!state.flags.wizard && state.age < 12) || noActions, reason: !state.flags.wizard && state.age < 12 ? "Magical awakening begins at age 12" : noActions ? "Age up for more actions" : state.flags.wizard ? `Mana ${state.magic ? state.magic.mana : 0} · Power ${state.magic ? state.magic.power : 0}` : "Choose an awakening path" }),
      menuRow("⏳", "Time Travel", "Return to a previously recorded age", "open-time-travel", { disabled: app.game.availableTimeTravelAges().length < 2, reason: app.game.availableTimeTravelAges().length < 2 ? "Age up to record more points in time" : `${app.game.availableTimeTravelAges().length} recorded ages` })
    ].join("");

    const reserved = new Set(["accessories", "doctor_visit", "fame_publicity", "occult_research"]);
    const generic = app.data.catalogs.activities.filter((activity) => !reserved.has(activity.id)).map((activity) => {
      const ageOkay = state.age >= activity.minAge && (!Number.isFinite(activity.maxAge) || state.age <= activity.maxAge);
      const modeOkay = (!activity.vampireOnly || state.flags.vampire) && (!activity.wizardOnly || state.flags.wizard);
      const cashOkay = state.finances.cash >= activity.cost;
      const disabled = !ageOkay || !modeOkay || !cashOkay || noActions || state.pendingEvent;
      let reason = activity.description;
      if (!ageOkay) reason = state.age < activity.minAge ? `Available at age ${activity.minAge}` : `Available for ages ${activity.minAge}–${activity.maxAge}`;
      else if (activity.vampireOnly && !state.flags.vampire) reason = "Vampire only";
      else if (activity.wizardOnly && !state.flags.wizard) reason = "Wizard / witch only";
      else if (!cashOkay) reason = `Needs ${money(state, activity.cost)}`;
      else if (noActions) reason = "Age up for more actions";
      return menuRow(activity.icon, activity.label, activity.description, "activity", { data: { activity: activity.id }, disabled, reason });
    }).join("");

    const status = state.flags.orphanage ? `<div class="hint-box"><strong>Current home:</strong> Orphanage care. Your guardian appears in Relationships.</div>` : state.flags.inParentalCare && state.age === 0 ? `<div class="hint-box"><strong>Current care:</strong> Your living parent${state.relationships.filter((p) => p.role === "parent" && p.alive !== false).length === 1 ? "" : "s"} are caring for you after the age spell.</div>` : "";
    return `<div class="panel activity-page"><div class="section-head"><div><h2>Activities</h2><p>Options unlock by age and change with your current life.</p></div><span class="status-pill">${state.activityPoints} action${state.activityPoints === 1 ? "" : "s"} left</span></div>${status}<div class="activity-menu">${special}</div><div class="activity-subheading">More activities</div><div class="activity-menu secondary-menu">${generic}</div></div>`;
  };

  V.people = function expandedPeople(app) {
    const state = app.game.state;
    if (app.game.isIncarcerated()) return `<div class="panel"><div class="empty-state"><div class="empty-icon">🔒</div><h3>Relationships are limited in custody</h3><p>Use the Jail tab to call people outside.</p></div></div>`;
    const groups = [
      ["Children", ["child", "stepchild"]], ["Spouse & partner", ["spouse", "fiance", "partner"]],
      ["Parents & guardians", ["parent", "grandparent", "guardian"]], ["Siblings", ["sibling"]],
      ["Friends", ["friend"]], ["Exes", ["ex", "former_stepchild"]], ["Late relationships", ["late_spouse", "late_partner"]]
    ];
    const actions = (person) => {
      if (person.alive === false) {
        if (!person.funeralPending) return "";
        return `<div class="relationship-special"><span>Funeral:</span><button class="button small secondary" data-action="funeral" data-person="${esc(person.id)}" data-method="burial">Burial</button><button class="button small secondary" data-action="funeral" data-person="${esc(person.id)}" data-method="cremation">Cremation</button><button class="button small ghost" data-action="funeral" data-person="${esc(person.id)}" data-method="science">Donate to science</button></div>`;
      }
      let special = "";
      if (person.role === "partner" && state.age >= 18 && person.age >= 18) special = `<div class="relationship-special"><span>Propose:</span><button class="button small secondary" data-action="propose" data-person="${esc(person.id)}" data-ring="none">No ring</button><button class="button small secondary" data-action="propose" data-person="${esc(person.id)}" data-ring="simple">Simple ring</button><button class="button small secondary" data-action="propose" data-person="${esc(person.id)}" data-ring="luxury">Luxury ring</button></div>`;
      else if (person.role === "fiance") special = `<div class="relationship-special"><span>Wedding:</span><button class="button small secondary" data-action="marry" data-person="${esc(person.id)}" data-plan="simple" data-surname="keep">Small wedding</button><button class="button small secondary" data-action="marry" data-person="${esc(person.id)}" data-plan="classic" data-surname="spouse-takes" data-prenup="true">Classic + prenup</button><button class="button small secondary" data-action="marry" data-person="${esc(person.id)}" data-plan="lavish" data-surname="hyphenate">Lavish + hyphenate</button></div>`;
      else if (person.role === "spouse") special = `<div class="relationship-special"><button class="button small secondary" data-action="renew-vows" data-person="${esc(person.id)}">Renew vows</button><button class="button small danger" data-action="divorce" data-person="${esc(person.id)}">Divorce</button></div>`;
      else if (person.role === "ex") special = `<div class="relationship-special"><button class="button small secondary" data-action="reconcile" data-person="${esc(person.id)}">Try to reconcile</button></div>`;
      const murder = state.age >= 18 ? `<button class="button small danger" data-action="crime" data-crime="murder" data-target="${esc(person.id)}">Murder</button>` : "";
      return `<div class="relationship-actions"><button class="button small secondary" data-action="relationship" data-person="${esc(person.id)}" data-kind="time">Spend time</button><button class="button small secondary" data-action="relationship" data-person="${esc(person.id)}" data-kind="talk">Conversation</button><button class="button small secondary" data-action="relationship" data-person="${esc(person.id)}" data-kind="compliment">Compliment</button><button class="button small secondary" data-action="relationship" data-person="${esc(person.id)}" data-kind="gift">Gift ${money(state, 50)}</button><button class="button small ghost" data-action="relationship" data-person="${esc(person.id)}" data-kind="insult">Insult</button>${murder}</div>${special}`;
    };
    const row = (person) => `<details class="relationship-row expanded-relationship"><summary><div class="person-badge image-person"><img src="${U.avatarSvg(person.avatar)}" alt="Portrait of ${esc(person.firstName)}"></div><div class="relationship-main"><div class="relationship-title"><h3>${esc(person.firstName)} ${esc(person.lastName)} <span>(${esc(roleLabel(person))})</span></h3><small>${person.alive === false ? `Died at ${person.deathAge || person.age}` : `Age ${person.age}`} · ${esc(identityLabel(person))} ${occultBadge(person)}</small></div><div class="relationship-meter-label">Relationship</div><div class="meter"><span style="--value:${pct(person.closeness)}%;--meter-color:#299442"></span></div></div><span class="relationship-chevron">›</span></summary><div class="relationship-detail">${actions(person)}</div></details>`;
    const sections = groups.map(([title, roles]) => {
      const people = state.relationships.filter((p) => roles.includes(p.role)).sort((a, b) => Number(b.alive) - Number(a.alive) || b.closeness - a.closeness);
      return people.length ? `<section class="relationship-section"><h3 class="relationship-section-title">${esc(title)}</h3>${people.map(row).join("")}</section>` : "";
    }).join("");
    return `<div class="panel relationship-panel"><div class="section-head"><div><h2>Relationships</h2><p>Every person has a portrait, age, gender, pronouns, role, and relationship level.</p></div><button class="button small secondary" data-action="find-date" ${state.age < 16 ? "disabled" : ""}>Find a date</button></div>${sections || `<div class="empty-state"><div class="empty-icon">💛</div><h3>No relationships yet</h3></div>`}</div>`;
  };

  const originalChallenges = V.challenges;
  V.challenges = function challengesWithRibbons(app) {
    const base = originalChallenges(app);
    const earned = app.game.state.legacy.ribbons || [];
    const cards = Object.values(NC.RIBBONS).map((ribbon) => {
      const record = earned.find((item) => item.id === ribbon.id);
      return `<article class="ribbon-card ${record ? "earned" : "locked"}"><span class="ribbon-icon">${record ? ribbon.icon : "◻"}</span><div><h3>${record ? esc(ribbon.label) : "Undiscovered"}</h3><p>${record ? esc(ribbon.description) : "Complete a life that matches this hidden path."}</p>${record ? `<small>Earned by ${esc(record.character)} · generation ${record.generation}</small>` : ""}</div></article>`;
    }).join("");
    return base.replace(/<\/div>\s*$/, `<section class="catalog-section ribbon-section"><div class="section-head compact"><div><h2>Ribbon collection</h2><p>Ribbons are awarded at death and saved permanently to this family line.</p></div><span class="status-pill neutral">${earned.length} / ${Object.keys(NC.RIBBONS).length}</span></div><div class="ribbon-grid">${cards}</div></section></div>`);
  };

  const originalDeath = V.deathModal;
  V.deathModal = function deathWithRibbon(app) {
    const html = originalDeath(app);
    const id = app.game.state.death && app.game.state.death.ribbon;
    const ribbon = NC.RIBBONS[id];
    if (!ribbon) return html;
    return html.replace('<div class="summary-grid">', `<div class="death-ribbon"><span>${ribbon.icon}</span><div><small>Ribbon earned</small><strong>${esc(ribbon.label)}</strong><p>${esc(ribbon.description)}</p></div></div><div class="summary-grid">`);
  };

  V.timeTravelModal = function timeTravelModal(app) {
    const state = app.game.state;
    const ages = app.game.availableTimeTravelAges().filter((age) => age !== state.age);
    return `<div class="modal-backdrop"><section class="dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>Time Travel</h2><p class="card-subtitle">Return to the exact recorded state of a previous age.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><div class="hint-box">This restores relationships, money, career, country, stats, crimes, events, and family details from that age. Recorded ages remain available so you can revisit them again.</div><div class="age-travel-grid">${ages.map((age) => `<button class="age-travel-button" data-action="time-travel" data-age="${age}"><strong>Age ${age}</strong><span>${state.timeTravel.snapshots[String(age)] ? esc(state.timeTravel.snapshots[String(age)].profile.city) : "Recorded chapter"}</span></button>`).join("") || '<p class="card-subtitle">No other ages have been recorded yet.</p>'}</div></div></section></div>`;
  };

  V.emigrateModal = function emigrateModal(app) {
    const state = app.game.state;
    const rows = app.data.catalogs.origins.map((origin) => `<button class="country-move-row" data-action="emigrate" data-country="${esc(origin.id)}" ${origin.id === state.profile.originId ? "disabled" : ""}><img src="${esc(origin.flag)}" alt=""><span><strong>${esc(origin.country)}</strong><small>${esc((origin.cities || [origin.city]).join(" · "))}</small></span><span>›</span></button>`).join("");
    return `<div class="modal-backdrop"><section class="dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>Emigrate</h2><p class="card-subtitle">Choose a new country. Moving costs ${money(state, 2800)}.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><div class="country-move-list">${rows}</div></div></section></div>`;
  };

  V.magicModal = function magicModal(app) {
    const state = app.game.state;
    if (!state.flags.wizard) {
      const paths = [
        ["grimoire", "📖", "Study an ancient grimoire", "70% base chance · costs " + money(state, 350)],
        ["mentor", "🧙", "Find a magical mentor", "82% base chance · costs " + money(state, 1800)],
        ["awakening", "⚡", "Risk a spontaneous awakening", "58% base chance · free"],
        ["family", "🌙", "Ask for a family ritual", "92% base chance · requires a living magical relative"]
      ];
      return `<div class="modal-backdrop"><section class="dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>Awaken Magic</h2><p class="card-subtitle">Choose how this character attempts to become a wizard, witch, or mage.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><div class="magic-path-list">${paths.map(([id, icon, title, note]) => { const check = app.game.wizardTurningCheck(id); return `<button class="magic-path" data-action="wizard-turn" data-method="${id}" ${!check.allowed ? "disabled" : ""}><span>${icon}</span><div><strong>${esc(title)}</strong><small>${esc(check.allowed ? note : check.reason)}</small></div><span>›</span></button>`; }).join("")}</div></div></section></div>`;
    }
    const living = state.relationships.filter((p) => p.alive !== false);
    const targetOptions = [`<option value="self">${esc(state.profile.firstName)} (self, age ${state.age})</option>`].concat(living.map((p) => `<option value="${esc(p.id)}">${esc(p.firstName)} ${esc(p.lastName)} · ${esc(roleLabel(p))} · age ${p.age}</option>`)).join("");
    return `<div class="modal-backdrop"><section class="dialog magic-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>Magic & Spells</h2><p class="card-subtitle">Mana ${state.magic.mana}/100 · Power ${state.magic.power}/100 · ${state.magic.spellsCast} spells cast</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><div class="field"><label for="magic-target">Target</label><select id="magic-target">${targetOptions}</select></div><div class="field"><label for="magic-age">Target age for age spells</label><input id="magic-age" type="number" min="0" max="140" value="${Math.max(0, state.age - 1)}"></div><div class="spell-grid">
      <button class="spell-card" data-action="cast-spell" data-spell="age_down"><span>⏪</span><strong>Age Down</strong><small>24 mana · set the target to a younger age</small></button>
      <button class="spell-card" data-action="cast-spell" data-spell="age_up"><span>⏩</span><strong>Age Up</strong><small>24 mana · set the target to an older age</small></button>
      <button class="spell-card" data-action="cast-spell" data-spell="grant_magic"><span>✨</span><strong>Give Magic</strong><small>38 mana · awaken magic in someone else</small></button>
      <button class="spell-card" data-action="cast-spell" data-spell="restoration"><span>💚</span><strong>Restoration</strong><small>14 mana · improve health</small></button>
      <button class="spell-card" data-action="cast-spell" data-spell="fortune"><span>🍀</span><strong>Fortune</strong><small>20 mana · invite improbable good luck</small></button>
      <button class="spell-card" data-action="cast-spell" data-spell="charm"><span>💞</span><strong>Relationship Charm</strong><small>12 mana · soften tension with someone</small></button>
      <button class="spell-card dangerous-spell" data-action="cast-spell" data-spell="inferno"><span>🔥</span><strong>Inferno</strong><small>45 mana · an abstract attempted killing with police consequences</small></button>
    </div></div></section></div>`;
  };
  const originalGameView = V.game;
  V.game = function gameWithCountryAndOccult(app) {
    let html = originalGameView(app);
    const state = app.game.state;
    const occult = state.profile.occult === "wizard" ? `🪄 ${U.cap(NC.wizardNoun(state.profile.identity))}` : state.profile.occult === "vampire" ? "🦇 Vampire" : "🌱 Human";
    const home = state.flags.orphanage ? "Orphanage care" : state.flags.inParentalCare && state.age === 0 ? "Parental infant care" : `${state.profile.city}, ${state.profile.country}`;
    const strip = `<div class="profile-world-strip"><img src="${esc(state.profile.flag || app.game.origin(state.profile.originId).flag)}" alt="${esc(state.profile.country)} flag"><span><strong>${esc(home)}</strong><small>${esc(occult)}</small></span></div>`;
    html = html.replace('<div class="trait-row">', `${strip}<div class="trait-row">`);
    return html;
  };

})(window);
