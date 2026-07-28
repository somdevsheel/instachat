const Reel = require('../models/Reel'); // Ensure you have src/models/Reel.js
const User = require('../models/user.model');

/**
 * Create a reel
 * @param {Object} reelBody
 */
const createReel = async (reelBody) => {
  const reel = await Reel.create(reelBody);
  return reel;
};

/**
 * Get all reels (for Feed)
 * @param {number} limit
 * @param {number} page
 */
const queryReels = async (limit = 10, page = 1) => {
  const skip = (page - 1) * limit;
  const reels = await Reel.find()
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  return reels;
};

/**
 * Get reel by ID
 * @param {ObjectId} id
 */
const getReelById = async (id) => {
  return Reel.findById(id).populate('user', 'username profilePicture');
};

/**
 * Toggle saving a reel for a user
 * @param {ObjectId} reelId
 * @param {ObjectId} userId
 */
const toggleSaveReel = async (reelId, userId) => {
  const exists = await Reel.exists({ _id: reelId });
  if (!exists) return null;

  const user = await User.findById(userId).select('savedReels');
  const alreadySaved = user.savedReels.some((id) => id.toString() === reelId);

  if (alreadySaved) {
    user.savedReels.pull(reelId);
  } else {
    user.savedReels.push(reelId);
  }
  await user.save();

  return { saved: !alreadySaved };
};

/**
 * Get a user's saved reels
 * @param {ObjectId} userId
 */
const getSavedReels = async (userId) => {
  const user = await User.findById(userId).select('savedReels');
  return Reel.find({ _id: { $in: user.savedReels } })
    .populate('user', 'username name profilePicture')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Repost a reel onto a user's own profile/Reels tab.
 * Unlike post reposts, this does NOT wrap the reel in a new document —
 * it just records the (user, reel) pairing so the reel surfaces in the
 * reposter's Reels tab, while still pointing at the one original reel.
 * @param {ObjectId} reelId
 * @param {ObjectId} userId
 */
const repostReelToProfile = async (reelId, userId) => {
  const reel = await Reel.findById(reelId).select('user');
  if (!reel) return null;

  const user = await User.findById(userId).select('repostedReels');
  const alreadyReposted = user.repostedReels.some(
    (entry) => entry.reel.toString() === reelId
  );

  if (!alreadyReposted) {
    user.repostedReels.push({ reel: reelId });
    await user.save();
    await Reel.findByIdAndUpdate(reelId, { $inc: { shareCount: 1 } });
  }

  return { originalOwnerId: reel.user, alreadyReposted };
};

/**
 * Get a user's Reels tab: their own reels merged with reels they've
 * reposted, sorted by the most relevant activity time for each.
 * @param {ObjectId} targetUserId
 * @param {ObjectId} currentUserId
 */
const getUserReelsWithReposts = async (targetUserId, currentUserId) => {
  const [ownReels, targetUser] = await Promise.all([
    Reel.find({
      user: targetUserId,
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    })
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .lean(),
    User.findById(targetUserId).select('repostedReels').lean(),
  ]);

  const repostEntries = targetUser?.repostedReels || [];
  const repostIds = repostEntries.map((entry) => entry.reel);
  const repostedAtMap = new Map(
    repostEntries.map((entry) => [entry.reel.toString(), entry.repostedAt])
  );

  const repostedReels = repostIds.length
    ? await Reel.find({ _id: { $in: repostIds } })
        .populate('user', 'username profilePicture')
        .lean()
    : [];

  return {
    ownReels: ownReels.map((reel) => ({ ...reel, isRepost: false })),
    repostedReels: repostedReels.map((reel) => ({
      ...reel,
      isRepost: true,
      repostedAt: repostedAtMap.get(reel._id.toString()),
    })),
  };
};

module.exports = {
  createReel,
  queryReels,
  getReelById,
  toggleSaveReel,
  getSavedReels,
  repostReelToProfile,
  getUserReelsWithReposts,
};