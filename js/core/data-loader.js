(function installDataLoader(global) {
  "use strict";

  const NC = global.NextChapter;

  function combine(files, source) {
    const catalogs = files.find((file) => file && file.kind === "catalogs");
    const events = files
      .filter((file) => file && file.kind === "events")
      .flatMap((file) => file.events || []);
    if (!catalogs || !Array.isArray(events) || events.length === 0) {
      throw new Error("The game data is incomplete.");
    }
    const ids = new Set();
    for (const event of events) {
      if (!event.id || ids.has(event.id) || !Array.isArray(event.choices) || event.choices.length === 0) {
        throw new Error(`Invalid or duplicate event: ${event.id || "unknown"}`);
      }
      ids.add(event.id);
    }
    return {
      dataVersion: NC.DATA_BUNDLE && NC.DATA_BUNDLE.dataVersion || "1.0.0",
      source,
      catalogs,
      events,
      eventsById: Object.fromEntries(events.map((event) => [event.id, event]))
    };
  }

  async function loadFromJson() {
    const manifestResponse = await fetch("data/manifest.json", { cache: "no-store" });
    if (!manifestResponse.ok) throw new Error(`Data manifest returned ${manifestResponse.status}`);
    const manifest = await manifestResponse.json();
    const responses = await Promise.all(manifest.files.map(async (path) => {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error(`${path} returned ${response.status}`);
      return response.json();
    }));
    const combined = combine(responses, "json");
    combined.dataVersion = manifest.dataVersion;
    return combined;
  }

  function loadBundle() {
    if (!NC.DATA_BUNDLE || !Array.isArray(NC.DATA_BUNDLE.files)) {
      throw new Error("The offline data bundle is missing. Run tools/sync-data.mjs.");
    }
    const combined = combine(NC.DATA_BUNDLE.files, "bundle");
    combined.dataVersion = NC.DATA_BUNDLE.dataVersion;
    return combined;
  }

  NC.Data = {
    async load() {
      if (global.location.protocol !== "file:") {
        try {
          const live = await loadFromJson();
          NC.data = live;
          return live;
        } catch (error) {
          console.warn("Live JSON data could not be loaded; using the offline bundle.", error);
        }
      }
      const bundled = loadBundle();
      NC.data = bundled;
      return bundled;
    }
  };
})(window);
