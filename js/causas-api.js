// ================================================================
// causas-api.js — Integración con el backend Google Apps Script
// ================================================================
// Configuración: reemplazá GAS_URL con la URL real del deploy.
// El endpoint debe tener acceso "Cualquiera" para evitar CORS.
// Si el acceso es "Solo yo", el módulo cae automáticamente a JSONP.
// ================================================================

var CausasAPI = (function () {

  // ── Configuración ──────────────────────────────────────────────
  // Proxy Cloudflare Worker — resuelve CORS en iOS Safari
  var GAS_URL   = 'https://gas-proxy.mariomanulis.workers.dev/?action=causas';
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

  // ── XHR helper — más compatible que fetch en iOS Safari ───────
  function xhrFetch(url) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = 15000;
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          var text = xhr.responseText || '';
          if (text.trim().startsWith('<')) {
            reject(new Error('GAS devolvió HTML — deploy no público'));
            return;
          }
          try { resolve(JSON.parse(text)); }
          catch(e) { reject(new Error('Error al parsear respuesta JSON')); }
        } else {
          reject(new Error('HTTP ' + xhr.status));
        }
      };
      xhr.onerror   = function() { reject(new Error('XHR: error de red')); };
      xhr.ontimeout = function() { reject(new Error('XHR: timeout (15s)')); };
      xhr.send();
    });
  }

  // ── JSONP helper — último recurso ──────────────────────────────
  function jsonpFetch(url) {
    return new Promise(function(resolve, reject) {
      var cbName = '__gasCb_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
      var script = document.createElement('script');
      var timer  = setTimeout(function() {
        cleanup();
        reject(new Error('JSONP: timeout (15s) — GAS no respondió'));
      }, 15000);

      function cleanup() {
        clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cbName] = function(data) { cleanup(); resolve(data); };
      script.onerror = function() {
        cleanup();
        reject(new Error('JSONP: error al cargar script'));
      };
      var sep = url.indexOf('?') >= 0 ? '&' : '?';
      script.src = url + sep + 'callback=' + cbName;
      document.head.appendChild(script);
    });
  }

  // ── _fetchRaw: fetch → XHR (proxy Cloudflare, sin JSONP) ────────
  async function _fetchRaw() {
    var baseUrl = GAS_URL.split('?')[0];
    var t       = Date.now();

    // Intento 1: fetch
    try {
      var res = await fetch(baseUrl + '?action=causas&t=' + t,
                            { method: 'GET', credentials: 'omit', redirect: 'follow' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var text = await res.text();
      if (text.trim().startsWith('<')) throw new Error('HTML — proxy no accesible');
      return JSON.parse(text);
    } catch(e1) {
      console.warn('[CausasAPI] fetch falló:', e1.message);
    }

    // Intento 2: XHR
    return xhrFetch(baseUrl + '?action=causas&t=' + (t + 1));
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
    var t       = Date.now();
    try {
      var res = await fetch(baseUrl + '?action=diagnostico&t=' + t,
                            { method: 'GET', credentials: 'omit', redirect: 'follow' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var text = await res.text();
      if (text.trim().startsWith('<')) throw new Error('HTML');
      return JSON.parse(text);
    } catch(e1) {}
    return xhrFetch(baseUrl + '?action=diagnostico&t=' + (t + 1));
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
