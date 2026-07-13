(function installNextChapterV27Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);

  function role(person) {
    return person.parentType || String(person.role || "relative").replaceAll("_", " ");
  }

  V.familyLegacyModal = function familyLegacyModal(app) {
    const s = app.game.state;
    const familyRoles = new Set(["parent", "guardian", "grandparent", "sibling", "child", "stepchild", "spouse", "late_spouse", "partner", "late_partner", "former_stepchild"]);
    const current = s.relationships.filter((person) => familyRoles.has(person.role));
    const rows = current.map((person) => `<li class="v27-legacy-person"><img src="${U.avatarSvg(person.avatar)}" alt=""><div><strong>${esc(person.firstName)} ${esc(person.lastName)}</strong><span>${esc(U.cap(role(person)))} · ${person.alive === false ? `died at ${person.deathAge || person.age} from ${esc(person.deathCause || "an unknown cause")}` : `age ${person.age}`}</span></div><b>${person.alive === false ? "†" : "●"}</b></li>`).join("");
    const ancestors = (s.legacy.graveyard || []).map((person) => `<li class="v27-legacy-person is-ancestor"><span class="v27-legacy-generation">${person.generation}</span><div><strong>${esc(person.name)}</strong><span>Generation ${person.generation} · died at ${person.age} from ${esc(person.cause || "an unknown cause")}</span></div><b>†</b></li>`).join("");
    return `<div class="modal-backdrop"><section class="dialog nc-popup-dialog v27-legacy-dialog" role="dialog" aria-modal="true" aria-labelledby="legacy-title"><div class="dialog-header"><div><h2 id="legacy-title">🌳 ${esc(s.profile.lastName)} Family Legacy</h2><p class="card-subtitle">Generation ${s.legacy.generation} · ${esc(s.birth.familyType || "family history")}</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div><div class="dialog-body"><article class="v27-birth-record"><img src="${U.avatarSvg(s.profile.avatar)}" alt=""><div><small>Current life</small><h3>${esc(s.profile.firstName)} ${esc(s.profile.lastName)}</h3><p>Born ${esc(s.birth.date)} · ${esc(s.birth.reason)}</p></div></article><h3>Family members</h3><ul class="v27-legacy-list">${rows || "<li>No relatives recorded.</li>"}</ul><h3>Previous generations</h3><ul class="v27-legacy-list">${ancestors || "<li class=\"v27-legacy-empty\">This is the first recorded generation.</li>"}</ul></div></section></div>`;
  };

  const previousCreator = V.creator;
  V.creator = function creatorV27(app) {
    let html = previousCreator(app);
    html = html.replace("Build your main character", "Create your character").replace("Preview the portrait before you begin. Names and portraits stay original to this game while aiming for a polished mobile-sim look.", "Shape a distinctive, expressive character and watch every detail update live.");
    html = html.replace('<div class="form-grid">', '<div class="v27-creator-section"><span>Identity & story</span><small>Who will this life begin as?</small></div><div class="form-grid">');
    html = html.replace('<div class="field"><label for="skin">Skin tone</label><input id="skin" name="skin" type="color" value="', '<div class="v27-appearance-heading field full"><strong>Appearance</strong><span>Every control updates the portrait instantly.</span></div><div class="field v27-color-field"><label for="skin">Skin tone</label><input id="skin" name="skin" type="color" value="');
    html = html.replace('<div class="field"><label for="hair">Hair colour</label>', '<div class="field v27-color-field"><label for="hair">Hair colour</label>');
    html = html.replace('<div class="field"><label for="eye">Eye colour</label>', '<div class="field v27-color-field"><label for="eye">Eye colour</label>');
    html = html.replace('<div class="field"><label for="accent">Avatar background</label>', '<div class="field v27-color-field"><label for="accent">Portrait background</label>');
    html = html.replace('<option value="short"', '<option value="short"').replace('</option><option value="long"', '</option><option value="bob">Bob</option><option value="waves">Waves</option><option value="braids">Braids</option><option value="bald">Bald</option><option value="long"');
    return html;
  };

  const previousGame = V.game;
  V.game = function gameV27(app) {
    const s = app.game.state;
    let html = previousGame(app);
    const name = `${esc(s.profile.firstName)} ${esc(s.profile.lastName)}`;
    html = html.replace(`<span>${name}</span>`, `<button class="v27-profile-name" data-action="open-family-legacy" title="Open family legacy">${name}<small>Family legacy ›</small></button>`);
    html = html.replace('<section class="v18-stat-panel">', `<section class="v18-stat-panel ${app.tab === "life" ? "" : "v27-stats-hidden"}">`);
    return html;
  };

  const previousPeople = V.people;
  V.people = function peopleV27(app) {
    let html = previousPeople(app);
    const dead = app.game.state.relationships.filter((person) => person.alive === false);
    dead.forEach((person) => {
      const original = `Died at ${person.deathAge || person.age}`;
      const replacement = `${original} · ${esc(person.deathCause || "cause unknown")}`;
      html = html.replace(original, replacement);
    });
    return html;
  };
})(window);
