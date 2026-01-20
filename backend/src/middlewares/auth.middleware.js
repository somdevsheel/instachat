const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Middleware to protect routes
 * Verifies JWT token and attaches user to req object
 */
exports.protect = async (req, res, next) => {
  let token;

  // 1. Check if Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract token from header ('Bearer <token>')
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find User associated with token
      // We exclude the password for safety
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User belonging to this token no longer exists' 
        });
      }

      // 5. Proceed to the next middleware/controller
      next();
      
    } catch (error) {
      console.error(`Auth Error: ${error.message}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token provided' 
    });
  }
};

/**
 * (Optional) Middleware to grant access to specific roles
 * Usage: router.delete('/user/:id', protect, authorize('admin'), deleteUser);
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) { // Assumes User model has a 'role' field
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};