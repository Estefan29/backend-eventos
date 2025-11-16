// src/controllers/pagoController.js
import { PagoModel } from "../models/pago.model.js";

export const obtenerPagos = async (req, res) => {
  try {
    const pagos = await PagoModel.obtenerTodos();
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los pagos", error });
  }
};

export const obtenerPagoPorId = async (req, res) => {
  try {
    const pago = await PagoModel.obtenerPorId(req.params.id);
    if (!pago) return res.status(404).json({ message: "No encontrado" });
    res.json(pago);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el pago", error });
  }
};

export const crearPago = async (req, res) => {
  try {
    const nuevo = await PagoModel.crear(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ message: "Error al crear el pago", error });
  }
};

export const actualizarPago = async (req, res) => {
  try {
    const actualizado = await PagoModel.actualizar(req.params.id, req.body);
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el pago", error });
  }
};

export const eliminarPago = async (req, res) => {
  try {
    const eliminado = await PagoModel.eliminar(req.params.id);
    res.json(eliminado);
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar el pago", error });
  }
};
