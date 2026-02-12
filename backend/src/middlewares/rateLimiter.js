// const rateLimit = require('express-rate-limit');

// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 300, 
//   standardHeaders: true, 
//   legacyHeaders: false, 
//   message: { success: false, message: 'Too many requests' }
// });

// const authLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, 
//   max: 10, 
//   message: { success: false, message: 'Too many login attempts' }
// });

// const uploadLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, 
//   max: 20, 
//   message: { success: false, message: 'Upload limit exceeded' }
// });

// module.exports = { apiLimiter, authLimiter, uploadLimiter };




const rateLimit = require('express-rate-limit');

/* ============================
   GLOBAL API LIMITER
   (General traffic)
============================ */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

/* ============================
   AUTH LIMITER
   (Login / OTP / Forgot password)
============================ */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // strict on auth
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.',
  },
});

/* ============================
   UPLOAD LIMITER
   (Media uploads)
============================ */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload limit exceeded. Try again later.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
};
