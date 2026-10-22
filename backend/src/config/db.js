const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Database Configuration Strategy
 * -----------------------------
 * 1. strictQuery: Set to false to handle Mongoose 7+ strict mode changes.
 * 2. Pool Size: Limits concurrent connections to prevent overloading the database.
 * 3. Error Handling: Exits the process on failure so tools like PM2 or Docker can restart it.
 */

const connectDB = async () => {
  try {
    // 1. Validation: Ensure the URI exists before attempting connection
    if (!process.env.MONGO_URI) {
      logger.error('❌ FATAL: MONGO_URI is missing in .env file');
      process.exit(1);
    }

    // 2. Mongoose Settings
    mongoose.set('strictQuery', false); // Prepare for future Mongoose versions

    const options = {
      maxPoolSize: 10,       // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Fail after 5s if DB is unreachable
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4              // Use IPv4, skip trying IPv6
    };

    // 3. Establish Connection
    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    logger.error(`❌ Database Connection Error: ${error.message}`);
    // Exit with failure code (1) to trigger restart in Docker/PM2
    process.exit(1);
  }
};

// --- Connection Event Listeners (For Monitoring) ---

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB Disconnected. Waiting for reconnection...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('✅ MongoDB Reconnected.');
});

mongoose.connection.on('error', (err) => {
  logger.error(`❌ MongoDB Runtime Error: ${err.message}`);
});

module.exports = connectDB;