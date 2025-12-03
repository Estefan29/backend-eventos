import { jest } from "@jest/globals";

import {
  crearInscripcion,
  obtenerInscripciones,
  obtenerInscripcionPorId,
  actualizarInscripcion,
  cancelarInscripcion,
  eliminarInscripcion,
  obtenerMisInscripciones,
} from "@controllers/inscripcionController.js";

jest.mock("@config/db.mysql.js");
jest.mock("@models/evento.model.js");

import conectarMySQL from "@config/db.mysql.js";
import Evento from "@models/evento.model.js";

describe("InscripcionController", () => {
  let req, res, next, mockDb;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      usuario: { _id: "user123" },
      evento: null,
      cuposDisponibles: null,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    mockDb = {
      query: jest.fn(),
    };

    conectarMySQL.mockResolvedValue(mockDb);

    // Reset de mock global de Evento
    Evento.findById = jest.fn();
  });

  // ------------------------------------------------------------
  // CREAR INSCRIPCION
  // ------------------------------------------------------------
  describe("crearInscripcion", () => {
    it("debería crear inscripción gratuita confirmada", async () => {
      req.body = { id_evento_mongo: "evento123" };
      req.evento = {
        titulo: "Evento Gratis",
        fecha: new Date(),
        lugar: "Auditorio",
        precio: 0,
      };
      req.cuposDisponibles = 20;

      mockDb.query.mockResolvedValue([{ insertId: 1 }]);

      await crearInscripcion(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          inscripcion: expect.objectContaining({
            estado: "confirmada",
          }),
        })
      );
    });

    it("debería crear inscripción de pago pendiente", async () => {
      req.body = { id_evento_mongo: "evento123" };
      req.evento = {
        titulo: "Evento de Pago",
        fecha: new Date(),
        lugar: "Auditorio",
        precio: 100,
      };

      req.cuposDisponibles = 40;

      mockDb.query.mockResolvedValue([{ insertId: 1 }]);

      await crearInscripcion(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          inscripcion: expect.objectContaining({
            estado: "pendiente",
          }),
        })
      );
    });
  });

  // ------------------------------------------------------------
  // OBTENER INSCRIPCIONES
  // ------------------------------------------------------------
  describe("obtenerInscripciones", () => {
    it("debería obtener inscripciones con paginación", async () => {
      req.query = { pagina: "1", limite: "20" };

      const mockInscripciones = [
        { id: 1, id_evento_mongo: "evento1" },
      ];

      mockDb.query
        .mockResolvedValueOnce([mockInscripciones]) // SELECT principal
        .mockResolvedValueOnce([[{ total: 1 }]]); // COUNT

      // Mock Evento.findById().select()
      Evento.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          titulo: "Evento Test",
        }),
      });

      await obtenerInscripciones(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            paginacion: expect.objectContaining({
              total: 1,
            }),
          }),
        })
      );
    });
  });

  // ------------------------------------------------------------
  // OBTENER INSCRIPCION POR ID
  // ------------------------------------------------------------
  describe("obtenerInscripcionPorId", () => {
    it("debería obtener inscripción con evento y pagos", async () => {
      req.params.id = "1";

      const mockInscripcion = {
        id: 1,
        id_evento_mongo: "evento123",
      };

      mockDb.query
        .mockResolvedValueOnce([[mockInscripcion]]) // Inscripción
        .mockResolvedValueOnce([[]]); // Pagos vacío

      Evento.findById.mockResolvedValue({
        titulo: "Evento Test",
      });

      await obtenerInscripcionPorId(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            evento: expect.any(Object),
            pagos: expect.any(Array),
          }),
        })
      );
    });

    it("debería lanzar error si no existe", async () => {
      req.params.id = "999";

      mockDb.query.mockResolvedValue([[]]);

      await obtenerInscripcionPorId(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------
  // ACTUALIZAR INSCRIPCION
  // ------------------------------------------------------------
  describe("actualizarInscripcion", () => {
    it("debería actualizar correctamente", async () => {
      req.params.id = "1";
      req.body.estado = "confirmada";

      mockDb.query.mockResolvedValue([{ affectedRows: 1 }]);

      await actualizarInscripcion(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: expect.stringContaining("actualizada"),
        })
      );
    });

    it("debería rechazar estado inválido", async () => {
      req.body.estado = "xxx";

      await actualizarInscripcion(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------
  // CANCELAR INSCRIPCION
  // ------------------------------------------------------------
  describe("cancelarInscripcion", () => {
    it("debería cancelar si faltan más de 24h", async () => {
      req.params.id = "1";

      // Primera consulta → inscripción
      mockDb.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            estado: "confirmada",
            id_evento_mongo: "evento123",
          },
        ],
      ]);

      // Evento en 3 días
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 3);

      Evento.findById.mockResolvedValue({ fecha });

      mockDb.query.mockResolvedValue([{ affectedRows: 1 }]); // UPDATE inscripción
      mockDb.query.mockResolvedValue([{ affectedRows: 1 }]); // UPDATE pagos

      await cancelarInscripcion(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------
  // ELIMINAR INSCRIPCION
  // ------------------------------------------------------------
  describe("eliminarInscripcion", () => {
    it("debería eliminar correctamente", async () => {
      req.params.id = "1";

      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // pagos
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // inscripción

      await eliminarInscripcion(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: "🗑️ Inscripción eliminada correctamente",
        })
      );
    });
  });

  // ------------------------------------------------------------
  // OBTENER MIS INSCRIPCIONES
  // ------------------------------------------------------------
  describe("obtenerMisInscripciones", () => {
    it("debería obtener inscripciones del usuario", async () => {
      const mockInscripciones = [
        { id: 1, id_evento_mongo: "evento123" },
      ];

      mockDb.query.mockResolvedValue([mockInscripciones]);

      Evento.findById.mockResolvedValue({
        titulo: "Evento Test",
      });

      await obtenerMisInscripciones(req, res, next);

      expect(res.json).toHaveBeenCalled();
    });
  });
});
