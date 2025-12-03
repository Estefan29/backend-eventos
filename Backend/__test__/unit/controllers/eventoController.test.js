import { jest } from '@jest/globals';
import {
  crearEvento,
  obtenerEventos,
  obtenerEventoPorId,
  actualizarEvento,
  eliminarEvento,
  obtenerEstadisticasEvento
} from '@controllers/eventoController.js';

jest.mock('@models/evento.model.js');
jest.mock('@config/db.mysql.js');

import Evento from '@models/evento.model.js';
import conectarMySQL from '@config/db.mysql.js';

describe('EventoController', () => {
  let req, res, next, mockDb;

  beforeEach(() => {
    jest.clearAllMocks();

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

  // --------------------------------------------------------------------------
  // crearEvento
  // --------------------------------------------------------------------------
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
      const mockEvento = {
        save: jest.fn().mockRejectedValue(new Error('Error de validación'))
      };

      Evento.mockImplementation(() => mockEvento);

      await crearEvento(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // --------------------------------------------------------------------------
  // obtenerEventos
  // --------------------------------------------------------------------------
  describe('obtenerEventos', () => {
    it('debería obtener eventos con paginación', async () => {
      req.query = { pagina: '1', limite: '10' };

      const mockEventos = [
        { toJSON: jest.fn().mockReturnValue({ _id: '1', titulo: 'Evento 1' }) },
        { toJSON: jest.fn().mockReturnValue({ _id: '2', titulo: 'Evento 2' }) }
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

      expect(res.json).toH
