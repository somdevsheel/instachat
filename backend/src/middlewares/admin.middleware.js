const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * ======================================================
 * ADMIN AUTH MIDDLEWARE
 * ======================================================
 * - Verifies JWT token
 * - Checks user has admin or superadmin role
 * - Attaches user to request
 */

exports.adminProtect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - No token provided',
      });
    }

    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check admin role
    if (!user.role || !['admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Admin privileges required',
      });
    }

    // Check if admin is banned/suspended
    if (user.isBanned || user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been restricted',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Admin auth error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
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
