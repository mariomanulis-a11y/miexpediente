// ================================================================
// causas-api.js — Integración con el backend Google Apps Script
// ================================================================
// Configuración: reemplazá GAS_URL con la URL real del deploy.
// El endpoint debe tener acceso "Cualquiera" para evitar CORS.
// Si el acceso es "Solo yo", el módulo cae automáticamente a JSONP.
// ================================================================

var CausasAPI = (function () {

  // ── Configuración ──────────────────────────────────────────────
  var GAS_URL   = 'https://script.google.com/macros/s/AKfycbxaMRNtHpfVs9wGHSpAdFUwitz8R8V59zyM4Q4NhP4Af2JHGqOzC5dCNdGX3Vn7p9GCEw/exec?action=causas';
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  var _cache     = null;
  var _cacheTime = 0;
  var _pending   = null;   // Promise en vuelo (evita llamadas duplicadas)

  // ── Etapas: label y color ──────────────────────────────────────
  var ETAPAS = [
    { keys: ['TRABAR LITIS'],              label: 'Trabar litis',      color: '#ef4444' },
    { keys: ['HACER PRUEBA'],              label: 'Hacer prueba',      color: '#f59e0b' },
    { keys: ['VISTA DE CAUSA'],            label: 'Vista de causa',    color: '#3b82f6' },
    { keys: ['ESPERAR SENTENCIA'],         label: 'Esperar sentencia', color: '#8b5cf6' },
    { keys: ['CON SENTENCIA', 'SENTENCIA'],label: 'Con sentencia',     color: '#22c55e' },
    { keys: ['EJECUTAR', 'EJECUTAR/COBRAR', 'COBRAR'], label: 'Ejecutar/cobrar', color: '#16a34a' },
    { keys: ['CONCILIAR'],                 label: 'Conciliar',         color: '#14b8a6' }
  ];

  // ── JSONP helper ───────────────────────────────────────────────
  function jsonpFetch(url) {
    return new Promise(function (resolve, reject) {
      var cbName = '__gasCallback_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
      var script = document.createElement('script');
      var timer  = setTimeout(function () {
        cleanup();
        reject(new Error('JSONP: timeout al llamar al servidor GAS'));
      }, 12000);

      function cleanup() {
        clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = function (data) { cleanup(); resolve(data); };
      script.onerror = function () { cleanup(); reject(new Error('JSONP: error de red o URL incorrecta')); };

      var sep = url.indexOf('?') >= 0 ? '&' : '?';
      script.src = url + sep + 'callback=' + cbName;
      document.head.appendChild(script);
    });
  }

  // ── fetch con fallback a JSONP ─────────────────────────────────
  async function _fetchRaw() {
    // Intento 1: fetch estándar (requiere CORS habilitado en GAS)
    try {
      var res = await fetch(GAS_URL, { redirect: 'follow' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      return data;
    } catch (corsErr) {
      // Intento 2: JSONP (no requiere CORS, requiere soporte callback= en doGet)
      console.warn('[CausasAPI] fetch falló (' + (corsErr.message || corsErr) +
                   '), reintentando con JSONP…');
      var jsonpUrl = GAS_URL.replace('?action=causas', '');
      return jsonpFetch(jsonpUrl + '?action=causas');
    }
  }

  // ── fetchCausas: devuelve array plano de causas (con caché) ───
  async function fetchCausas() {
    var now = Date.now();

    // Devolver caché si es fresco
    if (_cache && (now - _cacheTime) < CACHE_TTL) return _cache;

    // Evitar llamadas paralelas duplicadas
    if (_pending) return _pending;

    _pending = _fetchRaw().then(function (data) {
      // data puede ser [ { pestana, causas[] } ] (formato GAS) o ya un array plano
      var flat = [];
      if (Array.isArray(data)) {
        data.forEach(function (item) {
          if (item && Array.isArray(item.causas)) {
            item.causas.forEach(function (c) { flat.push(c); });
          } else if (item && item.caratula) {
            flat.push(item);
          }
        });
      }
      _cache     = flat;
      _cacheTime = Date.now();
      _pending   = null;
      return flat;
    }).catch(function (err) {
      _pending = null;
      throw err;
    });

    return _pending;
  }

  // ── getCausasByCliente: filtra por coincidencia en caratula ───
  async function getCausasByCliente(nombre) {
    if (!nombre || !nombre.trim()) return [];
    var causas = await fetchCausas();
    var q = nombre.trim().toLowerCase();
    return causas.filter(function (c) {
      return (c.caratula || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  // ── formatEtapa: { label, color } desde causa.etapa o causa.proyeccion ──
  function formatEtapa(causa) {
    // Toma etapa primero; si no existe, intenta proyeccion como etapa
    var raw = (causa.etapa || causa.proyeccion || '').toString().trim().toUpperCase();
    for (var i = 0; i < ETAPAS.length; i++) {
      for (var j = 0; j < ETAPAS[i].keys.length; j++) {
        if (raw.indexOf(ETAPAS[i].keys[j]) >= 0) {
          return { label: ETAPAS[i].label, color: ETAPAS[i].color };
        }
      }
    }
    return { label: raw || 'Sin etapa', color: '#6b7280' };
  }

  // ── Configurar la URL en runtime (útil para diferentes entornos) ─
  function setUrl(url) { GAS_URL = url; _cache = null; _cacheTime = 0; }

  // ── getDiagnostico: retorna info de columnas reconocidas por pestaña ─
  async function getDiagnostico() {
    var baseUrl = GAS_URL.replace('?action=causas', '');
    try {
      var res = await fetch(baseUrl + '?action=diagnostico', { redirect: 'follow' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      return jsonpFetch(baseUrl + '?action=diagnostico');
    }
  }

  // ── API pública ────────────────────────────────────────────────
  return {
    fetchCausas:          fetchCausas,
    getCausasByCliente:   getCausasByCliente,
    formatEtapa:          formatEtapa,
    setUrl:               setUrl,
    getDiagnostico:       getDiagnostico,
    invalidateCache:      function () { _cache = null; _cacheTime = 0; }
  };

})();
