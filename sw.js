const CACHE_NAME = 'miexpediente-v11';

const BASE = self.location.pathname.replace(/\/[^/]*$/, '/');

const CACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'css/variables.css',
  BASE + 'css/base.css',
  BASE + 'css/components.css',
  BASE + 'css/layout.css',
  BASE + 'css/auth.css',
  BASE + 'css/dashboard.css',
  BASE + 'css/mobile.css',
  BASE + 'css/expedientes.css',
  BASE + 'js/config.js',
  BASE + 'js/utils.js',
  BASE + 'js/store.js',
  BASE + 'js/auth.js',
  BASE + 'js/api.js',
  BASE + 'js/etapas.js',
  BASE + 'js/causas-api.js',
  BASE + 'js/whatsapp.js',
  BASE + 'js/router.js',
  BASE + 'js/views.js',
  BASE + 'js/main.js',
  BASE + 'assets/logo.svg',
  BASE + 'assets/icon-192.svg',
  BASE + 'assets/icon-512.svg'
];

self.addEventListener('install', e => {
  // Instalar con tolerancia a fallos: si un archivo da 404 no rompe todo el SW
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        CACHE_URLS.map(url =>
          fetch(url).then(res => {
            if (res.ok) return cache.put(url, res);
          }).catch(() => {}) // ignorar errores individuales
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const reqUrl = new URL(e.request.url);
  if (reqUrl.hostname !== self.location.hostname) return;

  // Navegación: siempre buscar index.html en red primero
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(BASE + 'index.html').then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(BASE + 'index.html', clone));
        }
        return res;
      }).catch(() => caches.match(BASE + 'index.html'))
    );
    return;
  }

  // JS y CSS: network-first, fallback a cache
  if (e.request.url.match(/\.(js|css)(\?.*)?$/)) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Imágenes y otros: cache-first, actualiza en fondo
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
