import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ mensaje: "Backend de eventos funcionando correctamente!" });
});

export default router;
