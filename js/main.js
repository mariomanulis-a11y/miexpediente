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
    '<div class="header-search-wrap" id="header-search-wrap">' +
    '<input class="header-search-input" id="header-search" type="search" placeholder="🔍 Buscar..." autocomplete="off" ' +
    'oninput="_globalSearch(this.value)" onfocus="_globalSearch(this.value)">' +
    '<div class="header-search-dropdown" id="header-search-dropdown" style="display:none"></div>' +
    '</div>' +
    '<div class="header-actions">' +
    '<span class="header-user">' + (user.nombre || user.email) + '</span>' +
    '<button class="btn btn-ghost btn-sm" onclick="Auth.logout()" style="color:#fff;border-color:rgba(255,255,255,0.3)">Salir</button>' +
    '</div>';
  document.getElementById('hamburger-btn').onclick = toggleSidebar;
  document.addEventListener('click', function _hsc(e) {
    if (!e.target.closest('#header-search-wrap')) {
      var dd = document.getElementById('header-search-dropdown');
      if (dd) dd.style.display = 'none';
    }
  }, { once: false, capture: false });
}

// ── Búsqueda global ──────────────────────────────────────────
function _globalSearch(q) {
  var dd = document.getElementById('header-search-dropdown');
  if (!dd) return;
  q = (q || '').trim().toLowerCase();
  if (!q) { dd.style.display = 'none'; return; }
  var exps = Store.getExpedientes();
  var hits = exps.filter(function(e) {
    return ((e.caratula || '') + ' ' + (e.numero || '') + ' ' + (e.juzgado || '')).toLowerCase().indexOf(q) >= 0;
  }).slice(0, 8);
  if (!hits.length) {
    dd.innerHTML = '<div class="hsd-empty">Sin resultados</div>';
  } else {
    dd.innerHTML = hits.map(function(e) {
      return '<div class="hsd-item" onclick="_globalSearchGo(\'' + e.id + '\')">' +
             '<div class="hsd-caratula">' + Utils.truncate(e.caratula, 45) + '</div>' +
             '<div class="hsd-meta">' + (e.numero || 'S/N') + (e.fuero ? ' · ' + e.fuero : '') + '</div>' +
             '</div>';
    }).join('');
  }
  dd.style.display = 'block';
}
function _globalSearchGo(id) {
  var dd = document.getElementById('header-search-dropdown');
  var inp = document.getElementById('header-search');
  if (dd) dd.style.display = 'none';
  if (inp) inp.value = '';
  Router.go('expediente-detalle', { id: id });
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
    html += '<div class="sidebar-label">Herramientas</div>';
    html += link('reportes', '📊', 'Reportes &amp; Auditoría');
    html += link('calendario', '📅', 'Calendario');
    html += '<div style="padding:6px 12px;display:flex;flex-direction:column;gap:4px">' +
            '<button id="sync-btn" class="btn-sync" onclick="syncDesdeSheets()" style="width:100%">' +
            '&#8635; Sincronizar desde Sheet</button>' +
            '<button class="btn-sync" onclick="verificarSync()" style="width:100%;font-size:.72rem">' +
            '&#128202; Verificar columnas GAS</button></div>';
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

async function syncDesdeSheets() {
  var btn = document.getElementById('sync-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Sincronizando...'; }
  try {
    var result = await API.syncFromSheets();
    var msg = '✅ Sincronizado: ' + result.created + ' nuevos, ' + result.upserted + ' actualizados';
    if (result.merged > 0) msg += ' (' + result.merged + ' con datos locales preservados)';
    toast(msg, 'success', 7000);
    // Refresca lista si estamos en expedientes
    if (Router.current() === 'expedientes') Router.go('expedientes');
    if (Router.current() === 'dashboard')   Router.go('dashboard');
  } catch(e) {
    toast('Error: ' + (e.message || 'Sin conexión al Sheet'), 'error', 8000);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '↻ Sincronizar desde Sheet'; }
  }
}

async function guardarEnSheet() {
  var btn = document.getElementById('push-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Guardando...'; }
  try {
    var result = await API.pushToSheets();
    var msg = '✅ Sheet actualizado: ' + result.updated + ' expediente' + (result.updated !== 1 ? 's' : '');
    if (result.notFound && result.notFound.length) {
      msg += ' (' + result.notFound.length + ' no encontrado' + (result.notFound.length !== 1 ? 's' : '') + ' en Sheet)';
    }
    toast(msg, 'success', 7000);
    if (btn) btn.style.display = 'none';
  } catch(e) {
    toast('Error al guardar en Sheet: ' + (e.message || 'Sin conexión'), 'error', 8000);
    if (btn) {
      btn.disabled = false;
      var count = API.getPendingSyncCount();
      btn.innerHTML = '&#8679; Guardar en Sheet <span id="push-badge" class="badge">' + count + '</span>';
    }
  }
}

