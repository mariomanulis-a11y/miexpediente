# MiExpediente

App PWA de seguimiento de causas judiciales para el **Estudio Jurídico Manulis**.

## Funcionalidades

- **Rol Profesional**: gestión completa de expedientes, clientes y usuarios
- **Rol Cliente**: consulta del estado de su causa (acceso por invitación vía WhatsApp)
- Multi-profesional con WhatsApp propio por usuario
- Descargable como app desde el celular (PWA)

## Stack

- Frontend: HTML5 + CSS3 + JS Vanilla (sin frameworks)
- Backend: Firebase (Auth + Firestore)
- Hosting: Firebase Hosting / GitHub Pages
- PWA: Service Worker + Web App Manifest

## Configuración inicial

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Activar **Authentication** (Email/Password)
3. Crear base de datos **Firestore**
4. Copiar credenciales a `js/config.js`
5. Desplegar con `firebase deploy`

## Estructura

```
miexpediente/
├── index.html          # Shell SPA
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker
├── css/                # Estilos
├── js/                 # Lógica de la app
├── views/              # Vistas HTML
├── components/         # Componentes reutilizables
└── assets/             # Logo e íconos
```

## Roles y permisos

| Acción | Profesional | Cliente |
|--------|------------|---------|
| Ver todos los expedientes | ✅ | ❌ |
| Ver su expediente | ✅ | ✅ |
| Crear/editar expediente | ✅ | ❌ |
| Gestionar clientes | ✅ | ❌ |
| Descargar documentos | ✅ | ✅ |

## Acceso de clientes

El cliente solicita acceso enviando un mensaje de WhatsApp al profesional.
El profesional le crea la cuenta desde el panel y le envía el link de ingreso.
El cliente nunca ve los datos de los otros profesionales del estudio.

---
Desarrollado con ❤️ para Estudio Jurídico Manulis · San Isidro, Pcia. de Buenos Aires
