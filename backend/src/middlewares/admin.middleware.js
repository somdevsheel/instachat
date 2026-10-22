const verifyAuthToken = require('../utils/verifyAuthToken');

/**
 * ======================================================
 * ADMIN AUTH MIDDLEWARE
 * ======================================================
 * - Verifies JWT token (same rules as regular auth)
 * - Checks user has admin or superadmin role
 * - Attaches user to request
 */

exports.adminProtect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized - No token provided',
    });
  }

  let user;
  try {
    user = await verifyAuthToken(auth);
  } catch (err) {
    return res.status(err.statusCode || 401).json({
      success: false,
      message: err.statusCode === 403
        ? 'Your account has been restricted'
        : 'Authentication failed',
    });
  }

  if (!user.role || !['admin', 'superadmin'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Admin privileges required',
    });
  }

  req.user = user;
  next();
};

/**
 * Super Admin only middleware (use after adminProtect)
 */
exports.superAdminOnly = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin privileges required',
    });
  }
  next();
};
