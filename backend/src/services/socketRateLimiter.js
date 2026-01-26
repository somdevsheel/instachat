const redis = require('../config/redis');

module.exports = async function allowSocketEvent(
  userId,
  event,
  limit,
  windowSec
) {
  try {
    const key = `socket:${event}:${userId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSec);
    }

    return count <= limit;
  } catch (e) {
    // fail-open: allow event
    return true;
  }
};
