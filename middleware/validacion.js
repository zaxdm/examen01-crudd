const { body, validationResult } = require('express-validator');

// Reglas de validación para crear/actualizar producto
const reglasProducto = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ max: 500 }).withMessage('La descripción no puede superar 500 caracteres'),

  body('precio')
    .notEmpty().withMessage('El precio es obligatorio')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0'),

  body('stock')
    .notEmpty().withMessage('El stock es obligatorio')
    .isInt({ min: 0 }).withMessage('El stock debe ser un entero mayor o igual a 0'),

  body('categoria')
    .notEmpty().withMessage('La categoría es obligatoria')
    .isIn(['Electrónica', 'Ropa', 'Alimentos', 'Hogar', 'Deportes', 'Juguetes', 'Libros', 'Otros'])
    .withMessage('La categoría no es válida'),
];

// Middleware que evalúa los errores de validación
const manejarErroresValidacion = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(422).json({
      success: false,
      mensaje: 'Datos inválidos',
      errores: errores.array().map((e) => ({ campo: e.path, mensaje: e.msg })),
    });
  }
  next();
};

module.exports = { reglasProducto, manejarErroresValidacion };