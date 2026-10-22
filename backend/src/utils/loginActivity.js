const User = require('../models/user.model');
const logger = require('./logger');

const MAX_ENTRIES = 10;
const MAX_AGE_DAYS = 90;

/** "Chrome on Windows", "InstaChat app on iOS", ... from a User-Agent. */
const describeDevice = (ua = '') => {
  if (!ua) return 'Unknown device';
  const os = /iPhone|iPad|iOS|Darwin/i.test(ua)
    ? 'iOS'
    : /Android|okhttp/i.test(ua)
      ? 'Android'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS X|Macintosh/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Unknown OS';
  if (/Expo|okhttp|CFNetwork|Darwin/i.test(ua)) return `InstaChat app on ${os}`;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  return `${browser} on ${os}`;
};

/**
 * Record a successful login for the "Login activity" screen. Keeps the
 * last MAX_ENTRIES within MAX_AGE_DAYS (data minimisation: this is a
 * security feature, not a location history). Best-effort.
 */
const recordLogin = async (userId, req) => {
  try {
    const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86400000);
    await User.updateOne({ _id: userId }, { $pull: { loginActivity: { loginAt: { $lt: cutoff } } } });
    await User.updateOne(
      { _id: userId },
      {
        $push: {
          loginActivity: {
            $each: [
              {
                device: describeDevice(req.get('user-agent')),
                ip: req.ip || '',
                location: 'Unknown',
                loginAt: new Date(),
              },
            ],
            $position: 0,
            $slice: MAX_ENTRIES,
          },
        },
      }
    );
  } catch (err) {
    logger.error('Failed to record login activity', err);
  }
};

module.exports = { recordLogin, describeDevice };
