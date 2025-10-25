import express from "express";
import {
  obtenerPagos,
  obtenerPagoPorId,
  crearPago,
  actualizarPago,
  eliminarPago,
} from "../controllers/pagoController.js";

const router = express.Router();

router.get("/", obtenerPagos);
router.get("/:id", obtenerPagoPorId);
router.post("/", crearPago);
router.put("/:id", actualizarPago);
router.delete("/:id", eliminarPago);

export default router;