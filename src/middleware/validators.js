import { body, param, validationResult } from 'express-validator';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      mensaje: 'Error de validación',
      errores: errors.array().map(err => ({
        campo: err.path,
        mensaje: err.msg
      }))
    });
  }
  next();
};

// Validaciones para autenticación
export const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
  
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('Formato de correo inválido')
    .normalizeEmail(),
  
  body('contraseña')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  
  body('rol')
    .optional()
    .isIn(['admin', 'estudiante', 'profesor', 'administrativo', 'externo'])
    .withMessage('Rol no válido'),
  
  handleValidationErrors
];

export const validarLogin = [
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('Formato de correo inválido'),
  
  body('contraseña')
    .notEmpty().withMessage('La contraseña es obligatoria'),
  
  handleValidationErrors
];

// Validaciones para eventos
export const validarEvento = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ min: 5, max: 100 }).withMessage('El título debe tener entre 5 y 100 caracteres'),
  
  body('descripcion')
    .trim()
    .notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ min: 20 }).withMessage('La descripción debe tener al menos 20 caracteres'),
  
  body('fecha')
    .notEmpty().withMessage('La fecha es obligatoria')
    .isISO8601().withMessage('Formato de fecha inválido')
    .custom((value) => {
      const fechaEvento = new Date(value);
      const hoy = new Date();
      if (fechaEvento < hoy) {
        throw new Error('La fecha del evento debe ser futura');
      }
      return true;
    }),
  
  body('lugar')
    .trim()
    .notEmpty().withMessage('El lugar es obligatorio'),
  
  body('capacidad')
    .optional()
    .isInt({ min: 1 }).withMessage('La capacidad debe ser mayor a 0'),
  
  body('precio')
    .notEmpty().withMessage('El precio es obligatorio')
    .isNumeric().withMessage('El precio debe ser numérico')
    .custom((value) => value >= 0)
    .withMessage('El precio no puede ser negativo'),
  
  handleValidationErrors
];

// Validaciones para inscripciones
export const validarInscripcion = [
  body('id_usuario')
    .trim()
    .notEmpty().withMessage('El ID de usuario es obligatorio'),
  
  body('id_evento_mongo')
    .trim()
    .notEmpty().withMessage('El ID del evento es obligatorio')
    .isMongoId().withMessage('ID de evento inválido'),
  
  body('estado')
    .optional()
    .isIn(['pendiente', 'confirmada', 'cancelada'])
    .withMessage('Estado no válido'),
  
  handleValidationErrors
];

// Validaciones para pagos
export const validarPago = [
  body('id_inscripcion')
    .notEmpty().withMessage('El ID de inscripción es obligatorio')
    .isInt().withMessage('ID de inscripción inválido'),
  
  body('monto')
    .notEmpty().withMessage('El monto es obligatorio')
    .isDecimal({ decimal_digits: '0,2' }).withMessage('Formato de monto inválido')
    .custom((value) => parseFloat(value) > 0)
    .withMessage('El monto debe ser mayor a 0'),
  
  body('metodo_pago')
    .notEmpty().withMessage('El método de pago es obligatorio')
    .isIn(['tarjeta', 'efectivo', 'transferencia', 'pse'])
    .withMessage('Método de pago no válido'),
  
  body('estado')
    .optional()
    .isIn(['pendiente', 'completado', 'fallido', 'reembolsado'])
    .withMessage('Estado no válido'),
  
  handleValidationErrors
];

// Validación de MongoDB ObjectId
export const validarMongoId = [
  param('id')
    .isMongoId().withMessage('ID inválido'),
  handleValidationErrors
];

// Validación de MySQL ID
export const validarMySQLId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido'),
  handleValidationErrors
];