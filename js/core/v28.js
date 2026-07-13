(function installNextChapterV28Core(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine.prototype;

  NC.APP_VERSION = "2.8.0";
  NC.CHANGELOG = [{
    version: "2.8.0",
    title: "Portraits that grow with every life",
    items: [
      "Portraits now change from baby to child, teen, and adult at the correct ages.",
      "Women, men, girls, boys, and nonbinary characters have distinct identity-aware details.",
      "Every NPC portrait ages too, including parents, siblings, partners, children, and heirs.",
      "Existing saves automatically receive synchronized portrait ages when loaded."
    ]
  }].concat(NC.CHANGELOG || []);

  function stageForAge(value) {
    const age = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 18;
    if (age <= 4) return "baby";
    if (age <= 12) return "child";
    if (age <= 17) return "teen";
    if (age >= 65) return "senior";
    return "adult";
  }

  U.portraitStage = stageForAge;

  const previousAvatarSvg = U.avatarSvg;
  U.avatarSvg = function avatarSvgV28(avatar) {
    const a = Object.assign({}, avatar || {});
    const age = Number.isFinite(Number(a.age)) ? Math.max(0, Number(a.age)) : 18;
    const stage = stageForAge(age);
    const identity = ["woman", "man", "nonbinary"].includes(a.identity) ? a.identity : "nonbinary";

    if (stage === "baby") {
      a.style = age <= 1 ? "bald" : (a.style === "bald" ? "bald" : "short");
      if (["hat", "crown", "glasses", "earrings"].includes(a.accessory)) a.accessory = "none";
    }

    let svg = decodeURIComponent(previousAvatarSvg(a).split(",").slice(1).join(","));
    svg = svg.replace("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" data-stage="${stage}" data-age="${Math.floor(age)}" data-identity="${identity}">`);

    if (stage === "baby") {
      svg = svg
        .replaceAll('M50 19c18 0 27 13 27 32 0 20-12 32-27 32S23 71 23 51c0-19 9-32 27-32z', 'M50 16c20 0 31 14 31 34 0 22-14 35-31 35S19 72 19 50c0-20 11-34 31-34z')
        .replaceAll('rx="4.2" ry="3.4"', 'rx="5.2" ry="4.5"')
        .replaceAll('r="2.5" fill=', 'r="3.1" fill=')
        .replace('M12 100c3-21 17-31 38-31s35 10 38 31', 'M16 100c2-17 15-25 34-25s32 8 34 25');
      const babyDetails = `<path d="M27 82q23-12 46 0l5 18H22z" fill="#e7edf7" opacity=".96"/><path d="M36 80q14 12 28 0" fill="none" stroke="#a8bfdc" stroke-width="2"/><circle cx="50" cy="69" r="5" fill="#d9eef4" stroke="#79aeba" stroke-width="2"/><path d="M45 69h10" stroke="#79aeba" stroke-width="2"/>`;
      svg = svg.replace("</svg>", `${babyDetails}</svg>`);
    } else if (stage === "child") {
      svg = svg
        .replaceAll('M50 19c18 0 27 13 27 32 0 20-12 32-27 32S23 71 23 51c0-19 9-32 27-32z', 'M50 18c18 0 29 13 29 33 0 21-13 34-29 34S21 72 21 51c0-20 11-33 29-33z')
        .replaceAll('rx="4.2" ry="3.4"', 'rx="4.8" ry="4"');
      svg = svg.replace("</svg>", '<path d="M38 82l12 7 12-7" fill="none" stroke="#eef4ff" stroke-width="3" stroke-linecap="round"/></svg>');
    } else if (stage === "teen") {
      svg = svg.replace("</svg>", '<path d="M31 100q2-20 19-20t19 20" fill="none" stroke="#3c4658" stroke-width="5"/><circle cx="66" cy="58" r="1.3" fill="#b85f63" opacity=".6"/></svg>');
    } else if (stage === "senior") {
      svg = svg.replaceAll(`fill="${a.hair || "#4a3028"}"`, 'fill="#b9b9bd"').replaceAll(`stroke="${a.hair || "#4a3028"}"`, 'stroke="#b9b9bd"');
      svg = svg.replace("</svg>", '<g fill="none" stroke="#805d52" stroke-width=".8" opacity=".42"><path d="M31 57q7 3 14 0M55 57q7 3 14 0"/><path d="M38 73q12 4 24 0"/></g></svg>');
    }

    let identityDetails = "";
    if (identity === "woman") {
      identityDetails = '<g fill="none" stroke="#30242a" stroke-width="1.4" stroke-linecap="round"><path d="M35 46l-3-2m4 1l-1-3M65 46l3-2m-4 1l1-3"/></g><path d="M42 65q8 5 16 0" fill="none" stroke="#a64059" stroke-width="2.6" stroke-linecap="round"/>';
    } else if (identity === "man") {
      identityDetails = `<path d="M32 41q8-4 15 0M53 41q8-4 15 0" fill="none" stroke="${a.hair || "#4a3028"}" stroke-width="3" stroke-linecap="round"/>${stage === "adult" || stage === "senior" ? '<path d="M35 71q15 9 30 0" fill="none" stroke="#5b3c34" stroke-width="1.2" stroke-dasharray="1.2 2" opacity=".42"/>' : ""}`;
    } else {
      identityDetails = '<path d="M43 88h14" stroke="#f3cf58" stroke-width="3" stroke-linecap="round"/><path d="M50 84v8" stroke="#8c6de5" stroke-width="3" stroke-linecap="round"/>';
    }
    svg = svg.replace("</svg>", `${identityDetails}</svg>`);
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  };

  function syncPortraits(game) {
    const s = game && game.state;
    if (!s || !s.profile) return;
    s.profile.avatar = s.profile.avatar || {};
    s.profile.avatar.age = Number(s.age) || 0;
    s.profile.avatar.identity = s.profile.identity || "nonbinary";
    (s.relationships || []).forEach((person) => {
      person.avatar = person.avatar || {};
      person.avatar.age = Number(person.alive === false && person.deathAge != null ? person.deathAge : person.age) || 0;
      person.avatar.identity = person.identity || "nonbinary";
    });
    if (s.vampire) {
      [s.vampire.aristocratForm, s.vampire.trueForm].filter(Boolean).forEach((form) => {
        form.age = Number(s.age) || 0;
        form.identity = s.profile.identity || "nonbinary";
      });
    }
  }

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV28State() {
    previousEnsure.call(this);
    syncPortraits(this);
  };

  const previousTouch = GP.touch;
  GP.touch = function touchV28(reason) {
    syncPortraits(this);
    return previousTouch.call(this, reason);
  };
})(window);
