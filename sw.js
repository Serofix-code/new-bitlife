"use strict";
const CACHE = "next-chapter-v2.4.0";
const FILES = [
  "./", "./index.html", "./guide.html", "./css/styles.css", "./assets/mark.svg", "./manifest.webmanifest", "./js/core/namespace.js", "./js/data.bundle.js", "./js/core/utils.js", "./js/core/data-loader.js", "./js/core/storage.js", "./js/core/events.js", "./js/core/game.js", "./js/core/expansion.js", "./js/core/v16.js", "./js/core/v17.js", "./js/core/v18.js", "./js/core/v19.js", "./js/core/v20.js", "./js/core/v21.js", "./js/core/v23.js", "./js/core/v24.js", "./js/ui/render.js", "./js/ui/expansion-view.js", "./js/ui/v16-view.js", "./js/ui/v17-view.js", "./js/ui/v18-view.js", "./js/ui/v19-view.js", "./js/ui/v20-view.js", "./js/ui/v21-view.js", "./js/ui/v23-view.js", "./js/ui/v24-view.js", "./js/ui/app.js", "./js/ui/expansion-app.js", "./js/ui/v16-app.js", "./js/ui/v17-app.js", "./js/ui/v18-app.js", "./js/ui/v19-app.js", "./js/ui/v20-app.js", "./js/ui/v21-app.js", "./js/ui/v23-app.js", "./js/ui/v24-app.js", "./assets/flags/australia.png", "./assets/flags/belgium.png", "./assets/flags/canada.png", "./assets/flags/denmark.png", "./assets/flags/finland.png", "./assets/flags/france.png", "./assets/flags/germany.png", "./assets/flags/iceland.png", "./assets/flags/ireland.png", "./assets/flags/italy.png", "./assets/flags/japan.png", "./assets/flags/netherlands.png", "./assets/flags/norway.png", "./assets/flags/poland.png", "./assets/flags/russia.png", "./assets/flags/south-korea.png", "./assets/flags/spain.png", "./assets/flags/sweden.png", "./assets/flags/switzerland.png", "./assets/flags/uk.png", "./assets/flags/usa.png"
];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).pathname.startsWith("/api/")) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