async function verificarSync() {
  try {
    var diag = await CausasAPI.getDiagnostico();
    if (!diag || diag.error) throw new Error(diag ? diag.error : 'Sin respuesta');
    var h = '<div class="modal-header"><h3 class="modal-title">Diagnóstico de columnas GAS</h3>' +
            '<button class="modal-close" onclick="closeModal()">&#x2715;</button></div>' +
            '<div style="max-height:60vh;overflow-y:auto">';
    diag.forEach(function(p) {
      h += '<div style="margin-bottom:1rem"><strong>' + p.pestana + '</strong> — ' + p.filas + ' filas<br>' +
           '<span style="font-size:.78rem;color:var(--text-muted)">Mapeados: ' + p.mapeados.join(', ') + '</span>';
      if (p.sinMapear && p.sinMapear.length) {
        h += '<br><span style="font-size:.75rem;color:#ef4444">Sin mapear: ' + p.sinMapear.join(', ') + '</span>';
      }
      h += '</div>';
    });
    h += '</div>';
    showModal(h);
  } catch(e) {
    toast('Error: ' + e.message, 'error');
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
    (isPro ? '<div class="stat-card"><span class="stat-icon">👥</span><div><div class="stat-label">Clientes</div><div class="stat-value" id="stat-cli">—</div></div></div><div class="stat-card"><span class="stat-icon">🔴</span><div><div class="stat-label">Urgentes</div><div class="stat-value" id="stat-urg">—</div></div></div><div class="stat-card"><span class="stat-icon">✅</span><div><div class="stat-label">Activos</div><div class="stat-value" id="stat-act">—</div></div></div><div class="stat-card" style="cursor:pointer" onclick="Router.go(\'calendario\')"><span class="stat-icon">📅</span><div><div class="stat-label">Vencimientos 7d</div><div class="stat-value" id="stat-venc" style="color:#ef4444">—</div></div></div>' : '') +
    '</div>' +
    (isPro ? '<div id="venc-alert-section" style="margin-top:1.25rem"></div>' : '') +
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
      // Vencimientos próximos 7 días
      const hoyMs = Date.now();
      const venc7 = exps.filter(function(e) {
        if (!e.proximoVencimiento) return false;
        var d = new Date(e.proximoVencimiento);
        if (isNaN(d.getTime())) return false;
        var diff = (d.getTime() - hoyMs) / 86400000;
        return diff >= -1 && diff <= 7;
      });
      document.getElementById('stat-venc').textContent = venc7.length;
      var vSec = document.getElementById('venc-alert-section');
      if (vSec && venc7.length) {
        var vh = '<div class="card" style="border:1px solid rgba(239,68,68,.35);padding:0">' +
          '<div style="padding:.75rem 1.25rem;border-bottom:1px solid rgba(239,68,68,.2);display:flex;align-items:center;gap:.5rem">' +
          '<span style="color:#ef4444">⚠️</span><span style="font-weight:600;color:#ef4444;font-size:.9rem">Vencimientos próximos (7 días)</span></div>' +
          '<div class="table-wrapper"><table><thead><tr><th>Carátula</th><th>Vence</th><th>Estado</th></tr></thead><tbody>';
        venc7.forEach(function(e) {
          var d = new Date(e.proximoVencimiento);
          var diff = Math.ceil((d.getTime() - hoyMs) / 86400000);
          var cls = diff <= 1 ? '#ef4444' : diff <= 3 ? '#f59e0b' : '#22c55e';
          vh += '<tr onclick="Router.go(\'expediente-detalle\',{id:\'' + e.id + '\'})" style="cursor:pointer">' +
            '<td style="font-weight:500">' + Utils.truncate(e.caratula, 40) + '</td>' +
            '<td style="color:' + cls + ';font-weight:700">' + Utils.formatDate(e.proximoVencimiento) + (diff <= 0 ? ' (VENCIDO)' : diff === 1 ? ' (mañana)' : ' (en ' + diff + 'd)') + '</td>' +
            '<td>' + Utils.statusBadge(e.estado || 'activo') + '</td></tr>';
        });
        vh += '</tbody></table></div></div>';
        vSec.innerHTML = vh;
      }
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
    '<div class="page-actions">' +
    (isPro
      ? '<button class="btn-sync" id="sync-btn" onclick="syncDesdeSheets()" title="Sincronizar desde Google Sheets">&#8635; Sync</button>' +
        '<button class="btn btn-outline btn-sm" id="push-btn" onclick="guardarEnSheet()" title="Guardar cambios locales en Google Sheets" style="display:none">&#8679; Guardar en Sheet <span id="push-badge" class="badge"></span></button>'
      : '') +
    '<button class="btn btn-success btn-sm" onclick="exportarExcel()" title="Exportar listado a CSV/Excel" style="gap:5px">&#128202; Excel</button>' +
    '<button class="btn btn-danger btn-sm" onclick="exportarPDF()" title="Descargar PDF del listado" style="gap:5px">&#128196; PDF</button>' +
    (isPro ? '<button class="btn btn-primary" onclick="Router.go(\'nuevo-expediente\')">+ Nuevo</button>' : '') +
    '</div>' +
    '</div>' +

    // ── Barra de búsqueda ──
    '<div class="search-bar" style="flex-wrap:wrap;gap:.5rem">' +
    '<input class="form-input" id="search-input" placeholder="Buscar por carátula, número..." oninput="_expFilter()" style="flex:1;min-width:200px;max-width:340px">' +
    '</div>' +

    // ── Filtros dinámicos ──
    '<div id="exp-filters" style="display:flex;flex-wrap:wrap;gap:.75rem;margin-bottom:1rem;align-items:flex-start">' +

    // Estado (desplegable)
    '<div>' +
    '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text-muted);margin-bottom:5px">Estado</div>' +
    '<select id="filter-estado" class="form-select" style="min-width:155px;font-size:.82rem" onchange="_expFilter()">' +
    '<option value="">Todos</option>' +
    '<option value="activo">Activo</option>' +
    '<option value="urgente">Urgente</option>' +
    '<option value="suspendido">Suspendido</option>' +
    '<option value="archivado">Archivado</option>' +
    '</select></div>' +

    // Fuero (se puebla dinámicamente)
    '<div>' +
    '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text-muted);margin-bottom:5px">Fuero</div>' +
    '<select id="filter-fuero" class="form-select" style="min-width:180px;font-size:.82rem" onchange="_expFilter()">' +
    '<option value="">Todos los fueros</option>' +
    '</select></div>' +

    // Departamento judicial (dinámico)
    '<div>' +
    '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text-muted);margin-bottom:5px">Departamento judicial</div>' +
    '<select id="filter-dept" class="form-select" style="min-width:180px;font-size:.82rem" onchange="_expFilter()">' +
    '<option value="">Todos</option>' +
    '</select></div>' +

    // Etapa (dinámica)
    '<div>' +
    '<div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.8px;color:var(--text-muted);margin-bottom:5px">Etapa procesal</div>' +
    '<select id="filter-etapa" class="form-select" style="min-width:180px;font-size:.82rem" onchange="_expFilter()">' +
    '<option value="">Todas las etapas</option>' +
    '</select></div>' +

    // Botón limpiar
    '<div style="align-self:flex-end">' +
    '<button class="btn btn-ghost btn-sm" onclick="_expClearFilters()" id="btn-clear-filters" style="display:none">✕ Limpiar filtros</button>' +
    '</div>' +

    '</div>' + // /exp-filters

    '<div id="exp-count" style="font-size:.8rem;color:var(--text-muted);margin-bottom:.75rem"></div>' +
    '<div id="exp-list"><div class="spinner"></div></div>';


  let allExps = [];
  var PAGE_SIZE = 20;
  window._expPage = 0;

  // Puebla los selects con valores únicos de los datos
  function _buildSelects() {
    var fueros  = {};
    var depts   = {};
    var etapas  = {};

    allExps.forEach(function(e) {
      var f  = _normFuero(e.fuero);
      var d  = (e.departamento || e._sheetName || '').trim();
      var et = (e.etapaProcesal || e.etapaGAS || '').trim();
      if (f && f !== 'Sin especificar') fueros[f]  = true;
      if (d)                            depts[d]   = true;
      if (et)                           etapas[et] = true;
    });

    var selF = document.getElementById('filter-fuero');
    var selD = document.getElementById('filter-dept');
    var selE = document.getElementById('filter-etapa');

    Object.keys(fueros).sort().forEach(function(v) {
      selF.innerHTML += '<option value="' + v + '">' + v + '</option>';
    });
    Object.keys(depts).sort().forEach(function(v) {
      selD.innerHTML += '<option value="' + v + '">' + v + '</option>';
    });
    Object.keys(etapas).sort().forEach(function(v) {
      selE.innerHTML += '<option value="' + v + '">' + v + '</option>';
    });
  }

  window._expFilter = function() {
    var q     = (document.getElementById('search-input').value || '').toLowerCase().trim();
    var s     = (document.getElementById('filter-estado') || {}).value || '';
    var fuero = (document.getElementById('filter-fuero') || {}).value || '';
    var dept  = (document.getElementById('filter-dept')  || {}).value || '';
    var etapa = (document.getElementById('filter-etapa') || {}).value || '';

    var dirty = q || s || fuero || dept || etapa;
    var btn = document.getElementById('btn-clear-filters');
    if (btn) btn.style.display = dirty ? '' : 'none';

    var list = allExps.filter(function(e) {
      if (s && e.estado !== s) return false;
      if (fuero && _normFuero(e.fuero) !== fuero) return false;
      if (dept) {
        var ed = (e.departamento || e._sheetName || '').trim();
        if (ed !== dept) return false;
      }
      if (etapa) {
        var ee = (e.etapaProcesal || e.etapaGAS || '').trim();
        if (ee !== etapa) return false;
      }
      if (q && !((e.caratula || '') + ' ' + (e.numero || '') + ' ' + (e.court || '')).toLowerCase().includes(q)) return false;
      return true;
    });

    window._expFilteredList = list; // expuesto para exportar

    var cnt = document.getElementById('exp-count');
    var totalPages = Math.ceil(list.length / PAGE_SIZE) || 1;
    if (window._expPage >= totalPages) window._expPage = totalPages - 1;
    var page = window._expPage;
    var paged = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    if (cnt) cnt.textContent = list.length + ' expediente' + (list.length !== 1 ? 's' : '') +
      (dirty ? ' (filtrado)' : '') +
      (totalPages > 1 ? ' — pág ' + (page + 1) + '/' + totalPages : '');

    var el = document.getElementById('exp-list');
    if (!list.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📂</div><p class="empty-state-text">Sin resultados para los filtros aplicados</p></div>';
    } else {
      var pagination = totalPages > 1
        ? '<div class="pagination-bar">' +
          '<button class="btn btn-ghost btn-sm" onclick="window._expPage=Math.max(0,window._expPage-1);window._expFilter()" ' + (page === 0 ? 'disabled' : '') + '>&larr; Anterior</button>' +
          '<span style="font-size:.82rem;color:var(--text-muted)">Página ' + (page + 1) + ' de ' + totalPages + '</span>' +
          '<button class="btn btn-ghost btn-sm" onclick="window._expPage=Math.min(' + (totalPages-1) + ',window._expPage+1);window._expFilter()" ' + (page >= totalPages - 1 ? 'disabled' : '') + '>Siguiente &rarr;</button>' +
          '</div>'
        : '';
      el.innerHTML = '<div class="grid-2">' + paged.map(function(e) { return renderExpCard(e); }).join('') + '</div>' + pagination;
    }
  };

  window._expClearFilters = function() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-fuero').value = '';
    document.getElementById('filter-dept').value  = '';
    document.getElementById('filter-etapa').value = '';
    document.getElementById('filter-estado').value = '';
    window._expPage = 0;
    _expFilter();
  };

  try {
    allExps = await API.getExpedientes();
    Store.setExpedientes(allExps);
    _buildSelects();
    _expFilter();
    // Mostrar botón de push si hay cambios pendientes
    var pendingCount = API.getPendingSyncCount();
    var pushBtn = document.getElementById('push-btn');
    if (pushBtn && pendingCount > 0) {
      pushBtn.style.display = '';
      var badge = document.getElementById('push-badge');
      if (badge) badge.textContent = pendingCount;
    }
  } catch(err) {
    document.getElementById('exp-list').innerHTML = '<p class="form-error">Error al cargar expedientes.</p>';
  }
});

