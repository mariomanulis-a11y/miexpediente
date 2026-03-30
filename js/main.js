// ── Toast ────────────────────────────────────────────────────
function toast(msg, type, ms) {
  type = type || 'info';
  ms = ms || 3500;
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function() { t.remove(); }, ms);
}

// ── Modal ────────────────────────────────────────────────────
function showModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;
  box.innerHTML = html;
  overlay.style.display = 'flex';
  overlay.onclick = function(e) { if (e.target === overlay) closeModal(); };
}
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ── Header ───────────────────────────────────────────────────
function renderHeader() {
  const header = document.getElementById('app-header');
  if (!header) return;
  const user = Store.getUser();
  if (!user) { header.style.display = 'none'; return; }
  header.style.display = 'flex';
  header.innerHTML =
    '<button class="hamburger" id="hamburger-btn" aria-label="Menu">&#9776;</button>' +
    '<a class="header-brand" href="#/dashboard">' +
    '<img src="assets/logo.svg" alt="MiExpediente">MiExpediente</a>' +
    '<div class="header-spacer"></div>' +
    '<div class="header-actions">' +
    '<span class="header-user">' + (user.nombre || user.email) + '</span>' +
    '<button class="btn btn-ghost btn-sm" onclick="Auth.logout()" style="color:#fff;border-color:rgba(255,255,255,0.3)">Salir</button>' +
    '</div>';
  document.getElementById('hamburger-btn').onclick = toggleSidebar;
}

// ── Sidebar ──────────────────────────────────────────────────
function renderSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;
  const user = Store.getUser();
  if (!user) { sidebar.style.display = 'none'; return; }
  sidebar.style.display = 'block';

  const isPro = user.rol === 'profesional';
  const cur = Router.current();

  function link(route, icon, label) {
    return '<a class="sidebar-link' + (cur === route ? ' active' : '') +
      '" onclick="Router.go(\'' + route + '\')">' +
      '<span class="icon">' + icon + '</span>' + label + '</a>';
  }

  let html = '<div class="sidebar-section">';
  html += '<div class="sidebar-label">Principal</div>';
  html += link('dashboard', '🏠', 'Inicio');
  html += link('expedientes', '📁', 'Expedientes');
  if (isPro) {
    html += '<div class="sidebar-label">Gestion</div>';
    html += link('clientes', '👥', 'Clientes');
    html += link('nuevo-expediente', '➕', 'Nuevo Expediente');
  }
  html += '<div class="sidebar-label">Cuenta</div>';
  html += link('perfil', '👤', 'Mi Perfil');
  if (isPro) html += link('configuracion', '⚙️', 'Configuracion');
  html += '</div>';
  sidebar.innerHTML = html;

  // Backdrop mobile
  let bd = document.getElementById('sidebar-backdrop');
  if (!bd) {
    bd = document.createElement('div');
    bd.id = 'sidebar-backdrop';
    bd.className = 'sidebar-backdrop';
    bd.onclick = closeSidebar;
    document.body.appendChild(bd);
  }
}

function toggleSidebar() {
  const s = document.getElementById('app-sidebar');
  const b = document.getElementById('sidebar-backdrop');
  if (!s) return;
  const open = s.classList.toggle('open');
  if (b) b.classList.toggle('show', open);
}
function closeSidebar() {
  const s = document.getElementById('app-sidebar');
  const b = document.getElementById('sidebar-backdrop');
  if (s) s.classList.remove('open');
  if (b) b.classList.remove('show');
}

// ── VISTAS ───────────────────────────────────────────────────

// LOGIN
Router.register('login', function(container) {
  document.getElementById('app-header').style.display = 'none';
  document.getElementById('app-sidebar').style.display = 'none';
  container.className = 'auth-wrapper';
  container.innerHTML =
    '<div class="auth-card fade-in">' +
    '<div class="auth-logo">' +
    '<img src="assets/logo.svg" alt="MiExpediente" width="60">' +
    '<div class="auth-logo-title">MiExpediente</div>' +
    '<div class="auth-logo-sub">Estudio Juridico Manulis</div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">Correo electronico</label>' +
    '<input class="form-input" type="email" id="login-email" placeholder="correo@ejemplo.com" autocomplete="email"></div>' +
    '<div class="form-group"><label class="form-label">Contrasena</label>' +
    '<input class="form-input" type="password" id="login-pass" placeholder="••••••••" autocomplete="current-password"></div>' +
    '<p id="login-error" class="form-error" style="display:none"></p>' +
    '<button class="btn btn-primary btn-block btn-lg" id="login-btn" onclick="doLogin()">Ingresar</button>' +
    '<div class="auth-divider">o</div>' +
    '<button class="btn btn-wa btn-block" onclick="WA.abrirWA(WA.linkSolicitud())">&#128362; Solicitar acceso por WhatsApp</button>' +
    '<div class="auth-footer"><a href="#" onclick="showResetModal()">Olvide mi contrasena</a></div>' +
    '</div>';

  document.getElementById('login-pass').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });
});

