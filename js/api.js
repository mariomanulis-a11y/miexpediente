const API = {
  async getExpedientes(filtros) {
    filtros = filtros || {};
    let q = db.collection('expedientes');
    if (Store.isCliente()) q = q.where('clienteId', '==', Store.getUser().clienteId);
    if (filtros.estado) q = q.where('estado', '==', filtros.estado);
    q = q.orderBy('updatedAt', 'desc');
    try {
      const snap = await q.get();
      const result = snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
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
    return db.collection('expedientes').doc(id).update(data);
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

  // ── Sync desde Google Sheets via GAS ─────────────────────────
  // Mapeo de columnas GAS → campos Firestore
  // Solo campos permitidos para admin (proyeccion queda en adminData)
  async syncFromSheets() {
    var causas = await CausasAPI.fetchCausas();
    if (!causas || !causas.length) throw new Error('No se obtuvieron datos del Sheet');

    var batch    = db.batch();
    var col      = db.collection('expedientes');
    var upserted = 0;
    var created  = 0;

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
        fuero:            c.fuero         || '',   // FUERO/JURISDICCIÓN
        tasks_notes:      c.tareas        || '',   // TAREAS PENDIENTES
        observaciones:    c.detalle       || '',   // DETALLE → observaciones
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
      // Solo sobreescribir etapaProcesal si no fue seteada manualmente
      // (si viene del Sheet como "HACER PRUEBA", no matchea EtapasProcesales —
      //  el admin puede corregirla manualmente desde el form de edición)
      if (!snap.empty) {
        var existing = snap.docs[0].data();
        if (!existing.etapaProcesal) payload.etapaProcesal = c.etapa || '';
      } else {
        payload.etapaProcesal = c.etapa || '';
      }

      if (!snap.empty) {
        batch.update(snap.docs[0].ref, payload);
        upserted++;
      } else {
        var newRef = col.doc();
        payload.createdAt      = Utils.serverTimestamp();
        payload.actualizaciones = [];
        payload.estado         = 'activo';
        batch.set(newRef, payload);
        created++;
      }
    }

    await batch.commit();
    return { upserted: upserted, created: created, total: upserted + created };
  }
};
