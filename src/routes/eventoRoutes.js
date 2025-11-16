import express from "express";
import {
  crearEvento,
  obtenerEventos,
  obtenerEventoPorId,
  actualizarEvento,
  eliminarEvento,
  obtenerEstadisticasEvento
} from "../controllers/eventController.js";
import { verificarToken } from "../middleware/auth.middleware.js";
import { esAdmin } from "../middleware/verificarRol.js";
import { validarEvento, validarMongoId } from "../middleware/validators.js";

const router = express.Router();

// Rutas públicas
router.get("/", obtenerEventos);
router.get("/:id", validarMongoId, obtenerEventoPorId);

// Rutas protegidas (solo admin)
router.post("/", verificarToken, esAdmin, validarEvento, crearEvento);
router.put("/:id", verificarToken, esAdmin, validarMongoId, validarEvento, actualizarEvento);
router.delete("/:id", verificarToken, esAdmin, validarMongoId, eliminarEvento);
router.get("/:id/estadisticas", verificarToken, esAdmin, validarMongoId, obtenerEstadisticasEvento);

export default router;