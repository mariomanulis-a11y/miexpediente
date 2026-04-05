// ── Glosario Jurídico ────────────────────────────────────────────────────────
const GLOSARIO_JURIDICO = {
  'A DESPACHO':            'El expediente está siendo revisado por el Juez para dictar una resolución.',
  'TRASLADO':              'Se le ha comunicado una presentación a la otra parte para que responda.',
  'AUTOS PARA SENTENCIA':  'El proceso ha finalizado y solo se espera la decisión final del Juez.',
  'A PRUEBA':              'Etapa de recolección de evidencias (testigos, peritos, documentos).',
  'OFICIO LIBRADO':        'Se envió una comunicación oficial a una entidad externa.',
  'PASE A NOTIFICAR':      'La resolución está lista y se está enviando la notificación oficial.',
  // Estados del expediente
  'ACTIVO':                'La causa está en curso normal, con actividad procesal vigente.',
  'URGENTE':               'Requiere atención inmediata. Hay plazos críticos o actuaciones urgentes.',
  'SUSPENDIDO':            'El proceso está temporalmente detenido por disposición judicial o acuerdo de partes.',
  'ARCHIVADO':             'La causa ha concluido o fue archivada por el juzgado.'
};

const Utils = {
  formatDate(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  formatDateTime(ts) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  now() { return firebase.firestore.Timestamp.now(); },
  serverTimestamp() { return firebase.firestore.FieldValue.serverTimestamp(); },
  initials(name) {
    if (!name) return '?';
    return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  },
  truncate(str, n) {
    if (!str) return '';
    n = n || 60;
    return str.length > n ? str.slice(0, n) + '...' : str;
  },
  isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
  isEmpty(v) { return v === null || v === undefined || String(v).trim() === ''; },
  $(sel, ctx) { return (ctx || document).querySelector(sel); },
  $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; },
  show(el) { var e = typeof el === 'string' ? document.querySelector(el) : el; if (e) e.style.display = ''; },
  hide(el) { var e = typeof el === 'string' ? document.querySelector(el) : el; if (e) e.style.display = 'none'; },
  setLoading(btn, loading) {
    if (!btn) return;
    if (loading) { btn._orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>'; }
    else { btn.disabled = false; btn.innerHTML = btn._orig || 'Guardar'; }
  },
  statusLabel(s) {
    var m = { activo: 'Activo', suspendido: 'Suspendido', archivado: 'Archivado', urgente: 'Urgente' };
    return m[s] || s;
  },
  statusBadge(s) {
    var m = { activo: 'badge-success', suspendido: 'badge-warning', archivado: 'badge-gray', urgente: 'badge-danger' };
    return '<span class="badge ' + (m[s] || 'badge-gray') + '">' + Utils.glosarioTooltip(Utils.statusLabel(s)) + '</span>';
  },
  // Envuelve un texto en un tooltip si existe en el GLOSARIO_JURIDICO.
  // Si no existe, devuelve el texto plano sin modificar.
  glosarioTooltip(texto) {
    if (!texto) return texto || '';
    var def = GLOSARIO_JURIDICO[(texto + '').trim().toUpperCase()];
    if (!def) return texto;
    return '<span class="glosario-tooltip">' +
      texto + '<span class="glosario-info-icon">ⓘ</span>' +
      '<span class="glosario-tipbox">' + def + '</span>' +
      '</span>';
  },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};
