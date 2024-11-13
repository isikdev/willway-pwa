importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');

const CACHE_NAME = "pwa-cache-v1";
const URLS_TO_CACHE = [
    "https://willway.pro/",
    "https://willway.pro/meditationrezdel",
    "https://willway.pro/meditation",
    "https://willway.pro/praktika",
    "https://willway.pro/stress",
    "https://willway.pro/stress1",
    "https://willway.pro/evgeniy",
    "https://willway.pro/card",
    "https://willway.pro/page57487489.html",
    "https://willway.pro/members/signup",
    "https://willway.pro/members/login",
    "https://willway.pro/members/recover-password",
    "https://willway.pro/page57563233.html"
];

workbox.core.setCacheNameDetails({ prefix: 'willway-pwa' });

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(URLS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== workbox.core.cacheNames.runtime) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

workbox.precaching.precacheAndRoute(URLS_TO_CACHE.map(url => ({ url, revision: '1' })));

workbox.routing.registerRoute(
    ({ request }) => request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image',
    new workbox.strategies.CacheFirst({
        cacheName: 'static-resources',
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 60, // Макс. кол-во файлов
                maxAgeSeconds: 30 * 24 * 60 * 60, // Храним до 30 дней
            }),
        ],
    })
);

workbox.routing.registerRoute(
    ({ request }) => request.destination === 'document',
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'pages-cache',
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 20, // Ограничение на количество страниц в кэше
            }),
        ],
    })
);

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return (
                response ||
                fetch(event.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                })
            );
        }).catch(() => {
            return caches.match("/");
        })
    );
});
