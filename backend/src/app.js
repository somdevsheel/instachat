const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Routes
const routes = require('./routes');

// Middlewares
const { apiLimiter } = require('./middlewares/rateLimiter');
const {
  errorConverter,
  errorHandler,
} = require('./middlewares/error.middleware');

// Redis
const redis = require('./config/redis');

const app = express();

/* ============================
   BASIC HEALTH CHECK
============================ */
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy and running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/* ============================
   REDIS HEALTH & MEMORY CHECK
   (LOW RAM SAFE)
============================ */
app.get('/api/v1/health/redis', async (req, res) => {
  try {
    const info = await redis.info('memory');

    const usedMemory =
      info.match(/used_memory_human:(.+)/)?.[1] || 'unknown';
    const maxMemory =
      info.match(/maxmemory_human:(.+)/)?.[1] || 'unlimited';

    res.status(200).json({
      success: true,
      redis: 'ok',
      usedMemory,
      maxMemory,
    });
  } catch (err) {
    // Redis down should NOT crash app
    res.status(200).json({
      success: false,
      redis: 'down',
    });
  }
});

/* ============================
   GLOBAL MIDDLEWARE
============================ */
app.use(helmet());

app.use(
  cors({
    origin: '*',
    // methods: ['GET', 'POST', 'PUT', 'DELETE'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/* ============================
   GLOBAL RATE LIMITING (REST)
============================ */
app.use('/api', apiLimiter);

/* ============================
   STATIC FILES (OPTIONAL)
============================ */
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads'))
);

/* ============================
   API ROUTES
============================ */
app.use('/api/v1', routes);

/* ============================
   ROOT
============================ */
app.get('/', (req, res) => {
  res.status(200).send('InstaChat API v1 is running... 🚀');
});

/* ============================
   ERROR HANDLING (LAST)
============================ */

// 404 handler
app.use((req, res, next) => {
  const error = new Error('Route Not Found');
  error.statusCode = 404;
  next(error);
});

// Convert to AppError
app.use(errorConverter);

// Final error response
app.use(errorHandler);

app.use('/api/debug', require('./routes/debug.routes'));


module.exports = app;
