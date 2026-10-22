const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const logger = require('./utils/logger');
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

// Databases (readiness check)
const mongoose = require('mongoose');
const { query: pgQuery } = require('./config/postgres');

// CORS policy
const { corsOriginValidator } = require('./config/cors');

const app = express();

/* ✅ REQUIRED FOR NGINX / LOAD BALANCER */
app.set('trust proxy', 1);

/* ============================
   REQUEST ID + ACCESS LOG
   Every request gets an id (reused from an upstream X-Request-Id, e.g.
   set by nginx/ALB, or generated). It is returned in the response
   header and attached to every log line / error report for that
   request, so a user-reported failure can be traced end to end.
============================ */
app.use((req, res, next) => {
  const incoming = req.headers['x-request-id'];
  req.id =
    typeof incoming === 'string' && /^[\w-]{1,100}$/.test(incoming)
      ? incoming
      : crypto.randomUUID();
  res.set('X-Request-Id', req.id);

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    // Path only — query strings can carry search terms / tokens.
    logger.info('request', {
      requestId: req.id,
      method: req.method,
      path: req.baseUrl + req.path,
      status: res.statusCode,
      durationMs: Math.round(Number(process.hrtime.bigint() - start) / 1e6),
      userId: req.user?._id?.toString(),
      ip: req.ip,
    });
  });
  next();
});

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
   READINESS (both databases reachable)
   Point load balancer / uptime checks here.
============================ */
app.get('/api/v1/health/ready', async (req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  let postgresOk = false;
  try {
    await pgQuery('SELECT 1');
    postgresOk = true;
  } catch {}

  const ok = mongoOk && postgresOk;
  res.status(ok ? 200 : 503).json({
    success: ok,
    mongo: mongoOk ? 'ok' : 'down',
    postgres: postgresOk ? 'ok' : 'down',
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
    origin: corsOriginValidator,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Media goes straight to S3 via presigned URLs, so JSON bodies are small.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Strip `$`-prefixed / dotted keys from user input so values like
// { "email": { "$ne": null } } can't turn into Mongo query operators.
const stripMongoOperators = (value) => {
  if (Array.isArray(value)) return value.map(stripMongoOperators);
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        value[key] = stripMongoOperators(value[key]);
      }
    }
  }
  return value;
};

app.use((req, res, next) => {
  stripMongoOperators(req.body);
  stripMongoOperators(req.params);
  // req.query is a getter in newer Express; mutate in place.
  stripMongoOperators(req.query);
  next();
});


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

module.exports = app;
