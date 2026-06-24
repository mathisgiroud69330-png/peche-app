const CACHE="peche-v8";

const FILES=[
"./",
"./index.html",
"./app.js",
"./manifest.json",
"./icon.png"
];

self.addEventListener("install",e=>{
e.waitUntil(
caches.open(CACHE).then(cache=>cache.addAll(FILES))
);
});

self.addEventListener("fetch",e=>{
e.respondWith(
caches.match(e.request).then(r=>r || fetch(e.request))
);
});