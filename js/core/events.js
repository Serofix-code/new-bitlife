(function installEventEngine(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;

  function livingRelationship(state, role, minCloseness) {
    return state.relationships.some((person) =>
      person.alive !== false &&
      (role === "random" || person.role === role) &&
      Number(person.closeness || 0) >= Number(minCloseness || 0)
    );
  }

  function hasCredential(state, credential) {
    return state.education.credentials.includes(credential);
  }

  class EventEngine {
    constructor(data) {
      this.data = data;
    }

    conditionsPass(state, event) {
      const conditions = event.conditions || {};
      if (event.activityOnly) return false;
      if (Number.isFinite(event.minAge) && state.age < event.minAge) return false;
      if (Number.isFinite(event.maxAge) && state.age > event.maxAge) return false;
      if (event.once && state.eventLedger.history.some((item) => item.eventId === event.id)) return false;
      const lastSeen = state.eventLedger.lastSeenAge[event.id];
      if (Number.isFinite(lastSeen) && Number.isFinite(event.cooldown) && state.age - lastSeen < event.cooldown) return false;
      if (conditions.educationActive && state.education.status !== "enrolled") return false;
      if (conditions.educationProgramIn && !conditions.educationProgramIn.includes(state.education.programId)) return false;
      if (conditions.careerActive && !state.career.active) return false;
      if (Number.isFinite(conditions.careerYearsMax) && (!state.career.active || state.career.active.years > conditions.careerYearsMax)) return false;
      if (Number.isFinite(conditions.careerPerformanceMin) && (!state.career.active || state.career.active.performance < conditions.careerPerformanceMin)) return false;
      if (conditions.relationshipRole && !livingRelationship(state, conditions.relationshipRole, conditions.relationshipClosenessMin)) return false;
      if (conditions.ownsProperty && !state.assets.some((asset) => asset.kind === "property")) return false;
      if (conditions.flagsAll && !conditions.flagsAll.every((flag) => Boolean(state.flags[flag]))) return false;
      if (conditions.flagsNone && !conditions.flagsNone.every((flag) => !state.flags[flag])) return false;
      if (conditions.statsMin && !Object.entries(conditions.statsMin).every(([stat, value]) => state.stats[stat] >= value)) return false;
      if (conditions.statsMax && !Object.entries(conditions.statsMax).every(([stat, value]) => state.stats[stat] <= value)) return false;
      return true;
    }

    eligible(state) {
      return this.data.events.filter((event) => this.conditionsPass(state, event));
    }

    pickAnnual(state) {
      const eligible = this.eligible(state);
      if (!eligible.length) return null;
      return U.weightedPick(state.rng, eligible, (event) => event.weight || 1);
    }

    byId(id) {
      return this.data.eventsById[id] || null;
    }

    choiceAvailable(state, choice) {
      const requires = choice.requires || {};
      if (Number.isFinite(requires.cashAtLeast) && state.finances.cash < requires.cashAtLeast) {
        return { allowed: false, reason: `Needs ${U.formatMoney(requires.cashAtLeast, state.profile.currency)}` };
      }
      if (requires.flagsAll && !requires.flagsAll.every((flag) => state.flags[flag])) {
        return { allowed: false, reason: "Not currently available" };
      }
      if (requires.statsMin) {
        const missing = Object.entries(requires.statsMin).find(([stat, value]) => state.stats[stat] < value);
        if (missing) return { allowed: false, reason: `Needs ${U.cap(missing[0])} ${missing[1]}` };
      }
      return { allowed: true, reason: "" };
    }

    resolve(game, eventId, choiceId) {
      const state = game.state;
      const event = this.byId(eventId);
      if (!event) throw new Error("That event no longer exists.");
      const choice = event.choices.find((item) => item.id === choiceId);
      if (!choice) throw new Error("That choice no longer exists.");
      const availability = this.choiceAvailable(state, choice);
      if (!availability.allowed) throw new Error(availability.reason);

      let resolved = choice;
      if (Array.isArray(choice.variants) && choice.variants.length) {
        const variant = U.weightedPick(state.rng, choice.variants, (item) => item.weight || 1);
        resolved = Object.assign({}, choice, variant, {
          effects: Object.assign({}, choice.effects || {}, variant.effects || {})
        });
      }

      const effectLabels = game.applyEffects(resolved.effects || {});
      state.eventLedger.history.push({
        eventId: event.id,
        choiceId: choice.id,
        age: state.age,
        at: new Date().toISOString()
      });
      if (state.eventLedger.history.length > 180) state.eventLedger.history.splice(0, state.eventLedger.history.length - 180);
      state.eventLedger.lastSeenAge[event.id] = state.age;
      return {
        event,
        choice,
        outcome: U.template(resolved.outcome || choice.outcome || "Your choice becomes part of the story.", state),
        effectLabels
      };
    }
  }

  NC.EventEngine = EventEngine;
})(window);
