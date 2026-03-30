const Store = {
  state: {
    user: null,        // { uid, email, nombre, rol, whatsapp, clienteId? }
    expedientes: [],
    clientes: [],
    currentExpediente: null
  },

  get(key) { return this.state[key]; },
  set(key, val) { this.state[key] = val; },

  setUser(u) { this.state.user = u; },
  getUser() { return this.state.user; },
  isLoggedIn() { return !!this.state.user; },
  isProfesional() { return this.state.user && this.state.user.rol === 'profesional'; },
  isCliente() { return this.state.user && this.state.user.rol === 'cliente'; },

  setExpedientes(list) { this.state.expedientes = list; },
  getExpedientes() { return this.state.expedientes; },
  setClientes(list) { this.state.clientes = list; },
  getClientes() { return this.state.clientes; },
  setCurrent(exp) { this.state.currentExpediente = exp; },
  getCurrent() { return this.state.currentExpediente; },

  clear() {
    this.state.user = null;
    this.state.expedientes = [];
    this.state.clientes = [];
    this.state.currentExpediente = null;
  }
};
