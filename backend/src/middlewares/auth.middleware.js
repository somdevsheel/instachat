const verifyAuthToken = require('../utils/verifyAuthToken');
const logger = require('../utils/logger');

exports.protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token', code: 'SESSION_INVALID' });
  }

  try {
    req.user = await verifyAuthToken(auth);
    next();
  } catch (err) {
    if (!err.statusCode) {
      logger.error('Auth middleware error:', err.message);
    }
    const status = err.statusCode || 401;
    return res.status(status).json({
      success: false,
      message: err.statusCode ? err.message : 'Auth failed',
      // Clients log the user out on this code (revoked / expired session,
      // banned, deleted) — unlike other 401s such as a wrong password.
      code: 'SESSION_INVALID',
    });
  }
};
