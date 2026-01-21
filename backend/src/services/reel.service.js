const Reel = require('../models/Reel'); // Ensure you have src/models/Reel.js

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

module.exports = {
  createReel,
  queryReels,
  getReelById,
};