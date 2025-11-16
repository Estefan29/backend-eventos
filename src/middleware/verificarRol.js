import { AppError } from './errorHandler.js';

export const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      throw new AppError('No autenticado', 401);
    }

    const tieneRol = rolesPermitidos.includes(req.usuario.rol);

    if (!tieneRol) {
      throw new AppError(
        `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(' o ')}`,
        403
      );
    }

    next();
  };
};

export const esAdmin = verificarRol('admin');
export const esProfesor = verificarRol('admin', 'profesor');
export const esEstudiante = verificarRol('admin', 'estudiante', 'profesor');

export const esPropietarioOAdmin = (req, res, next) => {
  const { id } = req.params;
  const usuarioId = req.usuario._id.toString();
  const esAdmin = req.usuario.rol === 'admin';

  if (!esAdmin && usuarioId !== id) {
    throw new AppError('No tienes permiso para realizar esta acción', 403);
  }

  next();
};