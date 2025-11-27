import Usuario from '../models/usuario.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler.js';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

// 🔒 CONFIGURACIÓN DE SEGURIDAD
const ROLES_PUBLICOS = ['estudiante', 'profesor', 'externo'];
const ROLES_PROTEGIDOS = ['admin', 'administrativo'];
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_usc_2024';

// ============================================
// UTILIDADES
// ============================================
const generarToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// ============================================
// REGISTRO DE USUARIO (CON SEGURIDAD MEJORADA)
// ============================================
export const registrarUsuario = async (req, res, next) => {
  try {
    const { nombre, correo, contraseña, rol, telefono, carrera } = req.body;

    // ✅ VALIDACIÓN 1: Campos obligatorios
    if (!nombre || !correo || !contraseña) {
      throw new AppError('Todos los campos son obligatorios', 400);
    }

    // ✅ VALIDACIÓN 2: Verificar que no exista el correo
    const usuarioExiste = await Usuario.findOne({ correo });
    if (usuarioExiste) {
      throw new AppError('El correo ya está registrado', 400);
    }

    // 🔒 VALIDACIÓN 3: BLOQUEAR ROLES PROTEGIDOS (CRÍTICO)
    const rolSolicitado = rol || 'estudiante';
    
    if (ROLES_PROTEGIDOS.includes(rolSolicitado)) {
      console.warn(`⚠️  Intento de registro con rol protegido: ${rolSolicitado} - Correo: ${correo}`);
      throw new AppError(
        'No tienes permisos para registrarte con ese rol. Los roles de Administrador y Administrativo son asignados por el sistema.',
        403
      );
    }

    // ✅ VALIDACIÓN 4: Verificar que el rol sea válido
    if (!ROLES_PUBLICOS.includes(rolSolicitado)) {
      throw new AppError(
        `Rol no válido. Los roles permitidos son: ${ROLES_PUBLICOS.join(', ')}`,
        400
      );
    }

    // ✅ VALIDACIÓN 5: Longitud de contraseña
    if (contraseña.length < 6) {
      throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const contraseñaHash = await bcrypt.hash(contraseña, salt);

    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      contraseña: contraseñaHash,
      rol: rolSolicitado, // Solo puede ser: estudiante, profesor o externo
      telefono,
      carrera
    });

    await nuevoUsuario.save();

    // Log de seguridad
    console.log(`✅ Nuevo registro exitoso: ${correo} - Rol: ${rolSolicitado}`);

    const token = generarToken(nuevoUsuario._id);

    res.status(201).json({
      status: 'success',
      mensaje: '✅ Usuario registrado exitosamente',
      token,
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol,
        telefono: nuevoUsuario.telefono,
        carrera: nuevoUsuario.carrera
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGIN DE USUARIO
// ============================================
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

    // Log de seguridad
    console.log(`✅ Login exitoso: ${correo} - Rol: ${usuario.rol}`);

    res.json({
      status: 'success',
      mensaje: '✅ Login exitoso',
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        telefono: usuario.telefono,
        carrera: usuario.carrera
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER PERFIL
// ============================================
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

// ============================================
// ACTUALIZAR PERFIL
// ============================================
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

// ============================================
// CAMBIAR CONTRASEÑA
// ============================================
export const cambiarContraseña = async (req, res, next) => {
  try {
    const { contraseñaActual, nuevaContraseña } = req.body;

    if (!contraseñaActual || !nuevaContraseña) {
      throw new AppError('Todas las contraseñas son requeridas', 400);
    }

    if (nuevaContraseña.length < 6) {
      throw new AppError('La nueva contraseña debe tener al menos 6 caracteres', 400);
    }

    const usuario = await Usuario.findById(req.usuario._id);
    
    const contraseñaValida = await bcrypt.compare(contraseñaActual, usuario.contraseña);
    if (!contraseñaValida) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    const salt = await bcrypt.genSalt(10);
    usuario.contraseña = await bcrypt.hash(nuevaContraseña, salt);
    await usuario.save();

    console.log(`✅ Contraseña cambiada para: ${usuario.correo}`);

    res.json({ 
      status: 'success',
      mensaje: '✅ Contraseña actualizada correctamente' 
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// RECUPERAR CONTRASEÑA (ENVIAR EMAIL)
// ============================================
export const recuperarPassword = async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo) {
      return res.status(400).json({
        mensaje: 'El correo es requerido'
      });
    }

    // Buscar usuario por correo
    const usuario = await Usuario.findOne({ correo });
    
    if (!usuario) {
      // Por seguridad, no revelar si el correo existe o no
      return res.status(200).json({
        mensaje: 'Si el correo existe, recibirás un enlace de recuperación'
      });
    }

    // Generar token de recuperación (válido por 1 hora)
    const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
    const expiracion = Date.now() + 3600000; // 1 hora

    // Guardar token en el usuario
    usuario.tokenRecuperacion = tokenRecuperacion;
    usuario.tokenRecuperacionExpira = expiracion;
    await usuario.save();

    // Configurar URL del frontend
    const urlFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const enlaceRestablecimiento = `${urlFrontend}/restablecer-password?token=${tokenRecuperacion}`;

    // Configurar transporter de nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Enviar correo
    await transporter.sendMail({
      from: `"Eventos USC" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: '🔑 Recuperación de Contraseña - Eventos USC',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperar Contraseña</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Eventos USC</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Recuperación de Contraseña</p>
            </div>
            
            <!-- Body -->
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hola <strong>${usuario.nombre}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:
              </p>
              
              <!-- Botón principal -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${enlaceRestablecimiento}" 
                   style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                  Restablecer Contraseña
                </a>
              </div>
              
              <!-- Enlace alternativo -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:
                </p>
                <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">
                  ${enlaceRestablecimiento}
                </p>
              </div>
              
              <!-- Advertencia -->
              <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #fbbf24; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                  ⚠️ Este enlace expirará en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                  © ${new Date().getFullYear()} Eventos USC - Universidad Santiago de Cali
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`✅ Correo de recuperación enviado a: ${correo}`);

    res.status(200).json({
      mensaje: 'Correo de recuperación enviado exitosamente. Revisa tu bandeja de entrada.',
      success: true
    });

  } catch (error) {
    console.error('❌ Error en recuperar-password:', error);
    res.status(500).json({
      mensaje: 'Error al enviar correo de recuperación',
      error: error.message
    });
  }
};

// ============================================
// RESTABLECER CONTRASEÑA (CON TOKEN)
// ============================================
export const restablecerPassword = async (req, res) => {
  try {
    const { token, nuevaContraseña } = req.body;

    // Validar que vengan los datos
    if (!token || !nuevaContraseña) {
      return res.status(400).json({
        mensaje: 'Token y nueva contraseña son requeridos'
      });
    }

    // Validar longitud de contraseña
    if (nuevaContraseña.length < 6) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Buscar usuario con el token válido
    const usuario = await Usuario.findOne({
      tokenRecuperacion: token,
      tokenRecuperacionExpira: { $gt: Date.now() } // Token no expirado
    });

    if (!usuario) {
      return res.status(400).json({
        mensaje: 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.'
      });
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    usuario.contraseña = await bcrypt.hash(nuevaContraseña, salt);

    // Limpiar token de recuperación
    usuario.tokenRecuperacion = undefined;
    usuario.tokenRecuperacionExpira = undefined;

    await usuario.save();

    console.log(`✅ Contraseña restablecida exitosamente para: ${usuario.correo}`);

    res.status(200).json({
      mensaje: 'Contraseña actualizada exitosamente',
      success: true
    });

  } catch (error) {
    console.error('❌ Error en restablecer-password:', error);
    res.status(500).json({
      mensaje: 'Error al restablecer contraseña',
      error: error.message
    });
  }
};

// ============================================
// PROMOVER A ADMINISTRATIVO (Solo Admin)
// ============================================
export const promoverAAdministrativo = async (req, res, next) => {
  try {
    const { usuarioId } = req.params;
    
    // Verificar que quien hace la petición es admin
    if (req.usuario.rol !== 'admin') {
      throw new AppError('Solo los administradores pueden promover usuarios', 403);
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // No permitir promover a otro admin
    if (usuario.rol === 'admin') {
      throw new AppError('No se puede modificar el rol de otro administrador', 400);
    }

    // Promover a administrativo
    usuario.rol = 'administrativo';
    await usuario.save();

    console.log(`✅ Usuario ${usuario.correo} promovido a administrativo por ${req.usuario.correo}`);

    res.json({ 
      status: 'success',
      mensaje: 'Usuario promovido exitosamente a Administrativo',
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

// ============================================
// DEGRADAR/CAMBIAR ROL (Solo Admin)
// ============================================
export const cambiarRolUsuario = async (req, res, next) => {
  try {
    const { usuarioId } = req.params;
    const { nuevoRol } = req.body;
    
    // Verificar que quien hace la petición es admin
    if (req.usuario.rol !== 'admin') {
      throw new AppError('Solo los administradores pueden cambiar roles', 403);
    }

    // Verificar que el nuevo rol sea válido (solo roles públicos)
    if (!ROLES_PUBLICOS.includes(nuevoRol)) {
      throw new AppError(
        `Rol no válido. Los roles permitidos son: ${ROLES_PUBLICOS.join(', ')}`,
        400
      );
    }

    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // No permitir degradar a un admin
    if (usuario.rol === 'admin') {
      throw new AppError('No se puede modificar el rol de un administrador', 400);
    }

    // Cambiar rol
    const rolAnterior = usuario.rol;
    usuario.rol = nuevoRol;
    await usuario.save();

    console.log(`✅ Rol de ${usuario.correo} cambiado de ${rolAnterior} a ${nuevoRol} por ${req.usuario.correo}`);

    res.json({ 
      status: 'success',
      mensaje: `Rol de usuario actualizado exitosamente a ${nuevoRol}`,
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