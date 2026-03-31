const Router = {
  routes: {},
  _current: '',

  register(name, fn) { this.routes[name] = fn; },

  current() {
    const hash = location.hash.replace('#/', '').split('?')[0];
    return hash || 'login';
  },

  go(name, params) {
    params = params || {};
    let hash = '#/' + name;
    const qs = Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
    if (qs) hash += '?' + qs;
    location.hash = hash;
  },

  params() {
    const qs = location.hash.split('?')[1] || '';
    const p = {};
    qs.split('&').forEach(function(pair) {
      if (!pair) return;
      const parts = pair.split('=');
      p[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
    });
    return p;
  },

  resolve() {
    const route = this.current();
    this._current = route;
    const fn = this.routes[route];
    const container = document.getElementById('view-container');
    if (!container) return;

    const user = Store.getUser();
    const publicRoutes = ['login', 'solicitar-acceso', 'reset-password'];
    if (!user && !publicRoutes.includes(route)) {
      this.go('login');
      return;
    }
    if (user && route === 'login') {
      this.go('dashboard');
      return;
    }

    // Permisos por rol
    const proOnly = ['clientes', 'nuevo-expediente', 'configuracion'];
    if (user && user.rol === 'cliente' && proOnly.includes(route)) {
      this.go('dashboard');
      return;
    }

    if (fn) {
      container.style.display = ''; // Quitar el display:none inicial
      container.innerHTML = '';
      fn(container);
    } else {
      container.style.display = '';
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">404</div><p class="empty-state-text">Pagina no encontrada</p></div>';
    }
  },

  init() {
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  }
};
