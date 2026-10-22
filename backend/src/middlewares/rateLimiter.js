const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

const limitMessage = (message) => ({ success: false, message });

/**
 * Counters live in Redis in production so limits hold across every
 * server process / instance (the default in-memory store counts per
 * process, so N processes would allow N x the limit).
 *
 *   RATE_LIMIT_STORE=redis|memory   (default: redis in production)
 */
const useRedisStore =
  (process.env.RATE_LIMIT_STORE ||
    (process.env.NODE_ENV === 'production' ? 'redis' : 'memory')) === 'redis';

const storeFor = (name) =>
  useRedisStore
    ? new RedisStore({
        prefix: `rl:${name}:`,
        sendCommand: (command, ...args) => redis.call(command, ...args),
      })
    : undefined; // express-rate-limit's MemoryStore

// Shared options. If Redis is unavailable, let requests through rather
// than failing the whole API (same fail-open policy as other Redis use).
const base = (name) => ({
  store: storeFor(name),
  passOnStoreError: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Key auth limits on IP + target email so users sharing one public IP
// (carrier NAT, offices, campuses) don't lock each other out, while a
// single attacker still can't hammer one account.
const ipAndEmailKey = (req) => {
  const email =
    typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
  // ipKeyGenerator groups IPv6 addresses by subnet, so an attacker
  // can't dodge the limit by rotating through their /64.
  return `${ipKeyGenerator(req.ip)}|${email}`;
};

/* ============================
   GLOBAL API LIMITER
   (General traffic)
============================ */
const apiLimiter = rateLimit({
  ...base('api'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // per IP
  message: limitMessage('Too many requests, please try again later'),
});

/* ============================
   AUTH IP CEILING
   (All auth endpoints, per IP — backstop against spraying many emails)
============================ */
const authLimiter = rateLimit({
  ...base('auth'),
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: limitMessage('Too many attempts. Please try again later.'),
});

/* ============================
   LOGIN
   (Only failed attempts count)
============================ */
const loginLimiter = rateLimit({
  ...base('login'),
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: ipAndEmailKey,
  skipSuccessfulRequests: true,
  message: limitMessage('Too many failed login attempts. Try again in 15 minutes.'),
});

/* ============================
   OTP SEND
   (Register / resend 2FA / forgot password — each one sends an email)
============================ */
const otpSendLimiter = rateLimit({
  ...base('otp-send'),
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: ipAndEmailKey,
  message: limitMessage('Too many codes requested. Please try again later.'),
});

/* ============================
   OTP VERIFY
   (Each issued code also burns after 5 wrong guesses — see utils/otp)
============================ */
const otpVerifyLimiter = rateLimit({
  ...base('otp-verify'),
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: ipAndEmailKey,
  skipSuccessfulRequests: true,
  message: limitMessage('Too many attempts. Please try again later.'),
});

/* ============================
   UPLOAD LIMITER
   (Media uploads)
============================ */
const uploadLimiter = rateLimit({
  ...base('upload'),
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  message: limitMessage('Upload limit exceeded. Try again later.'),
});

/* ============================
   DATA EXPORT
   (Builds a full copy of the user's data — expensive)
============================ */
const exportLimiter = rateLimit({
  ...base('export'),
  windowMs: 60 * 60 * 1000,
  limit: 3,
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req.ip),
  message: limitMessage('You can download your data 3 times per hour. Please try again later.'),
});

module.exports = {
  exportLimiter,
  apiLimiter,
  authLimiter,
  loginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  uploadLimiter,
};
