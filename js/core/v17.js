(function installNextChapterV17(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine && NC.GameEngine.prototype;
  const STORE_PREFIX = "nextchapter.v1.";

  NC.APP_VERSION = "1.7.0";
  NC.SCHEMA_VERSION = Math.max(NC.SCHEMA_VERSION || 1, 8);

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* no-op */ }
  }

  function dedupeById(items) {
    const out = [];
    const seen = new Set();
    (items || []).forEach((item) => {
      if (!item || !item.id || seen.has(item.id)) return;
      seen.add(item.id);
      out.push(item);
    });
    return out;
  }

  if (NC.SaveStore) {
    const SP = NC.SaveStore.prototype;

    SP.accountsKey = function accountsKey() { return `${STORE_PREFIX}accounts`; };
    SP.currentAccountKey = function currentAccountKey() { return `${STORE_PREFIX}currentAccount`; };
    SP.profileKey = function profileKey(id) { return `${STORE_PREFIX}acct.${id}.profile`; };

    SP.getAccounts = function getAccounts() {
      let accounts = readJson(this.accountsKey(), null);
      if (!Array.isArray(accounts) || !accounts.length) {
        accounts = [{ id: "default", name: "Player 1", createdAt: new Date().toISOString() }];
        writeJson(this.accountsKey(), accounts);
        if (!readJson(this.currentAccountKey(), null)) writeJson(this.currentAccountKey(), "default");
      }
      return accounts;
    };

    SP.getCurrentAccountId = function getCurrentAccountId() {
      const accounts = this.getAccounts();
      const current = readJson(this.currentAccountKey(), null);
      if (current && accounts.some((item) => item.id === current)) return current;
      writeJson(this.currentAccountKey(), accounts[0].id);
      return accounts[0].id;
    };

    SP.getCurrentAccount = function getCurrentAccount() {
      const id = this.getCurrentAccountId();
      return this.getAccounts().find((item) => item.id === id) || this.getAccounts()[0];
    };

    SP.createAccount = function createAccount(name) {
      const cleaned = U.cleanName(name, "Player").slice(0, 24);
      const accounts = this.getAccounts();
      const idBase = cleaned.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "player";
      let id = idBase;
      let i = 2;
      while (accounts.some((item) => item.id === id)) { id = `${idBase}-${i++}`; }
      const account = { id, name: cleaned, createdAt: new Date().toISOString() };
      accounts.push(account);
      writeJson(this.accountsKey(), accounts);
      writeJson(this.currentAccountKey(), id);
      return account;
    };

    SP.setCurrentAccount = function setCurrentAccount(id) {
      const accounts = this.getAccounts();
      const found = accounts.find((item) => item.id === id);
      if (!found) throw new Error("That account does not exist.");
      writeJson(this.currentAccountKey(), id);
      return found;
    };

    SP.key = function key(slot) {
      return `${STORE_PREFIX}acct.${this.getCurrentAccountId()}.${slot}`;
    };

    SP.getProfileProgress = function getProfileProgress() {
      const id = this.getCurrentAccountId();
      const profile = readJson(this.profileKey(id), null) || {
        ribbons: [],
        completedChallenges: [],
        stats: { livesStarted: 0, livesCompleted: 0 }
      };
      profile.ribbons = dedupeById(profile.ribbons);
      profile.completedChallenges = Array.from(new Set(profile.completedChallenges || []));
      profile.stats = profile.stats || { livesStarted: 0, livesCompleted: 0 };
      return profile;
    };

    SP.saveProfileProgress = function saveProfileProgress(profile) {
      const current = this.getProfileProgress();
      const next = Object.assign({}, current, profile || {});
      next.ribbons = dedupeById(next.ribbons || []);
      next.completedChallenges = Array.from(new Set(next.completedChallenges || []));
      writeJson(this.profileKey(this.getCurrentAccountId()), next);
      return next;
    };

    SP.mergeProfileProgress = function mergeProfileProgress(partial) {
      const current = this.getProfileProgress();
      return this.saveProfileProgress({
        ribbons: dedupeById([...(current.ribbons || []), ...((partial && partial.ribbons) || [])]),
        completedChallenges: Array.from(new Set([...(current.completedChallenges || []), ...((partial && partial.completedChallenges) || [])])),
        stats: Object.assign({}, current.stats || {}, (partial && partial.stats) || {})
      });
    };
  }

  // Improved avatar renderer with softer gender-aware silhouettes.
  U.avatarSvg = function avatarSvg(avatar) {
    const a = avatar || {};
    const skin = a.skin || "#d8a47f";
    const hair = a.hair || "#4a3028";
    const accent = a.accent || "#6a5acd";
    const eye = a.eye || "#49392f";
    const identity = a.identity || "nonbinary";
    const isWoman = identity === "woman";
    const isMan = identity === "man";
    const face = isWoman
      ? '<path d="M50 20c15 0 25 11 25 28 0 18-10 29-25 29S25 66 25 48C25 31 35 20 50 20z" fill="'+skin+'"/>'
      : isMan
      ? '<path d="M50 18c16 0 27 12 27 29 0 19-11 31-27 31S23 66 23 47c0-17 11-29 27-29z" fill="'+skin+'"/>'
      : '<ellipse cx="50" cy="49" rx="26" ry="29" fill="'+skin+'"/>';
    const hairShape = a.style === "long"
      ? '<path d="M18 43c0-22 12-35 32-35 17 0 32 11 32 35v34H18z" fill="'+hair+'"/><path d="M24 61c5 12 13 18 26 18s21-6 26-18" fill="none" stroke="'+hair+'" stroke-width="14" stroke-linecap="round"/>'
      : a.style === "curly"
      ? '<circle cx="28" cy="28" r="15" fill="'+hair+'"/><circle cx="45" cy="18" r="18" fill="'+hair+'"/><circle cx="64" cy="20" r="18" fill="'+hair+'"/><circle cx="76" cy="30" r="13" fill="'+hair+'"/><path d="M22 39c7-10 18-15 28-15 14 0 23 5 30 15v8H22z" fill="'+hair+'"/>'
      : isWoman
      ? '<path d="M24 37c3-19 13-28 26-28 17 0 29 11 30 31-14-7-36-9-56-3z" fill="'+hair+'"/><path d="M24 34c-2 9-2 18 1 29" fill="none" stroke="'+hair+'" stroke-width="8" stroke-linecap="round"/><path d="M76 34c2 9 2 18-1 29" fill="none" stroke="'+hair+'" stroke-width="8" stroke-linecap="round"/>'
      : '<path d="M22 39c2-20 14-30 28-30 16 0 28 12 28 31-15-8-38-8-56-1z" fill="'+hair+'"/>';
    const brows = isWoman
      ? '<path d="M33 40q7-6 14-1M53 39q7-5 14 1" fill="none" stroke="'+hair+'" stroke-width="2.3" stroke-linecap="round"/>'
      : '<path d="M31 39q9-5 16-1M53 38q8-4 16 1" fill="none" stroke="'+hair+'" stroke-width="3" stroke-linecap="round"/>';
    const eyes = isWoman
      ? '<ellipse cx="40" cy="48" rx="3.8" ry="3.2" fill="'+eye+'"/><ellipse cx="60" cy="48" rx="3.8" ry="3.2" fill="'+eye+'"/><path d="M35 44q5-4 10 0M55 44q5-4 10 0" fill="none" stroke="#231814" stroke-width="1.4" stroke-linecap="round"/>'
      : '<circle cx="40" cy="48" r="3.3" fill="'+eye+'"/><circle cx="60" cy="48" r="3.3" fill="'+eye+'"/>';
    const nose = isMan ? '<path d="M50 47l-2 9q3 2 6 0" fill="none" stroke="#8f5c4a" stroke-width="2.2" stroke-linecap="round"/>' : '<path d="M50 47l-1.5 8q2.5 1.7 5 0" fill="none" stroke="#986655" stroke-width="1.8" stroke-linecap="round"/>';
    const mouth = isWoman
      ? '<path d="M39 62q11 8 22 0" fill="none" stroke="#ac5065" stroke-width="3.2" stroke-linecap="round"/>'
      : isMan
      ? '<path d="M40 62q10 5 20 0" fill="none" stroke="#7b3d3d" stroke-width="3" stroke-linecap="round"/>'
      : '<path d="M39 62q11 6 22 0" fill="none" stroke="#8a5360" stroke-width="3" stroke-linecap="round"/>';
    const jaw = isMan ? '<path d="M32 70q18 14 36 0" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="5" stroke-linecap="round"/>' : '';
    const fangs = a.vampire ? '<path d="M44 64l3 8 2-8m6 0 2 8 3-8" fill="#fff" stroke="#fff" stroke-width="1.6"/>' : '';
    const wizardMark = a.wizard ? '<path d="M76 13l3 6 6 .9-4.4 4.2 1.1 6.1-5.7-3-5.7 3 1.1-6.1-4.4-4.2 6-.9z" fill="#f6d365" stroke="#7d5b13" stroke-width="1.1"/>' : '';
    const accessories = {
      glasses: '<g fill="none" stroke="#21242b" stroke-width="2.6"><circle cx="39" cy="48" r="9"/><circle cx="61" cy="48" r="9"/><path d="M48 48h4M29 45l-6-3M71 45l6-3"/></g>',
      crown: '<path d="M30 23l8-12 12 11 12-11 8 12-4 10H34z" fill="#f5cc52" stroke="#9c7413" stroke-width="2"/>',
      bow: '<path d="M22 25q-13-11-13 4t13 4l7-4zm0 0q13-11 13 4t-13 4l-7-4z" fill="#e16b8c"/>',
      earrings: '<circle cx="24" cy="57" r="4" fill="#f5cc52"/><circle cx="76" cy="57" r="4" fill="#f5cc52"/>',
      hat: '<path d="M23 34h54l-8-22H31z" fill="#333"/><path d="M16 34h68" stroke="#333" stroke-width="7"/>',
      none: ''
    };
    const accessory = accessories[a.accessory] || '';
    const shoulders = isWoman
      ? '<path d="M18 100c3-17 18-25 32-25s29 8 32 25" fill="rgba(255,255,255,.12)"/>'
      : '<path d="M14 100c4-18 20-24 36-24s31 6 36 24" fill="rgba(255,255,255,.12)"/>';
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
      + '<rect width="100" height="100" rx="28" fill="'+accent+'"/>'
      + shoulders + hairShape + face + brows + eyes + nose + mouth + jaw + fangs + wizardMark + accessory + '</svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };

  if (GP) {
    const previousEnsure = GP.ensureExpansionState;
    GP.ensureExpansionState = function ensureV17State() {
      if (previousEnsure) previousEnsure.call(this);
      const s = this.state;
      if (!s) return;
      s.schemaVersion = NC.SCHEMA_VERSION;
      s.profile = s.profile || {};
      s.profile.avatar = s.profile.avatar || {};
      s.profile.avatar.identity = s.profile.identity || s.profile.avatar.identity || "nonbinary";
      if (s.flags) {
        if (s.flags.vampire) s.profile.avatar.vampire = true;
        if (s.flags.wizard) s.profile.avatar.wizard = true;
      }
      s.relationships = Array.isArray(s.relationships) ? s.relationships : [];
      s.relationships.forEach((person) => {
        person.avatar = person.avatar || {};
        person.avatar.identity = person.identity || person.avatar.identity || "nonbinary";
        if (person.occult === "wizard") person.avatar.wizard = true;
        if (person.occult === "vampire") person.avatar.vampire = true;
      });
    };

    const previousCreate = GP.createCharacter;
    GP.createCharacter = function createCharacterV17(input) {
      const state = previousCreate.call(this, input);
      if (state && state.profile && state.profile.avatar) {
        state.profile.avatar.identity = state.profile.identity;
        if (state.flags && state.flags.vampire) state.profile.avatar.vampire = true;
        if (state.flags && state.flags.wizard) state.profile.avatar.wizard = true;
      }
      return state;
    };

    const previousMakeRelativeAvatar = GP.makeRelativeAvatar;
    GP.makeRelativeAvatar = function makeRelativeAvatarV17(role, identity) {
      const avatar = previousMakeRelativeAvatar ? previousMakeRelativeAvatar.call(this, role) : {};
      avatar.identity = identity || avatar.identity || "nonbinary";
      return avatar;
    };

    const previousRandomPerson = GP.randomPerson;
    GP.randomPerson = function randomPersonV17(role, options) {
      const person = previousRandomPerson.call(this, role, options);
      if (person && person.avatar) person.avatar.identity = person.identity;
      return person;
    };

    NC.DEV_TOGGLES = Object.assign({}, NC.DEV_TOGGLES || {}, {
      fixedTheme: true
    });

    GP.devUnlockAll = function devUnlockAll() {
      this.state.dev.alwaysWin = true;
      this.state.dev.neverCaught = true;
      this.state.dev.alwaysHired = true;
      this.state.dev.instantPromotions = true;
      this.state.fame = 100;
      if (this.state.magic) {
        this.state.magic.mana = 100;
        this.state.magic.power = 100;
      }
      this.touch("dev-unlock-all");
    };

    GP.devToggleOccult = function devToggleOccult(kind) {
      if (kind === "wizard") {
        this.state.flags.wizard = !this.state.flags.wizard;
        this.state.profile.occult = this.state.flags.wizard ? "wizard" : (this.state.flags.vampire ? "vampire" : "human");
        this.state.profile.avatar.wizard = this.state.flags.wizard;
        this.state.magic = this.state.flags.wizard ? (this.state.magic || { mana: 80, power: 25, spellsCast: 0, source: "developer", inherited: false, transformationAge: this.state.age }) : null;
      } else if (kind === "vampire") {
        this.state.flags.vampire = !this.state.flags.vampire;
        this.state.profile.occult = this.state.flags.vampire ? "vampire" : (this.state.flags.wizard ? "wizard" : "human");
        this.state.profile.avatar.vampire = this.state.flags.vampire;
      }
      this.touch("dev-occult-toggle");
    };
  }
})(window);
