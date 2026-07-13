(function installNextChapterV26Views(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const V = NC.View;
  const esc = (value) => U.escape(value);

  function releaseCard(entry) {
    const items = (entry.items || []).map((item) => `<li>${esc(item)}</li>`).join("");
    return `<article class="nc-changelog-card"><header><strong>${esc(entry.version)}</strong><span>${esc(entry.title)}</span></header><ul>${items}</ul></article>`;
  }

  V.changelogModal = function changelogModal(app) {
    const entries = (NC.CHANGELOG || []).map(releaseCard).join("");
    return `<div class="modal-backdrop"><section class="dialog nc-popup-dialog" role="dialog" aria-modal="true" aria-labelledby="changelog-title"><div class="dialog-header"><div><h2 id="changelog-title">📋 Changelog</h2><p class="card-subtitle">See what is new in Next Chapter without leaving the game.</p></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></div><div class="dialog-body"><div class="nc-changelog-version">Current version <strong>${esc(NC.APP_VERSION || "2.6.0")}</strong></div><div class="nc-changelog-list">${entries}</div></div></section></div>`;
  };

  V.mainMenuModal = function mainMenuModalV26(app) {
    const incarcerated = app.game.isIncarcerated();
    const items = incarcerated
      ? [["life", "📖", "Life journal"], ["jail", "🔒", "Jail"], ["developer", "🧪", "Developer"]]
      : [["life", "📖", "Life journal"], ["path", "💼", "Job & education"], ["assets", "🏠", "Assets & shopping"], ["people", "♥", "Relationships"], ["activities", "✨", "Activities"], ["crime", "🚓", "Crime & court"], ["challenges", "🏆", "Challenges & ribbons"], ["developer", "🧪", "Developer"]];
    const buttons = items.map(([tab, icon, label]) => `<button class="v16-main-menu-item" data-action="menu-tab" data-tab="${tab}"><span>${icon}</span><strong>${esc(label)}</strong><b>›</b></button>`).join("");
    return `<div class="modal-backdrop"><section class="dialog v16-menu-dialog nc-popup-dialog" role="dialog" aria-modal="true"><div class="dialog-header"><div><h2>Next Chapter</h2><p class="card-subtitle">Jump to a section, manage saves, or read what is new.</p></div><button class="icon-button" data-action="close-modal">×</button></div><div class="dialog-body"><div class="v16-main-menu-list">${buttons}<button class="v16-main-menu-item" data-action="open-changelog"><span>📋</span><strong>Changelog</strong><b>›</b></button><button class="v16-main-menu-item" data-action="open-saves"><span>💾</span><strong>Save & export</strong><b>›</b></button></div></div></section></div>`;
  };

  V.eventModal = function eventModalV26(app) {
    const pending = app.game.state.pendingEvent;
    if (!pending) return "";
    const event = app.game.events.byId(pending.eventId);
    if (!event) return "";
    const resolved = pending.resolved;
    const kicker = pending.source === "activity" ? "Activity" : pending.source === "developer" ? "Developer event" : `Age ${app.game.state.age}`;
    const sourceTone = event.category === "relationship" ? "Love" : event.category === "crime" ? "Justice" : event.category === "work" ? "Work" : event.category === "health" ? "Health" : "Life";
    const body = resolved
      ? `<div class="outcome-box"><strong>Your choice</strong><p style="margin:.35rem 0 0">${esc(resolved.outcome)}</p>${resolved.effectLabels && resolved.effectLabels.length ? `<div class="outcome-effects">${resolved.effectLabels.map((label) => `<span class="effect-chip ${label.negative ? "negative" : ""}">${esc(label.text)}</span>`).join("")}</div>` : ""}</div><div class="button-row nc-popup-actions"><button class="button secondary" data-action="complete-event">Continue</button></div>`
      : `<div class="choice-list nc-choice-list">${event.choices.map((choice) => {
          const availability = app.game.events.choiceAvailable(app.game.state, choice);
          return `<button class="choice-button" data-action="event-choice" data-choice="${esc(choice.id)}" ${!availability.allowed ? "disabled" : ""}><span>${esc(availability.allowed ? choice.label : `${choice.label} · ${availability.reason}`)}</span><span>→</span></button>`;
        }).join("")}</div>`;
    return `<div class="modal-backdrop"><section class="dialog nc-popup-dialog nc-event-dialog" role="dialog" aria-modal="true" aria-labelledby="event-title"><div class="dialog-header"><div class="nc-popup-badge"><span class="nc-popup-avatar">${esc(event.icon || "✦")}</span><div><h2 id="event-title">${esc(U.template(event.title, app.game.state))}</h2><p class="card-subtitle">${esc(sourceTone)} · ${esc(kicker)}</p></div></div></div><div class="dialog-body"><p class="event-text nc-event-copy">${esc(U.template(event.text, app.game.state))}</p>${body}</div></section></div>`;
  };
})(window);
