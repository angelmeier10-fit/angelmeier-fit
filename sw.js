const CACHE = 'amfit-v5';
const ASSETS = [
  './',
  './index.html',
  './anamnesis_digital.html',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-maskable.svg'
];

self.addEventListener('install', e => {
  // Si un solo asset falla, cache.addAll() aborta todo el precache y el SW
  // nunca queda instalado (por eso la app quedaba en blanco offline).
  // Cacheamos cada uno por separado para que uno roto no tumbe al resto.
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(a => c.add(a).catch(() => {})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Dejar pasar directo lo que ya maneja su propio caché offline (Firestore/Auth) o son requests no-GET
  if (e.request.method !== 'GET' || url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    return;
  }

  // Shell de la app: network-first para ver cambios al instante, con fallback a caché offline
  e.respondWith(
    fetch(e.request).then(res => {
      const resClone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, resClone));
      return res;
    }).catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  );
});
