// MI EXPEDIENTE — Módulo de Clientes

const Clientes = {
  getAll() { return Storage.get('clientes') || []; },
  getById(id) { return (Storage.get('clientes') || []).find(c => c.id === id) || null; },

  crear(data) {
    const clientes = Storage.get('clientes') || [];
    if (clientes.find(c => c.email.toLowerCase() === data.email.trim().toLowerCase()))
      return { ok: false, message: 'Ya existe un cliente con ese email.' };
    const nuevo = {
      id: Utils.uuid(),
      nombre: data.nombre.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password || Utils.uuid().slice(0, 8),
      whatsapp: (data.whatsapp || '').replace(/\D/g, ''),
      dni: (data.dni || '').trim(),
      activo: true,
      creadoEn: new Date().toISOString(),
      adminId: Auth.getSession()?.id
    };
    clientes.push(nuevo);
    Storage.set('clientes', clientes);
    Auth._log(`Cliente creado: ${nuevo.nombre}`);
    return { ok: true, cliente: nuevo };
  },

  actualizar(id, data) {
    const clientes = Storage.get('clientes') || [];
    const idx = clientes.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const campos = ['nombre','email','password','whatsapp','dni','activo'];
    campos.forEach(c => { if (data[c] !== undefined) clientes[idx][c] = data[c]; });
    Storage.set('clientes', clientes);
    return clientes[idx];
  },

  desactivar(id) { return this.actualizar(id, { activo: false }); },
  activar(id) { return this.actualizar(id, { activo: true }); }
};

// ============================================================
// Módulo de Solicitudes de acceso
// ============================================================

const Solicitudes = {
  getAll() { return Storage.get('solicitudes') || []; },
  getPendientes() { return (Storage.get('solicitudes') || []).filter(s => s.estado === 'pendiente'); },

  crear(data) {
    const solicitudes = Storage.get('solicitudes') || [];
    const nueva = {
      id: Utils.uuid(),
      nombre: data.nombre.trim(),
      email: data.email.trim().toLowerCase(),
      whatsapp: (data.whatsapp || '').replace(/\D/g, ''),
      mensaje: (data.mensaje || '').trim(),
      estado: 'pendiente',
      creadaEn: new Date().toISOString()
    };
    solicitudes.push(nueva);
    Storage.set('solicitudes', solicitudes);
    return nueva;
  },

  aprobar(id, password) {
    const solicitudes = Storage.get('solicitudes') || [];
    const idx = solicitudes.findIndex(s => s.id === id);
    if (idx === -1) return { ok: false, message: 'Solicitud no encontrada.' };
    const sol = solicitudes[idx];
    const pw = password || Utils.uuid().slice(0, 8);
    const result = Clientes.crear({ nombre: sol.nombre, email: sol.email, whatsapp: sol.whatsapp, password: pw });
    if (result.ok) {
      solicitudes[idx].estado = 'aprobada';
      solicitudes[idx].aprobadaEn = new Date().toISOString();
      solicitudes[idx].passwordAsignada = pw;
      Storage.set('solicitudes', solicitudes);
      Auth._log(`Acceso aprobado: ${sol.nombre}`);
      return { ok: true, cliente: result.cliente, password: pw };
    }
    return result;
  },

  rechazar(id) {
    const solicitudes = Storage.get('solicitudes') || [];
    const idx = solicitudes.findIndex(s => s.id === id);
    if (idx === -1) return false;
    solicitudes[idx].estado = 'rechazada';
    Storage.set('solicitudes', solicitudes);
    Auth._log(`Solicitud rechazada: ${solicitudes[idx].nombre}`);
    return true;
  }
};

// ============================================================
// Módulo de WhatsApp
// ============================================================

const WhatsApp = {
  enviarCredenciales(cliente, password) {
    const msg = `Hola ${cliente.nombre}! Tu acceso a *Mi Expediente* está listo.\n\n` +
      `🔗 ${APP_CONFIG.appUrl}\n📧 Usuario: ${cliente.email}\n🔑 Contraseña: ${password}\n\n` +
      `_${APP_CONFIG.estudio}_`;
    return this._open(cliente.whatsapp, msg);
  },

  notificarActualizacion(cliente, caratula) {
    const msg = `Hola ${cliente.nombre}, hay una novedad en tu expediente *${caratula}*.\n\n` +
      `Ingresá a Mi Expediente para verla:\n${APP_CONFIG.appUrl}\n\n_${APP_CONFIG.estudio}_`;
    return this._open(cliente.whatsapp, msg);
  },

  notificarVencimiento(cliente, caratula, fecha) {
    const msg = `⚠️ *Recordatorio*\nHola ${cliente.nombre}, el expediente *${caratula}* tiene un vencimiento el ${Utils.formatDate(fecha)}.\n\n_${APP_CONFIG.estudio}_`;
    return this._open(cliente.whatsapp, msg);
  },

  solicitarAcceso(nombre, email) {
    const msg = `Hola, soy *${nombre}* y quisiera solicitar acceso a Mi Expediente.\n📧 ${email}`;
    return this._open(APP_CONFIG.adminWhatsApp, msg);
  },

  _open(numero, mensaje) {
    if (!numero) return false;
    const num = String(numero).replace(/\D/g, '');
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`, '_blank');
    return true;
  }
};

// ============================================================
// Módulo de UI
// ============================================================

const UI = {
  toast(msg, tipo = 'info', ms = 3500) {
    const t = document.createElement('div');
    t.className = `toast toast-${tipo}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, ms);
  },

  loading(btn, show, label = 'Procesando...') {
    if (show) { btn.disabled = true; btn._prev = btn.textContent; btn.textContent = label; }
    else { btn.disabled = false; btn.textContent = btn._prev || 'Aceptar'; }
  },

  confirm(msg) { return window.confirm(msg); },

  estadoBadge(estado) {
    const map = { activo: 'success', archivado: 'secondary', ganado: 'primary',
                  perdido: 'danger', suspendido: 'warning', pendiente: 'warning',
                  aprobada: 'success', rechazada: 'danger' };
    const cls = map[estado] || 'secondary';
    return `<span class="badge badge-${cls}">${Utils.sanitize(estado)}</span>`;
  },

  empty(el, msg = 'No hay datos para mostrar.') {
    el.innerHTML = `<div class="empty-state"><p>${msg}</p></div>`;
  },

  setUser(nombre) {
    const el = document.getElementById('nav-user');
    if (el) el.textContent = nombre;
  }
};
