import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Bienvenido al API de Gestión de Eventos USC");
});

export default router;

