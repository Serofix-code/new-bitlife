# Next Chapter

## Version 2.1.0 — Wiki and Investment Expansion

- Added a new **Expansions** menu.
- Added the first expansion: **Investment Expansion**.
- Every life receives twelve random fictional companies with sectors, prices, risk levels, volatility, dividend yields, news, and long-term price histories.
- Trading unlocks at age 18; company research unlocks at age 16.
- Added purchases, sales, average cost, realized and unrealized results, dividends, annual market updates, and transaction history.
- Added investment developer cheats for cash, shares, booms, crashes, positive markets, fee removal, outlook reveals, portfolio maximization, and reset.
- Added an in-game **Game Guide & Wiki** page at `guide.html`.
- Added a complete `wiki/` set plus `PUSH_WIKI.ps1` for publishing to the GitHub Wiki.
- Existing saves migrate automatically.

[Open the browser guide](guide.html) · See `WIKI_SETUP.md` for GitHub Wiki publishing.

## Version 2.0.0 — dynamic activity centres

The variable-driven system introduced for fertility now applies across the main Activities menu. Health & Mind, Social Media, Clubs & Teams, Licenses, Civil Law, Vacations, Movie Theater, Nightlife, Fame Actions, Pets, and Style & Appearance each have dedicated submenus with changing metrics, estimated outcome chances, costs, requirements, persistent progress, and recent-history records.

Outcomes react to the character's age, health, happiness, knowledge, resilience, special talent, fame, followers, finances, career, housing, criminal record, and prior experience. Jail still replaces all outside activity options. Existing v1.9 saves migrate automatically.

The repository includes a GitHub Pages workflow, release notes, a source-available non-commercial license, and `PUBLISH_TO_GITHUB.md`.

## Version 1.9.0 — dynamic fertility, age-locked activities, and mobile flow

- Added a 0–100 biological success score driven by adulthood, age curves, health, reproductive role, and occult modifiers.
- Added customizable reproductive roles in character creation, separate from gender identity.
- Added natural attempts, artificial insemination, IVF, surrogacy, and adoption through a dedicated family-building center.
- Contraception now acts as a real multiplier on natural success chance, including a 0.01 long-acting option.
- Surrogacy includes randomized contract and medical-delay events without graphic content.
- Adoption checks adulthood, stable income or savings, and a clean criminal record.
- Successful biological or surrogacy routes create a pending family event that resolves on the next age-up instead of instantly creating a child.
- Rebuilt Activities into an age-locked matrix: childhood care and play, teen social media/clubs/part-time jobs, and full adult health, travel, assets, legal, family, and leisure sections.
- Jail still overrides the outside world and shows only prison actions, appeals, relationship calls, developer tools, and age-up.
- Added a reusable relationship-person template with correct subject, object, possessive, and reflexive pronouns.
- Tightened the mobile dashboard proportions, centered the desktop build at phone-like width, and completed dark/light styling for the new screens.
- Added developer cheats for guaranteed fertility, ignoring activity age locks, maximizing fertility, and clearing family-planning history.


## Version 1.5.0 — magic, time travel, countries, and ribbons

- Annual story events are remembered by a permanent event-ID ledger. Ordinary annual events can happen only once per life; explicitly repeatable events use a cooldown and do not return every year.
- Expanded the event library to 92 events, including more childhood, school, family, adult-life, country, wizard, and activity stories.
- Added exact-age time travel. Every recorded age stores a full life snapshot, and returning to it restores money, relationships, career, country, stats, crimes, events, and family state from that age.
- Added inheritable Wizard/Witch/Mage lives. Characters may be born magical or awaken later through a grimoire, mentor, spontaneous awakening, or family ritual.
- Added Age Down, Age Up, Give Magic, Restoration, Fortune, Relationship Charm, and an abstract forbidden Inferno spell with police and court consequences.
- Added Norway, France, the United States, Sweden, Denmark, the United Kingdom, Ireland, Finland, and Russia, with local PNG flags, country-based cities, currencies, and curated name pools.
- Rebuilt Activities as an original portrait-friendly row interface inspired by the supplied reference. It includes Accessories, Adoption, a no-stakes casino-resort outing, Crime, Doctor, Emigration, Fame, Fertility, Magic, and Time Travel.
- Relationship entries now include gender, pronouns, occult status, portraits, roles, age, and relationship bars.
- If both parents die while the character is under 18, the character is placed in orphanage care and assigned a guardian.
- Added a permanent family ribbon collection. A life earns one ribbon at death, and earned ribbons remain available across generations.

Next Chapter is an original, offline-first browser life simulator. Create a person, age through a complete life, choose how to respond to events, build relationships and a career, manage money and possessions, and continue the family story through a child.

