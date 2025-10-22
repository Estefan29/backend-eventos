import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import conectarMongo from "./config/db.mongo.js";
import conectarMySQL from "./config/db.mysql.js";
import testRoutes from "./routes/test.routes.js";
import eventoRoutes from "./routes/eventoRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/test", testRoutes); // 👈 monta la ruta
app.use("/api/eventos", eventoRoutes);
app.use("/api/usuarios", usuarioRoutes);

app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente 🚀");
});

// Conectar a las bases de datos
conectarMongo();
conectarMySQL();

const iniciarServidor = async () => {
  app.use(express.json());
  app.use(cors());

  console.log("🔍 Intentando conectar a MongoDB...");
  await conectarMongo();
  console.log("✅ MongoDB conectado correctamente.");

  console.log("🔍 Intentando conectar a MySQL...");
  await conectarMySQL();
  console.log("✅ MySQL conectado correctamente.");

  const PORT = 4000;
  app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
};

iniciarServidor();