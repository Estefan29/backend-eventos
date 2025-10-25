import conectarMySQL from "../config/db.mysql.js";

// Crear un nuevo pago
export const crearPago = async (req, res) => {
  const { id_inscripcion, monto, metodo_pago, estado, fecha_pago } = req.body;

  try {
    const connection = await conectarMySQL();
    const [result] = await connection.query(
      "INSERT INTO pagos (id_inscripcion, monto, metodo_pago, estado, fecha_pago) VALUES (?, ?, ?, ?, ?)",
      [id_inscripcion, monto, metodo_pago, estado, fecha_pago]
    );

    res.status(201).json({
      mensaje: " Pago registrado correctamente",
      id_pago: result.insertId,
    });
  } catch (error) {
    console.error("Error al crear pago:", error);
    res.status(500).json({ mensaje: "Error al crear el pago", error: error.message });
  }
};

// Obtener todos los pagos
export const obtenerPagos = async (req, res) => {
  try {
    const connection = await conectarMySQL();
    const [rows] = await connection.query("SELECT * FROM pagos");
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ mensaje: "Error al obtener pagos", error: error.message });
  }
};

// Obtener pago por ID
export const obtenerPagoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await conectarMySQL();
    const [rows] = await connection.query("SELECT * FROM pagos WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error al obtener pago:", error);
    res.status(500).json({ mensaje: "Error al obtener pago", error: error.message });
  }
};

// Actualizar pago
export const actualizarPago = async (req, res) => {
  const { id } = req.params;
  const { monto, metodo_pago, estado, fecha_pago } = req.body;

  try {
    const connection = await conectarMySQL();
    const [result] = await connection.query(
      "UPDATE pagos SET monto = ?, metodo_pago = ?, estado = ?, fecha_pago = ? WHERE id = ?",
      [monto, metodo_pago, estado, fecha_pago, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }

    res.status(200).json({ mensaje: "Pago actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar pago:", error);
    res.status(500).json({ mensaje: "Error al actualizar pago", error: error.message });
  }
};

// Eliminar pago
export const eliminarPago = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await conectarMySQL();
    const [result] = await connection.query("DELETE FROM pagos WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Pago no encontrado" });
    }

    res.status(200).json({ mensaje: "Pago eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar pago:", error);
    res.status(500).json({ mensaje: "Error al eliminar pago", error: error.message });
  }
};
