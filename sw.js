const CACHE_NAME = 'miexpediente-v2';

// Base path dinámica: funciona tanto en GitHub Pages (/miexpediente/)
// como en dominio propio (/)
const BASE = self.location.pathname.replace(/\/[^/]*$/, '/');

const CACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'css/variables.css',
  BASE + 'css/reset.css',
  BASE + 'css/base.css',
  BASE + 'css/components.css',
  BASE + 'css/layout.css',
  BASE + 'css/auth.css',
  BASE + 'css/dashboard.css',
  BASE + 'css/expedientes.css',
  BASE + 'css/mobile.css',
  BASE + 'css/main.css',
  BASE + 'js/config.js',
  BASE + 'js/utils.js',
  BASE + 'js/store.js',
  BASE + 'js/auth.js',
  BASE + 'js/api.js',
  BASE + 'js/whatsapp.js',
  BASE + 'js/router.js',
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

  // Para navegación (abre desde ícono del escritorio): siempre servir index.html
  // Esto evita el 404 cuando el SO intenta cargar la URL guardada en el manifest
  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match(BASE + 'index.html').then(cached => {
        return cached || fetch(BASE + 'index.html');
      })
    );
    return;
  }

  // Para CSS, JS, imágenes: cache-first, actualiza en red
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
