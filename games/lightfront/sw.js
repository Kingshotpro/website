// Campfire Service Worker — v0.8.0
const CACHE_NAME = 'campfire-v080';
const ASSETS = [
  './',
  './campfire_v0.8.0.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

// Install: cache all core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for game assets, network-first for everything else
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Don't cache non-ok responses or non-GET requests
        if (!response || response.status !== 200 || event.request.method !== 'GET') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Network failed — try cache again, or fall back to game page
        return caches.match(event.request)
          .then(cached => cached || caches.match('./campfire_v0.8.0.html'));
      });
    })
  );
});
