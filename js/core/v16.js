(function installNextChapterV16(global) {
  "use strict";

  const NC = global.NextChapter;
  const U = NC.Utils;
  const GP = NC.GameEngine.prototype;

  NC.APP_VERSION = "1.6.0";
  NC.SCHEMA_VERSION = 7;
  NC.FX_REFERENCE = {
    base: "USD",
    note: "Bundled reference rates for display only",
    ecbDate: "2026-07-10",
    rubDate: "2026-07-11"
  };

  NC.CURRENCIES = {
    USD: { code: "USD", symbol: "$", locale: "en-US", perUsd: 1, date: "2026-07-10" },
    EUR: { code: "EUR", symbol: "€", locale: "fr-FR", perUsd: 0.874891, date: "2026-07-10" },
    NOK: { code: "NOK", symbol: "kr", locale: "nb-NO", perUsd: 9.753718, date: "2026-07-10" },
    SEK: { code: "SEK", symbol: "kr", locale: "sv-SE", perUsd: 9.636483, date: "2026-07-10" },
    DKK: { code: "DKK", symbol: "kr", locale: "da-DK", perUsd: 6.539895, date: "2026-07-10" },
    GBP: { code: "GBP", symbol: "£", locale: "en-GB", perUsd: 0.745013, date: "2026-07-10" },
    RUB: { code: "RUB", symbol: "₽", locale: "ru-RU", perUsd: 76.6647, date: "2026-07-11" }
  };

  const legacyCurrencyMap = { "$": "USD", "€": "EUR", "£": "GBP", "₽": "RUB" };

  U.currencyInfo = function currencyInfo(currency) {
    const raw = String(currency || "USD").toUpperCase();
    const code = NC.CURRENCIES[raw] ? raw : legacyCurrencyMap[currency] || "USD";
    return NC.CURRENCIES[code] || NC.CURRENCIES.USD;
  };

  U.convertFromUsd = function convertFromUsd(value, currency) {
    const info = U.currencyInfo(currency);
    return (Number(value) || 0) * info.perUsd;
  };

  U.formatMoney = function formatMoney(value, currency) {
    const info = U.currencyInfo(currency);
    const local = U.convertFromUsd(value, info.code);
    const maximumFractionDigits = Math.abs(local) < 100 ? 2 : 0;
    try {
      return new Intl.NumberFormat(info.locale, {
        style: "currency",
        currency: info.code,
        maximumFractionDigits,
        minimumFractionDigits: 0
      }).format(local);
    } catch (_) {
      const sign = local < 0 ? "−" : "";
      return `${sign}${info.symbol}${Math.abs(Math.round(local)).toLocaleString()}`;
    }
  };

  function svgData(svg) {
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function seededColor(seed, index) {
    const palettes = [
      ["#d9c6a2", "#7f5548", "#6387a2", "#6c8b68"],
      ["#d6d8df", "#525d70", "#b96f5d", "#6c896e"],
      ["#e8d9c6", "#875847", "#4d7891", "#7a9c73"],
      ["#cfdce5", "#4f6172", "#c18463", "#587b65"]
    ];
    const p = palettes[Math.abs(seed || 0) % palettes.length];
    return p[index % p.length];
  }

  U.assetSvg = function assetSvg(asset) {
    const item = asset || {};
    const seed = Number(item.imageSeed || U.hashSeed(item.id || item.label || "asset"));
    const sky = seededColor(seed, 2);
    const main = seededColor(seed, 0);
    const trim = seededColor(seed, 1);
    const grass = seededColor(seed, 3);
    const kind = item.imageKind || item.category || item.kind || "property";
    let art = "";
    if (kind === "property" || item.kind === "property") {
      const stories = 1 + (seed % 3);
      const windows = Array.from({ length: stories * 3 }, (_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        return `<rect x="${44 + col * 34}" y="${62 + row * 32}" width="18" height="20" rx="2" fill="#d8eff7" stroke="${trim}" stroke-width="3"/>`;
      }).join("");
      art = `<rect width="220" height="140" rx="18" fill="${sky}"/><rect y="104" width="220" height="36" fill="${grass}"/><path d="M30 65L110 18l80 47" fill="${trim}"/><rect x="38" y="55" width="144" height="67" rx="4" fill="${main}" stroke="${trim}" stroke-width="5"/>${windows}<rect x="100" y="88" width="22" height="34" fill="${trim}"/><circle cx="117" cy="105" r="2" fill="#f5d27a"/><path d="M0 118h220" stroke="#5f695e" stroke-width="4"/>`;
    } else if (kind === "vehicle" || kind === "car") {
      art = `<rect width="220" height="140" rx="18" fill="${sky}"/><rect y="95" width="220" height="45" fill="#3d424a"/><path d="M35 91l22-37h92l35 37z" fill="${main}" stroke="${trim}" stroke-width="5"/><path d="M69 58h60l20 27H54z" fill="#cceaf4"/><rect x="31" y="84" width="161" height="26" rx="12" fill="${main}" stroke="${trim}" stroke-width="5"/><circle cx="67" cy="111" r="16" fill="#20242a"/><circle cx="160" cy="111" r="16" fill="#20242a"/><circle cx="67" cy="111" r="7" fill="#9aa1a9"/><circle cx="160" cy="111" r="7" fill="#9aa1a9"/>`;
    } else if (kind === "bicycle") {
      art = `<rect width="220" height="140" rx="18" fill="${sky}"/><rect y="105" width="220" height="35" fill="${grass}"/><g fill="none" stroke="${trim}" stroke-width="6"><circle cx="62" cy="96" r="27"/><circle cx="161" cy="96" r="27"/><path d="M62 96l42-49 28 49H62l24-35h47l28 35M104 47h26M132 96l14-58h18"/></g>`;
    } else if (kind === "jewelry") {
      art = `<rect width="220" height="140" rx="18" fill="#282b36"/><path d="M110 25l48 41-48 54-48-54z" fill="${sky}" stroke="#e8f9ff" stroke-width="6"/><path d="M62 66h96M82 46l28 74 28-74M110 25v95" stroke="#ffffff" stroke-opacity=".65" stroke-width="4"/>`;
    } else if (kind === "instrument") {
      art = `<rect width="220" height="140" rx="18" fill="${sky}"/><ellipse cx="91" cy="87" rx="42" ry="34" fill="${main}" stroke="${trim}" stroke-width="5"/><circle cx="95" cy="88" r="10" fill="#30251f"/><path d="M116 66l68-48 9 12-67 52" fill="${trim}"/><path d="M181 18l18-7 9 14-18 8z" fill="${main}"/><path d="M44 112l119-84" stroke="#f6eddc" stroke-width="2"/>`;
    } else {
      art = `<rect width="220" height="140" rx="18" fill="${sky}"/><circle cx="110" cy="70" r="44" fill="${main}" stroke="${trim}" stroke-width="7"/><path d="M74 70h72M110 34v72" stroke="${trim}" stroke-width="7"/>`;
    }
    return svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 140">${art}</svg>`);
  };

  function cityMultiplier(originId, city) {
    const country = { norway: 1.22, france: 1.05, usa: 1.0, sweden: 1.12, denmark: 1.16, uk: 1.12, ireland: 1.08, finland: 0.98, russia: 0.58 }[originId] || 1;
    const premiumCities = new Set(["Oslo", "Paris", "New York", "Los Angeles", "Stockholm", "Copenhagen", "London", "Dublin", "Helsinki", "Moscow", "Saint Petersburg"]);
    const valueCities = new Set(["Molde", "Lille", "Oulu", "Umeå", "Esbjerg", "Waterford", "Kazan"]);
    return country * (premiumCities.has(city) ? 1.22 : valueCities.has(city) ? 0.84 : 1);
  }

  function marketRng(state) {
    return { seed: U.hashSeed(`${state.saveId}|${state.year}|${state.profile.originId}|${state.profile.city}|market`), step: 0 };
  }

  function generateMarketListings(state) {
    const rng = marketRng(state);
    const city = state.profile.city;
    const mult = cityMultiplier(state.profile.originId, city);
    const listings = [];
    const add = (category, kind, label, basePrice, annualCost, minAge, imageKind, description) => {
      const price = Math.max(80, Math.round(basePrice * mult * (0.88 + U.random(rng) * 0.28)));
      listings.push({
        id: `market_${state.year}_${listings.length}_${U.hashSeed(label + state.year).toString(36)}`,
        category, kind, label, price,
        downPayment: kind === "property" ? Math.round(price * 0.20) : price,
        annualCost: Math.round(annualCost * mult), minAge, imageKind,
        imageSeed: U.randomInt(rng, 1, 999999), location: `${city}, ${state.profile.country}`,
        description, generatedYear: state.year
      });
    };

    const homeNames = [
      ["Compact city apartment", 92000, 4600, "A small home close to local shops and transport."],
      ["Two-bedroom terrace", 225000, 9800, "A practical family home with a little outdoor space."],
      ["Detached family house", 385000, 14800, "More room, a quiet street, and higher upkeep."],
      ["Modern waterfront flat", 510000, 17600, "Bright rooms and a view that changes with the weather."],
      ["Renovated country cottage", 310000, 13200, "Old charm, fresh paint, and a longer commute."]
    ];
    const shuffledHomes = homeNames.slice().sort(() => U.random(rng) - 0.5).slice(0, 4);
    shuffledHomes.forEach(([name, price, upkeep, description]) => add("Real Estate", "property", `${city} ${name}`, price, upkeep, 18, "property", description));

    const cars = [
      ["Reliable compact car", 13500, 1600], ["Electric city car", 31500, 1200], ["Family estate car", 27500, 2100], ["Luxury touring car", 78000, 5200]
    ].sort(() => U.random(rng) - 0.5).slice(0, 3);
    cars.forEach(([name, price, upkeep]) => add("Vehicles", "possession", name, price, upkeep, 18, "vehicle", "A locally listed vehicle with a generated condition and price."));
    add("Bicycles", "possession", `${city} commuter bicycle`, 780, 55, 14, "bicycle", "A sturdy bicycle suited to daily travel.");
    add("Jewellery", "possession", "Hand-cut gemstone pendant", 4600, 40, 16, "jewelry", "A distinctive piece from a local jeweller.");
    add("Jewellery", "possession", "Vintage silver ring", 1250, 20, 16, "jewelry", "A restored ring with a little history.");
    add("Music", "possession", "Professional instrument", 2300, 90, 12, "instrument", "A performance-ready instrument from a local music shop.");
    return listings;
  }

  const previousEnsure = GP.ensureExpansionState;
  GP.ensureExpansionState = function ensureV16State() {
    previousEnsure.call(this);
    const s = this.state;
    if (!s) return;
    s.schemaVersion = NC.SCHEMA_VERSION;
    const origin = this.origin(s.profile.originId);
    s.profile.currency = origin.currencyCode || origin.currency || "USD";
    s.profile.currencyCode = s.profile.currency;
    s.profile.currencySymbol = origin.currencySymbol || U.currencyInfo(s.profile.currency).symbol;
    s.profile.fxReferenceDate = origin.fxReferenceDate || U.currencyInfo(s.profile.currency).date;
    s.profile.flag = origin.flag;
    if (!Array.isArray(origin.cities) || !origin.cities.includes(s.profile.city)) s.profile.city = origin.city;

    s.market = s.market || { year: null, city: null, listings: [] };
    if (!Array.isArray(s.market.listings) || s.market.year !== s.year || s.market.city !== s.profile.city) {
      s.market = { year: s.year, city: s.profile.city, listings: generateMarketListings(s), refreshedAt: new Date().toISOString() };
    }
    s.assets = Array.isArray(s.assets) ? s.assets : [];
    s.assets.forEach((asset) => {
      asset.imageKind = asset.imageKind || (asset.kind === "property" ? "property" : asset.id && asset.id.includes("bicycle") ? "bicycle" : "vehicle");
      asset.imageSeed = Number.isFinite(asset.imageSeed) ? asset.imageSeed : U.hashSeed(asset.instanceId || asset.id || asset.label);
      asset.location = asset.location || `${s.profile.city}, ${s.profile.country}`;
    });

    s.casino = Object.assign({ score: 0, visits: 0, lastPlayedAge: null, round: null, bestStreak: 0, streak: 0 }, s.casino || {});
    s.crime = s.crime || {};
    s.crime.fugitiveSentence = s.crime.fugitiveSentence || null;
    s.metrics = Object.assign({ cityMoves: 0, casinoArcadeWins: 0, noStakeCasinoVisits: 0 }, s.metrics || {});
  };

  GP.refreshAssetMarket = function refreshAssetMarket(force) {
    const s = this.state;
    if (!s) return [];
    if (force || !s.market || s.market.year !== s.year || s.market.city !== s.profile.city) {
      s.market = { year: s.year, city: s.profile.city, listings: generateMarketListings(s), refreshedAt: new Date().toISOString() };
    }
    return s.market.listings;
  };

  GP.buyMarketListing = function buyMarketListing(listingId) {
    this.assertFree("Shopping");
    const s = this.state;
    this.ensureExpansionState();
    const listing = s.market.listings.find((item) => item.id === listingId);
    if (!listing) throw new Error("That listing is no longer available.");
    if (s.age < listing.minAge) throw new Error(`This purchase becomes available at age ${listing.minAge}.`);
    const upfront = listing.kind === "property" ? listing.downPayment : listing.price;
    if (s.finances.cash < upfront) throw new Error(`You need ${U.formatMoney(upfront, s.profile.currency)} in cash.`);
    s.finances.cash -= upfront;
    if (listing.kind === "property") s.finances.debt += Math.max(0, listing.price - upfront);
    const asset = Object.assign({}, listing, {
      instanceId: U.uid("asset"), value: listing.price, condition: U.randomInt(s.rng, 72, 100), boughtAge: s.age
    });
    s.assets.push(asset);
    s.market.listings = s.market.listings.filter((item) => item.id !== listingId);
    this.log(`Bought ${listing.label.toLocaleLowerCase()}`, listing.kind === "property" ? `You pay ${U.formatMoney(upfront, s.profile.currency)} up front and finance the remainder.` : `You pay ${U.formatMoney(upfront, s.profile.currency)} for the item.`, "money", listing.kind === "property" ? "🏠" : "🛍️");
    this.touch("market-purchase");
    return asset;
  };

  GP.relocate = function relocate(originId, city) {
    this.assertFree("Relocation");
    const s = this.state;
    if (s.age < 18) throw new Error("Relocation is available at age 18.");
    if (s.activityPoints < 1) throw new Error("Age up for more actions.");
    const origin = this.data.catalogs.origins.find((item) => item.id === originId);
    if (!origin) throw new Error("Choose a country.");
    const destination = String(city || origin.city);
    if (!origin.cities.includes(destination)) throw new Error("Choose a listed city.");
    const sameCountry = origin.id === s.profile.originId;
    if (sameCountry && destination === s.profile.city) throw new Error("You already live in that city.");
    const cost = sameCountry ? 850 : 2800;
    if (s.finances.cash < cost) throw new Error(`You need ${U.formatMoney(cost, s.profile.currency)} to move.`);
    if (!sameCountry && s.crime.convictions > 0 && !s.dev.alwaysWin && U.random(s.rng) < Math.min(.75, .18 + s.crime.convictions * .13)) {
      throw new Error("The immigration application was refused because of your criminal record.");
    }
    s.finances.cash -= cost;
    s.activityPoints -= 1;
    s.metrics.totalActions += 1;
    s.metrics.cityMoves += 1;
    const previous = `${s.profile.city}, ${s.profile.country}`;
    s.profile.originId = origin.id;
    s.profile.country = origin.country;
    s.profile.city = destination;
    s.profile.currency = origin.currencyCode || origin.currency;
    s.profile.currencyCode = s.profile.currency;
    s.profile.currencySymbol = origin.currencySymbol;
    s.profile.fxReferenceDate = origin.fxReferenceDate;
    s.profile.flag = origin.flag;
    if (!s.metrics.countriesVisited.includes(origin.id)) s.metrics.countriesVisited.push(origin.id);
    this.refreshAssetMarket(true);
    this.log(sameCountry ? "Moved to a new city" : "Emigrated", `You leave ${previous} and settle in ${destination}, ${origin.country}. Your bank balance is now displayed in ${s.profile.currency}.`, "milestone", "🌍");
    this.touch(sameCountry ? "city-relocation" : "emigrated-city");
    return true;
  };

  GP.emigrate = function emigrateV16(originId) {
    const origin = this.data.catalogs.origins.find((item) => item.id === originId);
    if (!origin) throw new Error("Choose a country.");
    const city = U.pick(this.state.rng, origin.cities || [origin.city]);
    return this.relocate(originId, city);
  };

  GP.beginCasinoArcade = function beginCasinoArcade() {
    this.assertFree("Casino arcade");
    const s = this.state;
    if (s.age < 18) throw new Error("The casino arcade is available at age 18.");
    if (s.activityPoints < 1) throw new Error("Age up for more actions.");
    if (s.casino.round && !s.casino.round.resolved) return s.casino.round;
    s.activityPoints -= 1;
    s.metrics.totalActions += 1;
    s.metrics.noStakeCasinoVisits += 1;
    s.casino.visits += 1;
    s.casino.lastPlayedAge = s.age;
    s.casino.round = {
      id: U.uid("arcade"), winningIndex: U.randomInt(s.rng, 0, 2), resolved: false,
      selectedIndex: null, reward: 0, createdAge: s.age
    };
    this.log("Entered the casino arcade", "You receive three free play tokens for a no-stakes luck game. The tokens cannot be bought, sold, or exchanged for money.", "neutral", "🎟️");
    this.touch("casino-arcade-start");
    return s.casino.round;
  };

  GP.resolveCasinoArcade = function resolveCasinoArcade(index) {
    const s = this.state;
    const round = s.casino && s.casino.round;
    if (!round || round.resolved) throw new Error("Start a new arcade round first.");
    const selected = U.clamp(U.int(index, -1), 0, 2);
    round.selectedIndex = selected;
    round.resolved = true;
    const won = selected === round.winningIndex;
    if (won) {
      round.reward = U.randomInt(s.rng, 8, 18);
      s.casino.score += round.reward;
      s.casino.streak += 1;
      s.casino.bestStreak = Math.max(s.casino.bestStreak, s.casino.streak);
      s.metrics.casinoArcadeWins += 1;
      s.stats.happiness = U.clamp(s.stats.happiness + 5, 0, 100);
      this.log("Lucky lights matched", `You find the glowing star and earn ${round.reward} arcade points. No money changes hands.`, "good", "⭐");
    } else {
      round.reward = 2;
      s.casino.score += 2;
      s.casino.streak = 0;
      s.stats.happiness = U.clamp(s.stats.happiness + 1, 0, 100);
      this.log("Arcade round completed", "The star was behind another card, but the lights and music still make for a fun outing.", "neutral", "🎴");
    }
    this.touch("casino-arcade-result");
    return { won, winningIndex: round.winningIndex, selectedIndex: selected, reward: round.reward };
  };

  GP.clearCasinoRound = function clearCasinoRound() {
    if (this.state.casino) this.state.casino.round = null;
    this.touch("casino-arcade-clear");
  };

  GP.mortalityCheck = function v16MortalityCheck() {
    const s = this.state;
    if (s.stats.health <= 0) return s.flags.vampire ? "a catastrophic injury or illness" : "a serious decline in health";
    if (s.flags.vampire) return null;
    const wizard = Boolean(s.flags.wizard);
    let base = 0;
    if (wizard) {
      if (s.age < 75) base = 0;
      else if (s.age < 90) base = 0.002;
      else if (s.age < 105) base = 0.009;
      else if (s.age < 115) base = 0.028;
      else if (s.age < 125) base = 0.065;
      else if (s.age < 135) base = 0.16;
      else base = 0.34;
    } else {
      if (s.age >= 45 && s.age < 60) base = 0.001;
      else if (s.age < 70) base = s.age >= 60 ? 0.006 : 0;
      else if (s.age < 80) base = 0.024;
      else if (s.age < 90) base = 0.075;
      else if (s.age < 100) base = 0.18;
      else if (s.age >= 100) base = 0.38;
    }
    const healthModifier = Math.max(0, 50 - s.stats.health) / (wizard ? 380 : 260);
    if (U.random(s.rng) < base + healthModifier) return s.age >= (wizard ? 112 : 78) ? "natural causes" : "an unexpected medical emergency";
    return null;
  };

  GP.progressRelationships = function v16RelationshipAging() {
    const s = this.state;
    s.relationships.forEach((person) => {
      if (!person.alive) return;
      person.age += 1;
      const vampire = person.occult === "vampire";
      const wizard = person.occult === "wizard";
      person.health = U.clamp(person.health + U.randomInt(s.rng, -4, 2) - (!vampire && person.age > (wizard ? 85 : 60) ? 1 : 0), 0, 100);
      if (vampire) person.health = Math.max(person.health, 35);
      const married = person.role === "spouse";
      person.closeness = U.clamp(person.closeness + U.randomInt(s.rng, married ? -1 : -2, 1), 0, 100);
      if (married && person.marriage) person.marriage.years = Math.max(0, s.age - person.marriage.startedAge);
      if (person.role === "fiance" && Number.isFinite(person.engagedAge) && s.age - person.engagedAge >= 3) {
        person.closeness = U.clamp(person.closeness - 4, 0, 100);
        this.log(`${person.firstName} wants a wedding date`, `After ${s.age - person.engagedAge} years engaged, ${person.firstName} asks whether the wedding is actually going to happen.`, "relationship", "💍");
      }
      if (married && s.finances.cash > 600 && U.random(s.rng) < 0.025) {
        const taken = Math.min(s.finances.cash, U.randomInt(s.rng, 80, Math.max(100, Math.round(s.finances.cash * 0.06))));
        s.finances.cash -= taken;
        person.closeness = U.clamp(person.closeness - 4, 0, 100);
        this.log(`${person.firstName} used shared money`, `${person.firstName} spent ${U.formatMoney(taken, s.profile.currency)} without asking first.`, "money", "💸");
      }

      let risk = 0;
      if (!vampire) {
        if (wizard) {
          risk = person.age < 80 ? 0.0003 : person.age < 100 ? 0.003 : person.age < 115 ? 0.018 : person.age < 125 ? 0.055 : person.age < 140 ? 0.14 : 0.30;
        } else {
          risk = person.age < 55 ? 0.0005 : person.age < 70 ? 0.004 : person.age < 80 ? 0.025 : person.age < 90 ? 0.07 : 0.16;
        }
      }
      const healthRisk = vampire ? (person.health <= 0 ? 1 : 0) : (100 - person.health) / (wizard ? 1000 : 700);
      if (person.health <= 0 || U.random(s.rng) < risk + healthRisk) {
        person.alive = false;
        person.deathAge = person.age;
        person.previousRole = person.role;
        if (person.role === "spouse") {
          person.role = "late_spouse";
          person.relationshipStatus = "widowed";
          person.funeralPending = true;
          const inheritance = person.closeness >= 35 ? Math.round(person.wealth * U.randomInt(s.rng, 25, 80) / 100) : 0;
          if (inheritance > 0) s.finances.cash += inheritance;
          this.log(`${person.firstName} ${person.lastName} died`, inheritance > 0 ? `Your spouse died at age ${person.age} and left you ${U.formatMoney(inheritance, s.profile.currency)}. Funeral arrangements are waiting in Relationships.` : `Your spouse died at age ${person.age}. Funeral arrangements are waiting in Relationships.`, "bad", "🕯️");
        } else {
          person.role = person.role === "partner" || person.role === "fiance" ? "late_partner" : person.role;
          this.log(`${person.firstName} ${person.lastName} died`, `Your ${person.previousRole || person.role} is remembered at age ${person.age}.`, "bad", "🕯️");
        }
        s.stats.happiness = U.clamp(s.stats.happiness - Math.round(person.closeness / 10), 0, 100);
      }
    });
    if (typeof this.checkOrphanageStatus === "function") this.checkOrphanageStatus();
  };

  const previousPrisonAction = GP.prisonAction;
  GP.prisonAction = function v16PrisonAction(kind, personId) {
    const sentenceBefore = kind === "escape" && this.currentSentence() ? U.deepClone(this.currentSentence()) : null;
    const result = previousPrisonAction.call(this, kind, personId);
    if (kind === "escape" && sentenceBefore && this.state.flags.fugitive && !this.isIncarcerated()) {
      sentenceBefore.escaped = true;
      sentenceBefore.escapedAtAge = this.state.age;
      this.state.crime.fugitiveSentence = sentenceBefore;
      this.touch("fugitive-sentence-saved");
    }
    return result;
  };

  const previousAgeUp = GP.ageUp;
  GP.ageUp = function v16AgeUp() {
    const wasFugitive = Boolean(this.state && this.state.flags && this.state.flags.fugitive && !this.isIncarcerated());
    const result = previousAgeUp.call(this);
    const s = this.state;
    if (!s || !s.alive) return result;
    this.refreshAssetMarket(false);
    if (wasFugitive && s.flags.fugitive && !this.isIncarcerated()) {
      const recaptureChance = U.clamp(0.10 + Number(s.fame || 0) * 0.006 + Number(s.crime.convictions || 0) * 0.015, 0.10, 0.82);
      if (!s.dev.neverCaught && U.random(s.rng) < recaptureChance) {
        const oldSentence = U.deepClone(s.crime.fugitiveSentence || {
          id: U.uid("sentence"), offense: "Felony escape", severity: "escape", originalYears: 3,
          yearsRemaining: 3, servedYears: 0, startedAge: s.age, facility: "Regional correctional facility",
          security: "medium", conduct: 30, appealsUsed: 0, paroleDeniedAtAge: null, escaped: true
        });
        const added = U.randomInt(s.rng, 1, 4);
        oldSentence.originalYears = Math.max(1, Number(oldSentence.originalYears || oldSentence.yearsRemaining || 1)) + added;
        oldSentence.yearsRemaining = Math.max(1, Number(oldSentence.yearsRemaining || 1)) + added;
        oldSentence.conduct = Math.min(Number(oldSentence.conduct || 45), 35);
        oldSentence.security = oldSentence.yearsRemaining >= 18 ? "maximum" : oldSentence.yearsRemaining >= 6 ? "medium" : "minimum";
        oldSentence.facility = oldSentence.security === "maximum" ? "Central penitentiary" : "Regional correctional facility";
        oldSentence.recapturedAge = s.age;
        s.crime.incarceration = oldSentence;
        s.crime.jailYears = oldSentence.yearsRemaining;
        s.crime.fugitiveSentence = null;
        s.flags.fugitive = false;
        s.pendingEvent = null;
        s.activityPoints = 2;
        if (s.career.active) this.leaveCareer("recaptured fugitive");
        this.log("Recaptured by police", `Police recognise you after a fugitive search. Your fame raised the chance of being identified, and ${added} extra year${added === 1 ? " is" : "s are"} added to the remaining sentence.`, "bad", "🚓");
        this.touch("fugitive-recaptured");
        return { recaptured: true, chance: recaptureChance };
      }
    }
    return result;
  };

  const previousCreate = GP.createCharacter;
  GP.createCharacter = function createV16Character(input) {
    const state = previousCreate.call(this, input);
    this.ensureExpansionState();
    const origin = this.origin(state.profile.originId);
    state.profile.currency = origin.currencyCode || origin.currency;
    state.profile.currencyCode = state.profile.currency;
    state.profile.currencySymbol = origin.currencySymbol;
    state.profile.fxReferenceDate = origin.fxReferenceDate;
    this.refreshAssetMarket(true);
    this.touch("v1.6-character-created");
    return state;
  };

  NC.marketListingsFor = generateMarketListings;
})(window);
