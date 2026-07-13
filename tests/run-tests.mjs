import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (relative) => JSON.parse(await fs.readFile(path.join(root, relative), "utf8"));
const manifest = await readJson("data/manifest.json");
const sourceFiles = await Promise.all(manifest.files.map(readJson));
const catalogs = sourceFiles.find((file) => file.kind === "catalogs");
const events = sourceFiles.filter((file) => file.kind === "events").flatMap((file) => file.events);

assert.ok(catalogs, "catalogs.json must be listed in the manifest");
assert.ok(events.length >= 40, "expected a substantial event catalog");
assert.equal(new Set(events.map((event) => event.id)).size, events.length, "event IDs must be unique");

const allowedEffects = new Set([
  "stats", "cash", "debt", "flags", "educationPerformance", "careerPerformance",
  "salaryMultiplier", "relationship", "addRelationship", "endRelationship",
  "endCareer", "addPossession", "legacy"
]);
for (const event of events) {
  assert.ok(event.title && event.text && event.icon, `${event.id} needs presentation fields`);
  assert.ok(Array.isArray(event.choices) && event.choices.length >= 2, `${event.id} needs choices`);
  assert.equal(new Set(event.choices.map((choice) => choice.id)).size, event.choices.length, `${event.id} choice IDs must be unique`);
  for (const choice of event.choices) {
    const branches = choice.variants || [choice];
    for (const branch of branches) {
      for (const key of Object.keys(branch.effects || {})) assert.ok(allowedEffects.has(key), `${event.id}/${choice.id} uses unsupported effect ${key}`);
    }
  }
}

const eventIdSet = new Set(events.map((event) => event.id));
for (const activity of catalogs.activities) assert.ok(eventIdSet.has(activity.eventId), `${activity.id} references a missing event`);
for (const job of catalogs.jobs) {
  if (job.requires) assert.ok(["secondary", "trade", "degree", "graduate"].includes(job.requires), `${job.id} has an unknown credential`);
  assert.ok(Array.isArray(job.promotions) && job.promotions.length >= 3, `${job.id} needs a complete promotion ladder`);
}

const bundleCode = await fs.readFile(path.join(root, "js", "data.bundle.js"), "utf8");
const bundleContext = { window: { NextChapter: {} } };
vm.runInNewContext(bundleCode, bundleContext, { filename: "data.bundle.js" });
const bundle = JSON.parse(JSON.stringify(bundleContext.window.NextChapter.DATA_BUNDLE));
assert.equal(bundle.dataVersion, manifest.dataVersion, "bundle data version must match manifest");
assert.deepEqual(bundle.files, sourceFiles, "offline bundle must exactly match source JSON");

