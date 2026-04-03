// ╔══════════════════════════════════════════════════════════════╗
// ║  VIEWS — Templates HTML de cada vista (retornan strings)    ║
// ╚══════════════════════════════════════════════════════════════╝

const Views = {

  // ── LOGIN ───────────────────────────────────────────────────
  login() {
    return `<!DOCTYPE html><html lang="es"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ingresar — MiExpediente</title>
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/auth.css">
<link rel="stylesheet" href="css/mobile.css">
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"><\/script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"><\/script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"><\/script>
</head><body>
<div class="auth-wrapper">
  <div class="auth-card">
    <div class="auth-logo">
      <img src="assets/logo.svg" alt="MiExpediente" width="56">
      <div class="auth-logo-title">MiExpediente</div>
      <div class="auth-logo-sub">Estudio Jurídico Manulis</div>
    </div>
    <div class="form-group">
      <label class="form-label" for="email">Correo electrónico</label>
      <input id="email" class="form-input" type="email" placeholder="tu@email.com" autocomplete="email">
    </div>
    <div class="form-group">
      <label class="form-label" for="password">Contraseña</label>
      <div class="password-wrapper">
        <input id="password" class="form-input" type="password" placeholder="••••••••" autocomplete="current-password">
        <button class="password-toggle" type="button" onclick="togglePass()">👁</button>
      </div>
    </div>
    <div id="login-error" style="display:none" class="form-error" style="margin-bottom:.75rem"></div>
    <button id="btn-login" class="btn btn-primary btn-block btn-lg" onclick="doLogin()">Ingresar</button>
    <div class="auth-divider">o</div>
    <a href="#/solicitar-acceso" class="btn btn-outline btn-block">Solicitar acceso como cliente</a>
    <div class="auth-footer">
      <a href="#" onclick="doReset()">¿Olvidaste tu contraseña?</a>
    </div>
  </div>
</div>
<div id="toast-container" class="toast-container"></div>
<script src="js/config.js"><\/script>
<script src="js/utils.js"><\/script>
<script src="js/store.js"><\/script>
<script>
function togglePass(){
  var i=document.getElementById('password');
  i.type=i.type==='password'?'text':'password';
}
async function doLogin(){
  var email=document.getElementById('email').value.trim();
  var pass=document.getElementById('password').value;
  var err=document.getElementById('login-error');
  var btn=document.getElementById('btn-login');
  if(!email||!pass){err.textContent='Completá todos los campos.';err.style.display='block';return;}
  btn.disabled=true; btn.textContent='Ingresando...';
  try{
    await auth.signInWithEmailAndPassword(email,pass);
    window.location.href='index.html#/dashboard';
  }catch(e){
    err.textContent=e.code==='auth/wrong-password'||e.code==='auth/user-not-found'?'Usuario o contraseña incorrectos.':'Error al ingresar.';
    err.style.display='block';
    btn.disabled=false; btn.textContent='Ingresar';
  }
}
async function doReset(){
  var email=document.getElementById('email').value.trim();
  if(!email){alert('Ingresá tu email primero.');return;}
  try{await auth.sendPasswordResetEmail(email);alert('Email de recuperación enviado.');}
  catch(e){alert('No se pudo enviar el email.');}
}
document.getElementById('password').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
<\/script>
</body></html>`;
  },

  // ── SOLICITAR ACCESO ────────────────────────────────────────
  solicitarAcceso() {
    return `<div class="auth-wrapper">
  <div class="auth-card">
    <div class="auth-logo">
      <img src="assets/logo.svg" alt="MiExpediente" width="48">
      <div class="auth-logo-title">Solicitar acceso</div>
      <div class="auth-logo-sub">Tu profesional habilitará tu cuenta</div>
    </div>
    <div class="form-group">
      <label class="form-label">Tu nombre completo</label>
      <input id="sa-nombre" class="form-input" type="text" placeholder="Juan Pérez">
    </div>
    <div class="form-group">
      <label class="form-label">Tu número de WhatsApp</label>
      <input id="sa-cel" class="form-input" type="tel" placeholder="549 11 1234-5678">
    </div>
    <button class="btn btn-wa btn-block btn-lg" onclick="solicitarWA()">
      📲 Enviar solicitud por WhatsApp
    </button>
    <div class="auth-divider">ya tenés acceso?</div>
    <a href="#/login" class="btn btn-outline btn-block">Ingresar</a>
  </div>
</div>`;
  },

  // ── DASHBOARD PROFESIONAL ───────────────────────────────────
  dashboardProf(stats) {
    return `<div class="fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Dashboard</div>
      <div class="page-subtitle">Resumen del estudio</div>
    </div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="Router.go('nuevo-expediente')">➕ Nuevo expediente</button>
    </div>
  </div>
  <div class="grid-4" style="margin-bottom:1.5rem">
    <div class="stat-card"><span class="stat-icon">📁</span><div><div class="stat-label">Total expedientes</div><div class="stat-value">${stats.total}</div></div></div>
    <div class="stat-card"><span class="stat-icon">🟢</span><div><div class="stat-label">Activos</div><div class="stat-value">${stats.activos}</div></div></div>
    <div class="stat-card"><span class="stat-icon">🔴</span><div><div class="stat-label">Urgentes</div><div class="stat-value">${stats.urgentes}</div></div></div>
    <div class="stat-card"><span class="stat-icon">👤</span><div><div class="stat-label">Clientes</div><div class="stat-value">${stats.clientes}</div></div></div>
  </div>
  <div class="card" id="recientes-container">
    <div class="card-header"><div class="card-title">Últimos expedientes</div><a href="#/expedientes" class="btn btn-ghost btn-sm">Ver todos →</a></div>
    <div class="card-body" id="recientes-body"><div class="spinner"></div></div>
  </div>
</div>`;
  },

  // ── DASHBOARD CLIENTE ───────────────────────────────────────
  dashboardCliente(exps, user) {
    const cards = exps.length
      ? exps.map(e => `
        <div class="expediente-card" onclick="Router.go('expediente-detalle','${e.id}')">
          <div class="expediente-card-header">
            <div>
              <div class="expediente-numero">${e.numero || ''}</div>
              <div class="expediente-caratula">${e.caratula}</div>
              <div class="expediente-juzgado">${e.juzgado || ''}</div>
            </div>
            ${Utils.statusBadge(e.estado)}
          </div>
          <div class="expediente-meta">
            <span class="expediente-fecha">Actualizado: ${Utils.formatDate(e.updatedAt)}</span>
          </div>
        </div>`).join('')
      : `<div class="empty-state"><div class="empty-state-icon">📂</div><div class="empty-state-text">No tenés causas asignadas aún</div></div>`;

    return `<div class="fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">Bienvenido, ${(user.nombre||'').split(' ')[0]}</div>
      <div class="page-subtitle">Estas son tus causas</div>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:.75rem">${cards}</div>
</div>`;
  },

  // ── LISTA EXPEDIENTES ───────────────────────────────────────
  expedientes(exps) {
    const rows = exps.map(e => `
      <tr onclick="Router.go('expediente-detalle','${e.id}')" style="cursor:pointer">
        <td><span style="font-family:var(--font-mono);font-size:.78rem">${e.numero||'—'}</span></td>
        <td>${Utils.truncate(e.caratula, 50)}</td>
        <td>${e.juzgado||'—'}</td>
        <td>${Utils.statusBadge(e.estado)}</td>
        <td>${Utils.formatDate(e.updatedAt)}</td>
      </tr>`).join('');

    return `<div class="fade-in">
  <div class="page-header">
    <div><div class="page-title">Expedientes</div></div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="Router.go('nuevo-expediente')">➕ Nuevo</button>
    </div>
  </div>
  <div class="search-bar">
    <input id="search-exp" class="form-input" type="search" placeholder="Buscar por carátula, número...">
  </div>
  <div class="filter-chips" id="filter-chips">
    <span class="chip active" data-filter="todos">Todos</span>
    <span class="chip" data-filter="activo">Activos</span>
    <span class="chip" data-filter="urgente">Urgentes</span>
    <span class="chip" data-filter="suspendido">Suspendidos</span>
    <span class="chip" data-filter="archivado">Archivados</span>
  </div>
  ${exps.length ? `
  <div class="card" style="padding:0">
    <div class="table-wrapper">
      <table id="exp-table">
        <thead><tr><th>N° expediente</th><th>Carátula</th><th>Juzgado</th><th>Estado</th><th>Actualizado</th></tr></thead>
        <tbody id="exp-tbody">${rows}</tbody>
      </table>
    </div>
  </div>` : `<div class="empty-state"><div class="empty-state-icon">📂</div><div class="empty-state-text">No hay expedientes cargados</div><div class="empty-state-sub"><button class="btn btn-primary" onclick="Router.go('nuevo-expediente')">Crear el primero</button></div></div>`}
</div>`;
  },

  // ── DETALLE EXPEDIENTE ──────────────────────────────────────
  expedienteDetalle(exp) {
    const movs = (exp.movimientos || []).slice().reverse().map(m => `
      <div class="update-card">
        <div class="update-date">${Utils.formatDateTime(m.fecha)}</div>
        <div class="update-text">${m.texto}</div>
      </div>`).join('') || '<p class="empty-state-text" style="font-size:.85rem;padding:.5rem 0">Sin movimientos registrados</p>';

    const isPro = Store.isProfesional();
    return `<div class="fade-in">
  <div class="page-header">
    <div>
      <div class="page-title">${Utils.truncate(exp.caratula, 55)}</div>
      <div class="page-subtitle">${exp.numero ? 'Exp. ' + exp.numero : ''} ${exp.juzgado ? '· ' + exp.juzgado : ''}</div>
    </div>
    <div class="page-actions">
      <a href="#/expedientes" class="btn btn-ghost btn-sm">← Volver</a>
      ${isPro ? `<button class="btn btn-primary btn-sm" onclick="Controllers.abrirMovimiento('${exp.id}')">+ Novedad</button>` : ''}
    </div>
  </div>

  <div class="grid-2" style="margin-bottom:1.25rem">
    <div class="card">
      <div class="detail-section-title">Datos del expediente</div>
      ${r('N° expediente', exp.numero)} ${r('Estado', Utils.statusBadge(exp.estado))}
      ${r('Juzgado', exp.juzgado)} ${r('Fuero', exp.fuero)} ${r('Materia', exp.materia)}
      ${r('Fecha inicio', Utils.formatDate(exp.fechaInicio))} ${r('Última actualización', Utils.formatDate(exp.updatedAt))}
    </div>
    <div class="card">
      <div class="detail-section-title">Partes</div>
      ${r('Actora', exp.actora)} ${r('Demandada', exp.demandada)}
      <div class="detail-section-title" style="margin-top:.75rem">Observaciones</div>
      <p style="font-size:.88rem;color:var(--text-secondary)">${exp.observaciones||'—'}</p>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><div class="card-title">Historial de novedades</div></div>
    <div id="movimientos-list">${movs}</div>
  </div>
</div>`;
    function r(k, v) { return `<div class="detail-row"><span class="detail-key">${k}</span><span class="detail-val">${v||'—'}</span></div>`; }
  },

  // ── CLIENTES ─────────────────────────────────────────────────
  clientes(list) {
    const rows = list.map(c => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:.6rem">
            <div class="avatar" style="width:30px;height:30px;font-size:.68rem">${Utils.initials(c.apellido + ' ' + c.nombre)}</div>
            <div><div style="font-weight:500">${c.apellido}, ${c.nombre}</div></div>
          </div>
        </td>
        <td>${c.email||'—'}</td>
        <td>${c.celular||'—'}</td>
        <td><span class="badge ${c.tieneAcceso?'badge-success':'badge-gray'}">${c.tieneAcceso?'Habilitado':'Sin acceso'}</span></td>
        <td>
          ${c.celular ? `<a href="${WhatsApp.linkContacto(c.celular)}" target="_blank" class="btn btn-wa btn-sm">WA</a>` : ''}
          <button class="btn btn-outline btn-sm" onclick="Controllers.editarCliente('${c.id}')">Editar</button>
          ${!c.tieneAcceso ? `<button class="btn btn-primary btn-sm" onclick="Controllers.habilitarCliente('${c.id}')">Habilitar</button>` : ''}
        </td>
      </tr>`).join('');

    return `<div class="fade-in">
  <div class="page-header">
    <div><div class="page-title">Clientes</div></div>
    <div class="page-actions">
      <button class="btn btn-primary" onclick="Controllers.nuevoCliente()">➕ Nuevo cliente</button>
    </div>
  </div>
  ${list.length ? `
  <div class="card" style="padding:0">
    <div class="table-wrapper">
      <table>
        <thead><tr><th>Nombre</th><th>Email</th><th>Celular</th><th>Acceso</th><th>Acciones</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>` : `<div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">Aún no tenés clientes cargados</div><div class="empty-state-sub"><button class="btn btn-primary" onclick="Controllers.nuevoCliente()">Agregar el primero</button></div></div>`}
</div>`;
  },

  // ── NUEVO EXPEDIENTE ─────────────────────────────────────────
  nuevoExpediente(clientes) {
    const opts = (clientes||[]).map(c => `<option value="${c.id}">${c.apellido}, ${c.nombre}</option>`).join('');
    return `<div class="fade-in">
  <div class="page-header">
    <div><div class="page-title">Nuevo expediente</div></div>
    <div class="page-actions"><a href="#/expedientes" class="btn btn-ghost btn-sm">← Cancelar</a></div>
  </div>
  <div class="card" style="max-width:680px">
    <div class="form-group">
      <label class="form-label">Carátula *</label>
      <input id="nexp-caratula" class="form-input" type="text" placeholder="Ejemplo: García c/ Empresa SA s/ Despido">
    </div>
    <div class="grid-2">
      <div class="form-group">
        <label class="form-label">N° de expediente</label>
        <input id="nexp-numero" class="form-input" type="text" placeholder="SI-12345/2024">
      </div>
      <div class="form-group">
        <label class="form-label">Estado</label>
        <select id="nexp-estado" class="form-select">
          <option value="activo">Activo</option>
          <option value="urgente">Urgente</option>
          <option value="suspendido">Suspendido</option>
          <option value="archivado">Archivado</option>
        </select>
      </div>
    </div>
    <div class="grid-2">
      <div class="form-group">
        <label class="form-label">Juzgado / Tribunal</label>
        <input id="nexp-juzgado" class="form-input" type="text" placeholder="Juzgado Laboral N° 1 — San Isidro">
      </div>
      <div class="form-group">
        <label class="form-label">Fuero</label>
        <select id="nexp-fuero" class="form-select" onchange="Views._onFueroChange(this.value)">
          <option value="">Seleccionar...</option>
          <option value="Civil y Comercial PBA">Civil y Comercial PBA</option>
          <option value="Laboral PBA">Laboral PBA (Ley 11.653 / 15.057)</option>
          <option value="Laboral Nación">Laboral Nación (Ley 18.345)</option>
          <option value="Penal">Penal</option>
          <option value="Familia">Familia</option>
          <option value="Contencioso Administrativo">Contencioso Administrativo</option>
        </select>
      </div>
    </div>

    <div id="nexp-etapa-wrap" style="display:none">
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Etapa procesal actual</label>
          <select id="nexp-etapa" class="form-select" onchange="Views._onEtapaChange()">
            <option value="">Seleccionar etapa...</option>
          </select>
        </div>
        <div class="form-group" style="align-self:flex-end">
          <input id="nexp-etapa-libre" class="form-input" type="text"
                 placeholder="O escribí algo libre (ej: pericia contable)..."
                 oninput="Views._onTextoLibre(this.value)">
        </div>
      </div>
      <div id="nexp-etapa-info" style="display:none;background:var(--bg-subtle,#f8fafc);border:1px solid var(--border-color,#e2e8f0);border-radius:6px;padding:12px;margin-bottom:1rem;font-size:.85rem">
        <div id="nexp-etapa-def" style="color:var(--text-secondary);margin-bottom:8px"></div>
        <div id="nexp-etapa-checklist"></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="form-group">
        <label class="form-label">Actora</label>
        <input id="nexp-actora" class="form-input" type="text">
      </div>
      <div class="form-group">
        <label class="form-label">Demandada</label>
        <input id="nexp-demandada" class="form-input" type="text">
      </div>
    </div>
    <div class="grid-2">
      <div class="form-group">
        <label class="form-label">Fecha de inicio</label>
        <input id="nexp-fecha" class="form-input" type="date">
      </div>
      <div class="form-group">
        <label class="form-label">Cliente asignado</label>
        <select id="nexp-cliente" class="form-select">
          <option value="">Sin asignar</option>
          ${opts}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Observaciones</label>
      <textarea id="nexp-obs" class="form-input" rows="3" placeholder="Notas internas sobre la causa..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Primera novedad (opcional)</label>
      <textarea id="nexp-mov" class="form-input" rows="2" placeholder="Ej: Se inicia expediente. Presentada demanda el dd/mm/aaaa."></textarea>
    </div>
    <div style="display:flex;gap:.5rem;justify-content:flex-end;margin-top:.5rem">
      <a href="#/expedientes" class="btn btn-ghost">Cancelar</a>
      <button id="btn-guardar-exp" class="btn btn-primary" onclick="Controllers.guardarExpediente()">Guardar expediente</button>
    </div>
  </div>
</div>`;
  },

  // ── HELPERS MOTOR DE ETAPAS (formulario nuevo expediente) ────
  _onFueroChange(fuero) {
    var wrap   = document.getElementById('nexp-etapa-wrap');
    var select = document.getElementById('nexp-etapa');
    var info   = document.getElementById('nexp-etapa-info');
    if (!wrap || !select) return;

    var etapas = EtapasProcesales.getEtapas(fuero);
    if (!etapas.length) { wrap.style.display = 'none'; return; }

    wrap.style.display = '';
    info.style.display = 'none';
    select.innerHTML   = '<option value="">Seleccionar etapa...</option>' +
      etapas.map(function (e) {
        return '<option value="' + e.nombre + '">' + e.id + '. ' + e.nombre + '</option>';
      }).join('');
  },

  _onEtapaChange() {
    var fuero  = (document.getElementById('nexp-fuero')  || {}).value;
    var etapa  = (document.getElementById('nexp-etapa')  || {}).value;
    var libre  = document.getElementById('nexp-etapa-libre');
    if (libre) libre.value = '';
    this._mostrarInfoEtapa(fuero, etapa);
  },

  _onTextoLibre(texto) {
    var fuero  = (document.getElementById('nexp-fuero') || {}).value;
    var select = document.getElementById('nexp-etapa');
    if (!fuero || !texto.trim()) return;
    var sugerida = EtapasProcesales.clasificar(fuero, texto);
    if (sugerida) {
      if (select) select.value = sugerida.nombre;
      this._mostrarInfoEtapa(fuero, sugerida.nombre);
    }
  },

  _mostrarInfoEtapa(fuero, etapaNombre) {
    var info   = document.getElementById('nexp-etapa-info');
    var defEl  = document.getElementById('nexp-etapa-def');
    var listEl = document.getElementById('nexp-etapa-checklist');
    if (!info || !etapaNombre) { if (info) info.style.display = 'none'; return; }

    var data = EtapasProcesales.getInfo(fuero, etapaNombre);
    if (!data) { info.style.display = 'none'; return; }

    var meta = EtapasProcesales.getMeta(fuero);
    defEl.innerHTML  = '<strong style="color:' + meta.color + '">' + data.nombre + '</strong> — ' + data.definicion;
    listEl.innerHTML = data.pendientes.length
      ? '<div style="margin-top:6px;font-size:.78rem;color:#6b7280">Pasos restantes hasta <strong>' + data.hito + '</strong>:</div>' +
        '<ol style="margin:.4rem 0 0 1.2rem;font-size:.78rem;color:#374151">' +
        data.pendientes.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ol>'
      : '<div style="margin-top:4px;font-size:.78rem;color:#16a34a">&#10003; Hito final alcanzado: ' + data.hito + '</div>';

    info.style.display = '';
  },

  // ── PANEL ETAPA PROCESAL (vista detalle) ──────────────────────
  etapaPanel(fuero, etapaNombre) {
    if (!fuero || !etapaNombre) return '';
    var data = EtapasProcesales.getInfo(fuero, etapaNombre);
    if (!data) return '';
    var meta = EtapasProcesales.getMeta(fuero);

    var checklist = data.pendientes.length
      ? '<div style="margin-top:.5rem;font-size:.78rem;color:var(--text-muted)">Pasos restantes hasta <strong>' + data.hito + '</strong>:</div>' +
        '<ol style="margin:.35rem 0 0 1.1rem;font-size:.8rem;line-height:1.7">' +
        data.pendientes.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ol>'
      : '<div style="margin-top:.35rem;font-size:.8rem;color:#16a34a;font-weight:600">&#10003; Hito final alcanzado: ' + data.hito + '</div>';

    return '<div class="card" style="margin-bottom:1rem;border-left:3px solid ' + meta.color + '">' +
      '<div style="padding:.75rem 1rem">' +
      '<div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.5rem">' +
      '<span style="font-size:.62rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Etapa procesal</span>' +
      '<span style="background:' + meta.color + '18;color:' + meta.color + ';border:1px solid ' + meta.color + '44;' +
        'border-radius:12px;padding:2px 10px;font-size:.72rem;font-weight:600">' + data.nombre + '</span>' +
      '<span style="font-size:.65rem;color:var(--text-muted);margin-left:auto">' + meta.ley + '</span>' +
      '</div>' +
      '<div style="font-size:.83rem;color:var(--text-secondary)">' + data.definicion + '</div>' +
      checklist +
      '</div></div>';
  },

  // ── CONFIGURACIÓN ────────────────────────────────────────────
  configuracion() {
    return `<div class="fade-in">
  <div class="page-header"><div class="page-title">Configuración</div></div>
  <div class="card" style="max-width:520px">
    <div class="card-header"><div class="card-title">Datos del estudio</div></div>
    <div class="form-group">
      <label class="form-label">Nombre del estudio</label>
      <input id="cfg-estudio" class="form-input" type="text" value="Estudio Jurídico Manulis">
    </div>
    <div class="form-group">
      <label class="form-label">Número de WhatsApp principal</label>
      <input id="cfg-wa" class="form-input" type="tel" placeholder="5491100000000">
    </div>
    <div class="form-group">
      <label class="form-label">Mensaje de bienvenida para clientes</label>
      <textarea id="cfg-msg" class="form-input" rows="3">Hola, quisiera solicitar acceso a MiExpediente para consultar mi causa.</textarea>
    </div>
    <button class="btn btn-primary" onclick="Controllers.guardarConfig()">Guardar configuración</button>
  </div>
</div>`;
  },

  // ── PERFIL ───────────────────────────────────────────────────
  perfil(user) {
    if (!user) return '<p>Cargando...</p>';
    return `<div class="fade-in">
  <div class="page-header"><div class="page-title">Mi perfil</div></div>
  <div class="card" style="max-width:480px">
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem">
      <div class="avatar" style="width:52px;height:52px;font-size:1.1rem">${Utils.initials(user.nombre||user.email)}</div>
      <div>
        <div style="font-weight:600;font-size:1rem">${user.nombre||'—'}</div>
        <div style="font-size:.82rem;color:var(--text-muted)">${user.email}</div>
        <span class="badge ${user.rol==='profesional'?'badge-primary':'badge-info'}" style="margin-top:.25rem">${user.rol==='profesional'?'Profesional':'Cliente'}</span>
      </div>
    </div>
    <div class="divider"></div>
    <div class="form-group">
      <label class="form-label">Nombre completo</label>
      <input id="prf-nombre" class="form-input" type="text" value="${user.nombre||''}">
    </div>
    ${user.rol==='profesional'?`
    <div class="form-group">
      <label class="form-label">WhatsApp (para contacto de clientes)</label>
      <input id="prf-wa" class="form-input" type="tel" value="${user.whatsapp||''}" placeholder="5491100000000">
    </div>`:''}
    <button class="btn btn-primary" onclick="Controllers.guardarPerfil()">Guardar cambios</button>
    <div class="divider"></div>
    <button class="btn btn-outline btn-danger" onclick="Auth.logout()">Cerrar sesión</button>
  </div>
</div>`;
  }
};
