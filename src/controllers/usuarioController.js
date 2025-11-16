import Usuario from "../models/usuario.model.js";
import { AppError } from "../middleware/errorHandler.js";

export const crearUsuario = async (req, res, next) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    await nuevoUsuario.save();
    res.status(201).json({ 
      status: 'success',
      mensaje: "✅ Usuario registrado con éxito", 
      usuario: nuevoUsuario 
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerUsuarios = async (req, res, next) => {
  try {
    const { pagina = 1, limite = 20, rol, busqueda } = req.query;

    const filtros = {};
    
    if (rol) filtros.rol = rol;
    if (busqueda) {
      filtros.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { correo: { $regex: busqueda, $options: 'i' } }
      ];
    }

    const skip = (pagina - 1) * limite;

    const [usuarios, total] = await Promise.all([
      Usuario.find(filtros)
        .select('-contraseña')
        .sort({ fecha_registro: -1 })
        .skip(skip)
        .limit(parseInt(limite)),
      Usuario.countDocuments(filtros)
    ]);

    res.json({
      status: 'success',
      data: {
        usuarios,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(total / limite)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerUsuarioPorId = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-contraseña');
    
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
      status: 'success',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarUsuario = async (req, res, next) => {
  try {
    const { nombre, telefono, carrera, rol, activo } = req.body;

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      { nombre, telefono, carrera, rol, activo },
      { new: true, runValidators: true }
    ).select('-contraseña');

    if (!usuarioActualizado) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
      status: 'success',
      mensaje: '✅ Usuario actualizado correctamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
      status: 'success',
      mensaje: '🗑️ Usuario eliminado correctamente'
    });
  } catch (error) {
    next(error);
  }
};