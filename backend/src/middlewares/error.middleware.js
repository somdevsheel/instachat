const logger = require('../utils/logger');
const isProduction = process.env.NODE_ENV === 'production';

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

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message;

  if (err.name === 'CastError') { statusCode = 404; message = 'Invalid ID'; }
  if (err.code === 11000) { statusCode = 400; message = 'Duplicate field value'; }
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {}).map((e) => e.message).join(', ') || 'Validation failed';
  }
  if (err.type === 'entity.too.large') { statusCode = 413; message = 'Request body too large'; }
  if (err.type === 'entity.parse.failed') { statusCode = 400; message = 'Malformed JSON body'; }
  if (err.code === 'LIMIT_FILE_SIZE') { statusCode = 413; message = 'File too large'; }
  if (err.message && err.message.startsWith('Origin ') && err.message.endsWith('not allowed by CORS')) {
    statusCode = 403;
  }

  if (statusCode >= 500) {
    logger.error('Unhandled request error', err, {
      requestId: req.id,
      method: req.method,
      path: req.baseUrl + req.path,
      userId: req.user?._id?.toString(),
    });

    // Don't leak internal error details (DB messages, paths) to clients.
    if (isProduction) message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    success: false,
    message: message || 'Server Error',
    requestId: req.id,
    // App-level error codes (e.g. PRIVATE_ACCOUNT) for client handling.
    ...(typeof err.code === 'string' && statusCode < 500 ? { code: err.code } : {}),
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = { errorConverter, errorHandler };
