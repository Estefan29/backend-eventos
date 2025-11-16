import express from "express";
import { 
  crearUsuario, 
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  eliminarUsuario
} from "../controllers/usuarioController.js";
import { verificarToken } from "../middleware/auth.middleware.js";
import { esAdmin, esPropietarioOAdmin } from "../middleware/verificarRol.js";

const router = express.Router();

// Solo admin puede listar y crear usuarios
router.get("/", verificarToken, esAdmin, obtenerUsuarios);
router.post("/", verificarToken, esAdmin, crearUsuario);

// Usuario puede ver/editar su propio perfil, admin puede ver/editar cualquiera
router.get("/:id", verificarToken, esPropietarioOAdmin, obtenerUsuarioPorId);
router.put("/:id", verificarToken, esPropietarioOAdmin, actualizarUsuario);
router.delete("/:id", verificarToken, esAdmin, eliminarUsuario);

export default router;