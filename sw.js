const CACHE = 'seis8-v2';
const ASSETS = [
    '/seis8/index.html',
    '/seis8/manifest.json',
    '/seis8/icon-192.png',
    '/seis8/icon-512.png'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(ASSETS))
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
    if (e.request.url.includes('script.google.com') ||
        e.request.url.includes('fonts.googleapis.com') ||
        e.request.url.includes('cdn.tailwindcss.com')) {
        return;
    }
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});
