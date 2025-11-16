import Evento from '../models/evento.model.js';
import conectarMySQL from '../config/db.mysql.js';
import { AppError } from './errorHandler.js';

export const validarInscripcion = async (req, res, next) => {
  try {
    const { id_usuario, id_evento_mongo } = req.body;

    const evento = await Evento.findById(id_evento_mongo);
    if (!evento) {
      throw new AppError('El evento no existe', 404);
    }

    const fechaEvento = new Date(evento.fecha);
    const hoy = new Date();
    
    if (fechaEvento < hoy) {
      throw new AppError('No puedes inscribirte a un evento que ya pasó', 400);
    }

    const db = await conectarMySQL();
    const [inscripciones] = await db.query(
      'SELECT COUNT(*) as total FROM inscripciones WHERE id_evento_mongo = ? AND estado != "cancelada"',
      [id_evento_mongo]
    );

    const inscritosActuales = inscripciones[0].total;
    
    if (evento.capacidad && inscritosActuales >= evento.capacidad) {
      throw new AppError('Este evento ya no tiene cupos disponibles', 400);
    }

    const [inscripcionExistente] = await db.query(
      'SELECT id FROM inscripciones WHERE id_usuario = ? AND id_evento_mongo = ? AND estado != "cancelada"',
      [id_usuario, id_evento_mongo]
    );

    if (inscripcionExistente.length > 0) {
      throw new AppError('Ya estás inscrito en este evento', 400);
    }

    req.evento = evento;
    req.cuposDisponibles = evento.capacidad - inscritosActuales;

    next();
  } catch (error) {
    next(error);
  }
};