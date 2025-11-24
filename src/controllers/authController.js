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
    const { nombre, correo, contraseña, rol,  } = req.body;

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
// Recuperar contraseña
export const recuperarPassword = async (req, res) => {
  try {
    const { correo } = req.body;

    // 1. Buscar usuario por correo
    const usuario = await Usuario.findOne({ correo });
    
    if (!usuario) {
      // Por seguridad, no revelar si el correo existe o no
      return res.status(200).json({
        mensaje: 'Si el correo existe, recibirás un enlace de recuperación'
      });
    }

    // 2. Generar token de recuperación (válido por 1 hora)
    const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
    const expiracion = Date.now() + 3600000; // 1 hora

    // 3. Guardar token en el usuario
    usuario.tokenRecuperacion = tokenRecuperacion;
    usuario.tokenRecuperacionExpira = expiracion;
    await usuario.save();

    // 4. Configurar nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // 5. Crear enlace de recuperación
    const enlaceRecuperacion = `${process.env.FRONTEND_URL}/restablecer-password/${tokenRecuperacion}`;

    // 6. Enviar correo
    await transporter.sendMail({
      from: `"Eventos USC" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: '🔑 Recuperación de Contraseña - Eventos USC',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); 
                     color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white; 
                     padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                     font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${usuario.nombre}</strong>,</p>
              <p>Recibimos una solicitud para restablecer tu contraseña en <strong>Eventos USC</strong>.</p>
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              
              <div style="text-align: center;">
                <a href="${enlaceRecuperacion}" class="button">
                  Restablecer Contraseña
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                ⏰ Este enlace expirará en <strong>1 hora</strong>.
              </p>
              
              <p style="color: #6b7280; font-size: 14px;">
                Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280;">
                  O copia y pega este enlace en tu navegador:<br>
                  <a href="${enlaceRecuperacion}" style="color: #2563eb; word-break: break-all;">
                    ${enlaceRecuperacion}
                  </a>
                </p>
              </div>
            </div>
            <div class="footer">
              <p>Este correo fue enviado por Eventos USC</p>
              <p>© ${new Date().getFullYear()} Universidad Santiago de Cali</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Correo de recuperación enviado a:', correo);

    res.status(200).json({
      mensaje: 'Correo de recuperación enviado exitosamente',
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

// Restablecer contraseña
export const restablecerPassword = async (req, res) => {
  try {
    const { token, nuevaContraseña } = req.body;

    // 1. Validar que vengan los datos
    if (!token || !nuevaContraseña) {
      return res.status(400).json({
        mensaje: 'Token y nueva contraseña son requeridos'
      });
    }

    // 2. Buscar usuario con el token válido
    const usuario = await Usuario.findOne({
      tokenRecuperacion: token,
      tokenRecuperacionExpira: { $gt: Date.now() } // Token no expirado
    });

    if (!usuario) {
      return res.status(400).json({
        mensaje: 'Token inválido o expirado. Solicita un nuevo enlace de recuperación.'
      });
    }

    // 3. Validar contraseña
    if (nuevaContraseña.length < 6) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // 4. Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    usuario.contraseña = await bcrypt.hash(nuevaContraseña, salt);

    // 5. Limpiar token de recuperación
    usuario.tokenRecuperacion = undefined;
    usuario.tokenRecuperacionExpira = undefined;

    await usuario.save();

    console.log('✅ Contraseña restablecida para:', usuario.correo);

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