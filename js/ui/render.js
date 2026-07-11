(function installViews(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View = {};

  const TAB_META = [
    ["life", "📖", "Life"],
    ["people", "💛", "People"],
    ["path", "🧭", "Path"],
    ["assets", "🏠", "Assets"],
    ["activities", "✨", "Activities"],
    ["crime", "🚓", "Crime"],
    ["jail", "🔒", "Jail"],
    ["challenges", "🏆", "Challenges"],
    ["developer", "🧪", "Developer"]
  ];

  function esc(value) { return U.escape(value); }
  function money(state, value) { return U.formatMoney(value, state.profile.currency); }
  function safePercent(value) { return U.clamp(value, 0, 100); }

  function roleLabel(person, state) {
    const role = person.role;
    const identity = U.pronouns(person.identity);
    if (role === "parent") return person.identity === "woman" ? "Mother" : person.identity === "man" ? "Father" : "Parent";
    if (role === "child") return person.identity === "woman" ? "Daughter" : person.identity === "man" ? "Son" : "Child";
    if (role === "stepchild") return person.identity === "woman" ? "Stepdaughter" : person.identity === "man" ? "Stepson" : "Stepchild";
    if (role === "former_stepchild") return "Former stepchild";
    if (role === "sibling") return person.identity === "woman" ? "Sister" : person.identity === "man" ? "Brother" : "Sibling";
    if (role === "grandparent") return person.identity === "woman" ? "Grandmother" : person.identity === "man" ? "Grandfather" : "Grandparent";
    if (role === "partner") return "Partner";
    if (role === "fiance") return person.identity === "woman" ? "Fiancée" : person.identity === "man" ? "Fiancé" : "Fiancé(e)";
    if (role === "spouse") return person.identity === "woman" ? "Wife" : person.identity === "man" ? "Husband" : "Spouse";
    if (role === "late_spouse") return `Late ${person.identity === "woman" ? "wife" : person.identity === "man" ? "husband" : "spouse"}`;
    if (role === "late_partner") return "Late partner";
    if (role === "ex") return "Ex-spouse";
    if (role === "friend") return "Friend";
    return U.cap(role.replaceAll("_", " "));
  }

  function roleColor(role) {
    const colors = { parent: "#6a5acd", sibling: "#ef8354", friend: "#2f9c95", partner: "#d35b73", fiance: "#d35b73", spouse: "#c8476d", ex: "#8c8796", child: "#d8a12b", stepchild: "#d8a12b", former_stepchild: "#8c8796", grandparent: "#7569b7", late_spouse: "#6f6878", late_partner: "#6f6878" };
    return colors[role] || "#2f9c95";
  }

  function emptyState(icon, title, text) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
  }

  V.landing = function landing(app) {
    const summary = app.store.summary("autosave");
    const continueCard = summary && !summary.corrupt ? `
      <div class="continue-card">
        <div class="person-badge" style="--person-color:#6a5acd">${esc(U.initials(summary.firstName, summary.lastName))}</div>
        <div>
          <h3>${esc(summary.firstName)} ${esc(summary.lastName)}</h3>
          <p>Age ${summary.age} · Generation ${summary.generation} · ${esc(summary.occupation)}</p>
        </div>
        <button class="button" data-action="continue-life">Continue</button>
      </div>` : "";
    const storageNote = app.store.available ? "Your active life autosaves in this browser." : "Browser storage is unavailable here. Use JSON export to keep your life portable.";
    return `
      <main class="landing-shell">
        <section class="landing-card">
          <img src="assets/mark.svg" alt="">
          <span class="welcome-kicker">An offline life simulator</span>
          <h1 class="display-type">Next Chapter</h1>
          <p>Build a life one year and one choice at a time. Every event, name, and visual in this project is original.</p>
          ${continueCard}
          <div class="button-row" style="justify-content:center">
            <button class="button" data-action="new-life">${summary ? "Start another life" : "Create a character"}</button>
            <button class="button secondary" data-action="import">Import JSON save</button>
          </div>
          <div class="hint-box">${esc(storageNote)} Open <strong>index.html</strong> directly—no account, server, or installation required.</div>
        </section>
      </main>`;
  };

  V.creator = function creator(app) {
    const data = app.data.catalogs;
    const draft = app.creatorDraft;
    const origins = data.origins.map((origin) => `<option value="${esc(origin.id)}" ${origin.id === draft.originId ? "selected" : ""}>${esc(origin.label)}</option>`).join("");
    const upbringings = data.upbringings.map((item) => `<option value="${esc(item.id)}" ${item.id === draft.upbringingId ? "selected" : ""}>${esc(item.label)} — ${esc(item.description)}</option>`).join("");
    const talents = Object.values(NC.SPECIAL_TALENTS).map((talent) => `<option value="${esc(talent.id)}" ${talent.id === (draft.specialTalent || "none") ? "selected" : ""}>${talent.icon} ${esc(talent.label)} — ${esc(talent.description)}</option>`).join("");
    return `
      <main class="creator-shell">
        <section class="welcome-copy">
          <img class="welcome-mark" src="assets/mark.svg" alt="">
          <span class="welcome-kicker">Your story, your choices</span>
          <h1>Where will this life lead?</h1>
          <p>Begin with a person, a place, and a small set of strengths. The rest is written year by year.</p>
          <div class="feature-cloud" aria-label="Game features">
            <span>Family & friends</span><span>School & careers</span><span>Homes & money</span><span>Health & joy</span><span>Generations</span>
          </div>
        </section>
        <form id="creator-form" class="creator-card">
          <div class="section-head">
            <div><h2>Create a character</h2><p>All fields can be changed before the story begins.</p></div>
            <button class="icon-button" type="button" data-action="randomize-character" title="Randomize" aria-label="Randomize character">↻</button>
          </div>
          <div class="form-grid">
            <div class="field"><label for="first-name">First name</label><input id="first-name" name="firstName" maxlength="32" required value="${esc(draft.firstName)}" autocomplete="off"></div>
            <div class="field"><label for="last-name">Last name</label><input id="last-name" name="lastName" maxlength="32" required value="${esc(draft.lastName)}" autocomplete="off"></div>
            <div class="field full">
              <span class="field-label">Identity</span>
              <div class="segmented">
                <label><input type="radio" name="identity" value="woman" ${draft.identity === "woman" ? "checked" : ""}><span>Woman · she/her</span></label>
                <label><input type="radio" name="identity" value="man" ${draft.identity === "man" ? "checked" : ""}><span>Man · he/him</span></label>
                <label><input type="radio" name="identity" value="nonbinary" ${draft.identity === "nonbinary" ? "checked" : ""}><span>Nonbinary · they/them</span></label>
              </div>
            </div>
            <div class="field"><label for="origin">Place of birth</label><select id="origin" name="originId">${origins}</select></div>
            <div class="field"><label for="upbringing">Early home</label><select id="upbringing" name="upbringingId">${upbringings}</select></div>
            <div class="field full"><span class="field-label">Life type</span><div class="segmented"><label><input type="radio" name="supernatural" value="human" ${draft.supernatural !== "vampire" ? "checked" : ""}><span>Human 🌱</span></label><label><input type="radio" name="supernatural" value="vampire" ${draft.supernatural === "vampire" ? "checked" : ""}><span>Vampire 🦇</span></label></div></div>
            <div class="field full"><label for="special-talent">Special talent</label><select id="special-talent" name="specialTalent">${talents}</select><small class="field-help">Talents improve matching careers and actions, but do not guarantee every outcome.</small></div>
            <div class="field"><label for="skin">Skin tone</label><input id="skin" name="skin" type="color" value="#d8a47f"></div>
            <div class="field"><label for="hair">Hair colour</label><input id="hair" name="hair" type="color" value="${esc(draft.hair || "#4a3028")}"></div>
            <div class="field"><label for="eye">Eye colour</label><input id="eye" name="eye" type="color" value="${esc(draft.eye || "#49392f")}"></div>
            <div class="field"><label for="accent">Avatar background</label><input id="accent" name="accent" type="color" value="${esc(draft.accent || "#6a5acd")}"></div>
            <div class="field"><label for="hair-style">Hair style</label><select id="hair-style" name="hairStyle"><option value="short">Short</option><option value="long">Long</option><option value="curly">Curly</option></select></div>
            <div class="field"><label for="accessory">Accessory</label><select id="accessory" name="accessory"><option value="none">None</option><option value="glasses">Glasses</option><option value="earrings">Earrings</option><option value="hat">Hat</option><option value="bow">Hair bow</option><option value="crown">Crown</option></select></div>
            <div class="field full"><label for="seed">Story seed <span style="font-weight:500;color:var(--muted)">(optional, for reproducible testing)</span></label><input id="seed" name="seed" maxlength="48" placeholder="Leave blank for a fresh surprise" value="${esc(draft.seed || "")}" autocomplete="off"></div>
          </div>
          <div class="creator-footer">
            <small>Stats and family details are generated from your choices and story seed.</small>
            <div class="button-row">
              <button class="button ghost" type="button" data-action="back-to-landing">Back</button>
              <button class="button" type="submit">Begin this life <span aria-hidden="true">→</span></button>
            </div>
          </div>
        </form>
      </main>`;
  };

  function statRows(state) {
    return NC.STATS.map((stat) => {
      const meta = NC.STAT_META[stat];
      const value = safePercent(state.stats[stat]);
      return `<div class="stat-row"><span title="${esc(meta.label)}">${meta.icon}</span><div class="meter" aria-label="${esc(meta.label)} ${value} out of 100"><span style="--value:${value}%;--meter-color:${meta.color}"></span></div><strong>${value}</strong></div>`;
    }).join("");
  }

  function ageButton(state, mobile) {
    const sentence = state.crime && state.crime.incarceration;
    const subtitle = sentence && sentence.yearsRemaining > 0
      ? `${sentence.yearsRemaining} year${sentence.yearsRemaining === 1 ? "" : "s"} left · ${state.activityPoints} jail action${state.activityPoints === 1 ? "" : "s"}`
      : `${state.activityPoints} action${state.activityPoints === 1 ? "" : "s"} left this year`;
    return `<button class="age-up-button ${mobile ? "mobile-age-up" : ""}" data-action="age-up" ${!state.alive || state.pendingEvent || (state.crime && state.crime.pendingCourt) ? "disabled" : ""}>
      <span><strong>${state.alive ? "Age up" : "Life complete"}</strong><small>${state.alive ? subtitle : "Choose what comes next"}</small></span>
      <span class="age-arrow" aria-hidden="true">→</span>
    </button>`;
  }

  function profileRail(game) {
    const state = game.state;
    return `<aside class="profile-rail">
      <section class="profile-card">
        <div class="profile-banner"></div>
        <div class="profile-body">
          <div class="avatar image-avatar"><img src="${U.avatarSvg(state.profile.avatar)}" alt="Custom avatar for ${esc(state.profile.firstName)}"></div>
          <h2 class="profile-name">${esc(state.profile.firstName)} ${esc(state.profile.lastName)}</h2>
          <p class="profile-meta">Age ${state.age} · ${esc(state.profile.pronouns)} · ${esc(game.occupationLabel())}</p>${game.isIncarcerated() ? `<div class="custody-badge">🔒 In custody · ${state.crime.incarceration.yearsRemaining} years remaining</div>` : ""}
          <div class="trait-row"><span class="trait-chip">${NC.SPECIAL_TALENTS[state.profile.specialTalent || "none"].icon} ${esc(NC.SPECIAL_TALENTS[state.profile.specialTalent || "none"].label)}</span>${state.profile.traits.map((trait) => `<span class="trait-chip">${esc(trait)}</span>`).join("")}</div>
          <div class="stat-list">${statRows(state)}</div><div class="progress-label"><span>⭐ Fame</span><strong>${safePercent(state.fame || 0)}</strong></div><div class="meter"><span style="--value:${safePercent(state.fame || 0)}%;--meter-color:#d8a12b"></span></div>${state.flags.vampire ? `<div class="vampire-stats"><span>🩸 Hunger <strong>${state.vampire ? state.vampire.hunger : 25}%</strong></span><span>🕯️ Secrecy <strong>${state.vampire ? state.vampire.secrecy : 80}%</strong></span></div>` : ""}
        </div>
        <div class="quick-balance"><div><span>Cash</span><strong>${money(state, state.finances.cash)}</strong></div><div><span>Net worth</span><strong>${money(state, game.netWorth())}</strong></div></div>
      </section>
      ${ageButton(state, false)}
    </aside>`;
  }

  function header(app) {
    const status = app.store.available ? (app.lastSavedAt ? `Saved ${U.relativeTime(app.lastSavedAt)}` : "Autosave ready") : "Memory only";
    return `<header class="site-header"><div class="header-inner">
      <a class="brand" href="#" data-action="tab" data-tab="life"><img src="assets/mark.svg" alt=""><span class="brand-copy"><strong>Next Chapter</strong><span>Life simulator</span></span></a>
      <div class="header-tools">
        <button class="icon-button" data-action="toggle-theme" title="Toggle dark mode" aria-label="Toggle dark mode">◐</button><span class="save-status">${esc(status)}</span>
        <button class="button secondary" data-action="open-saves"><span aria-hidden="true">💾</span><span class="button-label">Save & export</span></button>
      </div>
    </div></header>`;
  }

  V.game = function gameView(app) {
    const game = app.game;
    const state = game.state;
    const chapter = game.chapter();
    const allowedInCustody = new Set(["life", "jail", "developer"]);
    const availableTabs = game.isIncarcerated() ? TAB_META.filter(([id]) => allowedInCustody.has(id)) : TAB_META.filter(([id]) => id !== "jail");
    const tabs = availableTabs.map(([id, icon, label]) => `<button class="nav-button ${app.tab === id ? "active" : ""}" data-action="tab" data-tab="${id}" aria-selected="${app.tab === id}"><span>${icon}</span>${label}</button>`).join("");
    return `${header(app)}<div class="game-layout ${game.isIncarcerated() ? "custody-layout" : ""}">${profileRail(game)}<main class="main-column">
      <div class="chapter-heading"><div><h1>${game.isIncarcerated() ? "Years behind the gate" : esc(chapter.title)}</h1><p>${game.isIncarcerated() ? `Serving time in ${esc(state.crime.incarceration.facility)}` : esc(chapter.subtitle)}</p></div><span class="chapter-badge">${game.isIncarcerated() ? `Custody · ${state.crime.incarceration.security} security` : `${esc(chapter.label)} · ${state.year}`}</span></div>
      <nav class="tab-bar" aria-label="Life sections">${tabs}</nav>
      <section class="content-panel">${V.tabContent(app)}</section>
    </main></div>${ageButton(state, true)}`;
  };

  V.tabContent = function tabContent(app) {
    if (app.tab === "people") return V.people(app);
    if (app.tab === "path") return V.path(app);
    if (app.tab === "assets") return V.assets(app);
    if (app.tab === "activities") return V.activities(app);
    if (app.tab === "crime") return V.crime(app);
    if (app.tab === "jail") return V.jail(app);
    if (app.tab === "challenges") return V.challenges(app);
    if (app.tab === "developer") return V.developer(app);
    return V.life(app);
  };

  V.life = function life(app) {
    const state = app.game.state;
    const items = state.timeline.map((entry) => `<article class="timeline-entry ${esc(entry.type)}">
      <div class="timeline-dot">${esc(entry.icon)}</div>
      <div class="timeline-copy"><header><h3>${esc(entry.title)}</h3><time>Age ${U.int(entry.age, 0)} · ${U.int(entry.year, state.year)}</time></header><p>${esc(entry.text)}</p></div>
    </article>`).join("");
    return `<div class="panel"><div class="section-head"><div><h2>Life so far</h2><p>Your newest memories appear first.</p></div><span class="status-pill neutral">${state.timeline.length} entries</span></div><div class="timeline">${items || emptyState("📖", "A blank first page", "Age up to begin writing this life.")}</div></div>`;
  };

  V.people = function people(app) {
    const state = app.game.state;
    if (app.game.isIncarcerated()) return `<div class="panel">${emptyState("🔒", "Relationships are limited in custody", "Use the Jail tab to call or receive support from people outside.")}</div>`;

    const groups = [
      ["Children", ["child", "stepchild"]],
      ["Spouse & partner", ["spouse", "fiance", "partner"]],
      ["Parents", ["parent", "grandparent"]],
      ["Siblings", ["sibling"]],
      ["Friends", ["friend"]],
      ["Exes", ["ex", "former_stepchild"]],
      ["Late relationships", ["late_spouse", "late_partner"]]
    ];

    const actionButtons = (person) => {
      const alive = person.alive !== false;
      const common = alive ? `<button class="button small secondary" data-action="relationship" data-person="${esc(person.id)}" data-kind="time">Spend time</button><button class="button small secondary" data-action="relationship" data-person="${esc(person.id)}" data-kind="talk">Conversation</button><button class="button small secondary" data-action="relationship" data-person="${esc(person.id)}" data-kind="compliment">Compliment</button><button class="button small secondary" data-action="relationship" data-person="${esc(person.id)}" data-kind="gift">Gift ${money(state, 50)}</button><button class="button small ghost" data-action="relationship" data-person="${esc(person.id)}" data-kind="insult">Insult</button>` : "";
      let special = "";
      if (alive && person.role === "partner" && state.age >= 18 && person.age >= 18) {
        special = `<div class="relationship-special"><span>Propose:</span><button class="button small secondary" data-action="propose" data-person="${esc(person.id)}" data-ring="none">No ring</button><button class="button small secondary" data-action="propose" data-person="${esc(person.id)}" data-ring="simple">Simple ring</button><button class="button small secondary" data-action="propose" data-person="${esc(person.id)}" data-ring="luxury">Luxury ring</button><button class="button small ghost" data-action="propose" data-person="${esc(person.id)}" data-ring="fake">Fake ring</button></div>`;
      } else if (alive && person.role === "fiance") {
        special = `<div class="relationship-special"><span>Wedding:</span><button class="button small secondary" data-action="marry" data-person="${esc(person.id)}" data-plan="simple" data-surname="keep">Small wedding · keep names</button><button class="button small secondary" data-action="marry" data-person="${esc(person.id)}" data-plan="classic" data-surname="spouse-takes" data-prenup="true">Classic · spouse takes name · prenup</button><button class="button small secondary" data-action="marry" data-person="${esc(person.id)}" data-plan="lavish" data-surname="hyphenate">Lavish · hyphenate</button></div>`;
      } else if (alive && person.role === "spouse") {
        special = `<div class="relationship-special"><button class="button small secondary" data-action="renew-vows" data-person="${esc(person.id)}">Renew vows</button><button class="button small danger" data-action="divorce" data-person="${esc(person.id)}">Divorce</button></div>`;
      } else if (alive && person.role === "ex") {
        special = `<div class="relationship-special"><button class="button small secondary" data-action="reconcile" data-person="${esc(person.id)}">Try to reconcile</button></div>`;
      } else if (!alive && person.funeralPending) {
        special = `<div class="relationship-special"><span>Funeral:</span><button class="button small secondary" data-action="funeral" data-person="${esc(person.id)}" data-method="burial">Burial</button><button class="button small secondary" data-action="funeral" data-person="${esc(person.id)}" data-method="cremation">Cremation</button><button class="button small ghost" data-action="funeral" data-person="${esc(person.id)}" data-method="science">Donate to science</button></div>`;
      }
      const crime = alive && state.age >= 18 ? `<button class="button small danger" data-action="crime" data-crime="murder" data-target="${esc(person.id)}">Murder</button>` : "";
      return `<div class="relationship-actions">${common}${crime}</div>${special}`;
    };

    const row = (person) => {
      const alive = person.alive !== false;
      const status = alive ? `Age ${U.int(person.age, 0)}` : `Died at ${U.int(person.deathAge || person.age, 0)}`;
      return `<details class="relationship-row"><summary><div class="person-badge image-person"><img src="${U.avatarSvg(person.avatar)}" alt="Portrait of ${esc(person.firstName)}"></div><div class="relationship-main"><div class="relationship-title"><h3>${esc(person.firstName)} ${esc(person.lastName)} <span>(${esc(roleLabel(person, state))})</span></h3><small>${status}</small></div><div class="relationship-meter-label">Relationship</div><div class="meter"><span style="--value:${safePercent(person.closeness)}%;--meter-color:${roleColor(person.role)}"></span></div></div><span class="relationship-chevron">›</span></summary><div class="relationship-detail">${actionButtons(person)}</div></details>`;
    };

    const sections = groups.map(([title, roles]) => {
      const people = state.relationships.filter((p) => roles.includes(p.role)).sort((a, b) => Number(b.alive) - Number(a.alive) || b.closeness - a.closeness);
      return people.length ? `<section class="relationship-group"><h3>${title}</h3><div class="relationship-list">${people.map(row).join("")}</div></section>` : "";
    }).join("");

    const hasPartner = state.relationships.some((p) => p.alive !== false && ["partner", "fiance", "spouse"].includes(p.role));
    const dateButton = state.age >= 16 && !hasPartner ? `<button class="button secondary" data-action="find-date">Find a date</button>` : "";
    return `<div class="panel relationship-panel"><div class="section-head"><div><h2>Relationships</h2><p>Open a person to talk, give gifts, propose, marry, divorce, or handle family milestones.</p></div><div class="button-row">${dateButton}<span class="status-pill neutral">${state.activityPoints} action${state.activityPoints === 1 ? "" : "s"} left</span></div></div>${sections || emptyState("💛", "No one here yet", "New relationships can grow through life events and activities.")}</div>`;
  };

  function activeEducation(app) {
    const state = app.game.state;
    const program = app.game.currentEducation();
    if (!program) return `<article class="path-card"><div class="path-card-header"><div><span class="tag">Education</span><h3>No current program</h3><p class="card-subtitle">Past credentials: ${state.education.credentials.length ? state.education.credentials.map(U.cap).join(", ") : "none yet"}</p></div><div class="path-icon">📘</div></div></article>`;
    const progress = Math.round(state.education.yearsComplete / program.duration * 100);
    return `<article class="path-card"><div class="path-card-header"><div><span class="tag">Education</span><h3>${esc(program.label)}${state.education.field ? ` · ${esc(state.education.field)}` : ""}</h3><p class="card-subtitle">Year ${state.education.yearsComplete} of ${program.duration} · Performance ${safePercent(state.education.performance)}</p></div><div class="path-icon">${program.icon}</div></div><div class="progress-label"><span>Progress</span><strong>${progress}%</strong></div><div class="meter"><span style="--value:${progress}%;--meter-color:#6a5acd"></span></div>${!["primary", "secondary"].includes(program.id) ? `<div class="card-actions" style="margin-top:.8rem"><button class="button small secondary" data-action="leave-education">Leave program</button></div>` : ""}</article>`;
  }

  function activeCareer(app) {
    const state = app.game.state;
    const career = state.career.active;
    if (!career) return `<article class="path-card"><div class="path-card-header"><div><span class="tag">Career</span><h3>${state.flags.retired ? "Retired" : "No current job"}</h3><p class="card-subtitle">${state.flags.retired ? "Time belongs to you in a new way." : "Apply for roles below when you meet their requirements."}</p></div><div class="path-icon">${state.flags.retired ? "🌤️" : "💼"}</div></div></article>`;
    const assassin = career.jobId === "assassin";
    const job = app.data.catalogs.jobs.find((item) => item.id === career.jobId);
    const ladder = job && job.promotions || [];
    const nextPromotion = !assassin && career.level < ladder.length ? ladder[career.level] : null;
    const progressCopy = assassin ? `Level ${career.level} · ${career.contractSuccesses || 0} completed contract${career.contractSuccesses === 1 ? "" : "s"}` : `Level ${career.level + 1}${nextPromotion ? ` · Next: ${esc(nextPromotion)}` : " · Highest rank"}`;
    const actions = assassin
      ? `<button class="button small danger" data-action="assassin-contract" ${state.activityPoints < 1 || state.crime.pendingCourt ? "disabled" : ""}>Accept contract · 1 action</button>`
      : `<button class="button small" data-action="work-hard" ${state.activityPoints < 1 ? "disabled" : ""}>Focus at work</button>${state.age >= 58 ? `<button class="button small secondary" data-action="retire">Retire</button>` : ""}`;
    return `<article class="path-card" style="--accent-soft:${assassin ? "#f8e8ea" : "#e2f5f2"}"><div class="path-card-header"><div><span class="tag" style="color:${assassin ? "#9d3046" : "#24776f"};background:${assassin ? "#f8e8ea" : "#e2f5f2"}">${assassin ? "Illegal career" : "Career"}</span><h3>${esc(career.title)}</h3><p class="card-subtitle">${esc(career.sector)} · ${money(state, career.salary)}/year · ${career.years} year${career.years === 1 ? "" : "s"}</p><p class="card-subtitle">${progressCopy}</p></div><div class="path-icon" style="background:${assassin ? "#f8e8ea" : "#e2f5f2"}">${esc(career.icon)}</div></div><div class="progress-label"><span>Performance</span><strong>${safePercent(career.performance)}</strong></div><div class="meter"><span style="--value:${safePercent(career.performance)}%;--meter-color:${assassin ? "#9d3046" : "#2f9c95"}"></span></div><div class="card-actions" style="margin-top:.8rem">${actions}<button class="button small ghost" data-action="quit-job">Resign</button></div></article>`;
  }

  V.path = function path(app) {
    const state = app.game.state;
    const talent = NC.SPECIAL_TALENTS[state.profile.specialTalent || "none"];
    const higherEducation = app.data.catalogs.education.filter((program) => !["primary", "secondary"].includes(program.id)).map((program) => {
      const check = app.game.canEnroll(program.id);
      return `<article class="shop-card"><div class="shop-card-header"><div><h3>${esc(program.label)}</h3><p>${esc(program.description)}</p></div><div class="shop-icon">${program.icon}</div></div><span class="price">${money(state, program.cost)}/year · ${program.duration} years</span><div class="card-actions"><button class="button small secondary" data-action="enroll" data-program="${esc(program.id)}" ${!check.allowed ? "disabled" : ""}>${check.allowed ? "Enroll" : esc(check.reason)}</button></div></article>`;
    }).join("");
    const jobs = app.data.catalogs.jobs.map((job) => {
      const check = app.game.jobCheck(job);
      const odds = check.allowed ? `${Math.round(check.chance * 100)}% estimated interview chance` : "";
      const talentMatch = job.talent && job.talent === state.profile.specialTalent;
      return `<article class="shop-card"><div class="shop-card-header"><div><h3>${esc(job.title)}${talentMatch ? ` <span title="Special talent match">${talent.icon}</span>` : ""}</h3><p>${esc(job.description)}</p></div><div class="shop-icon">${job.icon}</div></div><span class="price">${money(state, job.salary)}/year · ${job.promotions.length} promotions</span>${check.allowed ? `<p class="card-subtitle">${esc(odds)}${check.warning ? ` · ${esc(check.warning)}` : ""}</p>` : ""}<div class="card-actions"><button class="button small secondary" data-action="apply-job" data-job="${esc(job.id)}" ${!check.allowed || state.activityPoints < 1 ? "disabled" : ""}>${check.allowed ? "Apply · 1 action" : esc(check.reason)}</button></div></article>`;
    }).join("");
    const assassinCheck = app.game.assassinCheck();
    const assassinActive = state.career.active && state.career.active.jobId === "assassin";
    const assassinCard = assassinActive ? "" : `<article class="shop-card"><div class="shop-card-header"><div><h3>🕶️ Assassin</h3><p>An illegal, abstract contract career. Getting caught is prosecuted as murder.</p></div><div class="shop-icon">🕶️</div></div><span class="price">Level 1 retainer ${money(state, 90000)}/year</span><p class="card-subtitle">Unlock: 3 successful murders without being caught · current ${state.crime.uncaughtMurders || 0}/3</p><div class="card-actions"><button class="button small danger" data-action="join-assassin" ${!assassinCheck.allowed ? "disabled" : ""}>${assassinCheck.allowed ? "Join underground network" : esc(assassinCheck.reason)}</button></div></article>`;
    return `<div class="panel"><div class="section-head"><div><h2>Education & career</h2><p>Build qualifications, find work, earn promotions, and shape a working life.</p></div><span class="status-pill neutral">${state.activityPoints} action${state.activityPoints === 1 ? "" : "s"} left</span></div><div class="hint-box"><strong>${talent.icon} Special talent:</strong> ${esc(talent.label)} — ${esc(talent.description)}</div><div class="path-stack">${activeEducation(app)}${activeCareer(app)}</div><section class="catalog-section"><h3>Further education</h3><div class="shop-grid">${higherEducation}</div></section><section class="catalog-section"><h3>Job market</h3>${state.age < 14 ? emptyState("💼", "Work can wait", "Job options begin appearing in the teen years.") : `<div class="shop-grid">${jobs}</div>`}</section><section class="catalog-section"><h3>Underground career</h3><div class="shop-grid">${assassinCard || `<article class="shop-card"><div class="shop-card-header"><div><h3>Current underground rank</h3><p>Complete contracts from your active career card to advance through all three levels.</p></div><div class="shop-icon">🕶️</div></div></article>`}</div></section></div>`;
  };

  V.assets = function assets(app) {
    const state = app.game.state;
    const owned = state.assets.map((asset) => `<article class="shop-card"><div class="shop-card-header"><div><h3>${esc(asset.label)}</h3><p>${esc(asset.kind === "property" ? `Property · condition ${safePercent(asset.condition)}%` : `Possession · condition ${safePercent(asset.condition)}%`)}</p></div><div class="shop-icon">${esc(asset.icon)}</div></div><span class="price">Value ${money(state, asset.value)}</span><div class="card-actions"><button class="button small secondary" data-action="sell-asset" data-instance="${esc(asset.instanceId)}">Sell</button></div></article>`).join("");
    const catalog = app.data.catalogs.assets.map((asset) => {
      const upfront = asset.kind === "property" ? asset.downPayment : asset.price;
      const ownsUnique = asset.kind === "possession" && state.assets.some((item) => item.id === asset.id);
      const disabled = state.age < asset.minAge || state.finances.cash < upfront || ownsUnique;
      const buttonText = ownsUnique ? "Already owned" : state.age < asset.minAge ? `Available at ${asset.minAge}` : `Buy · ${money(state, upfront)}${asset.kind === "property" ? " down" : ""}`;
      return `<article class="shop-card"><div class="shop-card-header"><div><h3>${esc(asset.label)}</h3><p>${esc(asset.description)}</p></div><div class="shop-icon">${esc(asset.icon)}</div></div><span class="price">${money(state, asset.price)} · upkeep ${money(state, asset.annualCost)}/year</span><div class="card-actions"><button class="button small secondary" data-action="buy-asset" data-asset="${esc(asset.id)}" ${disabled ? "disabled" : ""}>${esc(buttonText)}</button></div></article>`;
    }).join("");
    return `<div class="panel"><div class="section-head"><div><h2>Money & things</h2><p>Cash flow, property, transportation, and prized possessions.</p></div><span class="status-pill ${app.game.netWorth() >= 0 ? "" : "bad"}">Net worth ${money(state, app.game.netWorth())}</span></div><div class="finance-strip"><div class="finance-item"><span>Cash</span><strong>${money(state, state.finances.cash)}</strong></div><div class="finance-item negative"><span>Debt</span><strong>${money(state, state.finances.debt)}</strong></div><div class="finance-item positive"><span>Annual income</span><strong>${money(state, state.finances.annualIncome)}</strong></div><div class="finance-item negative"><span>Annual costs</span><strong>${money(state, state.finances.annualExpenses)}</strong></div></div><section class="catalog-section"><h3>Owned</h3>${owned ? `<div class="shop-grid">${owned}</div>` : emptyState("🗝️", "Nothing owned yet", "Property and possessions you buy will appear here.")}</section><section class="catalog-section"><h3>Marketplace</h3><div class="shop-grid">${catalog}</div></section></div>`;
  };

  V.activities = function activities(app) {
    const state = app.game.state;
    const cards = app.data.catalogs.activities.map((activity) => {
      const ageOkay = state.age >= activity.minAge && (!Number.isFinite(activity.maxAge) || state.age <= activity.maxAge);
      const modeOkay = !activity.vampireOnly || state.flags.vampire;
      const available = ageOkay && modeOkay && state.activityPoints > 0 && state.finances.cash >= activity.cost && !state.pendingEvent;
      const reason = state.age < activity.minAge ? `From age ${activity.minAge}` : Number.isFinite(activity.maxAge) && state.age > activity.maxAge ? `For ages ${activity.minAge}–${activity.maxAge}` : activity.vampireOnly && !state.flags.vampire ? "Vampire mode only" : state.activityPoints < 1 ? "Age up for more actions" : state.finances.cash < activity.cost ? `Needs ${money(state, activity.cost)}` : "Choose · 1 action";
      return `<article class="activity-card"><div class="activity-card-header"><div><h3>${esc(activity.label)}</h3><p>${esc(activity.description)}</p></div><div class="activity-icon">${activity.icon}</div></div><span class="activity-cost">${activity.cost ? money(state, activity.cost) : "Free"}</span><button class="button small secondary" data-action="activity" data-activity="${esc(activity.id)}" ${!available ? "disabled" : ""}>${esc(reason)}</button></article>`;
    }).join("");
    return `<div class="panel"><div class="section-head"><div><h2>Activities</h2><p>Spend action points before aging up. Choices can improve stats or create new connections.</p></div><span class="status-pill">${state.activityPoints} action${state.activityPoints === 1 ? "" : "s"} left</span></div><div class="activity-grid">${cards}</div></div>`;
  };

  V.crime = function crime(app) {
    const state = app.game.state;
    const crimes = [
      ["shoplift", "🛍️", "Shoplift", "Steal a small item. Lower reward and lower risk."],
      ["burglary", "🏠", "Burglary", "Break into a property for valuables."],
      ["bank", "🏦", "Rob a bank", "A high-risk crime with a large possible payout."]
    ].map(([id, icon, label, description]) => {
      const check = app.game.crimeCheck(id);
      return `<article class="activity-card"><div class="activity-card-header"><div><h3>${icon} ${label}</h3><p>${description}</p></div></div><button class="button small danger" data-action="crime" data-crime="${id}" ${!check.allowed ? "disabled" : ""}>${check.allowed ? "Attempt · 1 action" : esc(check.reason)}</button></article>`;
    }).join("");
    const records = state.crime.record.slice(0, 8).map((r) => `<article class="timeline-entry ${r.caught ? "bad" : "neutral"}"><div class="timeline-dot">${r.caught ? "🚓" : r.success ? "✓" : "×"}</div><div class="timeline-copy"><header><h3>${esc(r.label)}</h3><time>Age ${r.age}</time></header><p>${r.success ? "Succeeded" : "Failed"}${r.caught ? " · arrested" : " · not caught"}${r.reward ? ` · ${money(state, r.reward)}` : ""}</p></div></article>`).join("");
    return `<div class="panel"><div class="section-head"><div><h2>Crime & justice</h2><p>Illegal choices can bring money or fame, but police may investigate and courts can impose prison sentences.</p></div><span class="status-pill ${state.crime.jailYears ? "bad" : "warn"}">${state.crime.jailYears ? `${state.crime.jailYears} years in custody` : `${state.crime.arrests} arrests`}</span></div>${state.crime.pendingCourt ? `<div class="hint-box"><strong>Court case waiting:</strong> ${esc(state.crime.pendingCourt.label)}. Choose a lawyer below.</div><div class="shop-grid">${[["public","Public defender",0,"Lowest chance"],["local","Local lawyer",2500,"Fair chance"],["specialist","Defence specialist",15000,"Good chance"],["elite","Elite legal team",60000,"Best normal chance (still below 100%)"]].map(([id,label,cost,note])=>`<article class="shop-card"><div class="shop-card-header"><div><h3>${label}</h3><p>${note}</p></div><div class="shop-icon">⚖️</div></div><span class="price">${cost ? money(state,cost) : "Free"}</span><button class="button small secondary" data-action="court" data-lawyer="${id}" ${state.finances.cash < cost ? "disabled" : ""}>Hire and go to court</button></article>`).join("")}</div>` : `<div class="activity-grid">${crimes}</div>`}<section class="catalog-section"><h3>Record</h3><div class="timeline">${records || emptyState("🚓", "No criminal record", "Crimes and police encounters will appear here.")}</div></section></div>`;
  };

  V.jail = function jail(app) {
    const state = app.game.state;
    const sentence = app.game.currentSentence();
    if (!sentence) return `<div class="panel">${emptyState("🚪", "You are not incarcerated", "The Jail tab only appears while a sentence is active.")}</div>`;
    const servedPercent = Math.round(sentence.servedYears / Math.max(1, sentence.originalYears) * 100);
    const contacts = state.relationships.filter((p) => p.alive !== false).sort((a, b) => b.closeness - a.closeness).slice(0, 8).map((p) => `<button class="button small secondary" data-action="prison-action" data-kind="call" data-person="${esc(p.id)}">Call ${esc(p.firstName)}</button>`).join("");
    const minimumServed = Math.max(1, Math.ceil(sentence.originalYears * .45));
    const paroleText = sentence.servedYears >= minimumServed ? "Request parole" : `Parole after ${minimumServed} served`;
    const appealCards = [["public","Appeal defender",0,"Small chance"],["local","Appeal lawyer",4500,"Better chance"],["specialist","Appellate specialist",22000,"Strong chance"],["elite","Elite appellate team",85000,"Best normal chance"]].map(([id,label,cost,note]) => `<article class="shop-card"><div class="shop-card-header"><div><h3>${label}</h3><p>${note}; no normal appeal is guaranteed.</p></div><div class="shop-icon">⚖️</div></div><span class="price">${cost ? money(state,cost) : "Free"}</span><button class="button small secondary" data-action="appeal" data-lawyer="${id}" ${state.finances.cash < cost || sentence.appealsUsed >= 2 ? "disabled" : ""}>Appeal conviction</button></article>`).join("");
    return `<div class="panel jail-panel"><div class="section-head"><div><h2>In custody</h2><p>Ordinary activities, work, school, shopping, dating, and crime are locked until release.</p></div><span class="status-pill bad">${sentence.yearsRemaining} year${sentence.yearsRemaining === 1 ? "" : "s"} remaining</span></div><div class="sentence-card"><div class="sentence-icon">🔒</div><div><span class="tag">${esc(sentence.security)} security</span><h3>${esc(sentence.offense)}</h3><p>${esc(sentence.facility)} · sentenced at age ${sentence.startedAge}</p><div class="progress-label"><span>Sentence served</span><strong>${sentence.servedYears} / ${sentence.originalYears} years</strong></div><div class="meter"><span style="--value:${safePercent(servedPercent)}%;--meter-color:#6f6878"></span></div><div class="sentence-meta"><span>Conduct <strong>${safePercent(sentence.conduct)}</strong></span><span>Appeals used <strong>${sentence.appealsUsed}/2</strong></span></div></div></div><section class="catalog-section"><h3>Jail activities</h3><div class="activity-grid"><article class="activity-card"><div class="activity-card-header"><div><h3>🏃 Exercise</h3><p>Improve health, resilience, and conduct.</p></div></div><button class="button small secondary" data-action="prison-action" data-kind="exercise">Exercise · 1 action</button></article><article class="activity-card"><div class="activity-card-header"><div><h3>📚 Library</h3><p>Read and improve knowledge.</p></div></div><button class="button small secondary" data-action="prison-action" data-kind="read">Study · 1 action</button></article><article class="activity-card"><div class="activity-card-header"><div><h3>🧹 Prison work</h3><p>Earn a tiny amount and improve conduct.</p></div></div><button class="button small secondary" data-action="prison-action" data-kind="work">Work · 1 action</button></article><article class="activity-card"><div class="activity-card-header"><div><h3>📋 Parole board</h3><p>Early release depends on time served, conduct, and chance.</p></div></div><button class="button small secondary" data-action="prison-action" data-kind="parole" ${sentence.servedYears < minimumServed ? "disabled" : ""}>${paroleText}</button></article><article class="activity-card"><div class="activity-card-header"><div><h3>🚨 Escape attempt</h3><p>A risky abstract game choice. Failure adds years to the sentence.</p></div></div><button class="button small danger" data-action="prison-action" data-kind="escape">Attempt escape · 1 action</button></article></div></section><section class="catalog-section"><h3>Call someone</h3><div class="card-actions">${contacts || `<span class="card-subtitle">No living contacts are available.</span>`}</div></section><section class="catalog-section"><h3>Appeal</h3><div class="shop-grid">${appealCards}</div></section></div>`;
  };

  V.challenges = function challenges(app) {
    const state = app.game.state;
    const c = state.challenges.bankRobber;
    const row = (done, text) => `<li class="challenge-step ${done ? "done" : ""}"><span>${done ? "✓" : "○"}</span>${text}</li>`;
    return `<div class="panel"><div class="section-head"><div><h2>Challenges</h2><p>Each challenge can be completed only once across the entire family line.</p></div><span class="status-pill ${c.completed ? "" : "neutral"}">${c.completed ? "Permanently completed" : "In progress"}</span></div><article class="challenge-card"><div class="challenge-hero">🏦</div><div><span class="tag">One-time challenge</span><h3>Bank Robber</h3><p>Become famous after successfully robbing at least one bank without being caught.</p><ul class="challenge-list">${row(c.robberySucceededUncaught, "Complete a successful bank robbery without being caught")}${row(state.fame >= 70, "Reach 70 fame")}</ul>${c.completed ? `<div class="hint-box"><strong>Completed permanently.</strong> Awarded 25 legacy points${c.completedAge !== null ? ` at age ${c.completedAge}` : ""}. It cannot award points again in later generations.</div>` : ""}</div></article></div>`;
  };

  V.developer = function developer(app) {
    const state = app.game.state;
    const eventOptions = app.data.events.map((event) => `<option value="${esc(event.id)}">${esc(event.id)} — ${esc(event.title)}</option>`).join("");
    return `<div class="panel"><div class="section-head"><div><h2>Developer menu</h2><p>Deterministic controls for testing lifecycle systems and event content.</p></div><span class="status-pill warn">Testing tools</span></div><div class="dev-grid">
      <article class="dev-card"><h3>Timeline</h3><p>Jump to an age without processing the skipped years.</p><div class="field"><label for="dev-age">Age 0–110</label><input id="dev-age" type="number" min="0" max="110" value="${state.age}"></div><button class="button small secondary" data-action="dev-set-age">Set age</button></article>
      <article class="dev-card"><h3>Resources</h3><p>Add test money or maximize all four wellbeing stats.</p><div class="card-actions"><button class="button small secondary" data-action="dev-cash">Add ${money(state, 50000)}</button><button class="button small secondary" data-action="dev-stats">Max stats</button></div></article>
      <article class="dev-card"><h3>Family & death</h3><p>Create a child heir, or end the current life to test inheritance.</p><div class="card-actions"><button class="button small secondary" data-action="dev-child">Add child</button><button class="button small danger" data-action="dev-death">Force death</button></div></article>
      <article class="dev-card"><h3>Trigger event</h3><p>Open any event by its stable JSON ID, ignoring normal eligibility.</p><div class="field"><label for="dev-event">Event</label><select id="dev-event">${eventOptions}</select></div><button class="button small secondary" data-action="dev-event">Open event</button></article>
      <article class="dev-card"><h3>Outcome cheats</h3><p>Control crime, court, hiring, and promotions.</p><div class="card-actions"><button class="button small secondary" data-action="dev-toggle" data-key="alwaysWin">Always win: ${state.dev.alwaysWin ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="neverCaught">Never caught: ${state.dev.neverCaught ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="alwaysHired">Always hired: ${state.dev.alwaysHired ? "ON" : "OFF"}</button><button class="button small secondary" data-action="dev-toggle" data-key="instantPromotions">Fast promotions: ${state.dev.instantPromotions ? "ON" : "OFF"}</button></div></article>
      <article class="dev-card"><h3>Fame & challenges</h3><p>Max fame or complete the one-time Bank Robber challenge.</p><div class="card-actions"><button class="button small secondary" data-action="dev-fame">Max fame</button><button class="button small secondary" data-action="dev-challenge" ${state.challenges.bankRobber.completed ? "disabled" : ""}>${state.challenges.bankRobber.completed ? "Challenge already completed" : "Complete challenge"}</button></div></article>
      <article class="dev-card"><h3>Career testing</h3><p>Unlock the assassin requirement or force the next career promotion.</p><div class="card-actions"><button class="button small secondary" data-action="dev-assassin-unlock">Set 3 uncaught murders</button><button class="button small secondary" data-action="dev-promote" ${state.career.active ? "" : "disabled"}>Promote current career</button></div></article>
      <article class="dev-card"><h3>Justice reset</h3><p>Clear arrests, convictions, prison time, and pending court cases.</p><div class="card-actions"><button class="button small secondary" data-action="dev-clear-record">Clear criminal record</button><button class="button small secondary" data-action="dev-skip-sentence" ${app.game.isIncarcerated() ? "" : "disabled"}>Release from jail</button></div></article>
      <article class="dev-card"><h3>Relationship setup</h3><p>Add a highly compatible partner for proposal, wedding, and divorce testing.</p><button class="button small secondary" data-action="dev-partner">Add partner</button></article>
    </div><div class="hint-box"><strong>Seed:</strong> ${state.rng.seed >>> 0} · <strong>RNG step:</strong> ${state.rng.step} · <strong>Data:</strong> ${esc(app.data.dataVersion)} (${esc(app.data.source)}) · <strong>Save schema:</strong> ${state.schemaVersion}</div></div>`;
  };

  V.eventModal = function eventModal(app) {
    const pending = app.game.state.pendingEvent;
    if (!pending) return "";
    const event = app.game.events.byId(pending.eventId);
    if (!event) return "";
    const resolved = pending.resolved;
    const body = resolved ? `<div class="outcome-box"><strong>Your choice</strong><p style="margin:.35rem 0 0">${esc(resolved.outcome)}</p>${resolved.effectLabels && resolved.effectLabels.length ? `<div class="outcome-effects">${resolved.effectLabels.map((label) => `<span class="effect-chip ${label.negative ? "negative" : ""}">${esc(label.text)}</span>`).join("")}</div>` : ""}</div><div class="button-row" style="justify-content:flex-end;margin-top:1rem"><button class="button" data-action="complete-event">Continue</button></div>` : `<div class="choice-list">${event.choices.map((choice) => {
      const availability = app.game.events.choiceAvailable(app.game.state, choice);
      return `<button class="choice-button" data-action="event-choice" data-choice="${esc(choice.id)}" ${!availability.allowed ? "disabled" : ""}><span>${esc(availability.allowed ? choice.label : `${choice.label} · ${availability.reason}`)}</span><span>→</span></button>`;
    }).join("")}</div>`;
    return `<div class="modal-backdrop"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="event-title"><div class="dialog-body"><div class="event-hero"><span>${esc(event.icon || "✦")}</span></div><div class="event-kicker">${pending.source === "activity" ? "Activity" : pending.source === "developer" ? "Developer event" : `Age ${app.game.state.age}`}</div><h2 id="event-title" class="event-title">${esc(U.template(event.title, app.game.state))}</h2><p class="event-text">${esc(U.template(event.text, app.game.state))}</p>${body}</div></section></div>`;
  };

  V.deathModal = function deathModal(app) {
    const game = app.game;
    const state = game.state;
    if (state.alive) return "";
    const heirs = game.eligibleHeirs();
    const heirList = heirs.map((person) => `<button class="heir-button" data-action="continue-heir" data-person="${esc(person.id)}"><div class="person-badge" style="--person-color:${roleColor("child")}">${esc(U.initials(person.firstName, person.lastName))}</div><div><h3>${esc(person.firstName)} ${esc(person.lastName)}</h3><p>Age ${person.age} · inherits the estate and family history</p></div><span>→</span></button>`).join("");
    return `<div class="modal-backdrop"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="death-title"><div class="dialog-body"><div class="death-hero"><div class="death-icon">🕯️</div><h2 id="death-title">${esc(state.profile.firstName)}’s chapter is complete</h2><p>Age ${state.age} · ${esc(state.death.cause)}</p></div><div class="summary-grid"><div class="mini-card"><span>Generation</span><strong>${state.legacy.generation}</strong></div><div class="mini-card"><span>Legacy</span><strong>${state.legacy.score}</strong></div><div class="mini-card"><span>Estate</span><strong>${money(state, state.death.estate)}</strong></div></div>${heirs.length ? `<h3>Continue the family story</h3><p style="color:var(--muted)">Choose a child to inherit the estate. Cash is applied to debt first, 10% costs are deducted from any cash remainder, and property-linked debt can pass with its asset.</p><div class="heir-list">${heirList}</div><div class="divider-label">or</div>` : `<div class="hint-box">There is no living child heir in this generation. You can begin a completely new family story.</div>`}<button class="button secondary" style="width:100%" data-action="fresh-life">Start an unrelated new life</button></div></section></div>`;
  };

  V.saveModal = function saveModal(app) {
    const slots = ["slot1", "slot2", "slot3"].map((slot, index) => {
      const summary = app.store.summary(slot);
      const copy = !summary ? `<h3>Slot ${index + 1}</h3><p>Empty</p>` : summary.corrupt ? `<h3>Slot ${index + 1}</h3><p>Unreadable save</p>` : `<h3>${esc(summary.firstName)} ${esc(summary.lastName)}</h3><p>Age ${summary.age} · generation ${summary.generation} · ${esc(U.formatDate(summary.savedAt))}</p>`;
      return `<div class="save-slot"><div>${copy}</div><div class="save-tools"><button class="button small secondary" data-action="save-slot" data-slot="${slot}">Save</button>${summary ? `<button class="button small ghost" data-action="load-slot" data-slot="${slot}">Load</button><button class="icon-button" data-action="delete-slot" data-slot="${slot}" title="Delete" aria-label="Delete slot ${index + 1}">×</button>` : ""}</div></div>`;
    }).join("");
    return `<div class="modal-backdrop" data-dismissable="true"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="save-title"><div class="dialog-header"><div><h2 id="save-title">Save & portability</h2><p class="card-subtitle">Autosave runs after every choice.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div><div class="dialog-body"><div class="save-slots">${slots}</div><div class="divider-label">portable save</div><div class="button-row"><button class="button secondary" data-action="export">Export JSON</button><button class="button secondary" data-action="import">Import JSON</button><button class="button secondary" data-action="server-save">Save to home server</button><button class="button secondary" data-action="server-load">Load from home server</button><button class="button ghost" data-action="fresh-life">New life</button></div><div class="hint-box"><strong>Phone play:</strong> start the included server, then use these two buttons to move the same autosave between your PC and phone.</div>${!app.store.available ? `<div class="hint-box">Browser storage is unavailable for this file origin. Export JSON before closing the page.</div>` : ""}</div></section></div>`;
  };

  V.enrollModal = function enrollModal(app, programId) {
    const program = app.data.catalogs.education.find((item) => item.id === programId);
    if (!program) return "";
    const fields = (program.fields || []).map((field) => `<option value="${esc(field)}">${esc(field)}</option>`).join("");
    return `<div class="modal-backdrop"><form id="enroll-form" class="dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>${esc(program.label)}</h2><p class="card-subtitle">${money(app.game.state, program.cost)} per year for ${program.duration} years</p></div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close">×</button></div><div class="dialog-body"><p>${esc(program.description)}</p>${fields ? `<div class="field"><label for="study-field">Choose a field</label><select id="study-field" name="field">${fields}</select></div>` : ""}<input type="hidden" name="programId" value="${esc(program.id)}"><div class="hint-box">If your cash cannot cover annual tuition, the shortfall becomes student debt.</div><div class="button-row" style="justify-content:flex-end;margin-top:1rem"><button class="button secondary" type="button" data-action="close-modal">Cancel</button><button class="button" type="submit">Enroll</button></div></div></form></div>`;
  };
})(window);
