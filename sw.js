const CACHE_NAME = 'iss-tracker-3d-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.webmanifest',
  './assets/icons/iss.svg',
  './js/main.js',
  './js/config.js',
  './js/state.js',
  './js/utils.js',
  './js/storage.js',
  './js/ui.js',
  './js/globe.js',
  './js/maps.js',
  './js/iss-api.js',
  './js/orbit.js',
  './js/passes.js',
  './js/visibility.js',
  './js/nasa-oem.js',
  './js/cameras.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok && new URL(request.url).origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
  );
});
