const API = {
  async getExpedientes(filtros) {
    filtros = filtros || {};
    let q = db.collection('expedientes');
    if (Store.isCliente()) {
      // Para clientes: solo filtrar por clienteId, sin orderBy
      // (where + orderBy requiere índice compuesto que puede no existir)
      q = q.where('clienteId', '==', Store.getUser().clienteId);
    } else {
      if (filtros.estado) q = q.where('estado', '==', filtros.estado);
      q = q.orderBy('updatedAt', 'desc');
    }
    try {
      const snap = await q.get();
      let result = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
      // Ordenar client-side para clientes
      if (Store.isCliente()) {
        result.sort(function(a, b) {
          var ta = a.updatedAt && a.updatedAt.seconds ? a.updatedAt.seconds : 0;
          var tb = b.updatedAt && b.updatedAt.seconds ? b.updatedAt.seconds : 0;
          return tb - ta;
        });
      }
      try {
        var cacheKey = '_mvc_exps_' + (Store.getUser() ? Store.getUser().uid : 'anon');
        localStorage.setItem(cacheKey, JSON.stringify(result));
        localStorage.removeItem('_mvc_offline');
      } catch(e) {}
      return result;
    } catch(fetchErr) {
      // Feature 8: fallback offline
      try {
        var cacheKey = '_mvc_exps_' + (Store.getUser() ? Store.getUser().uid : 'anon');
        var cached = localStorage.getItem(cacheKey);
        if (cached) {
          localStorage.setItem('_mvc_offline', '1');
          var indicator = document.getElementById('offline-indicator');
          if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.style.cssText = 'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);background:#374151;color:#fff;padding:6px 16px;border-radius:20px;font-size:.78rem;z-index:9999';
            indicator.textContent = '📴 Modo offline — datos del último acceso';
            document.body.appendChild(indicator);
          }
          return JSON.parse(cached);
        }
      } catch(e2) {}
      throw fetchErr;
    }
  },
  async getExpediente(id) {
    const snap = await db.collection('expedientes').doc(id).get();
    if (!snap.exists) return null;
    return Object.assign({ id: snap.id }, snap.data());
  },
  async createExpediente(data) {
    const user = Store.getUser();
    const payload = Object.assign({}, data, {
      profesionalId: user.uid,
      createdAt: Utils.serverTimestamp(),
      updatedAt: Utils.serverTimestamp(),
      actualizaciones: []
    });
    const ref = await db.collection('expedientes').add(payload);
    return ref.id;
  },
  async updateExpediente(id, data) {
    data.updatedAt = Utils.serverTimestamp();
    await db.collection('expedientes').doc(id).update(data);
    // Marcar como pendiente de sincronizar al Sheet
    try {
      var pending = JSON.parse(localStorage.getItem('_mvc_pending_sync') || '{}');
      pending[id] = {
        caratula:      data.caratula      || (Store.getCurrent() && Store.getCurrent().caratula) || '',
        etapaProcesal: data.etapaProcesal || '',
        tasks_notes:   data.tasks_notes   || '',
        observaciones: data.observaciones || '',
        juzgado:       data.juzgado       || '',
        secretaria:    data.secretaria    || '',
        _ts: Date.now()
      };
      localStorage.setItem('_mvc_pending_sync', JSON.stringify(pending));
    } catch(e) {}
  },
  async deleteExpediente(id) {
    return db.collection('expedientes').doc(id).delete();
  },
  async addActualizacion(expId, texto) {
    const upd = {
      texto: texto,
      fecha: new Date().toISOString(),
      autorId: Store.getUser().uid,
      autorNombre: Store.getUser().nombre
    };
    return db.collection('expedientes').doc(expId).update({
      actualizaciones: firebase.firestore.FieldValue.arrayUnion(upd),
      updatedAt: Utils.serverTimestamp()
    });
  },
  async getClientes() {
    const snap = await db.collection('usuarios').where('rol', '==', 'cliente').orderBy('nombre').get();
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  },
  async getUsuario(uid) {
    const snap = await db.collection('usuarios').doc(uid).get();
    if (!snap.exists) return null;
    return Object.assign({ id: snap.id }, snap.data());
  },
  async createUsuario(uid, data) {
    return db.collection('usuarios').doc(uid).set(Object.assign({}, data, { createdAt: Utils.serverTimestamp() }));
  },
  async updateUsuario(uid, data) {
    return db.collection('usuarios').doc(uid).update(data);
  },
  async deleteUsuario(uid) {
    return db.collection('usuarios').doc(uid).delete();
  },
  listenExpedientes(clienteId, callback) {
    let q = db.collection('expedientes');
    if (clienteId) q = q.where('clienteId', '==', clienteId);
    q = q.orderBy('updatedAt', 'desc');
    return q.onSnapshot(snap => callback(snap.docs.map(d => Object.assign({ id: d.id }, d.data()))));
  },
  listenExpediente(id, callback) {
    return db.collection('expedientes').doc(id).onSnapshot(snap => {
      if (snap.exists) callback(Object.assign({ id: snap.id }, snap.data()));
    });
  },

  // ── Push cambios locales al Google Sheet via GAS ─────────────
  // Envía los expedientes marcados como "pendiente" al Worker/GAS.
  // GAS los busca por carátula y actualiza las columnas editables.
  async pushToSheets() {
    var pending = {};
    try {
      pending = JSON.parse(localStorage.getItem('_mvc_pending_sync') || '{}');
    } catch(e) {}

    var ids = Object.keys(pending);
    if (!ids.length) return { updated: 0, skipped: 0, notFound: [] };

    // Validar: descartar los que no tienen carátula
    var expedientes = ids
      .map(function(id) { return pending[id]; })
      .filter(function(e) { return e.caratula && e.caratula.trim(); });

    if (!expedientes.length) throw new Error('Ningún expediente pendiente tiene carátula válida');

    var workerBase = 'https://gas-proxy.mariomanulis.workers.dev';
    var res = await fetch(workerBase + '?action=guardar', {
      method:      'POST',
      credentials: 'omit',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ action: 'guardar', expedientes: expedientes })
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);
    var text = await res.text();
    if (text.trim().startsWith('<')) throw new Error('GAS devolvió HTML — verificar deploy');

    var data = JSON.parse(text);
    if (!data.ok) throw new Error(data.error || 'Error en GAS');

    // Limpiar pendientes exitosos
    localStorage.removeItem('_mvc_pending_sync');

    return data.result;
  },

  // Retorna cantidad de expedientes pendientes de sync al Sheet
  getPendingSyncCount() {
    try {
      var pending = JSON.parse(localStorage.getItem('_mvc_pending_sync') || '{}');
      return Object.keys(pending).length;
    } catch(e) { return 0; }
  },

  // ── Sync desde Google Sheets via GAS ─────────────────────────
  // Mapeo de columnas GAS → campos Firestore
  // Solo campos permitidos para admin (proyeccion queda en adminData)
  async syncFromSheets() {
    var causas = await CausasAPI.fetchCausas();
    if (!causas || !causas.length) throw new Error('No se obtuvieron datos del Sheet');

    // Smart merge: cargar pendientes locales para preservar cambios del admin
    var pendingSync = {};
    try {
      pendingSync = JSON.parse(localStorage.getItem('_mvc_pending_sync') || '{}');
    } catch(e) {}

    var batch    = db.batch();
    var col      = db.collection('expedientes');
    var upserted = 0;
    var created  = 0;
    var merged   = 0;

    for (var i = 0; i < causas.length; i++) {
      var c = causas[i];
      if (!c.caratula) continue;

      // Buscar expediente existente por caratula (ID único funcional)
      var snap = await col.where('caratula', '==', c.caratula).limit(1).get();

      var payload = {
        // Datos principales (visibles para admin y cliente)
        caratula:         c.caratula      || '',
        numero:           c.radicacion    || '',   // RADICACIÓN → numero/expediente
        court:            c.radicacion    || '',
        start_date:       c.fechaInicio   || '',   // FECHA INICIO
        fechaInicio:      c.fechaInicio   || '',   // alias para compatibilidad
        juzgado:          c.juzgado       || '',   // JUZGADO/TRIBUNAL
        secretaria:       c.secretaria    || '',   // SECRETARÍA
        fuero:            c.fuero         || '',   // FUERO/JURISDICCIÓN
        tasks_notes:      c.tareas        || '',   // TAREAS PENDIENTES
        observaciones:    c.detalle       || '',   // DETALLE → observaciones
        // Departamento judicial (columna o nombre de pestaña como fallback)
        departamento:     c.departamento  || c._sheetName || '',
        // Partes
        actora:           c.actora        || '',
        demandada:        c.demandada     || '',
        // Datos de tracking GAS
        etapaGAS:         c.etapa         || '',   // etapa interna del Sheet
        detalleGAS:       c.detalle       || '',
        _sheetName:       c._sheetName    || '',
        // Contacto cliente (si el Sheet lo tiene)
        clienteTelefono:  c.telefono      || '',
        // Datos solo admin (proyección, etc.)
        adminData: {
          goal_2026:      c.proyeccion    || '',   // PROYECCIÓN 2026
          etapa:          c.etapa         || '',
          tareas:         c.tareas        || '',
          detalle:        c.detalle       || '',
          radicacion:     c.radicacion    || ''
        },
        updatedAt: Utils.serverTimestamp(),
        syncedAt:  Utils.serverTimestamp()
      };

      if (!snap.empty) {
        var existing = snap.docs[0].data();
        var docId    = snap.docs[0].id;

        // Solo sobreescribir etapaProcesal si no fue seteada manualmente
        // (si viene del Sheet como "HACER PRUEBA", no matchea EtapasProcesales —
        //  el admin puede corregirla manualmente desde el form de edición)
        if (!existing.etapaProcesal) payload.etapaProcesal = c.etapa || '';

        // ── Smart merge: el dato local tiene prioridad sobre el Sheet ──────
        // Si este expediente tiene cambios pendientes de subir, los preservamos
        var localPending = pendingSync[docId];
        if (localPending) {
          // Campos que el admin editó en la app NO se sobreescriben con el Sheet
          var mergeFields = ['etapaProcesal', 'tasks_notes', 'observaciones', 'juzgado', 'secretaria'];
          mergeFields.forEach(function(field) {
            if (localPending[field] !== undefined && localPending[field] !== '') {
              payload[field] = localPending[field];
            }
          });
          merged++;
        }

        batch.update(snap.docs[0].ref, payload);
        upserted++;
      } else {
        payload.etapaProcesal  = c.etapa || '';
        var newRef = col.doc();
        payload.createdAt      = Utils.serverTimestamp();
        payload.actualizaciones = [];
        payload.estado         = 'activo';
        batch.set(newRef, payload);
        created++;
      }
    }

    await batch.commit();
    return { upserted: upserted, created: created, total: upserted + created, merged: merged };
  }
};