The project is dependency-free. The game runs by opening `index.html` directly and does not need a web server, package installation, account, network connection, ads, analytics, or a build step.

## Play

1. Extract or copy the whole project folder to a permanent location.
2. Double-click `index.html`.
3. Create a character or import a previously exported JSON save.
4. Spend the two annual action points on relationships, applications, work, or activities, then choose **Age up**.

Chrome, Edge, and Firefox are suitable. Browser saving for pages opened through `file://` can vary by browser and folder location. The game detects unavailable storage and continues in memory; use **Save & export → Export JSON** for a portable backup.

Do not move only `index.html`. Its `css`, `js`, `data`, and `assets` folders must stay beside it.

## Play on your phone with the included home server

The easiest Windows setup is:

1. Connect the PC and phone to the same Wi-Fi network.
2. Double-click **`start-phone-server.bat`**.
3. Keep the black server window open. It displays both a PC address and a phone address, usually similar to `http://192.168.1.25:8080/`.
4. Type the displayed **Phone** address into the phone browser.
5. In **Save & export**, use **Save to home server** on one device and **Load from home server** on the other to transfer the same life.

The server uses only Python's standard library. It serves the game on the local network and stores one optional shared save in `.next-chapter-server-save.json`. This setup is designed for a private home network, not for exposing the game directly to the public internet. If Windows asks whether Python may communicate through the firewall, allow it on **Private networks** only.

The phone can also add the game to its home screen after opening the server address. A service worker caches the main game files for offline reopening, though the shared-save buttons require the PC server to be running.

## Included systems

- Responsive desktop and mobile layouts
- Character creation with identity, nine real countries, upbringing, special talent, human/vampire/wizard occult nature, seeded randomness, and generated family
- A one-year age-up pipeline with milestones, a chronological life journal, permanent event memory, and exact-age snapshot time travel
- Grouped relationship lists with portraits, relationship bars, parents, siblings, children, stepchildren, friends, dating, engagement, marriage, prenups, surname choices, divorce, exes, reconciliation, widowhood, inheritance, funeral choices, and vow renewals
- Automatic primary/secondary education plus trade, college, and graduate programs
- Qualification-gated jobs, applications, salary, performance, promotion, resignation, layoffs, and retirement
- Cash flow, living costs, taxes, tuition debt, loan interest, net worth, homes, possessions, upkeep, condition, appreciation, depreciation, buying, and selling
- Health, happiness, knowledge, and resilience stats
- Manual activities and 92 weighted choice events with age/state filters; annual stories default to once per life unless explicitly repeatable
- Mortality, ribbons, estate settlement, occult inheritance, child succession, orphanage care, family graveyard, and multi-generation play
- Autosave, three named browser slots, JSON export/import, schema migration, storage fallback, and optional one-slot home-server synchronization between PC and phone
- Developer controls for age, cash, stats, heirs, partners, forced death, event-by-ID testing, guaranteed outcomes, fame, challenges, criminal records, and instant release
- Separate editable JSON catalogs/events with an offline JavaScript mirror for direct `file://` play

## Controls and game flow

The main sections are:

- **Life** — the newest journal entries appear first.
- **People** — spend time, talk, or give a small gift. These use action points.
- **Path** — monitor education and work; enroll, apply, focus at work, resign, or retire.
- **Assets** — review finances and buy/sell property or possessions.
- **Activities** — open choice events that can improve stats or create relationships.
- **Developer** — deterministic testing controls. This menu is intentionally visible in this development build.

At death, living children are offered as successor characters. Cash is applied to debt first; 10% estate costs are deducted from any cash remainder. Owned assets transfer with any property-linked debt the cash could not settle. The generation increases, and the deceased character remains in the family graveyard. If there is no child, start an unrelated new life.

## Saving and portability

Every state-changing action writes the active life to the `autosave` browser slot when local storage is available. The save dialog also has three named slots.

JSON exports use this envelope:

```json
{
  "format": "next-chapter-life-save",
  "formatVersion": 1,
  "appVersion": "1.0.0",
  "exportedAt": "2026-01-01T00:00:00.000Z",
  "state": {}
}
```

Imports are size-limited, reject unsafe object keys, validate required character/state fields, clamp stats, and refuse saves from unsupported future schema versions. The current save is not replaced unless an import parses and validates successfully.

Useful backup workflow:

1. Open **Save & export**.
2. Write the current state to a named slot for a local checkpoint.
3. Export JSON before moving browsers, clearing browser data, or moving the project folder.
4. Use **Import JSON save** from the title screen or save dialog to restore it.

## Project structure

