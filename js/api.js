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
  }
};
