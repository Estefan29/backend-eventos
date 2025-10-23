import Usuario from "../models/usuario.model.js";


// Crear usuario
export const crearUsuario = async (req, res) => {
  try {
    const nuevoUsuario = new Usuario(req.body);
    await nuevoUsuario.save();
    res
      .status(201)
      .json({ mensaje: "✅ Usuario registrado con éxito", usuario: nuevoUsuario });
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "❌ Error al registrar usuario", error: error.message });
  }
};

// Obtener todos los usuarios
export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res
      .status(500)
      .json({ mensaje: "❌ Error al obtener usuarios", error: error.message });
  }
};
