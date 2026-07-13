(function installNextChapterV27Core(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine.prototype;

  NC.APP_VERSION = "2.7.0";
  NC.CHANGELOG = [{
    version: "2.7.0",
    title: "Families, portraits, and life journal",
    items: [
      "Added dated, randomized birth stories and realistic parentage histories.",
      "Added a clickable family legacy with relatives and causes of death.",
      "Upgraded the character creator portrait and fixed every live appearance control.",
      "Age Up now returns to the Life Journal, and stats no longer cover other screens."
    ]
  }].concat(NC.CHANGELOG || []);

  function safeColor(value, fallback) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value) : fallback;
  }

  function birthDate(rng, year) {
    const month = U.randomInt(rng, 1, 12);
    const maxDay = [31, ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    const day = U.randomInt(rng, 1, maxDay);
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function prettyBirthDate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[month - 1] || "January"} ${day || 1}, ${year}`;
  }

  const previousAvatarSvg = U.avatarSvg;
  U.avatarSvg = function avatarSvgV27(avatar) {
    const a = avatar || {};
    const skin = safeColor(a.skin, "#d8a47f");
    const hair = safeColor(a.hair, "#4a3028");
    const eye = safeColor(a.eye, "#49392f");
    const accent = safeColor(a.accent, "#6a5acd");
    const style = a.style || a.hairStyle || "short";
    const hairBack = {
      long: `<path d="M19 49C19 19 32 7 50 7s31 12 31 42v45H19z" fill="${hair}"/>`,
      bob: `<path d="M17 48C17 20 31 8 50 8s33 12 33 40v35H17z" fill="${hair}"/>`,
      curly: `<g fill="${hair}"><circle cx="25" cy="31" r="15"/><circle cx="39" cy="18" r="16"/><circle cx="57" cy="17" r="17"/><circle cx="74" cy="29" r="16"/><circle cx="76" cy="48" r="14"/><circle cx="24" cy="49" r="14"/></g>`,
      waves: `<path d="M18 48C18 20 32 7 50 7s32 13 32 41v45H70c5-13-3-17 2-31 4-13-4-32-22-32S24 48 28 62c5 14-3 18 2 31H18z" fill="${hair}"/>`,
      braids: `<path d="M20 47C20 19 33 8 50 8s30 11 30 39H20z" fill="${hair}"/><path d="M27 45c-8 18-8 34-5 49M73 45c8 18 8 34 5 49" fill="none" stroke="${hair}" stroke-width="9" stroke-linecap="round"/>`,
      bald: ""
    }[style] || "";
    const hairFront = style === "bald" ? "" : style === "curly"
      ? `<g fill="${hair}"><circle cx="31" cy="27" r="11"/><circle cx="45" cy="23" r="12"/><circle cx="59" cy="23" r="12"/><circle cx="71" cy="29" r="10"/></g>`
      : `<path d="M25 39c2-18 12-28 27-28 14 0 24 9 27 27-13-9-35-11-54 1z" fill="${hair}"/>`;
    const accessories = {
      glasses: '<g fill="none" stroke="#29252a" stroke-width="2.5"><rect x="29" y="43" width="18" height="13" rx="6"/><rect x="53" y="43" width="18" height="13" rx="6"/><path d="M47 48h6M29 47l-7-3M71 47l7-3"/></g>',
      crown: '<path d="M29 22l8-13 13 12L63 9l8 13-4 10H33z" fill="#f5cc52" stroke="#9c7413" stroke-width="2"/>',
      bow: '<path d="M25 25Q9 13 10 30t15 3l7-4zm0 0q15-12 15 5t-15 3l-7-4z" fill="#e16b8c"/>',
      earrings: '<circle cx="23" cy="58" r="4" fill="#f5cc52"/><circle cx="77" cy="58" r="4" fill="#f5cc52"/>',
      hat: '<path d="M23 32h54L68 10H32z" fill="#29252a"/><path d="M15 33h70" stroke="#29252a" stroke-width="7"/>',
      none: ""
    };
    const occult = `${a.vampire ? '<path d="M43 65l4 8 3-8m4 0 3 8 4-8" fill="#fff" stroke="#fff" stroke-width="1.8"/>' : ""}${a.wizard ? '<path d="M78 9l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.9-5.3 2.9 1-6-4.3-4.2 6-.9z" fill="#f6d365" stroke="#7d5b13"/>' : ""}`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="b" x2="0" y2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="#171a21"/></linearGradient><radialGradient id="f" cx="50%" cy="35%"><stop stop-color="#fff" stop-opacity=".2"/><stop offset="1" stop-color="#8b4d35" stop-opacity=".12"/></radialGradient></defs><rect width="100" height="100" rx="25" fill="url(#b)"/><path d="M12 100c3-21 17-31 38-31s35 10 38 31" fill="#252b36"/>${hairBack}<path d="M42 68h16v16H42z" fill="${skin}"/><ellipse cx="23" cy="51" rx="5" ry="8" fill="${skin}"/><ellipse cx="77" cy="51" rx="5" ry="8" fill="${skin}"/><path d="M50 19c18 0 27 13 27 32 0 20-12 32-27 32S23 71 23 51c0-19 9-32 27-32z" fill="${skin}"/><path d="M50 19c18 0 27 13 27 32 0 20-12 32-27 32S23 71 23 51c0-19 9-32 27-32z" fill="url(#f)"/>${hairFront}<path d="M33 42q7-5 14 0M53 42q7-5 14 0" fill="none" stroke="${hair}" stroke-width="2.2" stroke-linecap="round"/><ellipse cx="40" cy="49" rx="4.2" ry="3.4" fill="#fff"/><ellipse cx="60" cy="49" rx="4.2" ry="3.4" fill="#fff"/><circle cx="40" cy="49" r="2.5" fill="${eye}"/><circle cx="60" cy="49" r="2.5" fill="${eye}"/><circle cx="39.2" cy="48.2" r=".8" fill="#fff"/><circle cx="59.2" cy="48.2" r=".8" fill="#fff"/><path d="M49 49q-2 8 2 9" fill="none" stroke="#8b5c49" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="34" cy="58" rx="5" ry="2" fill="#d87575" opacity=".2"/><ellipse cx="66" cy="58" rx="5" ry="2" fill="#d87575" opacity=".2"/><path d="M40 65q10 8 20 0" fill="none" stroke="#8e3f4b" stroke-width="2.4" stroke-linecap="round"/>${occult}${accessories[a.accessory] || ""}</svg>`;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  };
  U.avatarSvg.previous = previousAvatarSvg;

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV27State() {
    previousEnsure.call(this);
    const s = this.state;
    if (!s.birth) {
      const year = Number(s.year || new Date().getFullYear()) - Number(s.age || 0);
      s.birth = { date: `${year}-01-01`, reason: "born into a family whose story is still being discovered", familyType: "unknown" };
    }
    s.relationships.forEach((person) => {
      if (person.alive === false && !person.deathCause) person.deathCause = person.health <= 0 ? "a serious decline in health" : "natural causes";
    });
  };

  const previousCreate = GP.createCharacter;
  GP.createCharacter = function createV27Character(input) {
    const state = previousCreate.call(this, input);
    const parents = state.relationships.filter((person) => person.role === "parent").slice(0, 2);
    const familyRoll = U.random(state.rng);
    let reason;
    let familyType;
    if (familyRoll < 0.58) {
      parents[0].identity = "woman";
      parents[1].identity = "man";
      parents[0].parentType = "biological mother";
      parents[1].parentType = "biological father";
      familyType = "biological parents";
      reason = U.pick(state.rng, ["was the result of a planned pregnancy", "was a joyful surprise to their parents", "was born after their parents had hoped for a child for years"]);
    } else if (familyRoll < 0.79) {
      parents.forEach((parent) => { parent.identity = "woman"; });
      if (U.random(state.rng) < 0.5) {
        parents[0].parentType = "adoptive mother";
        parents[1].parentType = "adoptive mother";
        familyType = "adopted by two mothers";
        reason = `was adopted as a newborn by ${parents[0].firstName} and ${parents[1].firstName}`;
      } else {
        parents[0].parentType = "biological mother";
        parents[1].parentType = "stepmother";
        familyType = "blended family with two mothers";
        reason = `was born to ${parents[0].firstName} before she met your new mother, ${parents[1].firstName}`;
      }
    } else {
      parents.forEach((parent) => { parent.identity = "man"; });
      if (U.random(state.rng) < 0.5) {
        parents[0].parentType = "adoptive father";
        parents[1].parentType = "adoptive father";
        familyType = "adopted by two fathers";
        reason = `was adopted as a newborn by ${parents[0].firstName} and ${parents[1].firstName}`;
      } else {
        parents[0].parentType = "biological father";
        parents[1].parentType = "stepfather";
        familyType = "blended family with two fathers";
        reason = `was born before ${parents[0].firstName} met your new father, ${parents[1].firstName}`;
      }
    }
    parents.forEach((parent) => {
      parent.pronouns = U.pronouns(parent.identity).label;
      parent.reproductiveRole = parent.identity === "woman" ? "carry" : parent.identity === "man" ? "contribute" : (parent.reproductiveRole || "either");
      if (parent.avatar) parent.avatar.identity = parent.identity;
    });
    state.birth = { date: birthDate(state.rng, state.year), reason, familyType };
    const beginning = state.timeline.find((entry) => entry.title === "A new chapter begins");
    if (beginning) {
      beginning.title = `${state.profile.firstName} was born`;
      beginning.text = `${state.profile.firstName} ${state.profile.lastName} was born on ${prettyBirthDate(state.birth.date)} in ${state.profile.city}, ${state.profile.country}, and ${reason}.`;
      beginning.icon = "👶";
      state.timeline.splice(state.timeline.indexOf(beginning), 1);
      state.timeline.unshift(beginning);
    }
    this.touch("v2.7-character-created");
    return state;
  };

  const previousProgressRelationships = GP.progressRelationships;
  GP.progressRelationships = function progressRelationshipsV27() {
    const living = new Set(this.state.relationships.filter((person) => person.alive !== false).map((person) => person.id));
    previousProgressRelationships.call(this);
    this.state.relationships.forEach((person) => {
      if (!living.has(person.id) || person.alive !== false || person.deathCause) return;
      if (person.health <= 0) person.deathCause = "a serious decline in health";
      else if (person.age >= 78) person.deathCause = U.pick(this.state.rng, ["natural causes", "heart failure", "a stroke", "complications of old age"]);
      else person.deathCause = U.pick(this.state.rng, ["an unexpected medical emergency", "a sudden illness", "an accident"]);
    });
  };
})(window);
