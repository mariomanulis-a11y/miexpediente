// MI EXPEDIENTE — Roles y permisos

const ROLES = {
  admin: {
    nombre: 'Profesional',
    descripcion: 'Abogado/a del estudio',
    permisos: [
      'expedientes:read', 'expedientes:write', 'expedientes:delete',
      'clientes:read', 'clientes:write', 'clientes:delete',
      'solicitudes:read', 'solicitudes:manage',
      'actuaciones:write',
      'admin:panel'
    ]
  },
  cliente: {
    nombre: 'Cliente',
    descripcion: 'Cliente del estudio',
    permisos: [
      'expedientes:read:own'
    ]
  }
};

function hasPermiso(sesion, permiso) {
  if (!sesion || !sesion.rol) return false;
  const rol = ROLES[sesion.rol];
  if (!rol) return false;
  return rol.permisos.includes(permiso) ||
         rol.permisos.includes(permiso.split(':')[0] + ':*');
}