```text
next-chapter-life-sim/
├── index.html                 # directly playable entry point
├── README.md
├── package.json               # optional contributor shortcuts
├── server.py                  # LAN server plus shared-save API
├── start-phone-server.bat     # one-click Windows phone server
├── start-phone-server.ps1     # PowerShell alternative
├── manifest.webmanifest       # installable mobile metadata
├── sw.js                      # offline cache when served over HTTP
├── assets/
│   ├── mark.svg               # original local app mark
│   └── flags/                 # nine local PNG country flags
├── css/
│   └── styles.css             # layout, components, responsive design
├── data/
│   ├── manifest.json          # source data file list and version
│   ├── catalogs.json          # locations, education, jobs, assets, activities
│   └── events/
│       ├── childhood.json
│       ├── education.json
│       ├── work.json
│       ├── relationships.json
│       ├── life.json
│       ├── activities.json
│       ├── expanded.json
│       ├── vampire.json
│       └── wizard.json
├── js/
│   ├── data.bundle.js         # generated offline mirror of data/*.json
│   ├── core/
│   │   ├── namespace.js
│   │   ├── utils.js
│   │   ├── data-loader.js
│   │   ├── storage.js
│   │   ├── events.js
│   │   ├── game.js
│   │   └── expansion.js
│   └── ui/
│       ├── render.js
│       ├── expansion-view.js
│       ├── app.js
│       └── expansion-app.js
├── tools/
│   └── sync-data.mjs          # validates JSON and refreshes the offline bundle
└── tests/
    └── run-tests.mjs          # data, offline, lifecycle, save, inheritance tests
```

Classic deferred scripts are used deliberately. Browsers commonly block JavaScript modules and `fetch()` calls when a page is opened from `file://`.

## Event data

JSON under `data/` is the human-editable source. A typical event is:

```json
{
  "id": "school_group_project",
  "title": "Four people, one poster",
  "text": "Your group has opinions but no plan.",
  "icon": "📌",
  "minAge": 9,
  "maxAge": 22,
  "weight": 8,
  "cooldown": 4,
  "conditions": { "educationActive": true },
  "choices": [
    {
      "id": "lead",
      "label": "Make a plan",
      "outcome": "The work comes together.",
      "effects": {
        "stats": { "knowledge": 4, "happiness": -2 },
        "educationPerformance": 6
      }
    }
  ]
}
```

Supported event conditions include:

- `educationActive`, `educationProgramIn`
- `careerActive`, `careerYearsMax`, `careerPerformanceMin`
- `relationshipRole`, `relationshipClosenessMin`
- `ownsProperty`
- `flagsAll`, `flagsNone`
- `statsMin`, `statsMax`
- top-level `minAge`, `maxAge`, `repeatable`, and `cooldown`

Annual story events are once-per-life by default. Set `"repeatable": true` only for stories that should return, and give them a sensible `cooldown`. A permanent seen-ID ledger prevents old stories from reappearing after the visible history is trimmed or after time travel.

Supported effects include:

- `stats`, `cash`, `debt`, `flags`, `legacy`
- `educationPerformance`, `careerPerformance`, `salaryMultiplier`, `endCareer`
- `relationship`, `addRelationship`, `endRelationship`
- `addPossession`

Choices can have `requires.cashAtLeast`, `requires.statsMin`, or `requires.flagsAll`. A choice may replace a single result with weighted `variants` for controlled random outcomes. Event JSON is declarative; the engine never evaluates JavaScript from data.

Activity events have `activityOnly: true` and are opened through a matching catalog entry instead of the annual random selector.

## Editing data

After changing any JSON file, refresh the checked-in offline mirror:

```powershell
node tools/sync-data.mjs
```

This command validates required event fields, duplicate IDs, choice IDs, activity references, and then regenerates `js/data.bundle.js`. Players do not run it; it is only a content-authoring tool.

When served over HTTP, the game reads the JSON source directly. When opened from `file://`, it uses `js/data.bundle.js`. Both paths therefore share the same content model.

## Development

No dependencies are required. Node.js is only used for content synchronization and tests.

Run all automated checks:

```powershell
npm test
```

Refresh the offline data bundle:

```powershell
npm run sync-data
```

Optional local server for live JSON editing:

```powershell
npm run serve
```

Then open `http://localhost:8080/`. No server is required for normal play.

The test suite verifies:

- unique and complete events/choices
- only allowlisted declarative effects
- activity-to-event references
- exact JSON/offline-bundle parity
- absence of modules and remote dependencies in `index.html`
- existence of every local script/style/asset reference
- a deterministic 20-year lifecycle through primary and secondary education
- save/load/export/import round trips
- death, heir selection, inheritance, and generation transition

