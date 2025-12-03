// _tests_/unit/controllers/pagoController.test.js
import { jest } from '@jest/globals';
import {
  obtenerPagos,
  obtenerPagoPorId,
  crearPago,
  actualizarPago,
  eliminarPago
} from '@controllers/pagoController.js';

jest.mock('@models/pago.model.js', () => ({
  PagoModel: {
    obtenerTodos: jest.fn(),
    obtenerPorId: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
  }
}));

import { PagoModel } from '@models/pago.model.js';

describe('PagoController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  // ==========================
  // obtenerPagos
  // ==========================
  describe('obtenerPagos', () => {
    it('debería obtener todos los pagos', async () => {
      const mockPagos = [
        { id: 1, monto: 100, estado: 'completado' },
        { id: 2, monto: 50, estado: 'pendiente' }
      ];

      PagoModel.obtenerTodos.mockResolvedValue(mockPagos);

      await obtenerPagos(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPagos);
    });

    it('debería manejar errores', async () => {
      PagoModel.obtenerTodos.mockRejectedValue(new Error('DB Error'));

      await obtenerPagos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error al obtener los pagos'
        })
      );
    });
  });

  // ==========================
  // obtenerPagoPorId
  // ==========================
  describe('obtenerPagoPorId', () => {
    it('debería obtener un pago por ID', async () => {
      req.params.id = '1';

      const mockPago = {
        id: 1,
        monto: 100,
        estado: 'completado'
      };

      PagoModel.obtenerPorId.mockResolvedValue(mockPago);

      await obtenerPagoPorId(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPago);
    });

    it('debería devolver 404 si no existe', async () => {
      req.params.id = '999';

      PagoModel.obtenerPorId.mockResolvedValue(null);

      await obtenerPagoPorId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ==========================
  // crearPago
  // ==========================
  describe('crearPago', () => {
    it('debería crear un pago exitosamente', async () => {
      req.body = {
        id_inscripcion: 1,
        monto: 100,
        metodo_pago: 'tarjeta',
        estado: 'completado'
      };

      const mockNuevoPago = { id: 1, ...req.body };

      PagoModel.crear.mockResolvedValue(mockNuevoPago);

      await crearPago(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockNuevoPago);
    });
  });

  // ==========================
  // actualizarPago
  // ==========================
  describe('actualizarPago', () => {
    it('debería actualizar un pago', async () => {
      req.params.id = '1';
      req.body = { estado: 'completado' };

      const mockPagoActualizado = {
        id: 1,
        estado: 'completado'
      };

      PagoModel.actualizar.mockResolvedValue(mockPagoActualizado);

      await actualizarPago(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPagoActualizado);
    });
  });

  // ==========================
  // eliminarPago
  // ==========================
  describe('eliminarPago', () => {
    it('debería eliminar un pago', async () => {
      req.params.id = '1';

      PagoModel.eliminar.mockResolvedValue({
        message: 'Pago eliminado correctamente'
      });

      await eliminarPago(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Pago eliminado correctamente'
        })
      );
    });
  });
});
