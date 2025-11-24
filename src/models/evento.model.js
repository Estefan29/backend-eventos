// src/models/evento.model.js
import mongoose from "mongoose";

const eventoSchema = new mongoose.Schema({
  titulo: { 
    type: String, 
    required: [true, 'El título es obligatorio'],
    trim: true,
    minlength: [5, 'El título debe tener al menos 5 caracteres'],
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  descripcion: { 
    type: String, 
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    minlength: [20, 'La descripción debe tener al menos 20 caracteres']
  },
  fecha: { 
    type: Date, 
    required: [true, 'La fecha es obligatoria'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'La fecha debe ser futura'
    }
  },
  lugar: { 
    type: String, 
    required: [true, 'El lugar es obligatorio'],
    trim: true
  },
  capacidad: { 
    type: Number,
    min: [1, 'La capacidad debe ser al menos 1'],
    default: null // null = sin límite
  },
  precio: { 
    type: Number, 
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo'],
    default: 0
  },
  imagen: {
    type: String,
    default: null
  },
  categoria: {
    type: String,
    enum: ['conferencia', 'taller', 'seminario', 'cultural', 'deportivo', 'otro'],
    default: 'otro'
  },
  estado: {
    type: String,
    enum: ['activo', 'cancelado', 'finalizado', 'pospuesto'],
    default: 'activo'
  },
  creado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  requisitos: {
    type: String,
    trim: true
  },
  duracion: {
    type: Number, // duración en minutos
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para verificar si el evento ya pasó
eventoSchema.virtual('yaFinalizo').get(function() {
  return new Date(this.fecha) < new Date();
});

// Virtual para días restantes
eventoSchema.virtual('diasRestantes').get(function() {
  const diferencia = new Date(this.fecha) - new Date();
  return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
});

// Índices para búsquedas optimizadas
eventoSchema.index({ titulo: 'text', descripcion: 'text' });
eventoSchema.index({ fecha: 1 });
eventoSchema.index({ estado: 1 });
eventoSchema.index({ categoria: 1 });

// Middleware pre-save para validaciones adicionales
eventoSchema.pre('save', function(next) {
  // Convertir título a formato apropiado
  this.titulo = this.titulo.charAt(0).toUpperCase() + this.titulo.slice(1);
  next();
});

const Evento = mongoose.model("Evento", eventoSchema);

export default Evento;