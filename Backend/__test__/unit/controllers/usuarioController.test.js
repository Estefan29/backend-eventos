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
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockUsuarios)
      });

      Usuario.countDocuments = jest.fn().mockResolvedValue(2);

      await obtenerUsuarios(req, res, next);

      expect(res.json).toHaveBeenCalled();
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
  });
});
