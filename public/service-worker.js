/* eslint-disable no-restricted-globals */
const CACHE = 'candy-pwa-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE = ['/', '/index.html', OFFLINE_URL, '/manifest.json'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.map((k) => (k === CACHE ? Promise.resolve() : caches.delete(k))))
        )
    );
    self.clients.claim();
});

// Network-first untuk navigasi (SPA routes), fallback ke cache/offline
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Navigasi dokumen (klik link/refresh)
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).catch(async () => {
                const cache = await caches.open(CACHE);
                return (await cache.match('/index.html')) || cache.match(OFFLINE_URL);
            })
        );
        return;
    }

    // Aset statis: style/script/image/font → cache-first + update di belakang layar
    const dest = req.destination;
    if (['style', 'script', 'image', 'font'].includes(dest)) {
        event.respondWith(
            caches.match(req).then((cached) => {
                const fetchAndPut = fetch(req)
                    .then((res) => {
                        const copy = res.clone();
                        caches.open(CACHE).then((c) => c.put(req, copy));
                        return res;
                    })
                    .catch(() => cached);
                return cached || fetchAndPut;
            })
        );
    }
});
