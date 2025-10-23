import Evento from "../models/evento.model.js";

// Crear evento
export const crearEvento = async (req, res) => {
  try {
    const nuevoEvento = new Evento(req.body);
    await nuevoEvento.save();
    res.status(201).json({ mensaje: "✅ Evento creado con éxito", evento: nuevoEvento });
  } catch (error) {
    res.status(500).json({ mensaje: "❌ Error al crear el evento", error: error.message });
  }
};

// Obtener todos los eventos
export const obtenerEventos = async (req, res) => {
  try {
    const eventos = await Evento.find();
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ mensaje: "❌ Error al obtener los eventos", error: error.message });
  }
};

// Obtener evento por ID
export const obtenerEventoPorId = async (req, res) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return res.status(404).json({ mensaje: "Evento no encontrado" });
    res.json(evento);
  } catch (error) {
    res.status(500).json({ mensaje: "❌ Error al obtener el evento", error: error.message });
  }
};

// Actualizar evento
export const actualizarEvento = async (req, res) => {
  try {
    const eventoActualizado = await Evento.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!eventoActualizado)
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    res.json({ mensaje: "✅ Evento actualizado correctamente", evento: eventoActualizado });
  } catch (error) {
    res.status(500).json({ mensaje: "❌ Error al actualizar el evento", error: error.message });
  }
};

// Eliminar evento
export const eliminarEvento = async (req, res) => {
  try {
    const eventoEliminado = await Evento.findByIdAndDelete(req.params.id);
    if (!eventoEliminado)
      return res.status(404).json({ mensaje: "Evento no encontrado" });
    res.json({ mensaje: "🗑️ Evento eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "❌ Error al eliminar el evento", error: error.message });
  }
};
