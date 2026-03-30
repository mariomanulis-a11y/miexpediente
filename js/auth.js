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
  onAuthChange(callback) {
    return auth.onAuthStateChanged(callback);
  },

  // Llamar desde main.js DESPUÉS de Router.init() para garantizar que Router esté definido
  initAuthListener() {
    Auth.onAuthChange(async function(user) {
      try {
        if (user) {
          const profile = await Auth.loadProfile(user.uid);
          if (profile) {
            Store.setUser(profile);
            const route = Router.current();
            if (!route || route === 'login' || route === 'solicitar-acceso') {
              Router.go('dashboard');
            }
          } else {
            await auth.signOut();
            Router.go('login');
          }
        } else {
          Store.clear();
          if (Router.current() !== 'solicitar-acceso') Router.go('login');
        }
      } catch (e) {
        console.error('[Auth] Error en onAuthStateChanged:', e);
        Router.go('login');
      } finally {
        const loading = document.getElementById('loading-screen');
        if (loading) loading.style.display = 'none';
      }
    });
  }
};
