import mysql from "mysql2/promise";

const conectarMySQL = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });
    console.log("🟠 Conectado a MySQL correctamente");
    return connection;
  } catch (error) {
    console.error("❌ Error al conectar a MySQL:", error.message);
    process.exit(1);
  }
};

export default conectarMySQL;
