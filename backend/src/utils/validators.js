const { body, validationResult } = require('express-validator');

/**
 * 1. Validation Rules for Authentication
 */
exports.authValidationRules = () => {
  return [
    // Validate Email
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(), // Converts 'User@GMAIL.com' to 'user@gmail.com'

    // Validate Password
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),

    // Validate Username (only for registration)
    body('username')
      .if(body('username').exists())
      .not()
      .isEmpty()
      .trim()
      .escape() // HTML sanitize to prevent XSS
      .withMessage('Username is required')
  ];
};

/**
 * 2. Validation Rules for Creating Posts
 */
exports.postValidationRules = () => {
  return [
    body('caption')
      .optional()
      .trim()
      .isLength({ max: 2200 })
      .withMessage('Caption cannot exceed 2200 characters')
  ];
};

/**
 * 3. The Actual Validator Middleware
 * This checks the results of the rules above.
 * If errors exist, it stops the request and sends a 400 error.
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }

  // Extract error messages into a clean array
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: extractedErrors
  });
};