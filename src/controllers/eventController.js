import Evento from "../models/evento.model.js";

// Crear nuevo evento
export const crearEvento = async (req, res) => {
  try {
    const nuevoEvento = new Evento(req.body);
    const eventoGuardado = await nuevoEvento.save();
    res.status(201).json(eventoGuardado);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear el evento", error: error.message });
  }
};

// Obtener todos los eventos
export const obtenerEventos = async (req, res) => {
  try {
    const eventos = await Evento.find();
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener los eventos", error: error.message });
  }
};
