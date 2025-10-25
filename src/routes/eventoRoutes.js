import express from "express";
import {
  crearEvento,
  obtenerEventos,
  obtenerEventoPorId,
  actualizarEvento,
  eliminarEvento,
} from "../controllers/eventController.js";

const router = express.Router();

// Rutas CRUD
router.post("/", crearEvento);
router.get("/", obtenerEventos);
router.get("/:id", obtenerEventoPorId);
router.put("/:id", actualizarEvento);
router.delete("/:id", eliminarEvento);

export default router;
