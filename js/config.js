// ╔══════════════════════════════════════════════════════════════╗
// ║  MIEXPEDIENTE — Configuración Firebase                       ║
// ║  Reemplazar con las credenciales de tu proyecto Firebase     ║
// ╚══════════════════════════════════════════════════════════════╝

const FIREBASE_CONFIG = {
  apiKey:            "TU_API_KEY",
  authDomain:        "tu-proyecto.firebaseapp.com",
  projectId:         "tu-proyecto",
  storageBucket:     "tu-proyecto.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId:             "TU_APP_ID"
};

// ── Configuración de WhatsApp ─────────────────────────────────
// Número en formato internacional, sin + ni espacios
const WA_CONFIG = {
  numeroEstudio: "5491100000000",   // Número principal del estudio
  mensaje: "Hola, quisiera solicitar acceso a MiExpediente para consultar mi causa."
};

// ── Configuración de la app ───────────────────────────────────
const APP_CONFIG = {
  nombre: "MiExpediente",
  estudio: "Estudio Jurídico Manulis",
  version: "1.0.0",
  hashRouting: true
};

// ── Inicialización Firebase ───────────────────────────────────
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  window.db   = firebase.firestore();
  window.auth = firebase.auth();
  window.auth.useDeviceLanguage();
} catch (e) {
  console.error('[Config] Error al inicializar Firebase:', e);
}
