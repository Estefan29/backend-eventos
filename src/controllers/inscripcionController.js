import conectarMySQL from "../config/db.mysql.js";

// Crear inscripción
export const crearInscripcion = async (req, res) => {
  try {
    const db = await conectarMySQL();
    const { id_usuario, id_evento_mongo, fecha_inscripcion, estado } = req.body;
    const [result] = await db.query(
      "INSERT INTO inscripciones (id_usuario, id_evento_mongo, fecha_inscripcion, estado) VALUES (?, ?, ?, ?)",
      [id_usuario, id_evento_mongo, fecha_inscripcion, estado]
    );

    res.status(201).json({
      id: result.insertId,
      id_usuario,
      id_evento_mongo,
      fecha_inscripcion,
      estado,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear inscripción", error });
  }
};

//  Obtener todas las inscripciones
export const obtenerInscripciones = async (req, res) => {
  try {
    const db = await conectarMySQL();
    const [rows] = await db.query("SELECT * FROM inscripciones");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener inscripciones", error });
  }
};

//  Obtener una inscripción por ID
export const obtenerInscripcionPorId = async (req, res) => {
  try {
    const db = await conectarMySQL();
    const [rows] = await db.query("SELECT * FROM inscripciones WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Inscripción no encontrada" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener inscripción", error });
  }
};

// Actualizar inscripción
export const actualizarInscripcion = async (req, res) => {
  try {
    const db = await conectarMySQL();
    const { usuario_id, evento_id, fecha_inscripcion, estado } = req.body;
    const [result] = await db.query(
      "UPDATE inscripciones SET usuario_id = ?, evento_id = ?, fecha_inscripcion = ?, estado = ? WHERE id = ?",
      [usuario_id, evento_id, fecha_inscripcion, estado, req.params.id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ mensaje: "Inscripción no encontrada" });

    res.json({
      id: req.params.id,
      usuario_id,
      evento_id,
      fecha_inscripcion,
      estado,
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar inscripción", error });
  }
};

//  Eliminar inscripción
export const eliminarInscripcion = async (req, res) => {
  try {
    const db = await conectarMySQL();
    const [result] = await db.query("DELETE FROM inscripciones WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ mensaje: "Inscripción no encontrada" });
    res.json({ mensaje: "Inscripción eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar inscripción", error });
  }
};
