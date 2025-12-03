// _tests_/unit/controllers/eventoController.test.js
import { jest } from '@jest/globals';
import {
  crearEvento,
  obtenerEventos,
  obtenerEventoPorId,
  actualizarEvento,
  eliminarEvento,
  obtenerEstadisticasEvento
} from '@controllers/eventoController.js';

// Mocks
jest.mock('@models/evento.model.js');
jest.mock('@config/db.mysql.js');

import Evento from '@models/evento.model.js';
import conectarMySQL from '@config/db.mysql.js';

describe('EventoController', () => {
  let req, res, next, mockDb;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      usuario: { _id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    mockDb = {
      query: jest.fn()
    };
    conectarMySQL.mockResolvedValue(mockDb);
  });

  describe('crearEvento', () => {
    it('debería crear un evento exitosamente', async () => {
      req.body = {
        titulo: 'Evento Test',
        descripcion: 'Descripción del evento de prueba',
        fecha: new Date('2025-12-31'),
        lugar: 'Auditorio Principal',
        capacidad: 100,
        precio: 50
      };

      const mockEvento = {
        _id: 'evento123',
        ...req.body,
        creado_por: 'user123',
        save: jest.fn().mockResolvedValue(true)
      };

      Evento.mockImplementation(() => mockEvento);

      await crearEvento(req, res, next);

      expect(mockEvento.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          mensaje: '✅ Evento creado con éxito'
        })
      );
    });

    it('debería manejar errores al crear evento', async () => {
      req.body = { titulo: 'Test' };

      const mockEvento = {
        save: jest.fn().mockRejectedValue(new Error('Error de validación'))
      };

      Evento.mockImplementation(() => mockEvento);

      await crearEvento(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('obtenerEventos', () => {
    it('debería obtener eventos con paginación', async () => {
      req.query = {
        pagina: '1',
        limite: '10'
      };

      const mockEventos = [
        {
          _id: '1',
          titulo: 'Evento 1',
          toJSON: jest.fn().mockReturnValue({ _id: '1', titulo: 'Evento 1' })
        },
        {
          _id: '2',
          titulo: 'Evento 2',
          toJSON: jest.fn().mockReturnValue({ _id: '2', titulo: 'Evento 2' })
        }
      ];

      Evento.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockEventos)
          })
        })
      });

      Evento.countDocuments = jest.fn().mockResolvedValue(2);

      mockDb.query.mockResolvedValue([[{ inscritos: 5 }]]);

      await obtenerEventos(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            eventos: expect.any(Array),
            paginacion: expect.objectContaining({
              total: 2,
              pagina: 1
            })
          })
        })
      );
    });

    it('debería filtrar eventos por búsqueda', async () => {
      req.query = {
        busqueda: 'conferencia',
        pagina: '1',
        limite: '10'
      };

      Evento.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      Evento.countDocuments = jest.fn().mockResolvedValue(0);

      await obtenerEventos(req, res, next);

      expect(Evento.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.any(Array)
        })
      );
    });

    it('debería filtrar eventos próximos', async () => {
      req.query = {
        estado: 'proximos',
        pagina: '1',
        limite: '10'
      };

      Evento.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        })
      });

      Evento.countDocuments = jest.fn().mockResolvedValue(0);

      await obtenerEventos(req, res, next);

      expect(Evento.find).toHaveBeenCalledWith(
        expect.objectContaining({
          fecha: expect.any(Object)
        })
      );
    });
  });

  describe('obtenerEventoPorId', () => {
    it('debería obtener un evento por ID', async () => {
      req.params.id = 'evento123';

      const mockEvento = {
        _id: 'evento123',
        titulo: 'Evento Test',
        capacidad: 100,
        toJSON: jest.fn().mockReturnValue({
          _id: 'evento123',
          titulo: 'Evento Test'
        })
      };

      Evento.findById = jest.fn().mockResolvedValue(mockEvento);
      mockDb.query.mockResolvedValue([[{ inscritos: 25 }]]);

      await obtenerEventoPorId(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            _id: 'evento123',
            inscritos: 25,
            cupos_disponibles: 75
          })
        })
      );
    });

    it('debería devolver error si el evento no existe', async () => {
      req.params.id = 'noexiste';

      Evento.findById = jest.fn().mockResolvedValue(null);

      await obtenerEventoPorId(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Evento no encontrado',
          statusCode: 404
        })
      );
    });
  });

  describe('actualizarEvento', () => {
    it('debería actualizar un evento exitosamente', async () => {
      req.params.id = 'evento123';
      req.body = {
        titulo: 'Evento Actualizado',
        descripcion: 'Nueva descripción'
      };

      const mockEventoActualizado = {
        _id: 'evento123',
        titulo: 'Evento Actualizado',
        descripcion: 'Nueva descripción'
      };

      Evento.findByIdAndUpdate = jest.fn().mockResolvedValue(mockEventoActualizado);

      await actualizarEvento(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          mensaje: '✅ Evento actualizado correctamente'
        })
      );
    });

    it('debería devolver error si el evento no existe', async () => {
      req.params.id = 'noexiste';
      req.body = { titulo: 'Test' };

      Evento.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await actualizarEvento(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Evento no encontrado',
          statusCode: 404
        })
      );
    });
  });

  describe('eliminarEvento', () => {
    it('debería eliminar un evento sin inscripciones', async () => {
      req.params.id = 'evento123';

      mockDb.query
        .mockResolvedValueOnce([[{ total: 0 }]]) // No hay inscripciones
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete inscripciones

      Evento.findByIdAndDelete = jest.fn().mockResolvedValue({
        _id: 'evento123',
        titulo: 'Evento Eliminado'
      });

      await eliminarEvento(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          mensaje: '🗑 Evento eliminado correctamente'
        })
      );
    });

    it('debería fallar si hay inscripciones confirmadas', async () => {
      req.params.id = 'evento123';

      mockDb.query.mockResolvedValue([[{ total: 5 }]]);

      await eliminarEvento(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('inscripciones confirmadas'),
          statusCode: 400
        })
      );
    });
  });

  describe('obtenerEstadisticasEvento', () => {
    it('debería obtener estadísticas completas del evento', async () => {
      req.params.id = 'evento123';

      const mockEvento = {
        _id: 'evento123',
        titulo: 'Evento Test',
        fecha: new Date(),
        capacidad: 100,
        precio: 50
      };

      Evento.findById = jest.fn().mockResolvedValue(mockEvento);

      mockDb.query
        .mockResolvedValueOnce([[{
          total: 80,
          confirmadas: 70,
          pendientes: 5,
          canceladas: 5
        }]])
        .mockResolvedValueOnce([[{
          total_ingresos: 3500,
          ingresos_completados: 3000,
          total_pagos: 70
        }]]);

      await obtenerEstadisticasEvento(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            evento: expect.any(Object),
            inscripciones: expect.any(Object),
            ingresos: expect.any(Object),
            ocupacion: '70.00%'
          })
        })
      );
    });

    it('debería manejar eventos sin límite de capacidad', async () => {
      req.params.id = 'evento123';

      const mockEvento = {
        _id: 'evento123',
        titulo: 'Evento Test',
        capacidad: null,
        precio: 0
      };

      Evento.findById = jest.fn().mockResolvedValue(mockEvento);

      mockDb.query
        .mockResolvedValueOnce([[{ total: 100, confirmadas: 100, pendientes: 0, canceladas: 0 }]])
        .mockResolvedValueOnce([[{ total_ingresos: 0, ingresos_completados: 0, total_pagos: 0 }]]);

      await obtenerEstadisticasEvento(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ocupacion: 'Sin límite'
          })
        })
      );
    });
  });
});