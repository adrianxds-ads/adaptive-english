const CACHE_NAME = 'adaptive-english-shell-v2';
const SHELL = [
  './',
  './app.js',
  './level.json',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const pathname = url.pathname;
  const isLevel = pathname.endsWith('/level.json');
  const isApp = pathname.endsWith('/app.js');
  const cacheKey = isLevel ? new Request('./level.json') : event.request;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request, {cache:'no-store'});
        const cache = await caches.open(CACHE_NAME);
        await cache.put('./', fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    try {
      const fresh = await fetch(event.request, {cache:'no-store'});
      if (isLevel || isApp) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(cacheKey, fresh.clone());
      }
      return fresh;
    } catch (e) {
      return (await caches.match(cacheKey)) || Response.error();
    }
  })());
});