// ── Exportar Excel (CSV con BOM UTF-8) ───────────────────────────────────────
function exportarExcel() {
  var list = window._expFilteredList || [];
  if (!list.length) { toast('No hay datos para exportar', 'warning'); return; }

  toast('Generando archivo…', 'info', 3000);

  setTimeout(function() {
    try {
      var cols = [
        { h: 'Carátula',       k: function(e) { return e.caratula || ''; } },
        { h: 'Número Exp.',    k: function(e) { return e.numero || ''; } },
        { h: 'Estado',         k: function(e) { return e.estado || ''; } },
        { h: 'Fuero',          k: function(e) { return e.fuero || ''; } },
        { h: 'Departamento',   k: function(e) { return e.departamento || e._sheetName || ''; } },
        { h: 'Juzgado',        k: function(e) { return e.juzgado || ''; } },
        { h: 'Secretaría',     k: function(e) { return e.secretaria || ''; } },
        { h: 'Etapa Procesal', k: function(e) { return e.etapaProcesal || e.etapaGAS || ''; } },
        { h: 'Fecha Inicio',   k: function(e) { return e.fechaInicio || ''; } },
        { h: 'Tareas',         k: function(e) { return e.tasks_notes || ''; } },
        { h: 'Observaciones',  k: function(e) { return e.observaciones || ''; } },
        { h: 'Cliente',        k: function(e) { return e.clienteNombre || ''; } }
      ];

      var esc = function(v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
      var header = cols.map(function(c) { return esc(c.h); }).join(',');
      var rows   = list.map(function(e) {
        return cols.map(function(c) { return esc(c.k(e)); }).join(',');
      });
      var csv = '\uFEFF' + [header].concat(rows).join('\r\n'); // BOM para Excel

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href     = url;
      a.download = 'expedientes_' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('✅ Archivo descargado (' + list.length + ' expedientes)', 'success', 4000);
    } catch(err) {
      toast('Error al generar Excel: ' + (err.message || ''), 'error');
    }
  }, 30);
}

// ── Exportar PDF (jsPDF + autoTable) ────────────────────────────────────────
function exportarPDF() {
  var list = window._expFilteredList || [];
  if (!list.length) { toast('No hay datos para exportar', 'warning'); return; }

  var jsPDFLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!jsPDFLib) {
    toast('⚠️ Librería PDF no disponible. Verificá tu conexión y recargá la página.', 'error', 6000);
    return;
  }

  toast('Generando PDF…', 'info', 4000);

  setTimeout(function() {
    try {
      var doc     = new jsPDFLib({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      var pageW   = doc.internal.pageSize.getWidth();
      var pageH   = doc.internal.pageSize.getHeight();
      var today   = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      var primary = [30, 58, 95]; // #1e3a5f

      // ── Encabezado ───────────────────────────────────────────────────────
      doc.setFillColor(primary[0], primary[1], primary[2]);
      doc.rect(0, 0, pageW, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text('ESTUDIO MVC ABOGADOS', 14, 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(200, 215, 235);
      doc.text('Listado de Expedientes', 14, 17);

      doc.setTextColor(200, 215, 235);
      doc.text('Generado: ' + today + '   |   Total: ' + list.length + ' expediente' + (list.length !== 1 ? 's' : ''), pageW - 14, 17, { align: 'right' });

      // ── Tabla ────────────────────────────────────────────────────────────
      doc.autoTable({
        startY: 26,
        head: [['Carátula', 'Número', 'Estado', 'Fuero', 'Departamento', 'Juzgado', 'Etapa Procesal', 'Fecha Inicio']],
        body: list.map(function(e) {
          return [
            e.caratula       || '—',
            e.numero         || '—',
            (e.estado        || '—').toUpperCase(),
            e.fuero          || '—',
            e.departamento   || e._sheetName || '—',
            e.juzgado        || '—',
            e.etapaProcesal  || e.etapaGAS || '—',
            e.fechaInicio    || '—'
          ];
        }),
        styles: {
          fontSize: 7,
          cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
          overflow: 'linebreak',
          valign: 'middle'
        },
        headStyles: {
          fillColor: primary,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8
        },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        columnStyles: {
          0: { cellWidth: 72 },  // carátula
          1: { cellWidth: 24 },  // número
          2: { cellWidth: 20 },  // estado
          3: { cellWidth: 22 },  // fuero
          4: { cellWidth: 30 },  // departamento
          5: { cellWidth: 28 },  // juzgado
          6: { cellWidth: 30 },  // etapa
          7: { cellWidth: 20 }   // fecha
        },
        margin: { left: 10, right: 10 }
      });

      // ── Pie de página con número de página ──────────────────────────────
      var totalPages = doc.internal.getNumberOfPages();
      for (var i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        // línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(10, pageH - 12, pageW - 10, pageH - 12);
        // texto izquierda
        doc.text('Estudio MVC Abogados  ·  ' + today, 10, pageH - 7);
        // texto centro (número de página)
        doc.text('Pág. ' + i + ' / ' + totalPages, pageW / 2, pageH - 7, { align: 'center' });
        // texto derecha
        doc.text('Confidencial', pageW - 10, pageH - 7, { align: 'right' });
      }

      doc.save('expedientes_' + new Date().toISOString().slice(0, 10) + '.pdf');
      toast('✅ PDF descargado (' + list.length + ' expedientes)', 'success', 4000);
    } catch(err) {
      toast('Error al generar PDF: ' + (err.message || ''), 'error');
    }
  }, 50); // yield para que el toast se renderice antes de bloquear
}

function renderExpCard(e) {
  var isPro  = Store.isProfesional();
  var etapa  = e.etapaProcesal || e.etapaGAS || '';
  var waLink = (isPro && e.clienteTelefono && etapa)
    ? WA.linkExpediente(e.clienteTelefono, e.caratula, etapa, e.id)
    : null;
  // Indicador de cambios locales pendientes de subir al Sheet
  var pendingDot = '';
  if (isPro) {
    try {
      var _ps = JSON.parse(localStorage.getItem('_mvc_pending_sync') || '{}');
      if (_ps[e.id]) {
        pendingDot = '<span title="Cambios pendientes de guardar en Sheet" ' +
          'style="display:inline-block;width:9px;height:9px;border-radius:50%;' +
          'background:#f97316;margin-left:6px;flex-shrink:0;align-self:center"></span>';
      }
    } catch(_) {}
  }
  return '<div class="expediente-card">' +
    '<div class="expediente-card-header" onclick="verExpediente(\'' + e.id + '\')" style="cursor:pointer">' +
    '<div style="display:flex;align-items:center;gap:0;flex:1;min-width:0">' +
    '<div style="flex:1;min-width:0"><div class="expediente-numero">' + (e.numero || 'S/N') + '</div>' +
    '<div class="expediente-caratula">' + Utils.truncate(e.caratula, 55) + '</div></div>' +
    pendingDot + '</div>' +
    Utils.statusBadge(e.estado || 'activo') + '</div>' +
    '<div class="expediente-juzgado">' + (e.juzgado || '') + '</div>' +
    '<div class="expediente-meta">' +
    '<span class="expediente-fecha">Actualizado: ' + Utils.formatDate(e.updatedAt) + '</span>' +
    (waLink
      ? '<a href="' + waLink + '" target="_blank" onclick="event.stopPropagation()" ' +
        'style="display:inline-flex;align-items:center;gap:4px;background:#25D366;color:#fff;' +
        'border-radius:4px;padding:3px 9px;font-size:.72rem;text-decoration:none;margin-left:auto">&#128362; WA</a>'
      : '') +
    '</div></div>';
}

function verExpediente(id) {
  Router.go('expediente-detalle', { id: id });
}

// ── Helpers de color por fuero ────────────────────────────────
function _fueroColors(fuero) {
  if (!fuero) return { primary: '#0f3460', light: '#e8edf5', dark: '#081d3a', rgb: '15,52,96' };
  var f = fuero.toLowerCase();
  if (f.indexOf('civil') >= 0)
    return { primary: '#2563eb', light: '#dbeafe', dark: '#1d4ed8', rgb: '37,99,235' };
  if (f.indexOf('laboral') >= 0 && (f.indexOf('naci') >= 0 || f.indexOf('nac') >= 0))
    return { primary: '#d97706', light: '#fef3c7', dark: '#b45309', rgb: '217,119,6' };
  if (f.indexOf('laboral') >= 0)
    return { primary: '#16a34a', light: '#dcfce7', dark: '#15803d', rgb: '22,163,74' };
  return { primary: '#0f3460', light: '#e8edf5', dark: '#081d3a', rgb: '15,52,96' };
}

// ── Stepper para la vista cliente ────────────────────────────
function _renderStepper(fuero, etapaActual, tasksNotes) {
  if (!fuero || !etapaActual) {
    return '<div class="card" style="padding:1.5rem"><p style="color:var(--text-muted);font-size:.88rem">Tu causa está siendo procesada. Comunicate con el estudio para más información.</p></div>';
  }
  var roadmap = EtapasProcesales.getRoadmap(fuero, etapaActual);
  var colors  = _fueroColors(fuero);
  if (!roadmap) {
    return '<div class="card" style="padding:1.5rem"><p style="color:var(--text-muted);font-size:.88rem">Etapa en proceso.</p></div>';
  }
  var isUrgent = /urgente|vencimiento/i.test(tasksNotes || '');

  var h = '<div class="card" style="padding:1.25rem 1.5rem">';

  // Fuero badge
  h += '<span class="fuero-badge" style="background:' + colors.light + ';color:' + colors.dark + ';border:1px solid ' + colors.primary + '33">' + fuero + '</span>';

  // Stepper
  h += '<div class="stepper">';

  roadmap.completadas.forEach(function(n) {
    h += '<div class="step step-done" style="--step-c:' + colors.primary + '">' +
         '<div class="step-dot step-dot-done" style="background:' + colors.primary + '">&#10003;</div>' +
         '<div class="step-label">' + Utils.glosarioTooltip(n) + '</div></div>';
  });

  h += '<div class="step step-current" style="--step-c:' + colors.primary + '">' +
       '<div class="step-dot step-dot-current step-pulse" style="background:' + colors.primary + ';--pulse-rgb:' + colors.rgb + '">&#9679;</div>' +
       '<div class="step-label step-label-current" style="color:' + colors.primary + '">' + Utils.glosarioTooltip(roadmap.actual) + '</div></div>';

  roadmap.pendientes.forEach(function(n) {
    h += '<div class="step step-pending">' +
         '<div class="step-dot step-dot-pending">&#9675;</div>' +
         '<div class="step-label">' + Utils.glosarioTooltip(n) + '</div></div>';
  });

  h += '<div class="step step-pending"><div class="step-dot step-dot-pending">&#127937;</div>' +
       '<div class="step-label">' + Utils.glosarioTooltip(roadmap.hito) + '</div></div>';

  h += '</div>'; // /stepper

  // Estado aviso
  if (tasksNotes && tasksNotes.trim()) {
    var alertColor = isUrgent ? 'var(--danger)' : colors.primary;
    var alertBg    = isUrgent ? '#fef2f2'        : colors.light;
    h += '<div class="estado-aviso" style="background:' + alertBg + ';border-left:3px solid ' + alertColor + ';color:' + alertColor + '">' +
         (isUrgent ? '&#9888;&#65039; ' : 'ℹ️ ') +
         '<strong>Estado actual:</strong><br>' + Utils.truncate(tasksNotes, 200) +
         '</div>';
  }

  h += '</div>'; // /card
  return h;
}

// EXPEDIENTE DETALLE
Router.register('expediente-detalle', async function(container) {
  container.className = 'view-container fade-in';
  renderHeader(); renderSidebar();
  const id = Router.params().id;
  if (!id) { Router.go('expedientes'); return; }
  container.innerHTML = '<div class="spinner"></div>';
  try {
    let exp = null;
    if (Store.isCliente()) {
      // Clientes: leer del store ya filtrado por clienteId para evitar errores de permisos Firestore
      exp = (Store.getExpedientes() || []).find(function(e) { return e.id === id; }) || null;
      if (!exp) {
        // Si no está en store (acceso directo por URL), cargar lista filtrada
        var clienteList = await API.getExpedientes();
        Store.setExpedientes(clienteList);
        exp = clienteList.find(function(e) { return e.id === id; }) || null;
      }
    } else {
      exp = await API.getExpediente(id);
    }
    if (!exp) { container.innerHTML = '<p class="form-error">Expediente no encontrado.</p>'; return; }
    Store.setCurrent(exp);
    const isPro = Store.isProfesional();
    const colors = _fueroColors(exp.fuero);
    const etapaActual = exp.etapaProcesal || exp.etapaGAS || '';
    const tasksNotes  = exp.tasks_notes || exp.tareas || '';

    // ── WA link para notificar cliente (admin) ──────────────
    var waExpLink = (isPro && exp.clienteTelefono && etapaActual)
      ? WA.linkExpediente(exp.clienteTelefono, exp.caratula, etapaActual, id)
      : null;

    // ── Header compartido ───────────────────────────────────
    var html =
      '<div class="page-header"><div>' +
      '<button class="btn btn-ghost btn-sm" onclick="Router.go(\'expedientes\')" style="margin-bottom:0.5rem">&larr; Volver</button>' +
      '<h1 class="page-title">' + Utils.truncate(exp.caratula, 60) + '</h1>' +
      '<p class="page-subtitle">' + (exp.numero || 'S/N') + ' &mdash; ' + Utils.statusBadge(exp.estado || 'activo') + '</p></div>';

    if (isPro) {
      html += '<div class="page-actions">';
      if (waExpLink) {
        html += '<a class="btn btn-sm" href="' + waExpLink + '" target="_blank" ' +
                'style="background:#25D366;color:#fff;border-color:#25D366">&#128362; Enviar por WA</a>';
      }
      html += '<button class="btn btn-outline btn-sm" onclick="editarExpediente(\'' + id + '\')">&#9998; Editar</button>' +
              '<button class="btn btn-danger btn-sm" onclick="confirmarEliminar(\'' + id + '\')">&#128465; Eliminar</button>' +
              '</div>';
    }
    html += '</div>'; // /page-header

    // ── VISTA CLIENTE: solo stepper ─────────────────────────
    if (!isPro) {
      html += _renderStepper(exp.fuero, etapaActual, tasksNotes);
      html += '<div class="card" style="margin-top:1rem">' +
              '<div class="card-header"><h3 class="card-title">Novedades</h3></div>' +
              '<div class="card-body" id="actualizaciones-list">' + renderActualizaciones(exp.actualizaciones || []) + '</div>' +
              '</div>';
      container.innerHTML = html;
      return;
    }

    // ── VISTA ADMIN: tabla técnica completa ─────────────────
    // Panel de etapa procesal con color de fuero
    html += Views.etapaPanel(exp.fuero, etapaActual);

    html += '<div class="grid-2">' +
      '<div><div class="card"><div class="detail-section">' +
      '<div class="detail-section-title">Datos del expediente</div>' +
      row('Numero', exp.numero) + row('Caratula', exp.caratula) + row('Juzgado', exp.juzgado) +
      row('Secretaria', exp.secretaria) + row('Fuero', exp.fuero) + row('Estado', Utils.statusLabel(exp.estado)) +
      row('Etapa procesal', etapaActual || '—') +
      row('Inicio', Utils.formatDate(exp.fechaInicio)) + row('Proximo vencimiento', Utils.formatDate(exp.proximoVencimiento)) +
      // Proyección 2026 — solo admin
      row('Proyecci&oacute;n 2026', (exp.adminData && exp.adminData.goal_2026) || exp.proyeccion || '—') +
      '</div></div>' +
      '<div class="card" style="margin-top:1rem"><div class="detail-section"><div class="detail-section-title">Datos del cliente</div>' +
      row('Cliente', exp.clienteNombre) +
      row('Telefono', exp.clienteTelefono
        ? exp.clienteTelefono + (waExpLink
            ? ' <a href="' + waExpLink + '" target="_blank" style="margin-left:8px;display:inline-flex;align-items:center;gap:4px;background:#25D366;color:#fff;border-radius:4px;padding:2px 8px;font-size:.72rem;text-decoration:none">&#128362; WA</a>'
            : '')
        : '—') +
      '</div></div>' +
      '</div>' +

      '<div>' +
      '<div class="card">' +
      '<div class="card-header"><h3 class="card-title">Actualizaciones</h3>' +
      '<button class="btn btn-primary btn-sm" onclick="nuevaActualizacion(\'' + id + '\')">+ Agregar</button>' +
      '</div>' +
      '<div class="card-body" id="actualizaciones-list">' + renderActualizaciones(exp.actualizaciones || []) + '</div>' +
      '</div>' +
      '</div>' +
      '</div>';

    // Historial de etapa (Feature 2)
    if (exp.etapaHistorial && exp.etapaHistorial.length) {
      html += '<div class="card" style="margin-top:1rem"><div class="card-header"><h3 class="card-title">Historial de etapas</h3></div><div class="card-body">' +
        '<div class="timeline">' +
        exp.etapaHistorial.slice().reverse().map(function(h) {
          return '<div class="timeline-item"><div class="timeline-dot"></div>' +
            '<div class="timeline-date">' + (h.fecha ? Utils.formatDateTime(h.fecha) : '') + ' &mdash; ' + (h.autor || '') + '</div>' +
            '<div class="timeline-content" style="font-weight:500">' + (h.etapa || '') + '</div></div>';
        }).join('') +
        '</div></div></div>';
    }

    // Sección GAS (solo admin)
    html += '<div id="gas-causas-section" style="margin-top:1rem">' +
              '<div class="card"><div class="card-header"><h3 class="card-title">&#128204; Estado en seguimiento GAS</h3></div>' +
              '<div class="card-body" id="gas-causas-body"><div class="spinner" style="margin:.5rem auto"></div></div>' +
              '</div>' +
            '</div>';

    container.innerHTML = html;

    // Carga GAS sin bloquear el render principal
    _loadGasCausas(exp);

  } catch(e) {
    container.innerHTML = '<p class="form-error">Error al cargar el expediente: ' + (e && e.message ? e.message : String(e)) + '</p>';
  }
});

// ── Carga asíncrona de datos GAS para la vista de detalle ───────
async function _loadGasCausas(exp) {
  var body = document.getElementById('gas-causas-body');
  if (!body) return;
  try {
    // Busca por actora, luego por nombre de cliente, luego por carátula completa
    var termino = exp.actora || exp.clienteNombre || exp.caratula || '';
    var causas  = await CausasAPI.getCausasByCliente(termino);

    if (!causas || !causas.length) {
      body.innerHTML =
        '<div class="empty-state" style="padding:1rem 0">' +
        '<div class="empty-state-icon">&#128202;</div>' +
        '<p class="empty-state-text">Sin causa vinculada en el seguimiento</p>' +
        '<p class="empty-state-sub" style="font-size:.78rem">' +
          'Verificá que la carátula en GAS contenga &ldquo;' +
          Utils.truncate(termino, 35) + '&rdquo;' +
        '</p></div>';
      return;
    }

    // Si hay más de una coincidencia, tomar la primera
    var c      = causas[0];
    var etapa  = CausasAPI.formatEtapa(c);
    // Primer paso pendiente: primera línea no vacía de tareas
    var paso   = (c.tareas || '').split('\n')
                   .map(function(l){ return l.trim(); })
                   .find(function(l){ return l.length > 0; }) || '—';

    body.innerHTML =
      '<div class="detail-section" style="padding:.25rem 0">' +

        '<div class="detail-row">' +
          '<div class="detail-key">Etapa actual</div>' +
          '<div class="detail-val">' +
            '<span class="badge" style="' +
              'background:' + etapa.color + '1a;' +
              'color:'      + etapa.color + ';' +
              'border:1px solid ' + etapa.color + '55;' +
              'font-size:.75rem;font-weight:600;letter-spacing:.4px' +
            '">' + etapa.label + '</span>' +
          '</div>' +
        '</div>' +

        '<div class="detail-row">' +
          '<div class="detail-key">Último movimiento</div>' +
          '<div class="detail-val" style="font-size:.85rem;color:var(--text-secondary);white-space:pre-line">' +
            (c.detalle || '—') +
          '</div>' +
        '</div>' +

        '<div class="detail-row">' +
          '<div class="detail-key">Próximo paso</div>' +
          '<div class="detail-val" style="font-size:.85rem">' + paso + '</div>' +
        '</div>' +

        (causas.length > 1
          ? '<p style="font-size:.75rem;color:var(--text-muted);margin-top:.5rem">' +
              '&#128712; ' + causas.length + ' causas vinculadas. Mostrando la primera.' +
            '</p>'
          : '') +

      '</div>';

  } catch (err) {
    var b = document.getElementById('gas-causas-body');
    if (!b) return;
    b.innerHTML =
      '<div style="padding:.5rem 0">' +
        '<p style="font-size:.82rem;color:var(--text-muted)">' +
          '&#128202; Datos de seguimiento no disponibles. Usá "Sincronizar desde Sheet" para actualizar.' +
        '</p>' +
      '</div>';
  }
}

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
    // Feature 4: WA automático al cliente si tiene teléfono
    const _expCur = Store.getCurrent();
    if (_expCur && _expCur.clienteTelefono) {
      WA.abrirWA(WA.linkNovedades(_expCur.clienteTelefono, _expCur.caratula, texto.trim()));
    }
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
    field('Etapa procesal', 'exp-etapa', 'text', v('etapaProcesal'), 'Ej: Prueba, Sentencia, Mediación') +
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
    '<div class="form-group"><label class="form-label">Tareas pendientes</label>' +
    '<textarea class="form-input" id="exp-tareas" rows="3" placeholder="Ej: Intimar al demandado, Presentar prueba...">' + v('tasks_notes') + '</textarea></div>' +
    '<div class="form-group"><label class="form-label">Observaciones / Detalle</label>' +
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
    etapaProcesal: (document.getElementById('exp-etapa') || document.getElementById('nexp-etapa') || {}).value || '',
    estado: (document.getElementById('exp-estado') || {}).value || 'activo',
    fechaInicio: (document.getElementById('exp-inicio') || {}).value || '',
    proximoVencimiento: (document.getElementById('exp-vencimiento') || {}).value || '',
    tasks_notes: (document.getElementById('exp-tareas') || {}).value || '',
    observaciones: (document.getElementById('exp-obs') || {}).value || '',
    clienteId: sel ? sel.value : '',
    clienteNombre: opt ? (opt.dataset.nombre || '') : '',
    clienteTelefono: opt ? (opt.dataset.tel || '') : ''
  };
  if (!data.caratula) { toast('La caratula es obligatoria', 'warning'); return; }
  Utils.setLoading(btn, true);
  try {
    if (editId) {
      // Feature 2: historial de etapa
      const cur = Store.getCurrent();
      if (cur && data.etapaProcesal && cur.etapaProcesal !== data.etapaProcesal && data.etapaProcesal) {
        data.etapaHistorial = firebase.firestore.FieldValue.arrayUnion({
          etapa: data.etapaProcesal,
          fecha: new Date().toISOString(),
          autor: (Store.getUser().nombre || Store.getUser().uid)
        });
      }
      await API.updateExpediente(editId, data);
      toast('Expediente actualizado', 'success');
      // Auto-push al Sheet en background (sin bloquear la navegación)
      API.pushToSheets().then(function(r) {
        if (!r) return;
        if (r.updated > 0) {
          var msg = '✅ Guardado en Sheet (' + r.updated + ' exp.)';
          if (r.notFound && r.notFound.length) msg += ' — ' + r.notFound.length + ' no encontrado/s en Sheet';
          toast(msg, r.notFound && r.notFound.length ? 'warning' : 'success', 6000);
        } else if (r.notFound && r.notFound.length) {
          toast('⚠️ No se encontró en el Sheet: ' + r.notFound[0], 'warning', 8000);
        }
      }).catch(function(err) {
        toast('⚠️ No se pudo guardar en Sheet: ' + (err && err.message || 'sin conexión'), 'warning', 7000);
      });
      Router.go('expediente-detalle', { id: editId });
    } else {
      const newId = await API.createExpediente(data);
      toast('Expediente creado', 'success');
      // Agregar al pending_sync para sincronizar el numero al Sheet si la carátula existe
      if (data.caratula && data.numero) {
        try {
          var _ps = JSON.parse(localStorage.getItem('_mvc_pending_sync') || '{}');
          _ps[newId] = { caratula: data.caratula, numero: data.numero, etapaProcesal: data.etapaProcesal || '', tasks_notes: data.tasks_notes || '', observaciones: data.observaciones || '', juzgado: data.juzgado || '', secretaria: data.secretaria || '', _ts: Date.now() };
          localStorage.setItem('_mvc_pending_sync', JSON.stringify(_ps));
        } catch(_) {}
        API.pushToSheets().then(function(r) {
          if (!r) return;
          if (r.updated > 0) toast('✅ Datos enviados al Sheet (' + r.updated + ' exp.)', 'success', 5000);
          else if (r.notFound && r.notFound.length) toast('ℹ️ Carátula no encontrada en Sheet (se guardó localmente)', 'info', 6000);
        }).catch(function() {});
      }
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

// ================================================================
// REPORTES — Analítica y auditoría de expedientes (solo admin)
// ================================================================
Router.register('reportes', async function(container) {
  container.className = 'view-container fade-in';
  renderHeader(); renderSidebar();
  if (!Store.isProfesional()) { Router.go('dashboard'); return; }

  container.innerHTML =
    '<div class="page-header">' +
    '<div><h1 class="page-title">Reportes &amp; Auditoría</h1>' +
    '<p style="color:var(--text-muted);font-size:.85rem">Análisis estadístico y consistencia de expedientes</p></div>' +
    '<div class="page-actions">' +
    '<button class="btn btn-outline btn-sm" id="btn-csv" onclick="exportarCSV()">&#8615; Exportar CSV</button>' +
    '<button class="btn btn-outline btn-sm" id="btn-json" onclick="exportarJSON()">&#8615; Exportar JSON</button>' +
    '<button class="btn btn-outline btn-sm" onclick="window.print()">🖨️ Imprimir</button>' +
    '</div></div>' +
    '<div id="rep-body"><div class="spinner"></div></div>';

  try {
    const exps = await API.getExpedientes();
    window._repExps = exps;
    _renderReportes(exps);
  } catch(e) {
    document.getElementById('rep-body').innerHTML = '<p class="form-error">Error al cargar datos: ' + e.message + '</p>';
  }
});

// ── Motor de cálculo ──────────────────────────────────────────
function _daysSinceStr(str) {
  if (!str) return null;
  // Acepta ISO (2024-03-15) y dd/mm/yyyy
  var d;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    d = new Date(str);
  } else {
    var p = str.split('/');
    if (p.length === 3) d = new Date(+p[2], +p[1] - 1, +p[0]);
  }
  if (!d || isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function _normFuero(fuero) {
  if (!fuero) return 'Sin especificar';
  var f = fuero.toLowerCase();
  if (f.indexOf('civil') >= 0) return 'Civil PBA';
  if (f.indexOf('naci') >= 0 || f.indexOf('nac') >= 0) return 'Laboral Nación';
  if (f.indexOf('laboral') >= 0) return 'Laboral PBA';
  return fuero;
}

function _calcKPIs(exps) {
  var hoy   = Date.now();
  var total = exps.length;

  // Distribución por fuero
  var byFuero = {};
  // Distribución por juzgado
  var byJuzgado = {};
  // Tiempo por etapa (suma días, conteo)
  var byEtapa = {};
  // Proyección 2026
  var enCarrera = 0, demoradas = 0, sinProyeccion = 0;
  // Auditoría
  var sinActualizar = [];   // > 30 días sin fecha
  var discrepancias = [];   // etapa vs tareas
  var stale30 = [];

  exps.forEach(function(e) {
    var fuero  = _normFuero(e.fuero);
    var juzgado = e.juzgado || 'Sin juzgado';
    var etapa  = e.etapaProcesal || e.etapaGAS || 'Sin etapa';

    // Por fuero
    byFuero[fuero]    = (byFuero[fuero]    || 0) + 1;
    byJuzgado[juzgado]= (byJuzgado[juzgado]|| 0) + 1;

    // Tiempo en etapa actual (desde fechaInicio como proxy)
    var dias = _daysSinceStr(e.start_date || e.fechaInicio);
    if (dias !== null) {
      if (!byEtapa[etapa]) byEtapa[etapa] = { suma: 0, cnt: 0 };
      byEtapa[etapa].suma += dias;
      byEtapa[etapa].cnt  += 1;
    }

    // Proyección 2026
    var proy = (e.adminData && e.adminData.goal_2026) || e.proyeccion || '';
    if (!proy) {
      sinProyeccion++;
    } else {
      // Tiene proyección → ¿fecha futura o pasada?
      var dp = _daysSinceStr(proy);
      if (dp === null) {
        sinProyeccion++;
      } else if (dp <= 0) {
        enCarrera++;   // fecha en el futuro (días negativos = aún no llegó)
      } else {
        demoradas++;   // ya pasó la fecha proyectada
      }
    }

    // Auditoría: sin actualización > 30 días
    var ref  = e.start_date || e.fechaInicio || '';
    var dref = _daysSinceStr(ref);
    if (dref !== null && dref > 30) {
      sinActualizar.push(e);
    }

    // Auditoría: discrepancia etapa vs tareas
    var etapaLow  = etapa.toLowerCase();
    var tareasLow = (e.tasks_notes || e.tareas || '').toLowerCase();
    var etapaFinal = etapaLow.indexOf('sentencia') >= 0 || etapaLow.indexOf('fallo') >= 0 || etapaLow.indexOf('ejecutar') >= 0;
    var tienePrueba = tareasLow.indexOf('peric') >= 0 || tareasLow.indexOf('prueba') >= 0 || tareasLow.indexOf('testimonial') >= 0;
    if (etapaFinal && tienePrueba) discrepancias.push(e);
  });

  return { total, byFuero, byJuzgado, byEtapa, enCarrera, demoradas, sinProyeccion, sinActualizar, discrepancias };
}

// ── Render principal ──────────────────────────────────────────
function _renderReportes(exps) {
  var kpi = _calcKPIs(exps);
  var h   = '';

  // ── 1. Resumen Ejecutivo ──────────────────────────────────
  h += '<div class="card" style="margin-bottom:1.25rem;padding:1.5rem">';
  h += '<div class="detail-section-title" style="margin-bottom:1rem">&#128200; Resumen Ejecutivo</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:1rem">';
  var kpis = [
    { lbl:'Total causas',    val: kpi.total,              color:'var(--primary)' },
    { lbl:'En carrera 2026', val: kpi.enCarrera,          color:'var(--success)' },
    { lbl:'Con demora',      val: kpi.demoradas,          color:'var(--danger)'  },
    { lbl:'Sin proyección',  val: kpi.sinProyeccion,      color:'var(--warning)' },
    { lbl:'Sin actualizar',  val: kpi.sinActualizar.length,color:'#e67e22'       },
    { lbl:'Discrepancias',   val: kpi.discrepancias.length,color:'#8b5cf6'       }
  ];
  kpis.forEach(function(k) {
    h += '<div style="background:var(--surface2);border-radius:var(--radius);padding:1rem;text-align:center">' +
         '<div style="font-size:1.8rem;font-weight:700;color:' + k.color + '">' + k.val + '</div>' +
         '<div style="font-size:.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-top:4px">' + k.lbl + '</div>' +
         '</div>';
  });
  h += '</div></div>';

  // ── 2. Distribución por Fuero (barras CSS) ────────────────
  h += '<div class="card" style="margin-bottom:1.25rem;padding:1.5rem">';
  h += '<div class="detail-section-title" style="margin-bottom:1rem">&#9878; Distribución por Fuero</div>';
  var fColors = { 'Civil PBA':'#2563eb', 'Laboral PBA':'#16a34a', 'Laboral Nación':'#d97706', 'Sin especificar':'#9ca3af' };
  Object.keys(kpi.byFuero).forEach(function(f) {
    var cnt = kpi.byFuero[f];
    var pct = Math.round(cnt / kpi.total * 100);
    var c   = fColors[f] || '#6b7280';
    h += '<div style="margin-bottom:.75rem">' +
         '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:4px">' +
         '<span style="font-weight:500">' + f + '</span><span style="color:var(--text-muted)">' + cnt + ' (' + pct + '%)</span></div>' +
         '<div style="background:var(--surface2);border-radius:4px;height:12px;overflow:hidden">' +
         '<div style="width:' + pct + '%;background:' + c + ';height:100%;border-radius:4px;transition:width .5s"></div>' +
         '</div></div>';
  });
  h += '</div>';

  // ── 3. Cuello de Botella: tiempo promedio por etapa ───────
  var etapasSorted = Object.keys(kpi.byEtapa).map(function(e) {
    return { nombre: e, avg: Math.round(kpi.byEtapa[e].suma / kpi.byEtapa[e].cnt), cnt: kpi.byEtapa[e].cnt };
  }).sort(function(a,b) { return b.avg - a.avg; });

  if (etapasSorted.length) {
    var maxAvg = etapasSorted[0].avg || 1;
    h += '<div class="card" style="margin-bottom:1.25rem;padding:1.5rem">';
    h += '<div class="detail-section-title" style="margin-bottom:1rem">&#9203; Análisis de Cuellos de Botella (días promedio en etapa)</div>';
    etapasSorted.forEach(function(e) {
      var pct = Math.round(e.avg / maxAvg * 100);
      var c   = e.avg > 180 ? '#ef4444' : e.avg > 90 ? '#f59e0b' : '#22c55e';
      h += '<div style="margin-bottom:.75rem">' +
           '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:4px">' +
           '<span style="font-weight:500">' + e.nombre + '</span>' +
           '<span style="color:' + c + ';font-weight:600">' + e.avg + ' días</span></div>' +
           '<div style="background:var(--surface2);border-radius:4px;height:10px;overflow:hidden">' +
           '<div style="width:' + pct + '%;background:' + c + ';height:100%;border-radius:4px"></div>' +
           '</div></div>';
    });
    h += '</div>';
  }

  // ── 4. Proyección 2026 ────────────────────────────────────
  h += '<div class="card" style="margin-bottom:1.25rem;padding:1.5rem">';
  h += '<div class="detail-section-title" style="margin-bottom:1rem">&#127937; Efectividad de Proyección 2026</div>';
  var totalConProy = kpi.enCarrera + kpi.demoradas;
  [
    { lbl:'En carrera (dentro de plazo)', val:kpi.enCarrera,    c:'#22c55e' },
    { lbl:'Con demora crítica',           val:kpi.demoradas,    c:'#ef4444' },
    { lbl:'Sin proyección cargada',       val:kpi.sinProyeccion,c:'#9ca3af' }
  ].forEach(function(row) {
    var pct = kpi.total ? Math.round(row.val / kpi.total * 100) : 0;
    h += '<div style="margin-bottom:.75rem">' +
         '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:4px">' +
         '<span>' + row.lbl + '</span><span style="color:' + row.c + ';font-weight:600">' + row.val + ' (' + pct + '%)</span></div>' +
         '<div style="background:var(--surface2);border-radius:4px;height:10px">' +
         '<div style="width:' + pct + '%;background:' + row.c + ';height:100%;border-radius:4px"></div>' +
         '</div></div>';
  });
  h += '</div>';

  // ── 5. Tabla Alerta Roja: sin actualización > 30 días ─────
  h += '<div class="card" style="margin-bottom:1.25rem;border:1px solid rgba(239,68,68,.35)">';
  h += '<div style="padding:1rem 1.5rem;border-bottom:1px solid rgba(239,68,68,.2);display:flex;align-items:center;gap:.5rem">' +
       '<span style="color:#ef4444;font-size:1.1rem">&#9888;</span>' +
       '<span style="font-weight:600;color:#ef4444">Alerta Roja — Causas sin actualización (+30 días)</span>' +
       '<span style="margin-left:auto;background:#ef444422;color:#ef4444;border-radius:12px;padding:2px 10px;font-size:.75rem;font-weight:700">' + kpi.sinActualizar.length + '</span>' +
       '</div>';
  if (!kpi.sinActualizar.length) {
    h += '<div style="padding:1.5rem;color:var(--text-muted);font-size:.88rem">&#10003; No hay causas paralizadas.</div>';
  } else {
    h += '<div class="table-wrapper"><table><thead><tr><th>Carátula</th><th>Fuero</th><th>Etapa</th><th>Días sin actualizar</th><th></th></tr></thead><tbody>';
    kpi.sinActualizar.forEach(function(e) {
      var dias = _daysSinceStr(e.start_date || e.fechaInicio || '') || '—';
      h += '<tr onclick="Router.go(\'expediente-detalle\',{id:\'' + e.id + '\'})" style="cursor:pointer">' +
           '<td style="font-weight:500">' + (e.caratula || '—') + '</td>' +
           '<td>' + _normFuero(e.fuero) + '</td>' +
           '<td>' + (e.etapaProcesal || e.etapaGAS || '—') + '</td>' +
           '<td style="color:#ef4444;font-weight:700">' + dias + '</td>' +
           '<td><span style="background:#ef444418;color:#ef4444;border-radius:12px;padding:2px 8px;font-size:.72rem">Paralizada</span></td>' +
           '</tr>';
    });
    h += '</tbody></table></div>';
  }
  h += '</div>';

  // ── 6. Discrepancias Etapa vs Tareas ─────────────────────
  h += '<div class="card" style="margin-bottom:1.25rem;border:1px solid rgba(139,92,246,.35)">';
  h += '<div style="padding:1rem 1.5rem;border-bottom:1px solid rgba(139,92,246,.2);display:flex;align-items:center;gap:.5rem">' +
       '<span style="color:#8b5cf6;font-size:1.1rem">&#9888;</span>' +
       '<span style="font-weight:600;color:#8b5cf6">Auditoría — Discrepancias Etapa vs Tareas</span>' +
       '<span style="margin-left:auto;background:#8b5cf622;color:#8b5cf6;border-radius:12px;padding:2px 10px;font-size:.75rem;font-weight:700">' + kpi.discrepancias.length + '</span>' +
       '</div>';
  if (!kpi.discrepancias.length) {
    h += '<div style="padding:1.5rem;color:var(--text-muted);font-size:.88rem">&#10003; No se detectaron discrepancias.</div>';
  } else {
    h += '<div class="table-wrapper"><table><thead><tr><th>Carátula</th><th>Etapa registrada</th><th>Tarea conflictiva</th></tr></thead><tbody>';
    kpi.discrepancias.forEach(function(e) {
      h += '<tr onclick="Router.go(\'expediente-detalle\',{id:\'' + e.id + '\'})" style="cursor:pointer">' +
           '<td style="font-weight:500">' + (e.caratula || '—') + '</td>' +
           '<td>' + (e.etapaProcesal || e.etapaGAS || '—') + '</td>' +
           '<td style="color:#8b5cf6;font-size:.82rem">' + ((e.tasks_notes || e.tareas || '').slice(0,80)) + '…</td>' +
           '</tr>';
    });
    h += '</tbody></table></div>';
  }
  h += '</div>';

  document.getElementById('rep-body').innerHTML = h;
}

// ── Exportar CSV ──────────────────────────────────────────────
function exportarCSV() {
  var exps = window._repExps || [];
  var header = ['ID','Caratula','Fuero','Juzgado','Etapa','Inicio','Proyeccion 2026','Dias en etapa','Tareas pendientes'];
  var rows = exps.map(function(e) {
    var dias = _daysSinceStr(e.start_date || e.fechaInicio || '') || '';
    var proy = (e.adminData && e.adminData.goal_2026) || e.proyeccion || '';
    return [
      e.id,
      '"' + (e.caratula  || '').replace(/"/g,'""') + '"',
      '"' + _normFuero(e.fuero) + '"',
      '"' + (e.juzgado   || '').replace(/"/g,'""') + '"',
      '"' + (e.etapaProcesal || e.etapaGAS || '') + '"',
      e.start_date || e.fechaInicio || '',
      proy,
      dias,
      '"' + (e.tasks_notes || e.tareas || '').replace(/"/g,'""').replace(/\n/g,' ') + '"'
    ].join(',');
  });
  var csv  = [header.join(',')].concat(rows).join('\n');
  var blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url;
  a.download = 'expedientes-MVC-' + new Date().toISOString().slice(0,10) + '.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
  toast('CSV exportado', 'success');
}

// ── Exportar JSON ─────────────────────────────────────────────
function exportarJSON() {
  var exps = window._repExps || [];
  var data = exps.map(function(e) {
    return {
      id:           e.id,
      caratula:     e.caratula,
      fuero:        _normFuero(e.fuero),
      juzgado:      e.juzgado,
      etapa:        e.etapaProcesal || e.etapaGAS || '',
      fechaInicio:  e.start_date || e.fechaInicio || '',
      proyeccion2026: (e.adminData && e.adminData.goal_2026) || e.proyeccion || '',
      diasEnEtapa:  _daysSinceStr(e.start_date || e.fechaInicio || ''),
      tareas:       e.tasks_notes || e.tareas || '',
      estado:       e.estado
    };
  });
  var blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url;
  a.download = 'expedientes-MVC-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
  toast('JSON exportado', 'success');
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
    '<input class="form-input" value="' + (location.origin + location.pathname.replace(/\/[^/]*$/, '/')) + '#/solicitar-acceso" readonly id="link-input">' +
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

// ── CALENDARIO ───────────────────────────────────────────────
Router.register('calendario', async function(container) {
  container.className = 'view-container fade-in';
  renderHeader(); renderSidebar();
  if (!Store.isProfesional()) { Router.go('dashboard'); return; }

  var now = new Date();
  var calYear  = now.getFullYear();
  var calMonth = now.getMonth(); // 0-based

  function renderCal(year, month) {
    var exps = Store.getExpedientes();
    var monthLabel = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][month];
    var firstDay = new Date(year, month, 1).getDay(); // 0=dom
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    // Agrupar vencimientos del mes por día
    var byDay = {};
    exps.forEach(function(e) {
      if (!e.proximoVencimiento) return;
      var d = new Date(e.proximoVencimiento);
      if (isNaN(d.getTime())) return;
      if (d.getFullYear() === year && d.getMonth() === month) {
        var day = d.getDate();
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(e);
      }
    });

    var todayDate = new Date();
    var todayStr = todayDate.getFullYear() + '-' + todayDate.getMonth() + '-' + todayDate.getDate();

    var h = '<div class="page-header"><div><h1 class="page-title">Calendario de Vencimientos</h1></div></div>';
    h += '<div class="card" style="padding:1.5rem">';
    h += '<div class="cal-nav">' +
         '<button class="btn btn-ghost btn-sm" onclick="_calPrev()">&larr;</button>' +
         '<span style="font-weight:600;font-size:1rem">' + monthLabel + ' ' + year + '</span>' +
         '<button class="btn btn-ghost btn-sm" onclick="_calNext()">&rarr;</button>' +
         '</div>';

    h += '<div class="cal-grid">';
    ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].forEach(function(d) {
      h += '<div class="cal-cell cal-header">' + d + '</div>';
    });

    // blanks before first day
    for (var b = 0; b < firstDay; b++) h += '<div class="cal-cell cal-blank"></div>';

    for (var d = 1; d <= daysInMonth; d++) {
      var isToday = (year === todayDate.getFullYear() && month === todayDate.getMonth() && d === todayDate.getDate());
      var events  = byDay[d] || [];
      h += '<div class="cal-cell' + (isToday ? ' cal-today' : '') + '">';
      h += '<div class="cal-day-num">' + d + '</div>';
      events.slice(0, 3).forEach(function(e) {
        var col = _fueroColors(e.fuero);
        h += '<div class="cal-event" style="background:' + col.light + ';border-left:3px solid ' + col.primary + ';color:' + col.dark + '" ' +
             'onclick="event.stopPropagation();Router.go(\'expediente-detalle\',{id:\'' + e.id + '\'})">' +
             Utils.truncate(e.caratula, 22) + '</div>';
      });
      if (events.length > 3) h += '<div class="cal-event-more">+' + (events.length - 3) + ' más</div>';
      h += '</div>';
    }

    h += '</div></div>'; // /cal-grid /card
    container.innerHTML = h;
  }

  window._calPrev = function() {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCal(calYear, calMonth);
  };
  window._calNext = function() {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCal(calYear, calMonth);
  };

  container.innerHTML = '<div class="spinner"></div>';
  try {
    var exps = await API.getExpedientes();
    Store.setExpedientes(exps);
    renderCal(calYear, calMonth);
  } catch(e) {
    container.innerHTML = '<p class="form-error">Error al cargar expedientes.</p>';
  }
});

// ── PWA service worker ──────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(location.pathname.replace(/\/[^/]*$/, '/') + 'sw.js').catch(function() {});
}

// Timeout de seguridad: oculta el loading-screen si Firebase no responde en 5s
setTimeout(function() {
  var loading = document.getElementById('loading-screen');
  if (loading && loading.style.display !== 'none') {
    loading.style.display = 'none';
    console.warn('[App] Timeout de seguridad: loading-screen ocultado tras 5s sin respuesta de Firebase.');
  }
}, 5000);

// Iniciar router (debe ir antes de Auth para que Router esté definido)
Router.init();

// Iniciar listener de autenticación (después de Router.init)
Auth.initAuthListener();

// ── Glosario: soporte de click/tap para móvil ────────────────────────────────
// En desktop se usa :hover (CSS puro). En móvil se toggle la clase .gl-open.
document.addEventListener('click', function(e) {
  var tip = e.target.closest('.glosario-tooltip');
  // Cierra cualquier tooltip abierto que no sea el clickeado
  document.querySelectorAll('.glosario-tooltip.gl-open').forEach(function(el) {
    if (el !== tip) el.classList.remove('gl-open');
  });
  if (tip) {
    e.stopPropagation();
    tip.classList.toggle('gl-open');
  }
});
