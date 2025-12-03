// _tests_/unit/controllers/usuarioController.test.js
import { jest } from '@jest/globals';
import {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
} from '@controllers/usuarioController.js';

jest.mock('@models/usuario.model.js');
import Usuario from '@models/usuario.model.js';

describe('UsuarioController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('crearUsuario', () => {
    it('debería crear usuario exitosamente', async () => {
      req.body = {
        nombre: 'Nuevo Usuario',
        correo: 'nuevo@example.com',
        password: 'password123'
      };

      const mockUsuario = {
        ...req.body,
        _id: 'user123',
        save: jest.fn().mockResolvedValue(true)
      };

      Usuario.mockImplementation(() => mockUsuario);

      await crearUsuario(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          mensaje: '✅ Usuario registrado con éxito'
        })
      );
    });
  });

  describe('obtenerUsuarios', () => {
    it('debería obtener usuarios con paginación', async () => {
      req.query = { pagina: '1', limite: '20' };

      const mockUsuarios = [
        { _id: '1', nombre: 'Usuario 1', correo: 'user1@example.com' },
        { _id: '2', nombre: 'Usuario 2', correo: 'user2@example.com' }
      ];

      Usuario.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockUsuarios)
            })
          })
        })
      });

      Usuario.countDocuments = jest.fn().mockResolvedValue(2);

      await obtenerUsuarios(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            usuarios: expect.any(Array),
            paginacion: expect.any(Object)
          })
        })
      );
    });

    it('debería filtrar por rol', async () => {
      req.query = { rol: 'admin' };

      Usuario.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      Usuario.countDocuments = jest.fn().mockResolvedValue(0);

      await obtenerUsuarios(req, res, next);

      expect(Usuario.find).toHaveBeenCalledWith(
        expect.objectContaining({ rol: 'admin' })
      );
    });

    it('debería buscar por nombre o correo', async () => {
      req.query = { busqueda: 'test' };

      Usuario.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([])
            })
          })
        })
      });

      Usuario.countDocuments = jest.fn().mockResolvedValue(0);

      await obtenerUsuarios(req, res, next);

      expect(Usuario.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.any(Array)
        })
      );
    });
  });

  describe('obtenerUsuarioPorId', () => {
    it('debería obtener usuario por ID', async () => {
      req.params.id = 'user123';

      const mockUsuario = {
        _id: 'user123',
        nombre: 'Test User',
        correo: 'test@example.com'
      };

      Usuario.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsuario)
      });

      await obtenerUsuarioPorId(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: mockUsuario
        })
      );
    });

    it('debería devolver error si no existe', async () => {
      req.params.id = 'noexiste';

      Usuario.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await obtenerUsuarioPorId(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuario no encontrado',
          statusCode: 404
        })
      );
    });
  });

  describe('actualizarUsuario', () => {
    it('debería actualizar usuario correctamente', async () => {
      req.params.id = 'user123';
      req.body = {
        nombre: 'Nombre Actualizado',
        telefono: '123456789'
      };

      const mockUsuarioActualizado = {
        _id: 'user123',
        nombre: 'Nombre Actualizado',
        telefono: '123456789'
      };

      Usuario.findByIdAndUpdate = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsuarioActualizado)
      });

      await actualizarUsuario(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          mensaje: '✅ Usuario actualizado correctamente'
        })
      );
    });
  });

  describe('eliminarUsuario', () => {
    it('debería eliminar usuario correctamente', async () => {
      req.params.id = 'user123';

      Usuario.findByIdAndDelete = jest.fn().mockResolvedValue({
        _id: 'user123'
      });

      await eliminarUsuario(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          mensaje: '🗑 Usuario eliminado correctamente'
        })
      );
    });

    it('debería devolver error si no existe', async () => {
      req.params.id = 'noexiste';

      Usuario.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      await eliminarUsuario(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Usuario no encontrado'
        })
      );
    });
  });
});