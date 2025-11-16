import conectarMySQL from "../config/db.mysql.js";

export const InscripcionModel = {
  // Obtener todas las inscripciones
  async obtenerTodas() {
    const connection = await conectarMySQL();
    const [rows] = await connection.execute("SELECT * FROM inscripciones");
    await connection.end();
    return rows;
  },

  // Obtener una inscripción por ID
  async obtenerPorId(id) {
    const connection = await conectarMySQL();
    const [rows] = await connection.execute("SELECT * FROM inscripciones WHERE id = ?", [id]);
    await connection.end();
    return rows[0];
  },

  // Crear inscripción
  async crear(datos) {
    const { id_usuario_mongo, id_evento_mongo, fecha_inscripcion, estado } = datos;
    const connection = await conectarMySQL();
    const [result] = await connection.execute(
      "INSERT INTO inscripciones (id_usuario_mongo, id_evento_mongo, fecha_inscripcion, estado) VALUES (?, ?, ?, ?)",
      [id_usuario_mongo, id_evento_mongo, fecha_inscripcion, estado]
    );
    await connection.end();
    return { id: result.insertId, ...datos };
  },

  // Actualizar inscripción
  async actualizar(id, datos) {
    const { id_usuario_mongo, id_evento_mongo, fecha_inscripcion, estado } = datos;
    const connection = await conectarMySQL();
    await connection.execute(
      "UPDATE inscripciones SET id_usuario_mongo=?, id_evento_mongo=?, fecha_inscripcion=?, estado=? WHERE id=?",
      [id_usuario_mongo, id_evento_mongo, fecha_inscripcion, estado, id]
    );
    await connection.end();
    return { id, ...datos };
  },

  // Eliminar inscripción
  async eliminar(id) {
    const connection = await conectarMySQL();
    await connection.execute("DELETE FROM inscripciones WHERE id = ?", [id]);
    await connection.end();
    return { message: "✅ Inscripción eliminada correctamente" };
  },
};
