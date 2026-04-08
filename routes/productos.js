const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const { reglasProducto, manejarErroresValidacion } = require('../middleware/validacion');

// Utilidad para verificar si un ID es válido
const esIdValido = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── POST /productos ─── Crear producto
router.post('/', reglasProducto, manejarErroresValidacion, async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria } = req.body;
    const producto = new Producto({ nombre, descripcion, precio, stock, categoria });
    const guardado = await producto.save();

    res.status(201).json({
      success: true,
      mensaje: 'Producto creado exitosamente',
      data: guardado,
    });
  } catch (error) {
    // Error de validación de Mongoose
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((e) => ({
        campo: e.path,
        mensaje: e.message,
      }));
      return res.status(422).json({ success: false, mensaje: 'Error de validación', errores: mensajes });
    }
    res.status(500).json({ success: false, mensaje: 'Error interno del servidor', error: error.message });
  }
});

// ─── GET /productos ─── Listar todos los productos
router.get('/', async (req, res) => {
  try {
    const { categoria, orden } = req.query;
    let filtro = {};
    if (categoria) filtro.categoria = categoria;

    const ordenamiento = orden === 'precio_asc'
      ? { precio: 1 }
      : orden === 'precio_desc'
      ? { precio: -1 }
      : { createdAt: -1 };

    const productos = await Producto.find(filtro).sort(ordenamiento);

    res.json({
      success: true,
      total: productos.length,
      data: productos,
    });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error al obtener productos', error: error.message });
  }
});

// ─── GET /productos/:id ─── Ver un producto
router.get('/:id', async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ success: false, mensaje: 'ID no válido' });
  }
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });
    }
    res.json({ success: true, data: producto });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error al obtener el producto', error: error.message });
  }
});

// ─── PUT /productos/:id ─── Actualizar producto
router.put('/:id', reglasProducto, manejarErroresValidacion, async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ success: false, mensaje: 'ID no válido' });
  }
  try {
    const { nombre, descripcion, precio, stock, categoria } = req.body;
    const actualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion, precio, stock, categoria },
      { returnDocument: 'after', runValidators: true }
    );
    if (!actualizado) {
      return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });
    }
    res.json({ success: true, mensaje: 'Producto actualizado exitosamente', data: actualizado });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((e) => ({ campo: e.path, mensaje: e.message }));
      return res.status(422).json({ success: false, mensaje: 'Error de validación', errores: mensajes });
    }
    res.status(500).json({ success: false, mensaje: 'Error al actualizar el producto', error: error.message });
  }
});

// ─── DELETE /productos/:id ─── Eliminar producto
router.delete('/:id', async (req, res) => {
  if (!esIdValido(req.params.id)) {
    return res.status(400).json({ success: false, mensaje: 'ID no válido' });
  }
  try {
    const eliminado = await Producto.findByIdAndDelete(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });
    }
    res.json({ success: true, mensaje: 'Producto eliminado exitosamente', data: eliminado });
  } catch (error) {
    res.status(500).json({ success: false, mensaje: 'Error al eliminar el producto', error: error.message });
  }
});

module.exports = router;