const CACHE_NAME = "stations-cache-v1";

const urlsToCache = [
  "./",
  "./index.html",
  "./app.js",
  "./style.css"
];

// install
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// fetch (offline first)
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request)
      .then(res => res || fetch(e.request))
  );
});