import Evento from "../models/evento.model.js";
import conectarMySQL from "../config/db.mysql.js";
import { AppError } from "../middleware/errorHandler.js";

// Crear evento
export const crearEvento = async (req, res, next) => {
  try {
    const nuevoEvento = new Evento({
      ...req.body,
      creado_por: req.usuario._id
    });
    
    await nuevoEvento.save();
    
    res.status(201).json({
      status: 'success',
      mensaje: "✅ Evento creado con éxito",
      evento: nuevoEvento
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todos los eventos (con filtros y paginación)
export const obtenerEventos = async (req, res, next) => {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      busqueda = '', 
      estado = 'todos',
      desde,
      hasta 
    } = req.query;

    const filtros = {};

    // Filtro de búsqueda
    if (busqueda) {
      filtros.$or = [
        { titulo: { $regex: busqueda, $options: 'i' } },
        { descripcion: { $regex: busqueda, $options: 'i' } },
        { lugar: { $regex: busqueda, $options: 'i' } }
      ];
    }

    // Filtro por fechas
    if (desde || hasta) {
      filtros.fecha = {};
      if (desde) filtros.fecha.$gte = new Date(desde);
      if (hasta) filtros.fecha.$lte = new Date(hasta);
    }

    // Filtro por estado (próximos, pasados, hoy)
    if (estado !== 'todos') {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      if (estado === 'proximos') {
        filtros.fecha = { $gte: mañana };
      } else if (estado === 'pasados') {
        filtros.fecha = { $lt: hoy };
      } else if (estado === 'hoy') {
        filtros.fecha = { $gte: hoy, $lt: mañana };
      }
    }

    const skip = (pagina - 1) * limite;

    const [eventos, total] = await Promise.all([
      Evento.find(filtros)
        .sort({ fecha: 1 })
        .skip(skip)
        .limit(parseInt(limite)),
      Evento.countDocuments(filtros)
    ]);

    // Obtener número de inscritos por evento
    const db = await conectarMySQL();
    const eventosConInscritos = await Promise.all(
      eventos.map(async (evento) => {
        const [result] = await db.query(
          'SELECT COUNT(*) as inscritos FROM inscripciones WHERE id_evento_mongo = ? AND estado != "cancelada"',
          [evento._id.toString()]
        );
        
        return {
          ...evento.toJSON(),
          inscritos: result[0].inscritos,
          cupos_disponibles: evento.capacidad ? evento.capacidad - result[0].inscritos : null
        };
      })
    );

    res.json({
      status: 'success',
      data: {
        eventos: eventosConInscritos,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(total / limite)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener evento por ID
export const obtenerEventoPorId = async (req, res, next) => {
  try {
    const evento = await Evento.findById(req.params.id);
    
    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

    // Obtener número de inscritos
    const db = await conectarMySQL();
    const [result] = await db.query(
      'SELECT COUNT(*) as inscritos FROM inscripciones WHERE id_evento_mongo = ? AND estado != "cancelada"',
      [evento._id.toString()]
    );

    res.json({
      status: 'success',
      data: {
        ...evento.toJSON(),
        inscritos: result[0].inscritos,
        cupos_disponibles: evento.capacidad ? evento.capacidad - result[0].inscritos : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar evento
export const actualizarEvento = async (req, res, next) => {
  try {
    const eventoActualizado = await Evento.findByIdAndUpdate(
      req.params.id,
      { ...req.body, actualizado_en: Date.now() },
      { new: true, runValidators: true }
    );

    if (!eventoActualizado) {
      throw new AppError('Evento no encontrado', 404);
    }

    res.json({
      status: 'success',
      mensaje: "✅ Evento actualizado correctamente",
      evento: eventoActualizado
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar evento
export const eliminarEvento = async (req, res, next) => {
  try {
    const db = await conectarMySQL();
    
    // Verificar si hay inscripciones activas
    const [inscripciones] = await db.query(
      'SELECT COUNT(*) as total FROM inscripciones WHERE id_evento_mongo = ? AND estado = "confirmada"',
      [req.params.id]
    );

    if (inscripciones[0].total > 0) {
      throw new AppError(
        'No puedes eliminar un evento con inscripciones confirmadas. Cancélalo primero.',
        400
      );
    }

    const eventoEliminado = await Evento.findByIdAndDelete(req.params.id);

    if (!eventoEliminado) {
      throw new AppError('Evento no encontrado', 404);
    }

    // Eliminar inscripciones asociadas
    await db.query(
      'DELETE FROM inscripciones WHERE id_evento_mongo = ?',
      [req.params.id]
    );

    res.json({
      status: 'success',
      mensaje: "🗑️ Evento eliminado correctamente"
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas del evento
export const obtenerEstadisticasEvento = async (req, res, next) => {
  try {
    const evento = await Evento.findById(req.params.id);
    
    if (!evento) {
      throw new AppError('Evento no encontrado', 404);
    }

    const db = await conectarMySQL();

    // Obtener estadísticas
    const [inscripciones] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'confirmada' THEN 1 ELSE 0 END) as confirmadas,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'cancelada' THEN 1 ELSE 0 END) as canceladas
      FROM inscripciones 
      WHERE id_evento_mongo = ?`,
      [req.params.id]
    );

    const [ingresos] = await db.query(
      `SELECT 
        COALESCE(SUM(p.monto), 0) as total_ingresos,
        COALESCE(SUM(CASE WHEN p.estado = 'completado' THEN p.monto ELSE 0 END), 0) as ingresos_completados,
        COUNT(p.id) as total_pagos
      FROM pagos p
      INNER JOIN inscripciones i ON p.id_inscripcion = i.id
      WHERE i.id_evento_mongo = ?`,
      [req.params.id]
    );

    res.json({
      status: 'success',
      data: {
        evento: {
          titulo: evento.titulo,
          fecha: evento.fecha,
          capacidad: evento.capacidad,
          precio: evento.precio
        },
        inscripciones: inscripciones[0],
        ingresos: ingresos[0],
        ocupacion: evento.capacidad 
          ? ((inscripciones[0].confirmadas / evento.capacidad) * 100).toFixed(2) + '%'
          : 'Sin límite'
      }
    });
  } catch (error) {
    next(error);
  }
};