async function doLogin() {
  const email = (document.getElementById('login-email') || {}).value || '';
  const pass = (document.getElementById('login-pass') || {}).value || '';
  const btn = document.getElementById('login-btn');
  const err = document.getElementById('login-error');
  if (!email || !pass) { err.textContent = 'Complete todos los campos'; err.style.display = 'block'; return; }
  err.style.display = 'none';
  Utils.setLoading(btn, true);
  try {
    await Auth.login(email, pass);
  } catch (e) {
    const msgs = {
      'auth/user-not-found': 'Usuario no encontrado.',
      'auth/wrong-password': 'Contrasena incorrecta.',
      'auth/invalid-email': 'Email invalido.',
      'auth/too-many-requests': 'Demasiados intentos. Intente mas tarde.'
    };
    err.textContent = msgs[e.code] || 'Error al ingresar. Verifique sus datos.';
    err.style.display = 'block';
    Utils.setLoading(btn, false);
  }
}

function showResetModal() {
  showModal(
    '<div class="modal-header"><h3 class="modal-title">Recuperar contrasena</h3>' +
    '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>' +
    '<div class="form-group"><label class="form-label">Email de tu cuenta</label>' +
    '<input class="form-input" type="email" id="reset-email" placeholder="correo@ejemplo.com"></div>' +
    '<div class="modal-footer">' +
    '<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>' +
    '<button class="btn btn-primary" id="reset-btn" onclick="doReset()">Enviar link</button></div>'
  );
}

async function doReset() {
  const email = (document.getElementById('reset-email') || {}).value || '';
  const btn = document.getElementById('reset-btn');
  if (!email) { toast('Ingrese su email', 'warning'); return; }
  Utils.setLoading(btn, true);
  try {
    await Auth.sendPasswordReset(email);
    toast('Link enviado a ' + email, 'success');
    closeModal();
  } catch(e) {
    toast('Error: ' + (e.message || 'Verifique el email'), 'error');
    Utils.setLoading(btn, false);
  }
}

// DASHBOARD
Router.register('dashboard', async function(container) {
  container.className = 'view-container fade-in';
  renderHeader(); renderSidebar();
  document.getElementById('app-header').style.display = 'flex';
  document.getElementById('app-sidebar').style.display = 'block';
  const user = Store.getUser();
  const isPro = user.rol === 'profesional';
  container.innerHTML = '<div class="page-header"><div><h1 class="page-title">Bienvenido, ' + (user.nombre || user.email) + '</h1><p class="page-subtitle">Panel de ' + (isPro ? 'profesional' : 'cliente') + '</p></div></div>' +
    '<div class="grid-4" id="stats-row"><div class="stat-card"><span class="stat-icon">📁</span><div><div class="stat-label">Expedientes</div><div class="stat-value" id="stat-exp">—</div></div></div>' +
    (isPro ? '<div class="stat-card"><span class="stat-icon">👥</span><div><div class="stat-label">Clientes</div><div class="stat-value" id="stat-cli">—</div></div></div><div class="stat-card"><span class="stat-icon">🔴</span><div><div class="stat-label">Urgentes</div><div class="stat-value" id="stat-urg">—</div></div></div><div class="stat-card"><span class="stat-icon">✅</span><div><div class="stat-label">Activos</div><div class="stat-value" id="stat-act">—</div></div></div>' : '') +
    '</div>' +
    '<div style="margin-top:1.5rem"><div class="card-header"><h2 class="card-title">Ultimas novedades</h2><button class="btn btn-primary btn-sm" onclick="Router.go(\'expedientes\')">Ver todos</button></div>' +
    '<div id="recent-list" style="margin-top:1rem"><div class="spinner"></div></div></div>';

  try {
    const exps = await API.getExpedientes();
    Store.setExpedientes(exps);
    document.getElementById('stat-exp').textContent = exps.length;
    if (isPro) {
      const clis = await API.getClientes();
      Store.setClientes(clis);
      document.getElementById('stat-cli').textContent = clis.length;
      document.getElementById('stat-urg').textContent = exps.filter(function(e) { return e.estado === 'urgente'; }).length;
      document.getElementById('stat-act').textContent = exps.filter(function(e) { return e.estado === 'activo'; }).length;
    }
    const recent = exps.slice(0, 5);
    const list = document.getElementById('recent-list');
    if (!recent.length) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📂</div><p class="empty-state-text">Sin expedientes aun</p>' + (isPro ? '<button class="btn btn-primary" style="margin-top:1rem" onclick="Router.go(\'nuevo-expediente\')">Crear expediente</button>' : '') + '</div>';
    } else {
      list.innerHTML = recent.map(function(e) { return renderExpCard(e); }).join('');
    }
  } catch(err) {
    document.getElementById('recent-list').innerHTML = '<p class="form-error">Error al cargar datos.</p>';
  }
});

