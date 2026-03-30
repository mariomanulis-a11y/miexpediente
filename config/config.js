// ============================================================
// MI EXPEDIENTE — Configuración principal
// Estudio Jurídico Manulis
// ============================================================

const APP_CONFIG = {
  nombre: 'Mi Expediente',
  estudio: 'Estudio Jurídico Manulis',
  version: '1.0.0',
  appUrl: 'https://mariomanulis-a11y.github.io/miexpediente',

  // WhatsApp principal del estudio (para solicitudes de acceso)
  adminWhatsApp: '5491112345678',   // ← Reemplazar con número real

  // Tiempo de sesión: 8 horas
  sessionTimeout: 8 * 60 * 60 * 1000,

  // --------------------------------------------------------
  // Usuarios administradores / profesionales
  // IMPORTANTE: En producción migrar a backend seguro.
  // Cada admin tiene su propio WhatsApp; los clientes NO
  // pueden ver qué admins existen ni que están vinculados.
  // --------------------------------------------------------
  admins: [
    {
      id: 'admin-001',
      nombre: 'Mario Manulis',
      email: 'mario@estudiomanulis.com.ar',
      password: 'Manulis2025!',           // ← Cambiar antes de usar
      whatsapp: '5491112345678',           // ← Número real con código país
      rol: 'admin',
      activo: true
    }
    // Para agregar socias, duplicar el bloque anterior con nuevo id/email/password/whatsapp
    // {
    //   id: 'admin-002',
    //   nombre: 'Nombre Socia',
    //   email: 'socia@estudiomanulis.com.ar',
    //   password: 'Password2025!',
    //   whatsapp: '5491198765432',
    //   rol: 'admin',
    //   activo: true
    // }
  ]
};
