import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  correo: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un correo válido']
  },
  contraseña: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  rol: {
    type: String,
    enum: ['admin', 'administrativo', 'estudiante', 'profesor', 'externo'],
    default: 'estudiante'
  },
  telefono: {
    type: String,
    trim: true
  },
  carrera: {
    type: String,
    trim: true
  },
  // 🔑 Campos para recuperación de contraseña
  tokenRecuperacion: {
    type: String
  },
  tokenRecuperacionExpira: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices para optimizar búsquedas
usuarioSchema.index({ correo: 1 });
usuarioSchema.index({ tokenRecuperacion: 1 });

// Método para no devolver la contraseña en las consultas
usuarioSchema.methods.toJSON = function() {
  const usuario = this.toObject();
  delete usuario.contraseña;
  delete usuario.tokenRecuperacion;
  delete usuario.tokenRecuperacionExpira;
  return usuario;
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;