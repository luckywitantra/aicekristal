const CACHE_NAME = "aice-kristal-v1";
const urlsToCache = [
    "/",
    "/index.html",
    "/styles.css",
    "/app.js",
    "/manifest.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener("fetch", event => {
    // Network First, fallback to cache (Cocok untuk data dinamis)
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