Recommended manual QA widths are 320, 375, 768, 1024, and 1440 pixels. Test character creation, a pending event reload, named slots, JSON import/export, education gating, job applications, assets, forced death with and without a child, and keyboard navigation.

## Clean-room scope

Next Chapter is an original implementation inspired by the broad genre of choice-driven life simulators. The reference APK was inspected statically only to identify generic feature categories and navigation concepts. It was not executed. No APK code, data rows, event prose, artwork, audio, avatars, brands, UI assets, saves, advertising SDKs, identifiers, or telemetry configuration are included here.

The supplied APK appeared to be an untrusted repackaged mod installer rather than a clean store package. Do not execute it or treat it as a source of reusable content.

## Version 1.1 customization update

- Parents, siblings, and children inherit the player character's surname by default.
- Activities now support both minimum and maximum ages, including baby/toddler options.
- Added exact-age early-childhood events, including first laughter, first sentences, preschool mishaps, and an age-three diaper blowout event.
- Relationship conversations now name a real topic and vary their wording by age and RNG seed.
- Added a persistent light/dark theme toggle.
- Added a generated customizable avatar with skin tone, hair colour, hairstyle, and background colour.
- Added optional vampire lives with fangs, hunger, secrecy, vampire events, vampire-only activities, and extended lifespan.
- Added pronoun-aware event templates such as `{subject}`, `{object}`, `{possessive}`, and `{noun}`. `{noun}` becomes girl, boy, child, woman, man, or person depending on identity and age.

To add more age-specific activities, edit `data/catalogs.json` and give an activity `minAge`, optional `maxAge`, and an `eventId`. Add the matching event to `data/events/activities.json`, then run `node tools/sync-data.mjs`.


## Version 1.2 expansion

- Every generated family member now has a portrait. Parents, siblings, children, and grandparents inherit the main character's skin tone while receiving independently generated hair, eye colour, hairstyle, background, and accessories.
- Added accessories, fame, police, crime records, courts, lawyers, prison sentences, bank robbery, and a non-graphic murder option for adult characters.
- Added the Bank Robber challenge: succeed at a bank robbery without being caught and reach 70 fame.
- Added developer cheats for guaranteed wins, never being caught, maximum fame, challenge completion, and clearing the criminal record.


## Version 1.3 custody, relationships, and phone-server update

- Convictions now create a persistent sentence object containing the offense, facility, security level, original sentence, time served, time remaining, conduct, appeals, and parole state.
- Sentence ranges depend on the crime, with repeat convictions increasing possible time. Court success remains random and is capped below 100% unless the developer win cheat is enabled.
- A convicted character is actually placed in custody. Ordinary education, jobs, shopping, crime, dating, and relationship activities are locked until release.
- Aging up while incarcerated serves exactly one year. The character is released when the remaining sentence reaches zero.
- Added a dedicated Jail screen with exercise, reading, prison work, family calls, parole, abstract escape attempts, and paid appeals. Failed escapes can add years.
- Added juvenile detention labeling for characters convicted before age 18.
- Rebuilt Relationships into grouped portrait rows inspired by the supplied layout while retaining original artwork and styling. Every row shows the person's role and relationship bar and expands into interactions.
- Added dating, proposals with ring choices, engagement, wedding plans, prenups, surname choices, stepchildren, divorce settlements, ex-spouses, reconciliation, vow renewals, spouse spending events, widow inheritance, and funeral choices.
- Added a one-click local-network server for phone play, a small shared-save API, installable web-app metadata, and offline caching.
- Save schema upgraded to version 4. Older version 1–3 saves are migrated automatically, including older `jailYears` values.
- Automated tests now cover persistent custody locking/release and proposal-marriage-divorce transitions in addition to the existing lifecycle, save, and inheritance checks.



## Version 1.4.0 — talents, records, promotions, and underground career

- Character creation includes Acting, Sports, Music, Crime, Business, Modeling, Dealing, or no special talent.
- Criminal convictions substantially reduce ordinary job-application odds, especially in education, health, and public service.
- Every normal job has a three-step named promotion ladder.
- The one-time Bank Robber challenge is permanently stored in the family legacy and cannot award points again.
- The abstract Assassin career unlocks after three successful murders without arrest. It has three levels, contract payouts, promotions, and murder-level court consequences if caught.
- Developer tools include always-hired, fast-promotions, assassin unlock, and manual promotion controls.

### Version 1.3.1 startup fix

- Fixed a startup-order crash where the landing screen tried to call `isIncarcerated()` before a game existed.
- Added a regression test for launching without an active save.
- Bumped the offline cache so browsers replace the broken JavaScript file.
