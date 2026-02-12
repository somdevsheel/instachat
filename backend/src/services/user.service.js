const User = require('../models/user.model'); // Assuming you have a standard index.js in models
// OR if you don't have an index.js in models, use:
// const User = require('../models/user.model');
const httpStatus = require('http-status');


/**
 * Get user by username
 */
const getUserByUsername = async (username) => {
  return User.findOne({ username });
};



/**
 * Update user by ID
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Search users
 */
const searchUsers = async (queryText) => {
  const regex = new RegExp(queryText, 'i'); // Case-insensitive search
  return User.find({
    $or: [{ username: regex }, { email: regex }]
  }).select('username profilePicture bio'); // Only return these fields
};

/**
 * Follow a user
 */
const followUser = async (currentUserId, targetUserId) => {
  if (currentUserId === targetUserId) {
    throw new Error('You cannot follow yourself');
  }

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) {
    throw new Error('User not found');
  }

  // Add to following/followers if not already there
  if (!currentUser.following.includes(targetUserId)) {
    currentUser.following.push(targetUserId);
    await currentUser.save();
  }

  if (!targetUser.followers.includes(currentUserId)) {
    targetUser.followers.push(currentUserId);
    await targetUser.save();
  }
};

/**
 * Unfollow a user
 */
const unfollowUser = async (currentUserId, targetUserId) => {
  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser) {
    throw new Error('User not found');
  }

  currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
  await currentUser.save();

  targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
  await targetUser.save();
};

module.exports = {
  getUserByUsername,
  updateUserById,
  searchUsers,
  followUser,
  unfollowUser,
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new Error('Email already taken');
  }
  return User.create(userBody);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

module.exports = {
  getUserByUsername,
  updateUserById,
  searchUsers,
  followUser,
  unfollowUser,
  createUser,
  getUserByEmail,
  getUserById,
};