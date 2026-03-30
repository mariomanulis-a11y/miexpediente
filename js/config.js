// ╔══════════════════════════════════════════════════════════════╗
// ║  MIEXPEDIENTE — Configuración Firebase                       ║
// ╚══════════════════════════════════════════════════════════════╝

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCwJLlXSPN4dyyMbsiUi4n80hNk_a_LMuI",
  authDomain:        "miexpediente-a99fb.firebaseapp.com",
  projectId:         "miexpediente-a99fb",
  storageBucket:     "miexpediente-a99fb.firebasestorage.app",
  messagingSenderId: "31947233280",
  appId:             "1:31947233280:web:6ba659ccd2408da9c9e0e5"
};

// ── WhatsApp del estudio ──────────────────────────────────────
// Reemplazá con tu número real (formato: 549 + código de área + número)
const WA_CONFIG = {
  numeroEstudio: "5491144000000",
  mensaje: "Hola, quisiera solicitar acceso a MiExpediente para consultar el estado de mi causa."
};

// ── Info del estudio ──────────────────────────────────────────
const APP_CONFIG = {
  nombre: "MiExpediente",
  estudio: "Estudio Jurídico Manulis",
  version: "1.0.0"
};

// ── Inicialización Firebase (compat SDK) ──────────────────────
if (typeof firebase === 'undefined') {
  console.error('[Config] Firebase SDK no cargó. Verificá la conexión a internet o el CDN.');
} else {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    window.db   = firebase.firestore();
    window.auth = firebase.auth();
    window.auth.useDeviceLanguage();
    console.log('[Config] Firebase inicializado correctamente.');
  } catch (e) {
    console.error('[Config] Error al inicializar Firebase:', e);
  }
}
