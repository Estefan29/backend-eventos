import Usuario from '../models/usuario.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_usc_2024';

const generarToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

export const registrarUsuario = async (req, res, next) => {
  try {
    const { nombre, correo, contraseña, rol, telefono, carrera } = req.body;

    if (!nombre || !correo || !contraseña) {
      throw new AppError('Todos los campos son obligatorios', 400);
    }

    const usuarioExiste = await Usuario.findOne({ correo });
    if (usuarioExiste) {
      throw new AppError('El correo ya está registrado', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const contraseñaHash = await bcrypt.hash(contraseña, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      contraseña: contraseñaHash,
      rol: rol || 'estudiante',
      telefono,
      carrera
    });

    await nuevoUsuario.save();

    const token = generarToken(nuevoUsuario._id);

    res.status(201).json({
      status: 'success',
      mensaje: '✅ Usuario registrado exitosamente',
      token,
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol
      }
    });
  } catch (error) {
    next(error);
  }
};

export const loginUsuario = async (req, res, next) => {
  try {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
      throw new AppError('Correo y contraseña son obligatorios', 400);
    }

    const usuario = await Usuario.findOne({ correo });
    if (!usuario) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!contraseñaValida) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = generarToken(usuario._id);

    res.json({
      status: 'success',
      mensaje: '✅ Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerPerfil = async (req, res) => {
  res.json({
    status: 'success',
    usuario: {
      id: req.usuario._id,
      nombre: req.usuario.nombre,
      correo: req.usuario.correo,
      rol: req.usuario.rol,
      telefono: req.usuario.telefono,
      carrera: req.usuario.carrera
    }
  });
};

export const actualizarPerfil = async (req, res, next) => {
  try {
    const { nombre, telefono, carrera } = req.body;
    
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      { nombre, telefono, carrera },
      { new: true, runValidators: true }
    ).select('-contraseña');

    res.json({
      status: 'success',
      mensaje: '✅ Perfil actualizado',
      usuario: usuarioActualizado
    });
  } catch (error) {
    next(error);
  }
};

export const cambiarContraseña = async (req, res, next) => {
  try {
    const { contraseñaActual, nuevaContraseña } = req.body;

    if (!contraseñaActual || !nuevaContraseña) {
      throw new AppError('Todas las contraseñas son requeridas', 400);
    }

    const usuario = await Usuario.findById(req.usuario._id);
    
    const contraseñaValida = await bcrypt.compare(contraseñaActual, usuario.contraseña);
    if (!contraseñaValida) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    const salt = await bcrypt.genSalt(10);
    usuario.contraseña = await bcrypt.hash(nuevaContraseña, salt);
    await usuario.save();

    res.json({ 
      status: 'success',
      mensaje: '✅ Contraseña actualizada correctamente' 
    });
  } catch (error) {
    next(error);
  }
};