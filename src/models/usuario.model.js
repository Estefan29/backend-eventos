import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  contraseña: { type: String, required: true },
  rol: { type: String, enum: ["admin", "usuario"], default: "usuario" }
});

const Usuario = mongoose.model("Usuario", usuarioSchema);

export default Usuario;
