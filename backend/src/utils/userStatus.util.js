const redis = require('../config/redis');
const { timeAgo } = require('./timeAgo.util');

exports.getUserStatus = async (user) => {
  try {
    const online = await redis.exists(`user:${user._id}:online`);

    if (online === 1) {
      return {
        online: true,
        lastSeen: null
      };
    }

    return {
      online: false,
      lastSeen: user.lastSeen || null
    };
  } catch {
    // Redis down → fallback to MongoDB only
    return {
      online: false,
      lastSeen: user.lastSeen || null
    };
  }
};

exports.getUserStatus = async (user) => {
  try {
    const online = await redis.exists(`user:${user._id}:online`);

    if (online === 1) {
      return {
        online: true,
        lastSeen: null
      };
    }

    return {
      online: false,
      lastSeen: user.lastSeen ? timeAgo(user.lastSeen) : null
    };
  } catch {
    // Redis down → MongoDB fallback
    return {
      online: false,
      lastSeen: user.lastSeen ? timeAgo(user.lastSeen) : null
    };
  }
};
