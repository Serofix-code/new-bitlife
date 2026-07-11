(function installNextChapterV17Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);
  const money = (state, value) => U.formatMoney(value, state.profile.currency);

  function accountButtons(app) {
    const current = app.store.getCurrentAccount();
    return app.store.getAccounts().map((account) => `<button class="button ${account.id === current.id ? '' : 'secondary'} small" data-action="switch-account" data-account="${esc(account.id)}">${account.id === current.id ? '● ' : ''}${esc(account.name)}</button>`).join('');
  }

  V.landing = function landingV17(app) {
    const summary = app.store.summary("autosave");
    const current = app.store.getCurrentAccount();
    const progress = app.store.getProfileProgress();
    const continueCard = summary && !summary.corrupt ? `
      <div class="continue-card">
        <div class="person-badge" style="--person-color:#28cad2">${esc(U.initials(summary.firstName, summary.lastName))}</div>
        <div>
          <h3>${esc(summary.firstName)} ${esc(summary.lastName)}</h3>
          <p>Age ${summary.age} · Generation ${summary.generation} · ${esc(summary.occupation)}</p>
        </div>
        <button class="button" data-action="continue-life">Continue</button>
      </div>` : `<div class="hint-box">This account does not have an autosave yet. Start a new life or import one.</div>`;
    return `
      <main class="landing-shell">
        <section class="landing-card">
          <img src="assets/mark.svg" alt="" style="width:70px;height:70px">
          <span class="welcome-kicker">Private offline life simulator</span>
          <h1 class="display-type">Next Chapter</h1>
          <p>Each account keeps its own saves, ribbons, and one-time challenges.</p>
          <div class="hint-box"><strong>Current account:</strong> ${esc(current.name)} · <strong>Ribbons:</strong> ${(progress.ribbons || []).length} · <strong>Completed challenges:</strong> ${(progress.completedChallenges || []).length}</div>
          <div class="button-row" style="justify-content:center;flex-wrap:wrap">${accountButtons(app)}<button class="button ghost small" data-action="create-account">＋ New user</button></div>
          ${continueCard}
          <div class="button-row" style="justify-content:center">
            <button class="button" data-action="new-life">${summary ? "Start another life" : "Create a character"}</button>
            <button class="button secondary" data-action="import">Import JSON save</button>
          </div>
          <div class="hint-box">Open <strong>index.html</strong> directly or use the included phone server. Dark mode is enabled by default and can be toggled in-game.</div>
        </section>
      </main>`;
  };

  V.creator = function creatorV17(app) {
    const data = app.data.catalogs;
    const draft = app.creatorDraft;
    const origins = data.origins.map((origin) => `<option value="${esc(origin.id)}" ${origin.id === draft.originId ? "selected" : ""}>${esc(origin.label)}</option>`).join("");
    const upbringings = data.upbringings.map((item) => `<option value="${esc(item.id)}" ${item.id === draft.upbringingId ? "selected" : ""}>${esc(item.label)} — ${esc(item.description)}</option>`).join("");
    const talents = Object.values(NC.SPECIAL_TALENTS).map((talent) => `<option value="${esc(talent.id)}" ${talent.id === (draft.specialTalent || "none") ? "selected" : ""}>${talent.icon} ${esc(talent.label)} — ${esc(talent.description)}</option>`).join("");
    const previewAvatar = Object.assign({}, draft, { identity: draft.identity, wizard: draft.supernatural === "wizard", vampire: draft.supernatural === "vampire" });
    const currentOrigin = data.origins.find((o) => o.id === draft.originId) || data.origins[0];
    return `
      <main class="creator-shell v17-creator-shell">
        <section class="welcome-copy">
          <img class="welcome-mark" src="assets/mark.svg" alt="">
          <span class="welcome-kicker">Create a life</span>
          <h1>Build your main character</h1>
          <p>Preview the portrait before you begin. Names and portraits stay original to this game while aiming for a polished mobile-sim look.</p>
          <div class="feature-cloud"><span>Preview avatar</span><span>Multiple users</span><span>Occults</span><span>Challenges</span><span>Account ribbons</span></div>
        </section>
        <form id="creator-form" class="creator-card creator-card-with-preview">
          <div class="creator-preview-panel">
            <img id="creator-avatar-preview" class="v17-creator-avatar" src="${U.avatarSvg(previewAvatar)}" alt="Character preview">
            <h3 id="creator-name-preview">${esc(draft.firstName)} ${esc(draft.lastName)}</h3>
            <p id="creator-origin-preview">${esc(currentOrigin.country)} · ${esc(draft.identity === 'woman' ? 'Woman' : draft.identity === 'man' ? 'Man' : 'Nonbinary')}</p>
            <small id="creator-occult-preview">${draft.supernatural === 'wizard' ? 'Wizard / Witch' : draft.supernatural === 'vampire' ? 'Vampire' : 'Human'} · ${esc((NC.SPECIAL_TALENTS[draft.specialTalent] || NC.SPECIAL_TALENTS.none).label)}</small>
          </div>
          <div class="section-head">
            <div><h2>Create a character</h2><p>Use the live preview to style your character.</p></div>
            <button class="icon-button" type="button" data-action="randomize-character" title="Randomize">↻</button>
          </div>
          <div class="form-grid">
            <div class="field"><label for="first-name">First name</label><input id="first-name" name="firstName" maxlength="32" required value="${esc(draft.firstName)}" autocomplete="off"></div>
            <div class="field"><label for="last-name">Last name</label><input id="last-name" name="lastName" maxlength="32" required value="${esc(draft.lastName)}" autocomplete="off"></div>
            <div class="field full"><span class="field-label">Identity</span><div class="segmented"><label><input type="radio" name="identity" value="woman" ${draft.identity === "woman" ? "checked" : ""}><span>Woman · she/her</span></label><label><input type="radio" name="identity" value="man" ${draft.identity === "man" ? "checked" : ""}><span>Man · he/him</span></label><label><input type="radio" name="identity" value="nonbinary" ${draft.identity === "nonbinary" ? "checked" : ""}><span>Nonbinary · they/them</span></label></div></div>
            <div class="field"><label for="origin">Place of birth</label><select id="origin" name="originId">${origins}</select></div>
            <div class="field"><label for="upbringing">Early home</label><select id="upbringing" name="upbringingId">${upbringings}</select></div>
            <div class="field full"><span class="field-label">Occult type</span><div class="segmented"><label><input type="radio" name="supernatural" value="human" ${draft.supernatural === "human" ? "checked" : ""}><span>Human 🌱</span></label><label><input type="radio" name="supernatural" value="vampire" ${draft.supernatural === "vampire" ? "checked" : ""}><span>Vampire 🦇</span></label><label><input type="radio" name="supernatural" value="wizard" ${draft.supernatural === "wizard" ? "checked" : ""}><span>Wizard / Witch 🪄</span></label></div></div>
            <div class="field full"><label for="special-talent">Special talent</label><select id="special-talent" name="specialTalent">${talents}</select></div>
            <div class="field"><label for="skin">Skin tone</label><input id="skin" name="skin" type="color" value="${esc(draft.skin || '#d8a47f')}"></div>
            <div class="field"><label for="hair">Hair colour</label><input id="hair" name="hair" type="color" value="${esc(draft.hair || '#4a3028')}"></div>
            <div class="field"><label for="eye">Eye colour</label><input id="eye" name="eye" type="color" value="${esc(draft.eye || '#49392f')}"></div>
            <div class="field"><label for="accent">Avatar background</label><input id="accent" name="accent" type="color" value="${esc(draft.accent || '#6a5acd')}"></div>
            <div class="field"><label for="hair-style">Hair style</label><select id="hair-style" name="hairStyle"><option value="short" ${draft.hairStyle === 'short' ? 'selected' : ''}>Short</option><option value="long" ${draft.hairStyle === 'long' ? 'selected' : ''}>Long</option><option value="curly" ${draft.hairStyle === 'curly' ? 'selected' : ''}>Curly</option></select></div>
            <div class="field"><label for="accessory">Accessory</label><select id="accessory" name="accessory"><option value="none" ${draft.accessory === 'none' ? 'selected' : ''}>None</option><option value="glasses" ${draft.accessory === 'glasses' ? 'selected' : ''}>Glasses</option><option value="earrings" ${draft.accessory === 'earrings' ? 'selected' : ''}>Earrings</option><option value="hat" ${draft.accessory === 'hat' ? 'selected' : ''}>Hat</option><option value="bow" ${draft.accessory === 'bow' ? 'selected' : ''}>Hair bow</option><option value="crown" ${draft.accessory === 'crown' ? 'selected' : ''}>Crown</option></select></div>
            <div class="field full"><label for="seed">Story seed <span style="font-weight:500;color:var(--muted)">(optional)</span></label><input id="seed" name="seed" maxlength="48" placeholder="Leave blank for a fresh surprise" value="${esc(draft.seed || "")}" autocomplete="off"></div>
          </div>
          <div class="creator-footer"><small>The preview updates as you change form values.</small><div class="button-row"><button class="button ghost" type="button" data-action="back-to-landing">Back</button><button class="button" type="submit">Begin this life →</button></div></div>
        </form>
      </main>`;
  };

  V.challenges = function challengesV17(app) {
    const state = app.game.state;
    const account = app.store.getCurrentAccount();
    const progress = app.store.getProfileProgress();
    const c = state.challenges.bankRobber;
    const row = (done, text) => `<li class="challenge-step ${done ? "done" : ""}"><span>${done ? "✓" : "○"}</span>${text}</li>`;
    const ribbons = progress.ribbons || [];
    const cards = Object.values(NC.RIBBONS).map((ribbon) => {
      const record = ribbons.find((item) => item.id === ribbon.id);
      return `<article class="ribbon-card ${record ? 'earned' : 'locked'}"><span class="ribbon-icon">${record ? ribbon.icon : '◻'}</span><div><h3>${record ? esc(ribbon.label) : 'Undiscovered'}</h3><p>${record ? esc(ribbon.description) : 'Complete a life that matches this hidden path.'}</p>${record ? `<small>Earned on account ${esc(account.name)}${record.character ? ` · ${esc(record.character)}` : ''}</small>` : ''}</div></article>`;
    }).join('');
    return `<div class="panel"><div class="section-head"><div><h2>Challenges & ribbons</h2><p>These are saved to the current account, not just the current generation.</p></div><span class="status-pill ${c.completed ? '' : 'neutral'}">${c.completed ? 'Account challenge complete' : 'In progress'}</span></div><article class="challenge-card"><div class="challenge-hero">🏦</div><div><span class="tag">One-time account challenge</span><h3>Bank Robber</h3><p>Become famous after successfully robbing at least one bank without being caught.</p><ul class="challenge-list">${row(c.robberySucceededUncaught, 'Complete a successful bank robbery without being caught')}${row(state.fame >= 70, 'Reach 70 fame')}</ul>${c.completed ? `<div class="hint-box"><strong>Completed on this account.</strong> It cannot award points a second time for the same user.</div>` : ''}</div></article><section class="catalog-section ribbon-section"><div class="section-head compact"><div><h2>Ribbon collection</h2><p>Every ribbon earned on this account is kept in your account collection.</p></div><span class="status-pill neutral">${ribbons.length} / ${Object.keys(NC.RIBBONS).length}</span></div><div class="ribbon-grid">${cards}</div></section></div>`;
  };

  V.developer = function developerV17(app) {
    const state = app.game.state;
    const eventOptions = app.data.events.map((event) => `<option value="${esc(event.id)}">${esc(event.id)} — ${esc(event.title)}</option>`).join("");
    return `<div class="panel"><div class="section-head"><div><h2>Developer menu</h2><p>Expanded cheats for careers, occults, justice, and testing.</p></div><span class="status-pill warn">Testing tools</span></div><div class="dev-grid">
      <article class="dev-card"><h3>Timeline</h3><p>Jump to an age without processing the skipped years.</p><div class="field"><label for="dev-age">Age 0–110</label><input id="dev-age" type="number" min="0" max="110" value="${state.age}"></div><button class="button small secondary" data-action="dev-set-age">Set age</button></article>
      <article class="dev-card"><h3>Resources</h3><p>Add money or maximize wellbeing and magic.</p><div class="card-actions"><button class="button small secondary" data-action="dev-cash">Add ${money(state, 50000)}</button><button class="button small secondary" data-action="dev-stats">Max stats</button><button class="button small secondary" data-action="dev-magic">Max mana</button></div></article>
      <article class="dev-card"><h3>Family & death</h3><p>Create an heir or end the current life to test inheritance and ribbons.</p><div class="card-actions"><button class="button small secondary" data-action="dev-child">Add child</button><button class="button small danger" data-action="dev-death">Force death</button></div></article>
      <article class="dev-card"><h3>Trigger event</h3><p>Open any event by its stable JSON ID.</p><div class="field"><label for="dev-event">Event</label><select id="dev-event">${eventOptions}</select></div><button class="button small secondary" data-action="dev-event">Open event</button></article>
      <article class="dev-card"><h3>Outcome cheats</h3><p>Control crime, court, hiring, and promotions.</p><div class="card-actions"><button class="button small secondary" data-action="dev-toggle" data-key="alwaysWin">Always win: ${state.dev.alwaysWin ? 'ON' : 'OFF'}</button><button class="button small secondary" data-action="dev-toggle" data-key="neverCaught">Never caught: ${state.dev.neverCaught ? 'ON' : 'OFF'}</button><button class="button small secondary" data-action="dev-toggle" data-key="alwaysHired">Always hired: ${state.dev.alwaysHired ? 'ON' : 'OFF'}</button><button class="button small secondary" data-action="dev-toggle" data-key="instantPromotions">Fast promotions: ${state.dev.instantPromotions ? 'ON' : 'OFF'}</button></div></article>
      <article class="dev-card"><h3>Fame & challenges</h3><p>Max fame or complete the one-time Bank Robber challenge.</p><div class="card-actions"><button class="button small secondary" data-action="dev-fame">Max fame</button><button class="button small secondary" data-action="dev-challenge" ${state.challenges.bankRobber.completed ? 'disabled' : ''}>${state.challenges.bankRobber.completed ? 'Challenge completed' : 'Complete challenge'}</button><button class="button small secondary" data-action="dev-unlock-all">Unlock all boosts</button></div></article>
      <article class="dev-card"><h3>Occults</h3><p>Toggle supernatural states for testing.</p><div class="card-actions"><button class="button small secondary" data-action="dev-occult" data-kind="wizard">${state.flags.wizard ? 'Remove wizard' : 'Become wizard'}</button><button class="button small secondary" data-action="dev-occult" data-kind="vampire">${state.flags.vampire ? 'Remove vampire' : 'Become vampire'}</button></div></article>
      <article class="dev-card"><h3>Career testing</h3><p>Unlock the assassin requirement or force the next career promotion.</p><div class="card-actions"><button class="button small secondary" data-action="dev-assassin-unlock">Set 3 uncaught murders</button><button class="button small secondary" data-action="dev-promote" ${state.career.active ? '' : 'disabled'}>Promote current career</button></div></article>
      <article class="dev-card"><h3>Justice reset</h3><p>Clear arrests, convictions, prison time, and pending court cases.</p><div class="card-actions"><button class="button small secondary" data-action="dev-clear-record">Clear criminal record</button><button class="button small secondary" data-action="dev-skip-sentence" ${app.game.isIncarcerated() ? '' : 'disabled'}>Release from jail</button></div></article>
      <article class="dev-card"><h3>Relationship setup</h3><p>Add a compatible partner for romance testing.</p><button class="button small secondary" data-action="dev-partner">Add partner</button></article>
    </div><div class="hint-box"><strong>Account:</strong> ${esc(app.store.getCurrentAccount().name)} · <strong>Seed:</strong> ${state.rng.seed >>> 0} · <strong>Data:</strong> ${esc(app.data.dataVersion)} · <strong>Save schema:</strong> ${state.schemaVersion}</div></div>`;
  };
})(window);
