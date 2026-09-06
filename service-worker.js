const CACHE = "dj-perry-three-stations-v3-configured";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./djperry-logo.png",
  "./strobe-logo.jpg",
  "./pulse107-logo.jpg",
  "./icon-192.png",
  "./icon-512.png",
  "./metadata-dj.html",
  "./metadata-strobe.html",
  "./metadata-pulse.html"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Do not intercept or cache CloudRadio streams or metadata.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
