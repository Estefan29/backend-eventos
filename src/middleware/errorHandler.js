export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      status: 'error',
      mensaje: 'Error de validación',
      errores: errors
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      status: 'error',
      mensaje: `El ${field} ya está registrado`
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      mensaje: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      mensaje: 'Token expirado'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      mensaje: 'ID inválido'
    });
  }

  res.status(err.statusCode).json({
    status: err.status,
    mensaje: err.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    status: 'error',
    mensaje: `Ruta no encontrada: ${req.originalUrl}`
  });
};