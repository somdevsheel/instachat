const redis = require('../config/redis');
const logger = require('../utils/logger');

const WINDOW_SECONDS = 60 * 15; // 15 minutes
const MAX_ATTEMPTS = 5;

module.exports = async function passwordRateLimiter(req, res, next) {
  try {
    if (!redis || !redis.status || redis.status !== 'ready') {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('⚠️ Password rate limiter skipped (dev)');
        }
      return next(); // ✅ CRITICAL FIX
    }

    const userId = req.user?.id;
    if (!userId) return next();

    const key = `pwd_attempts:${userId}`;

    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    if (attempts > MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many password change attempts. Try later.',
      });
    }

    next();
  } catch (err) {
    logger.warn(
      '⚠️ Password rate limiter error, allowing request:',
      err.message
    );
    next(); // ✅ NEVER BLOCK ON ERROR
  }
};
