const redis = require('../config/redis');
const { timeAgo } = require('./timeAgo.util');

/**
 * Online / last-seen status for `user`, as shown to `viewer`.
 * "Activity status" privacy setting, reciprocal like the app describes:
 * - if `user` turned it off, nobody sees when they're online/last active
 * - if `viewer` turned it off, they don't see anyone else's either
 *
 * Callers must load `lastSeen activityStatusVisible` on the user doc;
 * `viewer` is req.user (a full user doc).
 */
exports.getUserStatus = async (user, viewer = null) => {
  const hidden = { online: false, lastSeen: null };
  if (!user || user.activityStatusVisible === false) return hidden;
  const isSelf = viewer && String(viewer._id) === String(user._id);
  if (viewer && !isSelf && viewer.activityStatusVisible === false) return hidden;

  const lastSeen = user.lastSeen ? timeAgo(user.lastSeen) : null;
  try {
    const online = await redis.exists(`user:${user._id}:online`);
    return online === 1 ? { online: true, lastSeen: null } : { online: false, lastSeen };
  } catch {
    // Redis down → MongoDB fallback
    return { online: false, lastSeen };
  }
};
