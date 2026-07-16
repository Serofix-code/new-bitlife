# Mod Maker — Early Release

The **Next Chapter Mod Maker** is a beginner-friendly standalone editor for custom annual life events. No coding is required.

## Open the editor

- In the game, open **Main Menu → Mods & Mod Maker → Open Mod Maker**.
- From the start screen, select **Open Mod Maker**.
- On GitHub Pages, open [the web Mod Maker](https://serofix-code.github.io/new-bitlife/mod-maker.html).
- Offline, open `mod-maker.html` beside `index.html`.

## Make and install a mod

1. Give the mod a name, author, description, and color.
2. Write an event title and story prompt.
3. Choose the minimum and maximum character ages.
4. Write two choices, outcomes, and stat effects.
5. Select **Download mod file**.
6. In the game, open **Mods & Mod Maker** and select **Install a mod file**.
7. Choose the exported `.nextchaptermod.json` file. The game reloads and adds the event to future annual event rolls.

Installed mods remain on the current device. They can be enabled, disabled, or removed from the in-game Mods screen.

## Early-release schema

```json
{
  "schemaVersion": 1,
  "id": "my-first-chapter",
  "name": "My First Chapter",
  "author": "New Modder",
  "description": "A playful custom moment.",
  "color": "#8b5cf6",
  "events": [
    {
      "id": "mysterious-invitation",
      "title": "A mysterious invitation",
      "text": "A bright envelope arrives.",
      "icon": "🎈",
      "minAge": 8,
      "maxAge": 90,
      "weight": 3,
      "cooldown": 3,
      "choices": [
        {
          "id": "open-it",
          "label": "Open it",
          "outcome": "You discover a celebration.",
          "effects": { "stats": { "happiness": 8 } }
        },
        {
          "id": "leave-it",
          "label": "Leave it",
          "outcome": "The day remains peaceful.",
          "effects": { "stats": { "resilience": 2 } }
        }
      ]
    }
  ]
}
```

The loader sanitizes text, limits each mod to 30 events, requires two to four choices per event, restricts stat changes to ±25, and restricts cash effects to ±100,000. Later Mod Maker releases can expand into activities, careers, items, and appearance packs.
