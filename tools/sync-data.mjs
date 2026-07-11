import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "data", "manifest.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const files = [];
const eventIds = new Set();

for (const relative of manifest.files) {
  const absolute = path.resolve(root, relative);
  if (!absolute.startsWith(root + path.sep)) throw new Error(`Manifest path escapes project: ${relative}`);
  const parsed = JSON.parse(await fs.readFile(absolute, "utf8"));
  if (parsed.kind === "events") {
    if (!Array.isArray(parsed.events) || parsed.events.length === 0) throw new Error(`${relative} has no events`);
    for (const event of parsed.events) {
      if (!event.id || eventIds.has(event.id)) throw new Error(`Missing or duplicate event ID: ${event.id}`);
      if (!event.title || !event.text || !Array.isArray(event.choices) || event.choices.length < 2) throw new Error(`Incomplete event: ${event.id}`);
      const choiceIds = new Set();
      for (const choice of event.choices) {
        if (!choice.id || choiceIds.has(choice.id) || !choice.label) throw new Error(`Invalid choice in ${event.id}`);
        if (!choice.outcome && !Array.isArray(choice.variants)) throw new Error(`Choice ${event.id}/${choice.id} has no outcome`);
        choiceIds.add(choice.id);
      }
      eventIds.add(event.id);
    }
  }
  files.push(parsed);
}

const catalogs = files.find((file) => file.kind === "catalogs");
if (!catalogs) throw new Error("Catalog data is missing");
for (const activity of catalogs.activities || []) {
  if (!eventIds.has(activity.eventId)) throw new Error(`Activity ${activity.id} references missing event ${activity.eventId}`);
}

const bundle = { dataVersion: manifest.dataVersion, generatedAt: new Date().toISOString(), files };
const output = `(function installOfflineData(global) {\n  "use strict";\n  global.NextChapter.DATA_BUNDLE = ${JSON.stringify(bundle, null, 2)};\n})(window);\n`;
await fs.writeFile(path.join(root, "js", "data.bundle.js"), output, "utf8");

console.log(`Synced ${files.length} JSON files with ${eventIds.size} events to js/data.bundle.js`);
