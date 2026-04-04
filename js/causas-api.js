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

  // ── fetch robusto: 3 intentos sin JSONP ──────────────────────
  async function _fetchRaw() {
    var baseUrl = GAS_URL.split('?')[0];
    var url     = baseUrl + '?action=causas&t=' + Date.now();
    var lastErr = null;

    // Intento 1: fetch con credentials omit (evita redirect a login de Google)
    try {
      var res = await fetch(url, { method: 'GET', credentials: 'omit', redirect: 'follow' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var text = await res.text();
      if (text.trim().startsWith('<')) throw new Error('respuesta HTML — deploy no público');
      return JSON.parse(text);
    } catch (e1) {
      lastErr = e1;
      console.warn('[CausasAPI] intento 1 falló:', e1.message);
    }

    // Intento 2: fetch con mode cors explícito
    try {
      var res2 = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' });
      if (!res2.ok) throw new Error('HTTP ' + res2.status);
      var text2 = await res2.text();
      if (text2.trim().startsWith('<')) throw new Error('respuesta HTML');
      return JSON.parse(text2);
    } catch (e2) {
      lastErr = e2;
      console.warn('[CausasAPI] intento 2 falló:', e2.message);
    }

    // Intento 3: fetch sin opciones extra
    try {
      var res3 = await fetch(baseUrl + '?action=causas');
      if (!res3.ok) throw new Error('HTTP ' + res3.status);
      var text3 = await res3.text();
      if (text3.trim().startsWith('<')) throw new Error('respuesta HTML — deploy no público');
      return JSON.parse(text3);
    } catch (e3) {
      lastErr = e3;
      console.warn('[CausasAPI] intento 3 falló:', e3.message);
    }

    throw new Error('No se pudo conectar con GAS. Detalle: ' + (lastErr ? lastErr.message : 'error desconocido'));
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
    var baseUrl = GAS_URL.split('?')[0];
    var url     = baseUrl + '?action=diagnostico&t=' + Date.now();
    var res = await fetch(url, { method: 'GET', credentials: 'omit', redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var text = await res.text();
    if (text.trim().startsWith('<')) throw new Error('GAS devolvió HTML — deploy no público');
    return JSON.parse(text);
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
