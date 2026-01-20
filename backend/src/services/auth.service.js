const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Register user
 */
const register = async ({ name, username, email, password }) => {
  // Check if user exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    name,
    username,
    email,
    password: hashedPassword,
  });

  // Generate token
  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
    },
    token,
  };
};

/**
 * Login user
 */
const login = async (email, password) => {
  // Find user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Generate token
  const token = generateToken(user._id);

  return {
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
    },
    token,
  };
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Refresh token (optional)
 */
const refreshToken = async (oldToken) => {
  // Verify old token
  const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);

  // Generate new token
  const token = generateToken(decoded.id);

  return { token };
};

/**
 * Forgot password (optional)
 */
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  // Generate reset token
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  // TODO: Send email with reset link
  console.log('Reset token:', resetToken);

  return resetToken;
};

/**
 * Reset password (optional)
 */
const resetPassword = async (token, newPassword) => {
  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user
  await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });
};

module.exports = {
  register,
  login,
  generateToken,
  refreshToken,
  forgotPassword,
  resetPassword,
};