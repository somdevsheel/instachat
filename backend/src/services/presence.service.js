const redis = require("../config/redis");

const TTL = 30; // seconds

exports.markOnline = async (userId, socketId) => {
  await redis.set(
    `user:${userId}:online`,
    socketId,
    "EX",
    TTL
  );
};

exports.refreshOnline = async (userId, socketId) => {
  await redis.set(
    `user:${userId}:online`,
    socketId,
    "EX",
    TTL
  );
};

exports.markOffline = async (userId) => {
  await redis.del(`user:${userId}:online`);
};

exports.isOnline = async (userId) => {
  return (await redis.exists(`user:${userId}:online`)) === 1;
};
