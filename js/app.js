// MI EXPEDIENTE — Inicialización de la app

(function () {
  'use strict';

  // Registrar Service Worker (PWA)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('[SW] Registrado'))
        .catch(e => console.warn('[SW] Error:', e));
    });
  }

  // Desde index.html: redirigir según sesión
  const path = window.location.pathname;
  const isRoot = path === '/' || path.endsWith('/index.html') || path.endsWith('/miexpediente/');

  if (isRoot) {
    const session = Auth.getSession();
    if (session) {
      location.href = session.rol === 'admin'
        ? 'pages/admin/dashboard.html'
        : 'pages/cliente/dashboard.html';
    } else {
      location.href = 'pages/login.html';
    }
    return;
  }

  // Ocultar splash screen
  const splash = document.getElementById('splash');
  if (splash) {
    setTimeout(() => {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }, 600);
  }

  // Marcar nav item activo
  document.querySelectorAll('.sidebar-nav a, .bottom-nav a').forEach(a => {
    if (a.href && window.location.href.includes(a.getAttribute('href'))) {
      a.closest('li')?.classList.add('active');
      a.classList.add('active');
    }
  });

})();
