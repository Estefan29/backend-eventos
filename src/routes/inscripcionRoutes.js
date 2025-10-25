import express from "express";
import {
  crearInscripcion,
  obtenerInscripciones,
  obtenerInscripcionPorId,
  actualizarInscripcion,
  eliminarInscripcion,
} from "../controllers/inscripcionController.js";

const router = express.Router();

router.post("/", crearInscripcion);
router.get("/", obtenerInscripciones);
router.get("/:id", obtenerInscripcionPorId);
router.put("/:id", actualizarInscripcion);
router.delete("/:id", eliminarInscripcion);

export default router;
