/**
 * ======================================================
 * REDIS CONFIGURATION
 * ======================================================
 * Configured entirely from env — no manual editing per environment.
 *
 *   REDIS_URL        full connection string (takes precedence),
 *                    e.g. redis://:password@host:6379/0 or rediss://...
 *   REDIS_HOST       default 127.0.0.1
 *   REDIS_PORT       default 6379
 *   REDIS_PASSWORD   optional
 *
 * Redis is used for presence + rate limiting only, and every caller
 * fails open, so a Redis outage degrades features but never crashes
 * the API.
 */
const Redis = require('ioredis');
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

const baseOptions = {
  lazyConnect: true,
  enableReadyCheck: true,
  maxRetriesPerRequest: isProduction ? 3 : 1,
  // Production: keep reconnecting with backoff. Dev: give up quickly so a
  // missing local Redis doesn't spam the console.
  retryStrategy: isProduction
    ? (times) => Math.min(times * 200, 5000)
    : (times) => (times > 3 ? null : 500),
};

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, baseOptions)
  : new Redis({
      ...baseOptions,
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    });

let lastErrorLoggedAt = 0;
redis.on('error', (err) => {
  // Throttle: ioredis emits on every failed reconnect attempt.
  if (Date.now() - lastErrorLoggedAt > 30000) {
    lastErrorLoggedAt = Date.now();
    logger.error('🔴 Redis error:', err.message);
  }
});

redis.on('ready', () => {
  logger.info('🟢 Redis connected');
});

redis.connect().catch(() => {
  // Logged by the 'error' handler; app keeps running without Redis.
});

module.exports = redis;
