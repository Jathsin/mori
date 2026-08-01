const CACHE = "memore-v21";
const ASSETS = [
  "../",
  "./app.css",
  "./app.js",
  "./htmx.min.js",
  "./inter.ttf",
  "./gael.jpeg",
  "./juanmi.png",
  "./juanmi-2026.jpg",
  "./icon.svg",
  "./icon.png",
  "./icon-solid-v3.png",
  "./mori-touch-icon-180.png",
  "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("../", copy));
          return response;
        })
        .catch(() => caches.match("../")),
    );
    return;
  }
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || fetch(event.request)),
  );
});
