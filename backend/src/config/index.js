const dotenv = require('dotenv');

// 1. Load Environment Variables
const envFound = dotenv.config();

if (envFound.error) {
  // Only throw error in development; in production, env vars might be set by the OS/Docker
  if (process.env.NODE_ENV !== 'production') {
    throw new Error("⚠️  Couldn't find .env file  ⚠️");
  }
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * 2. Critical Variable Validation
 * We check for JWT_SECRET immediately. If it's missing, the app 
 * is insecure and should not start.
 */
if (!process.env.JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET is missing. Authentication cannot work.");
  process.exit(1);
}

// 3. Export Centralized Config Object
module.exports = {
  /**
   * Your favorite port
   */
  port: parseInt(process.env.PORT, 10) || 5000,

  /**
   * Environment (development, production, test)
   */
  env: process.env.NODE_ENV,

  /**
   * API Configurations
   */
  api: {
    prefix: '/api/v1',
  },

  /**
   * Security / Authentication
   */
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d', // Default to 7 days
  
  /**
   * Logs (Optional: useful for winston/morgan later)
   */
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },
};