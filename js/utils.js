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
    return '<span class="badge ' + (m[s] || 'badge-gray') + '">' + Utils.statusLabel(s) + '</span>';
  },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
};
