const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

/**
 * ======================================================
 * AUTH TOKENS
 * ======================================================
 * - `jti`: unique id per token, so a single session can be revoked
 *   (logout) via a Redis deny-list entry that expires with the token.
 * - `tv`: the user's tokenVersion at issue time; bumping it
 *   ("log out everywhere") invalidates every older token.
 */
const EXPIRES_IN = () => process.env.JWT_EXPIRES_IN || '30d';
const revokedKey = (jti) => `revoked_jwt:${jti}`;

const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), tv: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: EXPIRES_IN(), jwtid: crypto.randomUUID() }
  );

/** Deny-list this token's jti until it would have expired anyway. */
const revokeToken = async (decoded) => {
  if (!decoded?.jti || !decoded?.exp) return false;
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  if (ttl <= 0) return true;
  await redis.set(revokedKey(decoded.jti), '1', 'EX', ttl);
  return true;
};

/**
 * Fails open if Redis is unreachable (same policy as other Redis use):
 * a Redis outage must not log every user out.
 */
const isRevoked = async (decoded) => {
  if (!decoded?.jti) return false;
  try {
    return (await redis.exists(revokedKey(decoded.jti))) === 1;
  } catch {
    return false;
  }
};

module.exports = { signToken, revokeToken, isRevoked };
