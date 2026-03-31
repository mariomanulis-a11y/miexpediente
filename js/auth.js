const Auth = {
  async login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  },
  async logout() {
    await auth.signOut();
    Store.clear();
    Router.go('login');
  },
  async sendPasswordReset(email) {
    return auth.sendPasswordResetEmail(email);
  },
  async loadProfile(uid) {
    const snap = await db.collection('usuarios').doc(uid).get();
    if (!snap.exists) return null;
    return { uid, ...snap.data() };
  },
  async createProfile(user) {
    // Intenta crear el documento en Firestore con los datos del usuario Auth.
    // Requiere la regla canBootstrap o allow write publicada en Firestore.
    const data = {
      nombre:    user.displayName || user.email.split('@')[0],
      email:     user.email,
      rol:       'profesional',
      whatsapp:  '',
      activo:    true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('usuarios').doc(user.uid).set(data);
    return { uid: user.uid, ...data };
  },
  onAuthChange(callback) {
    return auth.onAuthStateChanged(callback);
  },

  // Llamar desde main.js DESPUÉS de Router.init()
  initAuthListener() {
    Auth.onAuthChange(async function(user) {
      try {
        if (user) {
          let profile = await Auth.loadProfile(user.uid);

          // Si no hay perfil, intentar crearlo (bootstrap primer usuario profesional)
          if (!profile) {
            console.log('[Auth] Sin perfil en Firestore, intentando bootstrap...');
            try {
              profile = await Auth.createProfile(user);
              console.log('[Auth] Perfil creado correctamente via bootstrap.');
            } catch (createErr) {
              console.warn('[Auth] Bootstrap bloqueado por reglas Firestore:', createErr.code);
              // Sin perfil y sin permisos: redirigir a login sin hacer signOut
              Store.clear();
              Router.go('login');
              return;
            }
          }

          Store.setUser(profile);
          const route = Router.current();
          if (!route || route === 'login' || route === 'solicitar-acceso') {
            Router.go('dashboard');
          }

        } else {
          Store.clear();
          if (Router.current() !== 'solicitar-acceso') Router.go('login');
        }
      } catch (e) {
        console.error('[Auth] Error en onAuthStateChanged:', e);
        Store.clear();
        Router.go('login');
      } finally {
        const loading = document.getElementById('loading-screen');
        if (loading) loading.style.display = 'none';
      }
    });
  }
};