// EXPEDIENTES
Router.register('expedientes', async function(container) {
  container.className = 'view-container fade-in';
  renderHeader(); renderSidebar();
  const isPro = Store.isProfesional();
  container.innerHTML =
    '<div class="page-header"><div><h1 class="page-title">Expedientes</h1></div>' +
    (isPro ? '<div class="page-actions"><button class="btn btn-primary" onclick="Router.go(\'nuevo-expediente\')">+ Nuevo</button></div>' : '') +
    '</div>' +
    '<div class="search-bar"><input class="form-input" id="search-input" placeholder="Buscar por caratula, numero..." oninput="filterExps()" style="flex:1;max-width:360px">' +
    '<div class="filter-chips" id="chips">' +
    '<span class="chip active" data-s="">Todos</span>' +
    '<span class="chip" data-s="activo">Activo</span>' +
    '<span class="chip" data-s="urgente">Urgente</span>' +
    '<span class="chip" data-s="suspendido">Suspendido</span>' +
    '<span class="chip" data-s="archivado">Archivado</span>' +
    '</div></div>' +
    '<div id="exp-list"><div class="spinner"></div></div>';

  let allExps = [];
  document.getElementById('chips').addEventListener('click', function(e) {
    if (e.target.dataset.s === undefined) return;
    Utils.$$('.chip', document.getElementById('chips')).forEach(function(c) { c.classList.remove('active'); });
    e.target.classList.add('active');
    renderExps();
  });

  window.filterExps = renderExps;
  window.renderExps = renderExps;

  function renderExps() {
    const q = (document.getElementById('search-input').value || '').toLowerCase();
    const s = (document.querySelector('.chip.active') || {}).dataset.s || '';
    let list = allExps;
    if (s) list = list.filter(function(e) { return e.estado === s; });
    if (q) list = list.filter(function(e) { return ((e.caratula || '') + ' ' + (e.numero || '')).toLowerCase().includes(q); });
    const el = document.getElementById('exp-list');
    if (!list.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📂</div><p class="empty-state-text">Sin resultados</p></div>';
    } else {
      el.innerHTML = '<div class="grid-2">' + list.map(function(e) { return renderExpCard(e); }).join('') + '</div>';
    }
  }

  try {
    allExps = await API.getExpedientes();
    Store.setExpedientes(allExps);
    renderExps();
  } catch(err) {
    document.getElementById('exp-list').innerHTML = '<p class="form-error">Error al cargar expedientes.</p>';
  }
});

function renderExpCard(e) {
  return '<div class="expediente-card" onclick="verExpediente(\'' + e.id + '\')">' +
    '<div class="expediente-card-header">' +
    '<div><div class="expediente-numero">' + (e.numero || 'S/N') + '</div>' +
    '<div class="expediente-caratula">' + Utils.truncate(e.caratula, 55) + '</div></div>' +
    Utils.statusBadge(e.estado || 'activo') + '</div>' +
    '<div class="expediente-juzgado">' + (e.juzgado || '') + '</div>' +
    '<div class="expediente-meta">' +
    '<span class="expediente-fecha">Actualizado: ' + Utils.formatDate(e.updatedAt) + '</span>' +
    '</div></div>';
}

function verExpediente(id) {
  Router.go('expediente-detalle', { id: id });
}

