import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import conectarMongo from "./config/db.mongo.js";
import conectarMySQL from "./config/db.mysql.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// Importar rutas
import testRoutes from "./routes/test.routes.js";
import authRoutes from "./routes/authRoutes.js";
import eventoRoutes from "./routes/eventoRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import inscripcionRoutes from "./routes/inscripcionRoutes.js";
import pagoRoutes from "./routes/pagoRoutes.js";

dotenv.config();

const app = express();

// Middleware globales
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    mensaje: "🎓 API Sistema de Gestión de Eventos USC",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      eventos: "/api/eventos",
      usuarios: "/api/usuarios",
      inscripciones: "/api/inscripciones",
      pagos: "/api/pagos",
      test: "/api/test"
    }
  });
});

// Montar rutas
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/eventos", eventoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/inscripciones", inscripcionRoutes);
app.use("/api/pagos", pagoRoutes);

// Manejo de rutas no encontradas
app.use(notFound);

// Manejador de errores
app.use(errorHandler);

// Iniciar servidor
const iniciarServidor = async () => {
  try {
    console.log("🔄 Iniciando servidor...");

    // Conectar a MongoDB
    console.log("🔄 Conectando a MongoDB...");
    await conectarMongo();
    console.log("✅ MongoDB conectado correctamente");

    // Conectar a MySQL
    console.log("🔄 Conectando a MySQL...");
    await conectarMySQL();
    console.log("✅ MySQL conectado correctamente");

    // Iniciar servidor
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/`);
      console.log(`⚡ Modo: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

iniciarServidor();

export default app;