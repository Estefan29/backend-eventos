import conectarMySQL from "../config/db.mysql.js";

export const PagoModel = {
  async obtenerTodos() {
    const [rows] = await pool.query(`
      SELECT p.*, i.id_usuario_mongo, i.id_evento_mongo
      FROM pagos p
      JOIN inscripciones i ON p.id_inscripcion = i.id
    `);
    return rows;
  },

  async obtenerPorId(id) {
    const [rows] = await pool.query("SELECT * FROM pagos WHERE id = ?", [id]);
    return rows[0];
  },

  async crear(datos) {
    const { id_inscripcion, monto, metodo_pago, estado, fecha_pago } = datos;
    const [result] = await pool.query(
      "INSERT INTO pagos (id_inscripcion, monto, metodo_pago, estado, fecha_pago) VALUES (?, ?, ?, ?, ?)",
      [id_inscripcion, monto, metodo_pago, estado, fecha_pago]
    );
    return { id: result.insertId, ...datos };
  },

  async actualizar(id, datos) {
    const { monto, metodo_pago, estado, fecha_pago } = datos;
    await pool.query(
      "UPDATE pagos SET monto=?, metodo_pago=?, estado=?, fecha_pago=? WHERE id=?",
      [monto, metodo_pago, estado, fecha_pago, id]
    );
    return { id, ...datos };
  },

  async eliminar(id) {
    await pool.query("DELETE FROM pagos WHERE id = ?", [id]);
    return { message: "Pago eliminado correctamente" };
  },
};
