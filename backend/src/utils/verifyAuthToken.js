const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { isRevoked } = require('./authTokens');

/**
 * ======================================================
 * VERIFY AUTH TOKEN
 * ======================================================
 * Shared by REST auth, admin auth and the Socket.IO handshake so
 * every entry point enforces the same rules:
 * - valid signature / not expired
 * - user still exists
 * - token was issued after the last password change
 * - account is not banned or actively suspended
 *
 * Throws an Error with `statusCode` on failure, returns the user.
 */
const authError = (message, statusCode = 401) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const verifyAuthToken = async (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') {
    throw authError('No token');
  }

  const token = rawToken.startsWith('Bearer ')
    ? rawToken.slice(7).trim()
    : rawToken.trim();

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw authError('Invalid or expired token');
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw authError('User no longer exists');
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    throw authError('Password changed recently. Please log in again.');
  }

  // "Log out everywhere" bumped the version after this token was issued.
  if ((decoded.tv || 0) !== (user.tokenVersion || 0)) {
    throw authError('Session expired. Please log in again.');
  }

  // This specific session was logged out.
  if (await isRevoked(decoded)) {
    throw authError('Session expired. Please log in again.');
  }

  if (user.isBanned) {
    throw authError('Your account has been banned', 403);
  }

  if (user.isSuspended) {
    const stillSuspended =
      !user.suspendedUntil || user.suspendedUntil > new Date();
    if (stillSuspended) {
      throw authError('Your account is suspended', 403);
    }
  }

  // Callers that need the token's claims (e.g. logout) read this.
  user.$locals.token = decoded;
  return user;
};

module.exports = verifyAuthToken;
