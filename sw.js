const CACHE_NAME = 'genba-memo-v5';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// アプリ本体はキャッシュ優先、それ以外(Firebase/外部CDN等)はネットワークを優先しつつ
// オフライン時のみキャッシュにフォールバックする
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req)
            .then((res) => {
              const resClone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
              return res;
            })
            .catch(() => cached)
        );
      })
    );
  } else {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
  }
});
