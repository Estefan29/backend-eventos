import express from "express";
import {
  crearInscripcion,
  obtenerInscripciones,
  obtenerInscripcionPorId,
  actualizarInscripcion,
  cancelarInscripcion,
  eliminarInscripcion,
  obtenerMisInscripciones
} from "../controllers/inscripcionController.js";
import { verificarToken } from "../middleware/auth.middleware.js";
import { esAdmin } from "../middleware/verificarRol.js";
import { validarInscripcion as validarInscripcionData } from "../middleware/validators.js";
import { validarInscripcion } from "../middleware/validarInscripcion.js";

const router = express.Router();

// Rutas para usuarios autenticados
router.get("/mis-inscripciones", verificarToken, obtenerMisInscripciones);
router.post("/", verificarToken, validarInscripcionData, validarInscripcion, crearInscripcion);
router.put("/:id/cancelar", verificarToken, cancelarInscripcion);

// Rutas para admin
router.get("/", verificarToken, esAdmin, obtenerInscripciones);
router.get("/:id", verificarToken, obtenerInscripcionPorId);
router.put("/:id", verificarToken, esAdmin, actualizarInscripcion);
router.delete("/:id", verificarToken, esAdmin, eliminarInscripcion);

export default router;
