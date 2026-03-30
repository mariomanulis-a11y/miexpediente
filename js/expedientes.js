// MI EXPEDIENTE — Módulo de Expedientes

const Expedientes = {
  getAll() {
    const session = Auth.getSession();
    const todos = Storage.get('expedientes') || [];
    if (!session) return [];
    if (session.rol === 'admin') return todos;
    return todos.filter(e => e.clienteId === session.id);
  },

  getById(id) {
    return (Storage.get('expedientes') || []).find(e => e.id === id) || null;
  },

  getByCliente(clienteId) {
    return (Storage.get('expedientes') || []).filter(e => e.clienteId === clienteId);
  },

  crear(data) {
    const expedientes = Storage.get('expedientes') || [];
    const nuevo = {
      id: Utils.uuid(),
      numero: data.numero || '',
      caratula: (data.caratula || '').trim(),
      clienteId: data.clienteId || '',
      juzgado: (data.juzgado || '').trim(),
      fuero: data.fuero || '',
      estado: data.estado || 'activo',
      descripcion: (data.descripcion || '').trim(),
      ultimaActuacion: (data.ultimaActuacion || '').trim(),
      proximoVencimiento: data.proximoVencimiento || null,
      actuaciones: [],
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      adminId: Auth.getSession()?.id
    };
    expedientes.push(nuevo);
    Storage.set('expedientes', expedientes);
    Auth._log(`Expediente creado: ${nuevo.caratula}`);
    return nuevo;
  },

  actualizar(id, data) {
    const expedientes = Storage.get('expedientes') || [];
    const idx = expedientes.findIndex(e => e.id === id);
    if (idx === -1) return null;
    const campos = ['caratula','numero','clienteId','juzgado','fuero','estado',
                    'descripcion','ultimaActuacion','proximoVencimiento'];
    campos.forEach(c => { if (data[c] !== undefined) expedientes[idx][c] = data[c]; });
    expedientes[idx].actualizadoEn = new Date().toISOString();
    Storage.set('expedientes', expedientes);
    Auth._log(`Expediente actualizado: ${expedientes[idx].caratula}`);
    return expedientes[idx];
  },

  agregarActuacion(expId, texto) {
    if (!texto || !texto.trim()) return false;
    const expedientes = Storage.get('expedientes') || [];
    const idx = expedientes.findIndex(e => e.id === expId);
    if (idx === -1) return false;
    const act = { id: Utils.uuid(), texto: texto.trim(), fecha: new Date().toISOString() };
    expedientes[idx].actuaciones = [act, ...(expedientes[idx].actuaciones || [])];
    expedientes[idx].ultimaActuacion = texto.trim();
    expedientes[idx].actualizadoEn = new Date().toISOString();
    Storage.set('expedientes', expedientes);
    Auth._log(`Actuación en: ${expedientes[idx].caratula}`);
    return true;
  },

  eliminar(id) {
    const expedientes = Storage.get('expedientes') || [];
    const exp = expedientes.find(e => e.id === id);
    Storage.set('expedientes', expedientes.filter(e => e.id !== id));
    if (exp) Auth._log(`Expediente eliminado: ${exp.caratula}`);
    return true;
  },

  proximosVencimientos(dias = 7) {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + dias);
    return (Storage.get('expedientes') || []).filter(e => {
      if (!e.proximoVencimiento) return false;
      const d = new Date(e.proximoVencimiento);
      return d >= hoy && d <= limite;
    }).sort((a, b) => new Date(a.proximoVencimiento) - new Date(b.proximoVencimiento));
  }
};
