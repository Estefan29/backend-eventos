import express from "express";
import { crearUsuario, obtenerUsuarios } from "../controllers/usuarioController.js";

const router = express.Router();

// Registrar usuario
router.post("/", crearUsuario);

// Listar usuarios
router.get("/", obtenerUsuarios);

export default router;