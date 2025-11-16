import conectarMySQL from "../config/db.mysql.js";
import Evento from "../models/evento.model.js";
import { AppError } from "../middleware/errorHandler.js";

// Crear inscripción
export const crearInscripcion = async (req, res, next) => {
  try {
    const db = await conectarMySQL();
    const { id_usuario, id_evento_mongo } = req.body;
    
    // El middleware validarInscripcion ya verificó todo
    const evento = req.evento;
    
    // Crear la inscripción
    const [result] = await db.query(
      "INSERT INTO inscripciones (id_usuario, id_evento_mongo, fecha_inscripcion, estado) VALUES (?, ?, NOW(), ?)",
      [id_usuario, id_evento_mongo, evento.precio > 0 ? 'pendiente' : 'confirmada']
    );

    // Si el evento es gratuito, confirmar automáticamente
    const estadoInscripcion = evento.precio > 0 ? 'pendiente' : 'confirmada';

    res.status(201).json({
      status: 'success',
      mensaje: evento.precio > 0 
        ? '✅ Inscripción creada. Por favor realiza el pago para confirmar.'
        : '✅ Inscripción confirmada exitosamente',
      inscripcion: {
        id: result.insertId,
        id_usuario,
        id_evento_mongo,
        evento: {
          titulo: evento.titulo,
          fecha: evento.fecha,
          lugar: evento.lugar,
          precio: evento.precio
        },
        estado: estadoInscripcion,
        cupos_disponibles: req.cuposDisponibles - 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todas las inscripciones (con filtros)
export const obtenerInscripciones = async (req, res, next) => {
  try {
    const db = await conectarMySQL();
    const { 
      estado, 
      id_usuario, 
      id_evento_mongo,
      pagina = 1,
      limite = 20
    } = req.query;

    let query = "SELECT * FROM inscripciones WHERE 1=1";
    const params = [];

    if (estado) {
      query += " AND estado = ?";
      params.push(estado);
    }

    if (id_usuario) {
      query += " AND id_usuario = ?";
      params.push(id_usuario);
    }

    if (id_evento_mongo) {
      query += " AND id_evento_mongo = ?";
      params.push(id_evento_mongo);
    }

    // Paginación
    const offset = (pagina - 1) * limite;
    query += " ORDER BY fecha_inscripcion DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limite), offset);

    const [inscripciones] = await db.query(query, params);

    // Contar total
    let countQuery = "SELECT COUNT(*) as total FROM inscripciones WHERE 1=1";
    const countParams = params.slice(0, -2); // Remover LIMIT y OFFSET
    
    if (estado) countQuery += " AND estado = ?";
    if (id_usuario) countQuery += " AND id_usuario = ?";
    if (id_evento_mongo) countQuery += " AND id_evento_mongo = ?";

    const [totalResult] = await db.query(countQuery, countParams);

    // Enriquecer con información de eventos
    const inscripcionesConEventos = await Promise.all(
      inscripciones.map(async (inscripcion) => {
        const evento = await Evento.findById(inscripcion.id_evento_mongo).select('titulo fecha lugar precio');
        return {
          ...inscripcion,
          evento: evento || { mensaje: 'Evento no encontrado' }
        };
      })
    );

    res.json({
      status: 'success',
      data: {
        inscripciones: inscripcionesConEventos,
        paginacion: {
          total: totalResult[0].total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(totalResult[0].total / limite)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener inscripción por ID
export const obtenerInscripcionPorId = async (req, res, next) => {
  try {
    const db = await conectarMySQL();
    const [rows] = await db.query(
      "SELECT * FROM inscripciones WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      throw new AppError('Inscripción no encontrada', 404);
    }

    const inscripcion = rows[0];

    // Obtener información del evento
    const evento = await Evento.findById(inscripcion.id_evento_mongo);

    // Obtener información de pagos
    const [pagos] = await db.query(
      "SELECT * FROM pagos WHERE id_inscripcion = ?",
      [inscripcion.id]
    );

    res.json({
      status: 'success',
      data: {
        ...inscripcion,
        evento,
        pagos
      }
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar estado de inscripción
export const actualizarInscripcion = async (req, res, next) => {
  try {
    const db = await conectarMySQL();
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ['pendiente', 'confirmada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
      throw new AppError('Estado inválido', 400);
    }

    const [result] = await db.query(
      "UPDATE inscripciones SET estado = ? WHERE id = ?",
      [estado, req.params.id]
    );

    if (result.affectedRows === 0) {
      throw new AppError('Inscripción no encontrada', 404);
    }

    res.json({
      status: 'success',
      mensaje: '✅ Inscripción actualizada correctamente',
      estado
    });
  } catch (error) {
    next(error);
  }
};

// Cancelar inscripción
export const cancelarInscripcion = async (req, res, next) => {
  try {
    const db = await conectarMySQL();

    // Obtener inscripción
    const [inscripciones] = await db.query(
      "SELECT * FROM inscripciones WHERE id = ?",
      [req.params.id]
    );

    if (inscripciones.length === 0) {
      throw new AppError('Inscripción no encontrada', 404);
    }

    const inscripcion = inscripciones[0];

    if (inscripcion.estado === 'cancelada') {
      throw new AppError('La inscripción ya está cancelada', 400);
    }

    // Verificar que falten al menos 24 horas para el evento
    const evento = await Evento.findById(inscripcion.id_evento_mongo);
    const horasRestantes = (new Date(evento.fecha) - new Date()) / (1000 * 60 * 60);

    if (horasRestantes < 24) {
      throw new AppError('No puedes cancelar una inscripción con menos de 24 horas de anticipación', 400);
    }

    // Cancelar inscripción
    await db.query(
      "UPDATE inscripciones SET estado = 'cancelada' WHERE id = ?",
      [req.params.id]
    );

    // Si había pagos, marcarlos como reembolsados
    await db.query(
      "UPDATE pagos SET estado = 'reembolsado' WHERE id_inscripcion = ? AND estado = 'completado'",
      [req.params.id]
    );

    res.json({
      status: 'success',
      mensaje: '✅ Inscripción cancelada. Se procesará el reembolso en 5-7 días hábiles.'
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar inscripción (solo admin)
export const eliminarInscripcion = async (req, res, next) => {
  try {
    const db = await conectarMySQL();

    // Eliminar pagos asociados primero
    await db.query("DELETE FROM pagos WHERE id_inscripcion = ?", [req.params.id]);

    // Eliminar inscripción
    const [result] = await db.query(
      "DELETE FROM inscripciones WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      throw new AppError('Inscripción no encontrada', 404);
    }

    res.json({
      status: 'success',
      mensaje: "🗑️ Inscripción eliminada correctamente"
    });
  } catch (error) {
    next(error);
  }
};

// Obtener mis inscripciones (usuario autenticado)
export const obtenerMisInscripciones = async (req, res, next) => {
  try {
    const db = await conectarMySQL();
    const id_usuario = req.usuario._id.toString();

    const [inscripciones] = await db.query(
      `SELECT i.*, 
        (SELECT COUNT(*) FROM pagos p WHERE p.id_inscripcion = i.id) as tiene_pagos
      FROM inscripciones i
      WHERE i.id_usuario = ?
      ORDER BY i.fecha_inscripcion DESC`,
      [id_usuario]
    );

    // Enriquecer con información de eventos
    const inscripcionesConEventos = await Promise.all(
      inscripciones.map(async (inscripcion) => {
        const evento = await Evento.findById(inscripcion.id_evento_mongo);
        return {
          ...inscripcion,
          evento
        };
      })
    );

    res.json({
      status: 'success',
      data: inscripcionesConEventos
    });
  } catch (error) {
    next(error);
  }
};