// EXPEDIENTE DETALLE
Router.register('expediente-detalle', async function(container) {
  container.className = 'view-container fade-in';
  renderHeader(); renderSidebar();
  const id = Router.params().id;
  if (!id) { Router.go('expedientes'); return; }
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const exp = await API.getExpediente(id);
    if (!exp) { container.innerHTML = '<p class="form-error">Expediente no encontrado.</p>'; return; }
    Store.setCurrent(exp);
    const isPro = Store.isProfesional();
    const user = Store.getUser();
    const waLink = exp.clienteTelefono ? WA.linkNovedades(exp.clienteTelefono, exp.caratula, 'Hay nuevas novedades en su expediente.') : null;

    container.innerHTML =
      '<div class="page-header"><div>' +
      '<button class="btn btn-ghost btn-sm" onclick="Router.go(\'expedientes\')" style="margin-bottom:0.5rem">&larr; Volver</button>' +
      '<h1 class="page-title">' + Utils.truncate(exp.caratula, 60) + '</h1>' +
      '<p class="page-subtitle">' + (exp.numero || 'S/N') + ' &mdash; ' + Utils.statusBadge(exp.estado || 'activo') + '</p></div>' +
      (isPro ? '<div class="page-actions">' +
        (waLink ? '<a class="btn btn-wa btn-sm" href="' + waLink + '" target="_blank">&#128362; Notificar cliente</a>' : '') +
        '<button class="btn btn-outline btn-sm" onclick="editarExpediente(\'' + id + '\')">&#9998; Editar</button>' +
        '<button class="btn btn-danger btn-sm" onclick="confirmarEliminar(\'' + id + '\')">&#128465; Eliminar</button>' +
        '</div>' : '') +
      '</div>' +
      '<div class="grid-2">' +
      '<div><div class="card"><div class="detail-section">' +
      '<div class="detail-section-title">Datos del expediente</div>' +
      row('Numero', exp.numero) + row('Caratula', exp.caratula) + row('Juzgado', exp.juzgado) +
      row('Secretaria', exp.secretaria) + row('Fuero', exp.fuero) + row('Estado', Utils.statusLabel(exp.estado)) +
      row('Inicio', Utils.formatDate(exp.fechaInicio)) + row('Proximo vencimiento', Utils.formatDate(exp.proximoVencimiento)) +
      '</div></div>' +
      (isPro ? '<div class="card" style="margin-top:1rem"><div class="detail-section"><div class="detail-section-title">Datos del cliente</div>' +
        row('Cliente', exp.clienteNombre) + row('Telefono', exp.clienteTelefono) +
        '</div></div>' : '') +
      '</div>' +
      '<div>' +
      '<div class="card">' +
      '<div class="card-header"><h3 class="card-title">Actualizaciones</h3>' +
      (isPro ? '<button class="btn btn-primary btn-sm" onclick="nuevaActualizacion(\'' + id + '\')">+ Agregar</button>' : '') +
      '</div>' +
      '<div class="card-body" id="actualizaciones-list">' + renderActualizaciones(exp.actualizaciones || []) + '</div>' +
      '</div>' +
      '</div>' +
      '</div>';
  } catch(e) {
    container.innerHTML = '<p class="form-error">Error al cargar el expediente.</p>';
  }
});

function row(k, v) {
  return '<div class="detail-row"><div class="detail-key">' + k + '</div><div class="detail-val">' + (v || '—') + '</div></div>';
}

function renderActualizaciones(list) {
  if (!list || !list.length) return '<div class="empty-state" style="padding:1.5rem 0"><div class="empty-state-icon">&#128222;</div><p class="empty-state-text">Sin actualizaciones aun</p></div>';
  return '<div class="timeline">' + list.slice().reverse().map(function(u) {
    return '<div class="timeline-item"><div class="timeline-dot"></div>' +
      '<div class="timeline-date">' + (u.fecha ? Utils.formatDateTime(u.fecha) : '') + ' &mdash; ' + (u.autorNombre || '') + '</div>' +
      '<div class="timeline-content">' + (u.texto || '') + '</div></div>';
  }).join('') + '</div>';
}

async function nuevaActualizacion(expId) {
  showModal(
    '<div class="modal-header"><h3 class="modal-title">Nueva actualizacion</h3><button class="modal-close" onclick="closeModal()">&#x2715;</button></div>' +
    '<div class="form-group"><label class="form-label">Texto de la novedad</label><textarea class="form-input" id="upd-texto" rows="4" placeholder="Descripcion de la novedad..."></textarea></div>' +
    '<div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>' +
    '<button class="btn btn-primary" id="upd-btn" onclick="guardarActualizacion(\'' + expId + '\')">Guardar</button></div>'
  );
}

async function guardarActualizacion(expId) {
  const texto = (document.getElementById('upd-texto') || {}).value || '';
  const btn = document.getElementById('upd-btn');
  if (!texto.trim()) { toast('Ingrese el texto de la actualizacion', 'warning'); return; }
  Utils.setLoading(btn, true);
  try {
    await API.addActualizacion(expId, texto.trim());
    toast('Actualizacion guardada', 'success');
    closeModal();
    Router.go('expediente-detalle', { id: expId });
  } catch(e) {
    toast('Error al guardar', 'error');
    Utils.setLoading(btn, false);
  }
}

