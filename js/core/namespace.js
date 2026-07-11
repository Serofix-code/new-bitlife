(function bootstrapNamespace(global) {
  "use strict";

  const NC = global.NextChapter = global.NextChapter || {};

  NC.APP_NAME = "Next Chapter";
  NC.APP_VERSION = "1.5.0";
  NC.SCHEMA_VERSION = 6;
  NC.SAVE_FORMAT = "next-chapter-life-save";
  NC.STATS = ["health", "happiness", "knowledge", "resilience"];
  NC.SPECIAL_TALENTS = {
    none: { id: "none", label: "No special talent", icon: "✨", description: "A balanced life with no hidden specialty." },
    acting: { id: "acting", label: "Acting", icon: "🎭", description: "Faster progress and better odds in acting careers and auditions." },
    sports: { id: "sports", label: "Sports (Athletic)", icon: "⚽", description: "Stronger fitness gains and much better odds in professional sport." },
    music: { id: "music", label: "Music", icon: "🎵", description: "Faster musical progress and better performance-career opportunities." },
    crime: { id: "crime", label: "Crime", icon: "🥷", description: "Higher success odds and a lower chance of arrest during abstract crime outcomes." },
    business: { id: "business", label: "Business", icon: "💼", description: "Better corporate applications, work performance, and promotion odds." },
    modeling: { id: "modeling", label: "Modeling", icon: "👠", description: "Improves fashion-career auditions, performance, and advancement." },
    dealing: { id: "dealing", label: "Dealing", icon: "🌿", description: "Improves negotiation and reward rolls in abstract underground transactions." }
  };

  NC.OCCULTS = {
    human: { id: "human", label: "Human", icon: "🌱" },
    vampire: { id: "vampire", label: "Vampire", icon: "🦇" },
    wizard: { id: "wizard", label: "Wizard / Witch", icon: "🪄" }
  };
  NC.RIBBONS = {
    ordinary: { id: "ordinary", label: "Ordinary Chapter", icon: "📖", description: "Live a life without one path overwhelmingly defining it." },
    scholar: { id: "scholar", label: "Scholar", icon: "🧠", description: "Complete advanced education." },
    family_first: { id: "family_first", label: "Family First", icon: "👨‍👩‍👧", description: "Build a close family while avoiding serious crime." },
    famous: { id: "famous", label: "Famous", icon: "📸", description: "Reach a very high level of fame." },
    fertile: { id: "fertile", label: "Big Family", icon: "🍼", description: "Raise a large family." },
    generous: { id: "generous", label: "Generous", icon: "🎁", description: "Give often and care for relationships." },
    centenarian: { id: "centenarian", label: "Long Life", icon: "∞", description: "Live to at least 100." },
    wanderer: { id: "wanderer", label: "Wanderer", icon: "🌍", description: "Live in several countries." },
    jailbird: { id: "jailbird", label: "Jailbird", icon: "🚓", description: "Spend a substantial part of life in custody." },
    escape_artist: { id: "escape_artist", label: "Escape Artist", icon: "🔓", description: "Successfully escape custody several times." },
    quiet_life: { id: "quiet_life", label: "Quiet Life", icon: "😴", description: "Live simply without a lasting career." },
    millionaire: { id: "millionaire", label: "Millionaire", icon: "💸", description: "Finish life with a large fortune." },
    mega_wealthy: { id: "mega_wealthy", label: "Mega-Wealthy", icon: "🤑", description: "Finish life with an enormous fortune." },
    successful: { id: "successful", label: "Successful", icon: "👍", description: "Build a long, stable career and life." },
    master_thief: { id: "master_thief", label: "Master Thief", icon: "🦝", description: "Commit many successful thefts." },
    notorious: { id: "notorious", label: "Notorious", icon: "🌑", description: "Become responsible for several deaths in the story." },
    unlucky: { id: "unlucky", label: "Unlucky", icon: "🌩️", description: "Have a tragically short life through misfortune." },
    model_citizen: { id: "model_citizen", label: "Model Citizen", icon: "⭐", description: "Live kindly, responsibly, and without a criminal record." },
    archmage: { id: "archmage", label: "Archmage", icon: "🔮", description: "Master magic through many spells." },
    time_weaver: { id: "time_weaver", label: "Time Weaver", icon: "⏳", description: "Use time travel repeatedly." },
    nightborn: { id: "nightborn", label: "Nightborn", icon: "🦇", description: "Complete a life as a vampire." }
  };

  NC.STAT_META = {
    health: { label: "Health", icon: "♥", color: "#2f9c95" },
    happiness: { label: "Joy", icon: "☀", color: "#ef8354" },
    knowledge: { label: "Knowledge", icon: "✦", color: "#6a5acd" },
    resilience: { label: "Resilience", icon: "◆", color: "#d8a12b" }
  };

  NC.bus = new EventTarget();
  NC.emit = function emit(name, detail) {
    NC.bus.dispatchEvent(new CustomEvent(name, { detail }));
  };
  NC.on = function on(name, listener) {
    NC.bus.addEventListener(name, listener);
    return function unsubscribe() { NC.bus.removeEventListener(name, listener); };
  };
})(window);
