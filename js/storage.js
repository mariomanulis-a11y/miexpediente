// MI EXPEDIENTE — Capa de datos (localStorage)

const Storage = {
  PREFIX: 'me_',

  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage.set error:', e);
      return false;
    }
  },

  get(key, defaultVal = null) {
    try {
      const val = localStorage.getItem(this.PREFIX + key);
      return val !== null ? JSON.parse(val) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  },

  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  push(key, item) {
    const arr = this.get(key, []);
    arr.push(item);
    return this.set(key, arr);
  },

  init() {
    if (!this.get('initialized')) {
      this.set('expedientes', []);
      this.set('clientes', []);
      this.set('solicitudes', []);
      this.set('actividad', []);
      this.set('initialized', true);
      console.log('[Mi Expediente] Storage inicializado.');
    }
  },

  exportar() {
    const data = {
      expedientes: this.get('expedientes', []),
      clientes: this.get('clientes', []),
      solicitudes: this.get('solicitudes', []),
      exportadoEn: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-miexpediente-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importar(json) {
    try {
      const data = JSON.parse(json);
      if (data.expedientes) this.set('expedientes', data.expedientes);
      if (data.clientes) this.set('clientes', data.clientes);
      if (data.solicitudes) this.set('solicitudes', data.solicitudes);
      return true;
    } catch (e) {
      return false;
    }
  }
};
