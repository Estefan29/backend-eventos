import express from "express";
import { crearEvento, obtenerEventos } from "../controllers/eventController.js";

const router = express.Router();

router.post("/", crearEvento);
router.get("/", obtenerEventos);

export default router;
