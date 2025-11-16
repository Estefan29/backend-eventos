import express from "express";
import {
  obtenerPagos,
  obtenerPagoPorId,
  crearPago,
  actualizarPago,
  eliminarPago
} from "../controllers/pagoController.js";
import { verificarToken } from "../middleware/auth.middleware.js";
import { esAdmin } from "../middleware/verificarRol.js";
import { validarPago } from "../middleware/validators.js";

const router = express.Router();

// Rutas para usuarios autenticados
router.post("/", verificarToken, validarPago, crearPago);
router.get("/:id", verificarToken, obtenerPagoPorId);

// Rutas para admin
router.get("/", verificarToken, esAdmin, obtenerPagos);
router.put("/:id", verificarToken, esAdmin, actualizarPago);
router.delete("/:id", verificarToken, esAdmin, eliminarPago);

export default router;