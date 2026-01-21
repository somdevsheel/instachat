const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Log the full error stack trace
    winston.format.json() // Store logs in JSON format
  ),
  transports: [
    // 1. Write all logs with level 'error' and below to `error.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    
    // 2. Write all logs to `combined.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log') 
    })
  ]
});

// If we're not in production then log to the `console` with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple() // Simple format: "info: Server started"
    )
  }));
}

module.exports = logger;