async function confirmarEliminar(id) {
  showModal(
    '<div class="modal-header"><h3 class="modal-title">Eliminar expediente</h3><button class="modal-close" onclick="closeModal()">&#x2715;</button></div>' +
    '<p>Esta accion no se puede deshacer. El expediente y todas sus actualizaciones seran eliminados.</p>' +
    '<div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>' +
    '<button class="btn btn-danger" id="del-btn" onclick="doEliminar(\'' + id + '\')">Eliminar</button></div>'
  );
}

async function doEliminar(id) {
  Utils.setLoading(document.getElementById('del-btn'), true);
  try {
    await API.deleteExpediente(id);
    toast('Expediente eliminado', 'info');
    closeModal();
    Router.go('expedientes');
  } catch(e) {
    toast('Error al eliminar', 'error');
  }
}

function editarExpediente(id) {
  Router.go('nuevo-expediente', { id: id });
}

// NUEVO / EDITAR EXPEDIENTE
Router.register('nuevo-expediente', async function(container) {
  container.className = 'view-container fade-in';
  renderHeader(); renderSidebar();
  if (!Store.isProfesional()) { Router.go('dashboard'); return; }
  const id = Router.params().id;
  const editing = !!id;
  let exp = null;
  if (editing) { try { exp = await API.getExpediente(id); } catch(e) {} }
  let clientes = [];
  try { clientes = await API.getClientes(); Store.setClientes(clientes); } catch(e) {}
  const v = function(f) { return exp ? (exp[f] || '') : ''; };

  container.innerHTML =
    '<div class="page-header"><div>' +
    '<button class="btn btn-ghost btn-sm" onclick="history.back()" style="margin-bottom:0.5rem">&larr; Volver</button>' +
    '<h1 class="page-title">' + (editing ? 'Editar expediente' : 'Nuevo expediente') + '</h1></div></div>' +
    '<div class="card" style="max-width:720px">' +
    '<div class="grid-2">' +
    field('Numero de expediente', 'exp-numero', 'text', v('numero'), 'Ej: SI-12345/2024') +
    field('Caratula', 'exp-caratula', 'text', v('caratula'), 'Nombre de la causa') +
    field('Juzgado', 'exp-juzgado', 'text', v('juzgado'), 'Ej: Juzgado Civil N°3') +
    field('Secretaria', 'exp-secretaria', 'text', v('secretaria'), '') +
    field('Fuero', 'exp-fuero', 'text', v('fuero'), 'Ej: Laboral, Civil, Familia') +
    '<div class="form-group"><label class="form-label">Estado</label>' +
    '<select class="form-select" id="exp-estado">' +
    ['activo','urgente','suspendido','archivado'].map(function(s) {
      return '<option value="' + s + '"' + (v('estado') === s ? ' selected' : '') + '>' + Utils.statusLabel(s) + '</option>';
    }).join('') + '</select></div>' +
    field('Fecha de inicio', 'exp-inicio', 'date', v('fechaInicio'), '') +
    field('Proximo vencimiento', 'exp-vencimiento', 'date', v('proximoVencimiento'), '') +
    '</div>' +
    '<div class="divider"></div>' +
    '<div class="form-group"><label class="form-label">Cliente</label>' +
    '<select class="form-select" id="exp-cliente">' +
    '<option value="">-- Sin asignar --</option>' +
    clientes.map(function(c) {
      return '<option value="' + c.id + '"' + (v('clienteId') === c.id ? ' selected' : '') + ' data-nombre="' + (c.nombre || '') + '" data-tel="' + (c.telefono || '') + '">' + (c.nombre || c.email) + '</option>';
    }).join('') + '</select></div>' +
    '<div class="form-group"><label class="form-label">Observaciones</label>' +
    '<textarea class="form-input" id="exp-obs" rows="3">' + v('observaciones') + '</textarea></div>' +
    '<div class="modal-footer" style="margin-top:1rem">' +
    '<button class="btn btn-ghost" onclick="history.back()">Cancelar</button>' +
    '<button class="btn btn-primary" id="save-exp-btn" onclick="guardarExpediente(' + (editing ? '\'' + id + '\'' : 'null') + ')">Guardar expediente</button>' +
    '</div></div>';
});

function field(label, id, type, val, ph) {
  return '<div class="form-group"><label class="form-label">' + label + '</label>' +
    '<input class="form-input" type="' + type + '" id="' + id + '" value="' + (val || '') + '" placeholder="' + (ph || '') + '"></div>';
}

