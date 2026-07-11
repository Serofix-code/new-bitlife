(function installNextChapterV18(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine && NC.GameEngine.prototype;

  NC.APP_VERSION = "1.8.0";
  NC.SCHEMA_VERSION = Math.max(NC.SCHEMA_VERSION || 1, 9);

  if (!GP) return;

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV18State() {
    if (previousEnsure) previousEnsure.call(this);
    const s = this.state;
    if (!s) return;
    s.schemaVersion = NC.SCHEMA_VERSION;
    s.dev = Object.assign({
      alwaysWin: false,
      neverCaught: false,
      instantFame: false,
      alwaysHired: false,
      instantPromotions: false
    }, s.dev || {});
    s.legacy = s.legacy || { generation: 1, score: 0, graveyard: [], ribbons: [], completedChallenges: [] };
    s.legacy.ribbons = Array.isArray(s.legacy.ribbons) ? s.legacy.ribbons : [];
    s.legacy.completedChallenges = Array.isArray(s.legacy.completedChallenges) ? s.legacy.completedChallenges : [];
  };

  GP.devUnlockAllRibbons = function devUnlockAllRibbons() {
    const s = this.state;
    const existing = new Set((s.legacy.ribbons || []).map((item) => item.id));
    Object.values(NC.RIBBONS).forEach((ribbon) => {
      if (existing.has(ribbon.id)) return;
      s.legacy.ribbons.push({
        id: ribbon.id,
        label: ribbon.label,
        icon: ribbon.icon,
        description: ribbon.description,
        generation: s.legacy.generation,
        character: `${s.profile.firstName} ${s.profile.lastName}`,
        age: s.age,
        earnedAt: new Date().toISOString(),
        developerUnlocked: true
      });
      existing.add(ribbon.id);
    });
    this.log("Developer collection unlocked", "Every ribbon has been added to the current user account collection.", "milestone", "🏆");
    this.touch("dev-all-ribbons");
    return s.legacy.ribbons.length;
  };

  GP.devClearAllRibbons = function devClearAllRibbons() {
    this.state.legacy.ribbons = [];
    this.touch("dev-clear-ribbons");
  };

  GP.devCompleteAllChallenges = function devCompleteAllChallenges() {
    const s = this.state;
    s.legacy.completedChallenges = Array.from(new Set([...(s.legacy.completedChallenges || []), "bank_robber"]));
    if (s.challenges && s.challenges.bankRobber) {
      Object.assign(s.challenges.bankRobber, {
        completed: true,
        robberySucceededUncaught: true,
        famous: true,
        completedAge: s.age,
        completedGeneration: s.legacy.generation
      });
    }
    s.fame = 100;
    this.log("Developer challenges completed", "Every currently available account challenge has been completed.", "milestone", "✅");
    this.touch("dev-all-challenges");
  };

  GP.devBecomeBillionaire = function devBecomeBillionaire() {
    this.state.finances.cash = Math.max(this.state.finances.cash, 1000000000);
    this.state.finances.debt = 0;
    this.touch("dev-billionaire");
  };

  GP.devUnlockEverything = function devUnlockEverything() {
    this.devUnlockAll();
    this.state.finances.cash = Math.max(this.state.finances.cash, 1000000000);
    this.state.finances.debt = 0;
    this.state.fame = 100;
    this.state.stats.health = 100;
    this.state.stats.happiness = 100;
    this.state.stats.knowledge = 100;
    this.state.stats.resilience = 100;
    this.state.activityPoints = Math.max(this.state.activityPoints, 99);
    this.devCompleteAllChallenges();
    this.devUnlockAllRibbons();
    if (this.state.magic) {
      this.state.magic.mana = 100;
      this.state.magic.power = 100;
    }
    this.touch("dev-everything");
  };
})(window);
