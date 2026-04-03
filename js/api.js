const API = {
  async getExpedientes(filtros) {
    filtros = filtros || {};
    let q = db.collection('expedientes');
    if (Store.isCliente()) q = q.where('clienteId', '==', Store.getUser().clienteId);
    if (filtros.estado) q = q.where('estado', '==', filtros.estado);
    q = q.orderBy('updatedAt', 'desc');
    const snap = await q.get();
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
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
        caratula:       c.caratula      || '',
        court:          c.radicacion    || '',   // RADICACIÓN → court
        start_date:     c.fechaInicio   || '',   // FECHA INICIO → start_date
        tasks_notes:    c.tareas        || '',   // DETALLE TAREAS PENDIENTES → tasks_notes
        etapaGAS:       c.etapa         || '',
        detalleGAS:     c.detalle       || '',
        _sheetName:     c._sheetName    || '',
        adminData: {
          goal_2026:    c.proyeccion    || '',   // PROYECCIÓN 2026 (solo admin)
          etapa:        c.etapa         || '',
          tareas:       c.tareas        || '',
          detalle:      c.detalle       || ''
        },
        updatedAt: Utils.serverTimestamp(),
        syncedAt:  Utils.serverTimestamp()
      };

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
