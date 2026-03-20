const CACHE_NAME = 'seis8-v4';
const ASSETS = ['/seis8/', '/seis8/index.html', '/seis8/manifest.json', '/seis8/icon-192.png', '/seis8/icon-512.png'];

// Al instalar: cachear recursos
self.addEventListener('install', e => {
  self.skipWaiting(); // Activar inmediatamente sin esperar
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {}))
  );
});

// Al activar: BORRAR todos los caches viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim()) // Tomar control de todas las pestañas inmediatamente
  );
});

// Estrategia: Network First para HTML, Cache First para assets estáticos
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Para index.html y la raíz: SIEMPRE ir a la red primero
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname.endsWith('/seis8')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Para fonts de Google y APIs externas: solo red, nunca cachear
  if (url.hostname.includes('google') || url.hostname.includes('googleapis') || url.hostname.includes('script.google')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // Para otros assets: Cache First con fallback a red
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      });
    })
  );
});

// Mensaje para forzar actualización manual desde la app
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
