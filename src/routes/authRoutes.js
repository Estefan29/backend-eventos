import express from 'express';
import {
  registrarUsuario,
  loginUsuario,
  obtenerPerfil,
  actualizarPerfil,
  cambiarContraseña,
  recuperarPassword,     
  restablecerPassword,
  //promoverAAdministrativo,
  //cambiarRolUsuario
} from '../controllers/authController.js';
import { verificarToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/recuperar-password', recuperarPassword);           // ← NUEVO
router.post('/restablecer-password', restablecerPassword);      // ← NUEVO

// Rutas protegidas
router.get('/perfil', verificarToken, obtenerPerfil);
router.put('/perfil', verificarToken, actualizarPerfil);
router.put('/cambiar-password', verificarToken, cambiarContraseña);

//router.put('/usuarios/:usuarioId/promover', protegerRuta, promoverAAdministrativo);
//router.put('/usuarios/:usuarioId/cambiar-rol', protegerRuta, cambiarRolUsuario);

export default router;  