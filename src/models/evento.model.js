import mongoose from "mongoose";

const eventoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  fecha: { type: Date, required: true },
  lugar: { type: String, required: true },
  organizador: { type: String, required: true },
  precio: { type: Number, required: true },
});

const Evento = mongoose.model("Evento", eventoSchema);

export default Evento;
