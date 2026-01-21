const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: { success: false, message: 'Too many requests' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: { success: false, message: 'Too many login attempts' }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 20, 
  message: { success: false, message: 'Upload limit exceeded' }
});

module.exports = { apiLimiter, authLimiter, uploadLimiter };