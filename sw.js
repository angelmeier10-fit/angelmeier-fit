const CACHE = 'amfit-v3';
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
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
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

  // Shell de la app: cache-first con actualización en segundo plano
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      }).catch(() => cached || caches.match('./index.html'));

      return cached || fetchPromise;
    })
  );
});