async function guardarExpediente(editId) {
  const btn = document.getElementById('save-exp-btn');
  const sel = document.getElementById('exp-cliente');
  const opt = sel ? sel.options[sel.selectedIndex] : null;
  const data = {
    numero: (document.getElementById('exp-numero') || {}).value || '',
    caratula: (document.getElementById('exp-caratula') || {}).value || '',
    juzgado: (document.getElementById('exp-juzgado') || {}).value || '',
    secretaria: (document.getElementById('exp-secretaria') || {}).value || '',
    fuero: (document.getElementById('exp-fuero') || {}).value || '',
    estado: (document.getElementById('exp-estado') || {}).value || 'activo',
    fechaInicio: (document.getElementById('exp-inicio') || {}).value || '',
    proximoVencimiento: (document.getElementById('exp-vencimiento') || {}).value || '',
    observaciones: (document.getElementById('exp-obs') || {}).value || '',
    clienteId: sel ? sel.value : '',
    clienteNombre: opt ? (opt.dataset.nombre || '') : '',
    clienteTelefono: opt ? (opt.dataset.tel || '') : ''
  };
  if (!data.caratula) { toast('La caratula es obligatoria', 'warning'); return; }
  Utils.setLoading(btn, true);
  try {
    if (editId) {
      await API.updateExpediente(editId, data);
      toast('Expediente actualizado', 'success');
      Router.go('expediente-detalle', { id: editId });
    } else {
      const newId = await API.createExpediente(data);
      toast('Expediente creado', 'success');
      Router.go('expediente-detalle', { id: newId });
    }
  } catch(e) {
    toast('Error al guardar: ' + (e.message || ''), 'error');
    Utils.setLoading(btn, false);
  }
}

