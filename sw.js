const CACHE_NAME = 'miexpediente-v6';

// Base path dinámica: funciona tanto en GitHub Pages (/miexpediente/)
// como en dominio propio (/)
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
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
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

  // No interceptar requests a dominios externos (GAS, Firebase, gstatic, etc.)
  // Solo cachear archivos propios de la app
  const reqUrl = new URL(e.request.url);
  if (reqUrl.hostname !== self.location.hostname) return;

  // Para navegación (abre desde ícono del escritorio): siempre servir index.html
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(BASE + 'index.html').then(cached => {
        return cached || fetch(BASE + 'index.html');
      })
    );
    return;
  }

  // JS y CSS: network-first (siempre código actualizado), fallback a cache si offline
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
