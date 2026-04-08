require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const productosRouter = require('./routes/productos');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Archivos estáticos (frontend) ──
app.use(express.static(path.join(__dirname, 'public')));

// ── Rutas de la API ──
app.use('/productos', productosRouter);

// ── Ruta raíz → sirve el frontend ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Ruta no encontrada ──
app.use((req, res) => {
  res.status(404).json({ success: false, mensaje: 'Ruta no encontrada' });
});

// ── Manejador de errores global ──
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).json({ success: false, mensaje: 'Error interno del servidor' });
});

// ── Conexión a MongoDB ──
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB:', process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  });