// CLIENTES
Router.register('clientes', async function(container) {
  container.className = 'view-container fade-in';
  renderHeader(); renderSidebar();
  if (!Store.isProfesional()) { Router.go('dashboard'); return; }
  container.innerHTML =
    '<div class="page-header"><h1 class="page-title">Clientes</h1>' +
    '<div class="page-actions"><button class="btn btn-primary" onclick="nuevoCliente()">+ Agregar cliente</button></div></div>' +
    '<div id="clientes-list"><div class="spinner"></div></div>';
  try {
    const clis = await API.getClientes();
    Store.setClientes(clis);
    const el = document.getElementById('clientes-list');
    if (!clis.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p class="empty-state-text">Sin clientes aun</p><button class="btn btn-primary" style="margin-top:1rem" onclick="nuevoCliente()">Agregar el primero</button></div>';
      return;
    }
    el.innerHTML = '<div class="card"><div class="table-wrapper"><table><thead><tr><th>Nombre</th><th>Email</th><th>Telefono</th><th>WhatsApp</th><th>Acciones</th></tr></thead><tbody>' +
      clis.map(function(c) {
        return '<tr><td><div class="avatar" style="display:inline-flex;margin-right:8px">' + Utils.initials(c.nombre) + '</div>' + (c.nombre || '—') + '</td>' +
          '<td>' + (c.email || '—') + '</td><td>' + (c.telefono || '—') + '</td>' +
          '<td>' + (c.telefono ? '<a class="btn btn-wa btn-sm" href="' + WA.linkInvitacion(c.telefono, c.nombre, location.origin) + '" target="_blank">Invitar</a>' : '—') + '</td>' +
          '<td><button class="btn btn-ghost btn-sm" onclick="editarCliente(\'' + c.id + '\')">&#9998;</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="confirmarEliminarCliente(\'' + c.id + '\')">&#128465;</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';
  } catch(e) {
    document.getElementById('clientes-list').innerHTML = '<p class="form-error">Error al cargar clientes.</p>';
  }
});

function nuevoCliente() { modalCliente(null); }
function editarCliente(id) {
  const c = Store.getClientes().find(function(x) { return x.id === id; });
  modalCliente(c);
}

function modalCliente(c) {
  const editing = !!c;
  showModal(
    '<div class="modal-header"><h3 class="modal-title">' + (editing ? 'Editar cliente' : 'Nuevo cliente') + '</h3><button class="modal-close" onclick="closeModal()">&#x2715;</button></div>' +
    '<div class="form-group"><label class="form-label">Nombre completo *</label><input class="form-input" id="cli-nombre" value="' + ((c && c.nombre) || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Email *</label><input class="form-input" type="email" id="cli-email" value="' + ((c && c.email) || '') + '"' + (editing ? ' readonly' : '') + '></div>' +
    '<div class="form-group"><label class="form-label">Telefono WhatsApp (ej: 5491150000000)</label><input class="form-input" id="cli-tel" value="' + ((c && c.telefono) || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Contrasena' + (editing ? ' (dejar vacio para no cambiar)' : ' *') + '</label><input class="form-input" type="password" id="cli-pass" placeholder="Min 6 caracteres"></div>' +
    '<div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>' +
    '<button class="btn btn-primary" id="cli-btn" onclick="guardarCliente(\'' + ((c && c.id) || '') + '\')">' + (editing ? 'Actualizar' : 'Crear') + '</button></div>'
  );
}

async function guardarCliente(editId) {
  const nombre = (document.getElementById('cli-nombre') || {}).value || '';
  const email = (document.getElementById('cli-email') || {}).value || '';
  const tel = (document.getElementById('cli-tel') || {}).value || '';
  const pass = (document.getElementById('cli-pass') || {}).value || '';
  const btn = document.getElementById('cli-btn');
  if (!nombre || !email) { toast('Nombre y email son obligatorios', 'warning'); return; }
  if (!editId && !pass) { toast('La contrasena es obligatoria para nuevos clientes', 'warning'); return; }
  Utils.setLoading(btn, true);
  try {
    if (editId) {
      await API.updateUsuario(editId, { nombre: nombre, telefono: tel });
    } else {
      // Crear usuario en Firebase Auth
      const secondary = firebase.initializeApp(firebase.app().options, 'new-' + Utils.uid());
      const cred = await secondary.auth().createUserWithEmailAndPassword(email, pass);
      const uid = cred.user.uid;
      await secondary.auth().signOut();
      secondary.delete();
      await API.createUsuario(uid, { nombre: nombre, email: email, telefono: tel, rol: 'cliente', clienteId: uid });
    }
    toast(editId ? 'Cliente actualizado' : 'Cliente creado', 'success');
    closeModal();
    Router.go('clientes');
  } catch(e) {
    toast('Error: ' + (e.message || ''), 'error');
    Utils.setLoading(btn, false);
  }
}

async function confirmarEliminarCliente(id) {
  showModal(
    '<div class="modal-header"><h3 class="modal-title">Eliminar cliente</h3><button class="modal-close" onclick="closeModal()">&#x2715;</button></div>' +
    '<p>El cliente ya no podra acceder a la app. Los expedientes vinculados no seran eliminados.</p>' +
    '<div class="modal-footer"><button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>' +
    '<button class="btn btn-danger" id="del-cli-btn" onclick="doEliminarCliente(\'' + id + '\')">Eliminar</button></div>'
  );
}

async function doEliminarCliente(id) {
  Utils.setLoading(document.getElementById('del-cli-btn'), true);
  try {
    await API.deleteUsuario(id);
    toast('Cliente eliminado', 'info');
    closeModal();
    Router.go('clientes');
  } catch(e) {
    toast('Error al eliminar', 'error');
  }
}

// PERFIL
Router.register('perfil', async function(container) {
  container.className = 'view-container fade-in';
  renderHeader(); renderSidebar();
  const user = Store.getUser();
  container.innerHTML =
    '<div class="page-header"><h1 class="page-title">Mi Perfil</h1></div>' +
    '<div class="card" style="max-width:480px">' +
    '<div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem">' +
    '<div class="avatar" style="width:56px;height:56px;font-size:1.3rem">' + Utils.initials(user.nombre) + '</div>' +
    '<div><div style="font-weight:600;font-size:1.05rem">' + (user.nombre || '—') + '</div>' +
    '<div style="font-size:0.82rem;color:var(--text-muted)">' + (user.rol === 'profesional' ? 'Profesional' : 'Cliente') + '</div></div>' +
    '</div>' +
    '<div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="perfil-nombre" value="' + (user.nombre || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Email</label><input class="form-input" value="' + (user.email || '') + '" readonly></div>' +
    (user.rol === 'profesional' ? '<div class="form-group"><label class="form-label">WhatsApp profesional</label><input class="form-input" id="perfil-wa" placeholder="5491150000000" value="' + (user.whatsapp || '') + '"></div>' : '') +
    '<button class="btn btn-primary" id="perfil-btn" onclick="guardarPerfil()">Guardar cambios</button>' +
    '</div>';
});

async function guardarPerfil() {
  const btn = document.getElementById('perfil-btn');
  const nombre = (document.getElementById('perfil-nombre') || {}).value || '';
  const wa = (document.getElementById('perfil-wa') || {}).value || '';
  const user = Store.getUser();
  Utils.setLoading(btn, true);
  try {
    const upd = { nombre: nombre };
    if (user.rol === 'profesional') upd.whatsapp = wa;
    await API.updateUsuario(user.uid, upd);
    Store.setUser(Object.assign({}, user, upd));
    toast('Perfil actualizado', 'success');
    renderHeader();
  } catch(e) {
    toast('Error al guardar', 'error');
  }
  Utils.setLoading(btn, false);
}

// CONFIGURACION
Router.register('configuracion', async function(container) {
  container.className = 'view-container fade-in';
  renderHeader(); renderSidebar();
  if (!Store.isProfesional()) { Router.go('dashboard'); return; }
  container.innerHTML =
    '<div class="page-header"><h1 class="page-title">Configuracion</h1></div>' +
    '<div class="card" style="max-width:560px">' +
    '<h3 class="card-title" style="margin-bottom:1rem">Acceso de clientes via WhatsApp</h3>' +
    '<p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:1rem">Cuando un cliente solicite acceso, recibiras un mensaje de WhatsApp. Desde el panel de Clientes podes crear su cuenta y enviarle el link de acceso.</p>' +
    '<div class="form-group"><label class="form-label">Numero WhatsApp para solicitudes (sin + ni espacios)</label><input class="form-input" id="cfg-wa" value="' + (WA_CONFIG.numeroEstudio || '') + '"></div>' +
    '<div class="form-group"><label class="form-label">Mensaje de bienvenida al invitar cliente</label><textarea class="form-input" id="cfg-msg" rows="3">' + (WA_CONFIG.mensaje || '') + '</textarea></div>' +
    '<button class="btn btn-primary" id="cfg-btn" onclick="guardarConfig()">Guardar</button>' +
    '<div class="divider"></div>' +
    '<h3 class="card-title" style="margin-bottom:1rem">Link de solicitud para clientes</h3>' +
    '<p style="font-size:0.88rem;color:var(--text-muted)">Comparta este link con sus clientes para que soliciten acceso:</p>' +
    '<div style="display:flex;gap:0.5rem;margin-top:0.5rem">' +
    '<input class="form-input" value="' + location.origin + '/#/solicitar-acceso" readonly id="link-input">' +
    '<button class="btn btn-outline" onclick="copiarLink()">Copiar</button></div>' +
    '</div>';
});

function guardarConfig() {
  WA_CONFIG.numeroEstudio = (document.getElementById('cfg-wa') || {}).value || WA_CONFIG.numeroEstudio;
  WA_CONFIG.mensaje = (document.getElementById('cfg-msg') || {}).value || WA_CONFIG.mensaje;
  toast('Configuracion guardada en esta sesion', 'success');
}
function copiarLink() {
  const el = document.getElementById('link-input');
  if (!el) return;
  el.select();
  document.execCommand('copy');
  toast('Link copiado al portapapeles', 'success');
}

// SOLICITAR ACCESO (publica)
Router.register('solicitar-acceso', function(container) {
  document.getElementById('app-header').style.display = 'none';
  document.getElementById('app-sidebar').style.display = 'none';
  container.className = 'auth-wrapper';
  container.innerHTML =
    '<div class="auth-card fade-in">' +
    '<div class="auth-logo">' +
    '<img src="assets/logo.svg" alt="MiExpediente" width="60">' +
    '<div class="auth-logo-title">MiExpediente</div>' +
    '<div class="auth-logo-sub">Estudio Juridico Manulis</div>' +
    '</div>' +
    '<h2 style="font-size:1.05rem;margin-bottom:1rem;text-align:center">Solicitar acceso</h2>' +
    '<p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:1.25rem;text-align:center">Para acceder a MiExpediente y consultar el estado de su causa, envie un mensaje de WhatsApp al estudio. Le crearemos su cuenta y le enviaremos el acceso.</p>' +
    '<a class="btn btn-wa btn-block btn-lg" href="' + WA.linkSolicitud() + '" target="_blank">&#128362; Solicitar acceso por WhatsApp</a>' +
    '<div class="auth-divider">o</div>' +
    '<p style="font-size:0.85rem;text-align:center;color:var(--text-muted)">Si ya tenes cuenta: <a href="#/login">Iniciar sesion</a></p>' +
    '</div>';
});

// ── PWA service worker ──────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function() {});
}

// Timeout de seguridad: oculta el loading-screen si Firebase no responde en 5s
setTimeout(function() {
  var loading = document.getElementById('loading-screen');
  if (loading && loading.style.display !== 'none') {
    loading.style.display = 'none';
    console.warn('[App] Timeout de seguridad: loading-screen ocultado tras 5s sin respuesta de Firebase.');
  }
}, 5000);

// Iniciar router
Router.init();