const html = await fs.readFile(path.join(root, "index.html"), "utf8");
assert.ok(!/type=["']module["']/.test(html), "file:// build must not use ES modules");
assert.ok(!/https?:\/\//.test(html), "index.html must not require network assets");
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const relative = match[1];
  if (relative.startsWith("#") || relative.startsWith("data:")) continue;
  await fs.access(path.join(root, relative));
}

class MemoryStorage {
  constructor() { this.map = new Map(); }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  removeItem(key) { this.map.delete(String(key)); }
}
class CustomEventStub extends Event {
  constructor(type, init = {}) { super(type); this.detail = init.detail; }
}

const context = {
  console,
  Event,
  EventTarget,
  CustomEvent: CustomEventStub,
  Intl,
  Date,
  Math,
  JSON,
  Number,
  String,
  Object,
  Array,
  Set,
  Map,
  Promise,
  structuredClone,
  setTimeout,
  clearTimeout,
  localStorage: new MemoryStorage(),
  location: { protocol: "file:" },
  crypto: globalThis.crypto
};
context.window = context;
vm.createContext(context);
for (const relative of [
  "js/core/namespace.js",
  "js/data.bundle.js",
  "js/core/utils.js",
  "js/core/data-loader.js",
  "js/core/storage.js",
  "js/core/events.js",
  "js/core/game.js",
  "js/core/expansion.js",
  "js/core/v16.js",
  "js/core/v17.js",
  "js/core/v18.js",
  "js/core/v19.js",
  "js/core/v20.js",
  "js/core/v21.js",
  "js/core/v23.js",
  "js/core/v24.js",
  "js/core/v25.js",
  "js/ui/render.js",
  "js/ui/expansion-view.js",
  "js/ui/v16-view.js",
  "js/ui/v17-view.js",
  "js/ui/v18-view.js",
  "js/ui/v19-view.js",
  "js/ui/v20-view.js",
  "js/ui/v21-view.js",
  "js/ui/v23-view.js",
  "js/ui/v24-view.js",
  "js/ui/v25-view.js"
]) {
  vm.runInContext(await fs.readFile(path.join(root, relative), "utf8"), context, { filename: relative });
}

const NC = context.NextChapter;

// Startup regression test: the landing screen must initialize before a GameEngine exists.
const fakeElement = {
  innerHTML: "",
  value: "",
  addEventListener() {},
  appendChild() {},
  click() {}
};
context.document = {
  readyState: "loading",
  documentElement: { dataset: {} },
  addEventListener() {},
  getElementById() { return fakeElement; },
  createElement() { return { ...fakeElement, append() {}, remove() {}, className: "", textContent: "" }; }
};
context.navigator = {};
vm.runInContext(await fs.readFile(path.join(root, "js/ui/app.js"), "utf8"), context, { filename: "js/ui/app.js" });
vm.runInContext(await fs.readFile(path.join(root, "js/ui/expansion-app.js"), "utf8"), context, { filename: "js/ui/expansion-app.js" });
vm.runInContext(await fs.readFile(path.join(root, "js/ui/v16-app.js"), "utf8"), context, { filename: "js/ui/v16-app.js" });
vm.runInContext(await fs.readFile(path.join(root, "js/ui/v17-app.js"), "utf8"), context, { filename: "js/ui/v17-app.js" });
vm.runInContext(await fs.readFile(path.join(root, "js/ui/v18-app.js"), "utf8"), context, { filename: "js/ui/v18-app.js" });
vm.runInContext(await fs.readFile(path.join(root, "js/ui/v19-app.js"), "utf8"), context, { filename: "js/ui/v19-app.js" });
vm.runInContext(await fs.readFile(path.join(root, "js/ui/v20-app.js"), "utf8"), context, { filename: "js/ui/v20-app.js" });
vm.runInContext(await fs.readFile(path.join(root, "js/ui/v21-app.js"), "utf8"), context, { filename: "js/ui/v21-app.js" });
vm.runInContext(await fs.readFile(path.join(root, "js/ui/v23-app.js"), "utf8"), context, { filename: "js/ui/v23-app.js" });
vm.runInContext(await fs.readFile(path.join(root, "js/ui/v24-app.js"), "utf8"), context, { filename: "js/ui/v24-app.js" });
const startupApp = new NC.AppController({ catalogs: { origins: [{ id: "test", firstNames: ["A"], lastNames: ["B"] }], upbringings: [{ id: "test" }] } }, {});
assert.equal(startupApp.game, null);
assert.equal(startupApp.tab, "life");

const data = await NC.Data.load();
const game = new NC.GameEngine(data);
game.createCharacter({ firstName: "Ada", lastName: "Test", identity: "nonbinary", originId: "norway", upbringingId: "bookish", specialTalent: "business", seed: "repeatable-test" });
assert.equal(game.state.age, 0);
assert.equal(game.state.profile.specialTalent, "business");
assert.ok(game.state.relationships.length >= 2);

for (let year = 0; year < 20; year += 1) {
  game.ageUp();
  if (game.state.pendingEvent) {
    const event = game.events.byId(game.state.pendingEvent.eventId);
    const choice = event.choices.find((item) => game.events.choiceAvailable(game.state, item).allowed);
    assert.ok(choice, `event ${event.id} should have an available choice`);
    game.resolveChoice(choice.id);
    game.completeEvent();
  }
  assert.ok(game.state.alive, "test character should survive the first 20 years");
}
assert.equal(game.state.age, 20);
assert.ok(game.state.education.credentials.includes("primary"));
assert.ok(game.state.education.credentials.includes("secondary"));
assert.ok(Number.isFinite(game.netWorth()));

const store = new NC.SaveStore();
store.save("slot1", game.state);
const loaded = store.load("slot1");
assert.equal(loaded.profile.firstName, "Ada");
assert.equal(loaded.age, 20);
const exported = store.export(game.state);
assert.equal(store.import(exported).saveId, game.state.saveId);

const justiceGame = new NC.GameEngine(data);
justiceGame.createCharacter({ firstName: "Justice", lastName: "Test", identity: "woman", originId: "norway", upbringingId: "bookish", seed: "justice-test" });
justiceGame.devSetAge(18);
justiceGame.startIncarceration({ label: "Bank robbery", severity: "bank" }, 3);
assert.equal(justiceGame.isIncarcerated(), true);
const jailHtml = NC.View.jail({ game: justiceGame, data, store: { available: true }, lastSavedAt: null, tab: "jail" });
assert.match(jailHtml, /In custody/);
assert.match(jailHtml, /3 years remaining/);
assert.equal(justiceGame.currentSentence().yearsRemaining, 3);
assert.throws(() => justiceGame.startActivity(catalogs.activities[0].id), /incarcerated/);
assert.throws(() => justiceGame.relationshipAction(justiceGame.state.relationships[0].id, "talk"), /incarcerated/);
justiceGame.prisonAction("read");
justiceGame.ageUp();
assert.equal(justiceGame.currentSentence().yearsRemaining, 2);
justiceGame.ageUp();
justiceGame.ageUp();
assert.equal(justiceGame.isIncarcerated(), false);

const marriageGame = new NC.GameEngine(data);
marriageGame.createCharacter({ firstName: "Marriage", lastName: "Test", identity: "nonbinary", originId: "norway", upbringingId: "bookish", seed: "marriage-test" });
marriageGame.devSetAge(25);
marriageGame.devCash(100000);
marriageGame.devAddPartner();
marriageGame.state.dev.alwaysWin = true;
const partner = marriageGame.state.relationships.find((person) => person.role === "partner");
assert.ok(partner);
assert.equal(marriageGame.propose(partner.id, "simple"), true);
marriageGame.marry(partner.id, "simple", "spouse-takes", true);
assert.equal(partner.role, "spouse");
const relationshipHtml = NC.View.people({ game: marriageGame, data, store: { available: true }, lastSavedAt: null, tab: "people" });
assert.match(relationshipHtml, /Spouse &amp; partner|Spouse & partner/);
assert.match(relationshipHtml, /Relationship/);
assert.equal(partner.marriage.prenup, true);
marriageGame.divorce(partner.id);
assert.equal(partner.role, "ex");

const recordGame = new NC.GameEngine(data);
recordGame.createCharacter({ firstName: "Record", lastName: "Test", identity: "woman", originId: "norway", upbringingId: "bookish", specialTalent: "none", seed: "record-test" });
recordGame.devSetAge(25);
recordGame.state.education.credentials.push("secondary");
const entryJob = catalogs.jobs.find((job) => job.id === "office_coordinator");
const cleanChance = recordGame.jobApplicationChance(entryJob);
recordGame.state.crime.convictions = 3;
recordGame.state.crime.convictionHistory.push({ offense: "Bank robbery" });
const recordChance = recordGame.jobApplicationChance(entryJob);
assert.ok(recordChance < cleanChance, "a criminal record must make normal employment harder");

const assassinGame = new NC.GameEngine(data);
assassinGame.createCharacter({ firstName: "Shadow", lastName: "Test", identity: "nonbinary", originId: "norway", upbringingId: "bookish", specialTalent: "crime", seed: "assassin-test" });
assassinGame.devSetAge(25);
assert.equal(assassinGame.assassinCheck().allowed, false);
assassinGame.devUnlockAssassin();
assert.equal(assassinGame.assassinCheck().allowed, true);
assassinGame.joinAssassinCareer();
assert.equal(assassinGame.state.career.active.level, 1);
assassinGame.state.dev.alwaysWin = true;
assassinGame.state.dev.neverCaught = true;
for (let i = 0; i < 3; i += 1) { assassinGame.state.activityPoints = 2; assassinGame.assassinContract(); }
assert.equal(assassinGame.state.career.active.level, 2, "three level-one contracts should promote the assassin career");

// One-time challenges persist across generations and never award twice.
game.state.challenges.bankRobber.robberySucceededUncaught = true;
game.state.fame = 100;
game.updateChallenges();
const challengeScore = game.state.legacy.score;
assert.ok(game.state.legacy.completedChallenges.includes("bank_robber"));
game.updateChallenges();
assert.equal(game.state.legacy.score, challengeScore, "completed challenge must not award points twice");

game.devAddChild();
const heir = game.eligibleHeirs()[0];
assert.ok(heir, "developer child should be an eligible heir");
game.die("a test conclusion");
assert.equal(game.state.alive, false);
game.continueAs(heir.id);
assert.equal(game.state.alive, true);
assert.equal(game.state.legacy.generation, 2);
assert.equal(game.state.legacy.graveyard.length, 1);
assert.ok(game.state.legacy.completedChallenges.includes("bank_robber"), "challenge completion must persist to the heir");
assert.equal(game.state.challenges.bankRobber.completed, true);


// Country catalog and local flag assets.
assert.ok(catalogs.origins.length >= 21, "the world catalog should now contain at least twenty-one countries");
for (const origin of catalogs.origins) {
  assert.ok(origin.firstNamesByGender && origin.firstNamesByGender.woman.length >= 10, `${origin.id} needs country-aware names`);
  await fs.access(path.join(root, origin.flag));
}
const countryNameGame = new NC.GameEngine(data);
countryNameGame.createCharacter({ firstName: "Luna", lastName: "Aardal", identity: "woman", originId: "norway", upbringingId: "bookish", occult: "human", seed: "country-names" });
const norwegianWoman = countryNameGame.randomPerson("friend", { identity: "woman" });
assert.ok(catalogs.origins.find((item) => item.id === "norway").firstNamesByGender.woman.includes(norwegianWoman.firstName));
assert.equal(norwegianWoman.gender, "Woman");

// Annual events do not repeat unless explicitly marked repeatable.
const eventMap = new Map(events.map((event) => [event.id, event]));
const annualHistory = game.state.eventLedger.history.map((item) => item.eventId);
for (const id of new Set(annualHistory)) {
  const count = annualHistory.filter((item) => item === id).length;
  assert.ok(count === 1 || eventMap.get(id).repeatable === true, `${id} repeated without being marked repeatable`);
}


// Permanent event memory survives visible-history trimming and time travel.
const repeatGuardGame = new NC.GameEngine(data);
repeatGuardGame.createCharacter({ firstName: "Repeat", lastName: "Guard", identity: "nonbinary", originId: "sweden", upbringingId: "bookish", occult: "human", seed: "seen-ledger" });
const oneOffEvent = events.find((event) => !event.activityOnly && event.repeatable !== true && (!Number.isFinite(event.minAge) || event.minAge <= 20) && (!Number.isFinite(event.maxAge) || event.maxAge >= 20));
assert.ok(oneOffEvent, "a one-off annual event is required for the repeat guard test");
repeatGuardGame.state.age = 20;
repeatGuardGame.state.eventLedger.seenEventIds[oneOffEvent.id] = true;
repeatGuardGame.state.timeTravel.seenEventIds[oneOffEvent.id] = true;
repeatGuardGame.state.eventLedger.history = Array.from({ length: 180 }, (_, i) => ({ eventId: `trimmed-${i}`, age: i }));
assert.equal(repeatGuardGame.events.conditionsPass(repeatGuardGame.state, oneOffEvent), false, "a seen one-off event must stay blocked after history trimming");

// Born magic, later-life awakening, self age spells, and family reactions.
const magicGame = new NC.GameEngine(data);
magicGame.createCharacter({ firstName: "Mira", lastName: "Rune", identity: "woman", originId: "finland", upbringingId: "bookish", occult: "wizard", seed: "born-wizard" });
assert.equal(magicGame.state.flags.wizard, true);
assert.ok(magicGame.state.relationships.some((person) => person.role === "parent" && person.occult === "wizard"), "a born wizard should have a magical parent");
magicGame.devSetAge(20);
magicGame.state.activityPoints = 3;
magicGame.state.magic.mana = 100;
const manaBeforeInvalidSpell = magicGame.state.magic.mana;
const actionsBeforeInvalidSpell = magicGame.state.activityPoints;
assert.throws(() => magicGame.castSpell("age_up", "self", 19), /older/);
assert.equal(magicGame.state.magic.mana, manaBeforeInvalidSpell, "an invalid spell must not spend mana");
assert.equal(magicGame.state.activityPoints, actionsBeforeInvalidSpell, "an invalid spell must not spend an action");
const livingBeforeBabySpell = magicGame.state.relationships.filter((person) => person.alive !== false).length;
magicGame.castSpell("age_down", "self", 0);
assert.equal(magicGame.state.age, 0);
assert.equal(magicGame.state.flags.inParentalCare, true);
assert.ok(magicGame.state.timeline.some((entry) => /put you in a diaper/i.test(entry.text)), "age zero spell should create the requested care event");
assert.ok(magicGame.state.timeline.filter((entry) => /reacts$/i.test(entry.title)).length >= livingBeforeBabySpell, "every living relationship should react to the baby transformation");

const awakeningGame = new NC.GameEngine(data);
awakeningGame.createCharacter({ firstName: "Ari", lastName: "Vale", identity: "nonbinary", originId: "ireland", upbringingId: "bookish", occult: "human", seed: "later-wizard" });
awakeningGame.devSetAge(18);
awakeningGame.state.dev.alwaysWin = true;
awakeningGame.state.activityPoints = 2;
assert.equal(awakeningGame.attemptWizardTurning("awakening"), true);
assert.equal(awakeningGame.state.profile.occult, "wizard");

// Occult traits can be inherited by children.
let inheritedChild = null;
for (let i = 0; i < 20 && !inheritedChild; i += 1) {
  const child = magicGame.randomPerson("child", { age: 0 });
  if (child.occult === "wizard") inheritedChild = child;
}
assert.ok(inheritedChild, "wizard occult should be inheritable by generated children");

// Time travel restores the exact recorded state for that age while preserving the archive.
const timeGame = new NC.GameEngine(data);
timeGame.createCharacter({ firstName: "Tempo", lastName: "Test", identity: "man", originId: "france", upbringingId: "bookish", occult: "human", seed: "time-test" });
timeGame.devSetAge(5);
timeGame.state.finances.cash = 1234;
timeGame.state.stats.happiness = 41;
timeGame.touch("checkpoint-five");
timeGame.devSetAge(9);
timeGame.state.finances.cash = 98765;
timeGame.state.stats.happiness = 88;
timeGame.touch("checkpoint-nine");
assert.ok(timeGame.availableTimeTravelAges().includes(5));
assert.ok(timeGame.availableTimeTravelAges().includes(9));
timeGame.timeTravelToAge(5);
assert.equal(timeGame.state.age, 5);
assert.equal(timeGame.state.finances.cash, 1234);
assert.equal(timeGame.state.stats.happiness, 41);
assert.ok(timeGame.availableTimeTravelAges().includes(9), "future recorded ages should remain available after travelling back");

// Losing both parents while under 18 sends the character into orphanage care.
const orphanGame = new NC.GameEngine(data);
orphanGame.createCharacter({ firstName: "Orla", lastName: "Test", identity: "woman", originId: "uk", upbringingId: "bookish", occult: "human", seed: "orphan-test" });
orphanGame.devSetAge(10);
orphanGame.state.relationships.filter((person) => person.role === "parent").forEach((parent) => { parent.alive = false; parent.deathAge = parent.age; });
assert.equal(orphanGame.checkOrphanageStatus(), true);
assert.equal(orphanGame.state.flags.orphanage, true);
assert.ok(orphanGame.state.relationships.some((person) => person.role === "guardian"));

// Ribbons are awarded at death and saved to the inherited family collection.
const ribbonGame = new NC.GameEngine(data);
ribbonGame.createCharacter({ firstName: "Merlin", lastName: "Test", identity: "man", originId: "denmark", upbringingId: "bookish", occult: "wizard", seed: "ribbon-test" });
ribbonGame.devSetAge(80);
ribbonGame.state.metrics.magicSpells = 20;
ribbonGame.die("natural causes");
assert.equal(ribbonGame.state.death.ribbon, "archmage");
assert.ok(ribbonGame.state.legacy.ribbons.some((item) => item.id === "archmage"));

const activitiesHtml = NC.View.activities({ game: awakeningGame, data, store: { available: true }, lastSavedAt: null, tab: "activities" });
assert.match(activitiesHtml, /Time Travel/);
assert.match(activitiesHtml, /Magic &amp; Spells|Magic & Spells/);
assert.match(activitiesHtml, /Casino Arcade/);
assert.match(activitiesHtml, /Free play tokens/i);

// v1.6 currency conversion, exact-city relocation, personalized market, arcade, lifespan and fugitive checks.
assert.ok(catalogs.origins.find((item) => item.id === "norway").cities.includes("Molde"), "Norway should include Molde");
assert.ok(catalogs.origins.find((item) => item.id === "france").cities.includes("Lille"), "France should include Lille");
const convertedNorway = NC.Utils.formatMoney(50000, "NOK");
assert.match(convertedNorway, /kr|NOK/);
assert.ok(!convertedNorway.includes("50\u00a0000") && !convertedNorway.includes("50,000"), "50,000 common-base units should not display as only 50,000 NOK");

const cityGame = new NC.GameEngine(data);
cityGame.createCharacter({ firstName: "City", lastName: "Test", identity: "woman", originId: "norway", upbringingId: "bookish", occult: "human", seed: "city-test" });
cityGame.devSetAge(22);
cityGame.devCash(100000);
cityGame.state.activityPoints = 2;
const norwayDestination = cityGame.state.profile.city === "Molde" ? "Bergen" : "Molde";
cityGame.relocate("norway", norwayDestination);
assert.equal(cityGame.state.profile.city, norwayDestination);
assert.equal(cityGame.state.market.city, norwayDestination);
cityGame.state.activityPoints = 2;
cityGame.relocate("france", "Lille");
assert.equal(cityGame.state.profile.city, "Lille");
assert.equal(cityGame.state.profile.currency, "EUR");
assert.ok(cityGame.state.market.listings.every((item) => item.location.includes("Lille")));
assert.ok(cityGame.state.market.listings.every((item) => NC.Utils.assetSvg(item).startsWith("data:image/svg+xml")));
const listing = cityGame.state.market.listings.find((item) => item.kind !== "property");
const cashBeforePurchase = cityGame.state.finances.cash;
const bought = cityGame.buyMarketListing(listing.id);
assert.ok(cityGame.state.assets.some((item) => item.instanceId === bought.instanceId));
assert.ok(cityGame.state.finances.cash < cashBeforePurchase);

const arcadeGame = new NC.GameEngine(data);
arcadeGame.createCharacter({ firstName: "Arcade", lastName: "Test", identity: "nonbinary", originId: "ireland", upbringingId: "bookish", occult: "human", seed: "arcade-test" });
arcadeGame.devSetAge(18);
arcadeGame.state.activityPoints = 2;
const arcadeCash = arcadeGame.state.finances.cash;
const round = arcadeGame.beginCasinoArcade();
arcadeGame.resolveCasinoArcade(round.winningIndex);
assert.equal(arcadeGame.state.finances.cash, arcadeCash, "the no-stakes arcade must never change cash");
assert.ok(arcadeGame.state.casino.score > 0);

const vampireLife = new NC.GameEngine(data);
vampireLife.createCharacter({ firstName: "Vera", lastName: "Night", identity: "woman", originId: "uk", upbringingId: "bookish", occult: "vampire", seed: "immortal-vampire" });
vampireLife.state.age = 500;
vampireLife.state.stats.health = 100;
for (let i = 0; i < 20; i += 1) assert.equal(vampireLife.mortalityCheck(), null, "vampires must not die from old age");

const wizardLife = new NC.GameEngine(data);
wizardLife.createCharacter({ firstName: "Wyn", lastName: "Rune", identity: "man", originId: "finland", upbringingId: "bookish", occult: "wizard", seed: "wizard-life" });
wizardLife.state.age = 70;
wizardLife.state.stats.health = 100;
for (let i = 0; i < 20; i += 1) assert.equal(wizardLife.mortalityCheck(), null, "healthy wizards should not face old-age mortality before 75");

const fugitiveGame = new NC.GameEngine(data);
fugitiveGame.createCharacter({ firstName: "Run", lastName: "Away", identity: "nonbinary", originId: "usa", upbringingId: "bookish", occult: "human", seed: "fugitive-recapture" });
fugitiveGame.devSetAge(25);
fugitiveGame.state.flags.fugitive = true;
fugitiveGame.state.fame = 100;
fugitiveGame.state.crime.fugitiveSentence = { id: "old-sentence", offense: "Burglary", severity: "burglary", originalYears: 5, yearsRemaining: 4, servedYears: 1, startedAge: 23, facility: "Regional correctional facility", security: "medium", conduct: 30, appealsUsed: 0, escaped: true };
fugitiveGame.state.dev.neverCaught = false;
let recaptured = false;
for (let i = 0; i < 30 && !recaptured && fugitiveGame.state.alive; i += 1) {
  if (fugitiveGame.state.pendingEvent) {
    const ev = fugitiveGame.events.byId(fugitiveGame.state.pendingEvent.eventId);
    const ch = ev && ev.choices.find((item) => fugitiveGame.events.choiceAvailable(fugitiveGame.state, item).allowed);
    if (ch) { fugitiveGame.resolveChoice(ch.id); fugitiveGame.completeEvent(); }
  }
  const result = fugitiveGame.ageUp();
  recaptured = Boolean(result && result.recaptured) || fugitiveGame.isIncarcerated();
}
assert.equal(recaptured, true, "high fame should make fugitive recapture likely within repeated annual checks");
assert.equal(fugitiveGame.state.flags.fugitive, false);

const gameHtmlV16 = NC.View.game({ game: cityGame, data, store: { available: true }, lastSavedAt: null, tab: "life" });
assert.match(gameHtmlV16, /v18-bottom-dock/);
assert.match(gameHtmlV16, /Bank Balance/i);
assert.match(gameHtmlV16, /NEXT CHAPTER/i);

const creatorHtml = NC.View.creator({ data, creatorDraft: { firstName: "Luna", lastName: "Aardal", identity: "woman", originId: "norway", upbringingId: "bookish", occult: "wizard", specialTalent: "none", skin: "#d8a47f", hair: "#4a3028", eye: "#49392f", accent: "#6a5acd", hairStyle: "long", accessory: "none" } });
assert.match(creatorHtml, /assets\/flags\/norway\.png/);
assert.match(creatorHtml, /Wizard \/ Witch/);


// Dynamic fertility, family-building, age locks, and pronoun-template checks.
const familyGame = new NC.GameEngine(data);
familyGame.createCharacter({ firstName: "Rowan", lastName: "Vale", identity: "woman", reproductiveRole: "carry", originId: "france", upbringingId: "bookish", occult: "human", seed: "family-v19" });
assert.equal(familyGame.state.profile.reproductiveRole, "carry");
assert.equal(familyGame.biologicalSuccessMetric(familyGame.state), 0, "family-building score is inactive before adulthood");
familyGame.devSetAge(25);
familyGame.state.stats.health = 90;
familyGame.devAddPartner();
const familyPartner = familyGame.currentPartnerForFamily();
familyPartner.identity = "man";
familyPartner.reproductiveRole = "contribute";
familyPartner.age = 26;
familyPartner.health = 88;
familyGame.state.activityPoints = 5;
familyGame.state.finances.cash = 100000;
const naturalNoProtection = familyGame.familyMethodEstimate("natural");
assert.equal(naturalNoProtection.allowed, true);
assert.ok(naturalNoProtection.chance > 0);
familyGame.setContraception("implant");
const naturalProtected = familyGame.familyMethodEstimate("natural");
assert.ok(naturalProtected.chance < naturalNoProtection.chance, "contraception must reduce natural attempt chance");
familyGame.setContraception("none");
familyGame.state.dev.alwaysFertilitySuccess = true;
assert.equal(familyGame.familyPlanningAction("ivf"), true);
assert.ok(familyGame.state.familyPlanning.pendingPregnancy, "successful medical route should create a pending family event");
const childrenBeforeArrival = familyGame.state.relationships.filter((person) => person.role === "child").length;
familyGame.ageUp();
assert.equal(familyGame.state.relationships.filter((person) => person.role === "child").length, childrenBeforeArrival + 1, "pending pregnancy should resolve on the next age-up");

const adoptionGame = new NC.GameEngine(data);
adoptionGame.createCharacter({ firstName: "Adopt", lastName: "Test", identity: "nonbinary", reproductiveRole: "assisted", originId: "ireland", upbringingId: "bookish", occult: "human", seed: "adopt-v19" });
adoptionGame.devSetAge(30);
adoptionGame.state.activityPoints = 3;
adoptionGame.state.finances.cash = 100000;
adoptionGame.state.finances.annualIncome = 50000;
assert.equal(adoptionGame.familyMethodEstimate("adoption").allowed, true);
adoptionGame.state.crime.convictions = 1;
assert.equal(adoptionGame.familyMethodEstimate("adoption").allowed, false, "criminal records should block the clean-record adoption program");

const youthGame = new NC.GameEngine(data);
youthGame.createCharacter({ firstName: "Teen", lastName: "Test", identity: "nonbinary", reproductiveRole: "assisted", originId: "norway", upbringingId: "bookish", occult: "human", seed: "youth-v19" });
youthGame.devSetAge(12);
youthGame.state.activityPoints = 2;
assert.throws(() => youthGame.lifestyleAction("social_media"), /age 13/i);
youthGame.devSetAge(13);
youthGame.state.activityPoints = 2;
youthGame.lifestyleAction("social_media");
assert.equal(youthGame.state.social.posts, 1);

const prisonFamilyGame = new NC.GameEngine(data);
prisonFamilyGame.createCharacter({ firstName: "Locked", lastName: "Test", identity: "woman", reproductiveRole: "carry", originId: "sweden", upbringingId: "bookish", occult: "human", seed: "locked-family-v19" });
prisonFamilyGame.devSetAge(25);
prisonFamilyGame.startIncarceration({ label: "Burglary", severity: "property" }, 2);
assert.equal(prisonFamilyGame.familyMethodEstimate("ivf").allowed, false);
const prisonActivitiesHtml = NC.View.activities({ game: prisonFamilyGame, data, store, tab: "activities" });
assert.match(prisonActivitiesHtml, /In custody/);

const templated = NC.Utils.personTemplate("{personFirstName} said {personSubject} would bring {personPossessive} notes.", familyGame.state, { firstName: "Alex", identity: "nonbinary", age: 22 });
assert.equal(templated, "Alex said they would bring their notes.");
const activitiesHtmlV19 = NC.View.activities({ game: familyGame, data, store, tab: "activities" });
assert.match(activitiesHtmlV19, /Health &amp; Wellness|Health & Wellness/);
assert.match(activitiesHtmlV19, /Fertility &amp; Adoption|Fertility & Adoption/);
const familyModalHtml = NC.View.familyPlanningModal({ game: familyGame, data, store });
assert.match(familyModalHtml, /Biological success/);
assert.match(familyModalHtml, /Artificial insemination/);


// Dynamic activity-centre checks.
const dynamicGame = new NC.GameEngine(data);
dynamicGame.createCharacter({ firstName: "Dyna", lastName: "Test", identity: "nonbinary", reproductiveRole: "assisted", originId: "norway", upbringingId: "bookish", occult: "human", specialTalent: "sports", seed: "dynamic-v20" });
dynamicGame.devSetAge(15);
dynamicGame.state.finances.cash = 250000;
dynamicGame.state.activityPoints = 20;
assert.equal(dynamicGame.activityOptionEstimate("licenses", "driver").allowed, false, "driver licensing should stay age-locked before 16");
dynamicGame.devSetAge(18);
dynamicGame.state.activityPoints = 20;
assert.equal(dynamicGame.activityOptionEstimate("licenses", "driver").allowed, true);
dynamicGame.state.dev.alwaysActivitySuccess = true;
const healthBeforeDynamic = dynamicGame.state.stats.health;
dynamicGame.performDynamicActivity("wellness", "gym");
assert.ok(dynamicGame.state.stats.health >= healthBeforeDynamic, "successful gym activity should improve health");
dynamicGame.performDynamicActivity("licenses", "driver");
assert.ok(dynamicGame.state.activitySystems.licenses.owned.includes("driver"), "successful licensing test should grant the license");
const followersBeforeDynamic = dynamicGame.state.social.followers;
dynamicGame.performDynamicActivity("social", "creative");
assert.ok(dynamicGame.state.social.followers > followersBeforeDynamic, "dynamic social media post should add followers");
const dynamicActivitiesHtml = NC.View.activities({ game: dynamicGame, data, store, tab: "activities" });
assert.match(dynamicActivitiesHtml, /open-activity-center/);
const dynamicModalHtml = NC.View.activityCenterModal({ game: dynamicGame, data, store, modal: { center: "wellness" } });
assert.match(dynamicModalHtml, /Estimated result chance/);
assert.match(dynamicModalHtml, /Visit a doctor/);
const jailedDynamic = new NC.GameEngine(data);
jailedDynamic.createCharacter({ firstName: "Jail", lastName: "Dynamic", identity: "man", originId: "france", upbringingId: "bookish", seed: "jailed-dynamic-v20" });
jailedDynamic.devSetAge(25);
jailedDynamic.state.finances.cash = 100000;
jailedDynamic.state.activityPoints = 10;
jailedDynamic.startIncarceration({ label: "Burglary", severity: "property" }, 2);
assert.equal(jailedDynamic.activityOptionEstimate("travel", "domestic").allowed, false, "jail must block outside dynamic activities");


// Investment expansion and wiki checks.
const investmentGame = new NC.GameEngine(data);
investmentGame.createCharacter({ firstName: "Ivy", lastName: "Investor", identity: "woman", reproductiveRole: "carry", originId: "norway", upbringingId: "bookish", occult: "human", specialTalent: "business", seed: "investment-v21" });
assert.equal(investmentGame.state.investment.companies.length, 12, "each life should receive twelve fictional companies");
const firstCompany = investmentGame.state.investment.companies[0];
assert.equal(investmentGame.investmentCanTrade(firstCompany.id, 1, "buy").allowed, false, "trading should stay age-locked before adulthood");
investmentGame.devSetAge(25);
investmentGame.state.finances.cash = 1000000;
assert.equal(investmentGame.investmentCanTrade(firstCompany.id, 10, "buy").allowed, true);
const cashBeforeInvestment = investmentGame.state.finances.cash;
investmentGame.buyInvestmentShares(firstCompany.id, 10);
assert.equal(investmentGame.investmentHolding(firstCompany.id).shares, 10);
assert.ok(investmentGame.state.finances.cash < cashBeforeInvestment);
const priceBeforeAdvance = firstCompany.price;
investmentGame.state.dev.investmentAlwaysProfits = true;
investmentGame.state.year += 1;
investmentGame.advanceInvestmentMarket();
assert.ok(firstCompany.price > priceBeforeAdvance, "profitable-market cheat should make the next market year rise");
const portfolioBeforeSale = investmentGame.investmentPortfolioValue();
investmentGame.sellInvestmentShares(firstCompany.id, 5);
assert.equal(investmentGame.investmentHolding(firstCompany.id).shares, 5);
assert.ok(portfolioBeforeSale > investmentGame.investmentPortfolioValue());
const expansionHtml = NC.View.expansions({ game: investmentGame, data, store, tab: "expansions" });
assert.match(expansionHtml, /Investment Expansion/);
assert.match(expansionHtml, /Company market/);
assert.match(expansionHtml, /Portfolio value/);
const expansionActivitiesHtml = NC.View.activities({ game: investmentGame, data, store, tab: "activities" });
assert.match(expansionActivitiesHtml, /Investment Expansion/);
const jailedInvestor = new NC.GameEngine(data);
jailedInvestor.createCharacter({ firstName: "Locked", lastName: "Investor", identity: "nonbinary", originId: "france", upbringingId: "bookish", seed: "locked-investor" });
jailedInvestor.devSetAge(24);
jailedInvestor.state.finances.cash = 100000;
jailedInvestor.startIncarceration({ label: "Burglary", severity: "property" }, 2);
assert.equal(jailedInvestor.investmentCanTrade(jailedInvestor.state.investment.companies[0].id, 1, "buy").allowed, false, "jail must block investment trading");

// v2.3 age-up headlines, crypto, business, landlord, social, and fame checks.
const v23Game = new NC.GameEngine(data);
v23Game.createCharacter({ firstName: "Nova", lastName: "Builder", identity: "nonbinary", reproductiveRole: "assisted", originId: "canada", upbringingId: "bookish", occult: "human", specialTalent: "business", seed: "v23-expansions" });
assert.equal(v23Game.state.crypto.coins.length, 8, "each life should receive eight fictional crypto assets");
assert.throws(() => v23Game.buyCrypto(v23Game.state.crypto.coins[0].id, 1), /age 18/i, "crypto should stay age-locked");
v23Game.devSetAge(30);
v23Game.state.finances.cash = 10000000;
const firstCoin = v23Game.state.crypto.coins[0];
v23Game.buyCrypto(firstCoin.id, 10);
assert.ok(v23Game.cryptoHolding(firstCoin.id).units >= 10);
const cryptoBefore = firstCoin.price;
v23Game.state.dev.cryptoAlwaysProfits = true;
v23Game.state.year += 1;
v23Game.advanceCryptoMarket();
assert.ok(firstCoin.price > cryptoBefore, "crypto profit cheat should force positive movement");
v23Game.sellCrypto(firstCoin.id, 2);
assert.ok(v23Game.cryptoHolding(firstCoin.id).units < 10);
const cryptoHtml = NC.View.cryptoModal({ game: v23Game, data, store, modal: { type: "v23-crypto" } });
assert.match(cryptoHtml, /Crypto Expansion/);
assert.match(cryptoHtml, /Market headlines/);

const business = v23Game.startBusiness("cafe", "Nova Corner Café");
assert.equal(v23Game.state.businesses.owned.length, 1);
v23Game.state.dev.businessAlwaysProfits = true;
const businessUpdates = v23Game.advanceBusinesses();
assert.ok(businessUpdates[0].profit >= 0);
v23Game.businessAction(business.id, "advertise");
assert.ok(business.advertising > 0);
const businessHtml = NC.View.businessModal({ game: v23Game, data, store, modal: { type: "v23-business" } });
assert.match(businessHtml, /Business Expansion/);
assert.match(businessHtml, /Nova Corner Café/);

v23Game.rentHome("studio");
assert.equal(v23Game.state.housing.rentalHome.typeId, "studio");
const landlord = v23Game.buyLandlordProperty("small_flat");
assert.equal(v23Game.state.housing.landlordProperties.length, 1);
v23Game.state.dev.landlordAlwaysOccupied = true;
const housingUpdates = v23Game.advanceHousing();
assert.ok(housingUpdates.length >= 2);
assert.ok(landlord.value > 0);
const housingHtml = NC.View.housingModal({ game: v23Game, data, store, modal: { type: "v23-housing" } });
assert.match(housingHtml, /Renting &amp; Landlord Expansion|Renting & Landlord Expansion/);
assert.match(housingHtml, /Landlord properties/);

v23Game.state.activityPoints = 20;
v23Game.state.dev.alwaysActivitySuccess = true;
v23Game.state.social.followers = 150000;
const reputationBefore = v23Game.state.social.reputation;
v23Game.performDynamicActivity("social", "premium_brand");
assert.ok(v23Game.state.social.reputation >= reputationBefore);
assert.equal(v23Game.state.social.monetized, true);
const socialModal = NC.View.activityCenterModal({ game: v23Game, data, store, modal: { center: "social" } });
assert.match(socialModal, /Engagement/);
assert.match(socialModal, /Premium sponsorship/);
const fameModal = NC.View.activityCenterModal({ game: v23Game, data, store, modal: { center: "fame" } });
assert.match(fameModal, /Public image/);
assert.match(fameModal, /red-carpet/i);

const updateGame = new NC.GameEngine(data);
updateGame.createCharacter({ firstName: "Update", lastName: "Tester", identity: "woman", originId: "norway", upbringingId: "bookish", seed: "age-headline-v23" });
updateGame.devSetAge(30);
const siblingUpdate = updateGame.state.relationships.find((person) => person.role === "sibling") || updateGame.randomPerson("sibling", { age: 5, identity: "woman" });
if (!updateGame.state.relationships.includes(siblingUpdate)) updateGame.state.relationships.push(siblingUpdate);
siblingUpdate.age = 5;
updateGame.ageUp();
assert.ok(updateGame.state.timeline.some((entry) => /graduated kindergarten/i.test(entry.title)), "age-up should create compact family milestone headlines");
const lifeHtmlV23 = NC.View.v16Life({ game: updateGame, data, store, tab: "life" });
assert.match(lifeHtmlV23, /Life updates/);
assert.match(lifeHtmlV23, /graduated kindergarten/i);
assert.ok(v23Game.netWorth() >= v23Game.cryptoPortfolioValue() + v23Game.businessPortfolioValue() + v23Game.landlordPortfolioValue() - v23Game.state.finances.debt);

const guideHtml = await fs.readFile(path.join(root, "guide.html"), "utf8");
assert.match(guideHtml, /Next Chapter Wiki/);
assert.match(guideHtml, /Investment Expansion/);
assert.match(guideHtml, /Crypto Expansion/);
assert.match(guideHtml, /Business Expansion/);
assert.match(guideHtml, /Renting &amp; Landlord Expansion|Renting & Landlord Expansion/);
assert.match(guideHtml, /compact age-up updates/i);
for (const wikiPage of ["Life-Updates.md", "Crypto-Expansion.md", "Business-Expansion.md", "Renting-and-Landlords.md", "Social-Media-and-Fame.md"]) {
  await fs.access(path.join(root, "wiki", wikiPage));
}


// v2.4 country funding, surgery, and vampire expansion.
const fundedChild = new NC.GameEngine(data);
fundedChild.createCharacter({ firstName: "Freja", lastName: "Public", identity: "woman", reproductiveRole: "carry", originId: "norway", upbringingId: "bookish", occult: "human", seed: "v24-funded-child" });
fundedChild.state.age = 12;
fundedChild.state.activityPoints = 5;
fundedChild.state.finances.cash = 0;
const childDoctor = fundedChild.activityOptionEstimate("wellness", "doctor");
assert.equal(childDoctor.cost, 0, "a child with a living parent sponsor should not personally pay for healthcare");
assert.equal(childDoctor.allowed, true);
fundedChild.performDynamicActivity("wellness", "doctor");
assert.equal(fundedChild.state.finances.cash, 0);

const orphanCare = new NC.GameEngine(data);
orphanCare.createCharacter({ firstName: "Alex", lastName: "Orphan", identity: "nonbinary", reproductiveRole: "assisted", originId: "usa", upbringingId: "bookish", occult: "human", seed: "v24-orphan-care" });
orphanCare.state.age = 12;
orphanCare.state.flags.orphanage = true;
orphanCare.state.relationships.filter((person) => person.role === "parent").forEach((person) => { person.alive = false; });
assert.ok(orphanCare.activityOptionEstimate("wellness", "doctor").cost > 0, "an orphanage child should use country coverage rather than a parent sponsor");

const tuitionGame = new NC.GameEngine(data);
tuitionGame.createCharacter({ firstName: "Lina", lastName: "Student", identity: "woman", reproductiveRole: "carry", originId: "germany", upbringingId: "bookish", occult: "human", seed: "v24-college" });
tuitionGame.state.age = 18;
tuitionGame.state.education.credentials = ["primary", "secondary"];
const college = data.catalogs.education.find((item) => item.id === "college");
assert.equal(tuitionGame.educationAnnualCost(college), 0, "Germany should use the simplified tuition-free public college model");

const surgeryGame = new NC.GameEngine(data);
surgeryGame.createCharacter({ firstName: "Mira", lastName: "Clinic", identity: "nonbinary", reproductiveRole: "both", originId: "france", upbringingId: "bookish", occult: "human", seed: "v24-surgery" });
surgeryGame.state.age = 30;
surgeryGame.state.activityPoints = 20;
surgeryGame.state.finances.cash = 1000000;
surgeryGame.state.dev.surgeryAlwaysSucceeds = true;
const noseDoctor = surgeryGame.surgeonOffers("nose")[1];
const lookBefore = surgeryGame.state.stats.looks;
const surgeryResult = surgeryGame.performCosmeticProcedure("nose", noseDoctor.id);
assert.equal(surgeryResult.success, true);
assert.ok(surgeryGame.state.stats.looks >= lookBefore);
assert.ok(NC.View.cosmeticModal({ game: surgeryGame, data, store, modal: { type: "v24-cosmetic" } }).includes("Surgery Clinic"));

const vampireGame = new NC.GameEngine(data);
vampireGame.createCharacter({ firstName: "Vale", lastName: "Nocturne", identity: "woman", reproductiveRole: "carry", originId: "france", upbringingId: "bookish", occult: "vampire", seed: "v24-vampire" });
vampireGame.state.age = 30;
vampireGame.state.activityPoints = 20;
vampireGame.state.finances.cash = 5000000;
vampireGame.ensureExpansionState();
assert.ok(vampireGame.state.vampire.goals.length === 3);
assert.equal(vampireGame.familyMethodEstimate("natural").allowed, false, "vampires should not use biological family-building routes");
vampireGame.state.dev.vampireAlwaysSucceeds = true;
const huntResult = vampireGame.vampireHunt("old_quarter", "befriend");
assert.equal(huntResult.success, true);
vampireGame.buyVampireProperty("lair");
assert.equal(vampireGame.state.vampire.properties.length, 1);
vampireGame.vampireChooseLockedStat("looks");
assert.equal(vampireGame.state.stats.looks, 100);
assert.ok(NC.View.vampireModal({ game: vampireGame, data, store, modal: { type: "v24-vampire" } }).includes("Vampire Expansion"));



// v2.5 major enterprises, collections, and special careers.
const v25Game = new NC.GameEngine(data);
v25Game.createCharacter({ firstName: "Nova", lastName: "Vale", identity: "woman", originId: "france", upbringingId: "bookish", occult: "human", specialTalent: "business", seed: "v25-systems" });
v25Game.devSetAge(30);
v25Game.state.finances.cash = 50000000;
v25Game.state.activityPoints = 20;
v25Game.state.dev.specialCareerAlwaysSucceeds = true;
const museum = v25Game.startEnterprise("museum", "Vale Museum");
assert.equal(v25Game.state.enterprises.owned.length, 1, "major enterprise should be created");
v25Game.enterpriseAction(museum.id, "improve");
assert.ok(museum.appeal > 45, "enterprise upgrade should improve appeal");
const firstLot = v25Game.state.collections.market[0];
const collectible = v25Game.buyCollectible(firstLot.id);
assert.equal(v25Game.state.collections.owned.length, 1, "auction purchase should add a collectible");
v25Game.appraiseCollectible(collectible.id);
v25Game.displayCollectible(collectible.id, museum.id);
assert.equal(collectible.displayedAt, museum.id, "collectible should be displayable in a museum");
const career = v25Game.startSpecialCareer("astronaut");
assert.ok(career, "developer success control should guarantee special-career entry");
v25Game.specialCareerAction("work");
assert.ok(v25Game.state.specialCareer.completedActions >= 1, "successful special-career opportunity should be recorded");
assert.ok(v25Game.enterprisePortfolioValue() > 0 && v25Game.collectionPortfolioValue() > 0, "v2.5 assets should have portfolio value");
assert.ok(typeof NC.View.enterpriseModal === "function" && typeof NC.View.collectionModal === "function" && typeof NC.View.specialCareerModal === "function", "v2.5 expansion views should exist");

console.log(`All tests passed: ${events.length} events, ${catalogs.jobs.length} jobs, ${catalogs.assets.length} assets, lifecycle, fertility, dynamic activities, investments, crypto, businesses, landlords, enterprises, auctions, special careers, social/fame, age-up headlines, wiki, save, and inheritance checks.`);
