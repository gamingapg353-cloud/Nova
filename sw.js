// Nova service worker: sayt fayllarini keshda saqlaydi, internet bo'lmasa ham ochiladi
const CACHE = 'nova-v1';
const FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/privacy.html',
  '/manifest.json',
  '/imgs/icon-192.png',
  '/imgs/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Avval internetdan olishga urinadi, bo'lmasa keshdan beradi.
// Google kabi boshqa saytlarga so'rovlarga tegmaydi.
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then(r => r || caches.match('/index.html')))
  );
});
