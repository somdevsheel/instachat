const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof Error)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new Error(message);
    error.statusCode = statusCode;
  }
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  console.error(`🔴 Error: ${err.stack}`);

  if (err.name === 'CastError') { error.statusCode = 404; error.message = 'Invalid ID'; }
  if (err.code === 11000) { error.statusCode = 400; error.message = 'Duplicate field value'; }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { errorConverter, errorHandler };