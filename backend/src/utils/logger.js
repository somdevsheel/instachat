const winston = require('winston');

/**
 * ======================================================
 * LOGGER
 * ======================================================
 * - production: one JSON object per line (CloudWatch / Datadog / Loki
 *   can parse and filter on fields)
 * - development: colourised, human readable
 * - test: errors only
 *
 *   LOG_LEVEL   error | warn | info | http | debug   (default: info in
 *               production, debug in development)
 *
 * Use logger.debug for noisy diagnostics (hidden in production by
 * default), logger.info for notable events, logger.error for failures.
 */
const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

const level =
  process.env.LOG_LEVEL ||
  (env === 'test' ? 'error' : isProduction ? 'info' : 'debug');

// winston's printf drops extra args; fold `logger.error('msg', err)` and
// `logger.info('msg', { a: 1 })` style calls into structured fields.
const splatToMeta = winston.format((info) => {
  const splat = info[Symbol.for('splat')] || [];
  splat.forEach((arg, i) => {
    if (arg instanceof Error) {
      info.error = { name: arg.name, message: arg.message, stack: arg.stack };
    } else if (arg && typeof arg === 'object') {
      Object.assign(info, arg);
    } else if (arg !== undefined) {
      info[`arg${i}`] = arg;
    }
  });
  // winston itself appends an Error's message to `message` and copies
  // its stack to the top level; keep just the structured `error` field.
  if (info.error) {
    delete info.stack;
    const suffix = ` ${info.error.message}`;
    if (typeof info.message === 'string' && info.message.endsWith(suffix)) {
      info.message = info.message.slice(0, -suffix.length);
    }
  }
  return info;
});

const logger = winston.createLogger({
  level,
  format: isProduction
    ? winston.format.combine(
        splatToMeta(),
        winston.format.timestamp(),
        winston.format.json()
      )
    : winston.format.combine(
        splatToMeta(),
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level: lvl, message, error, ...meta }) => {
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          const stack = error?.stack ? `\n${error.stack}` : '';
          return `${timestamp} ${lvl} ${message}${extra}${stack}`;
        })
      ),
  transports: [new winston.transports.Console()],
});

// Every logger.error(..., err) also goes to error reporting (Sentry, if
// configured), with any object args as context (requestId, userId...).
// This covers controllers that catch their own errors and return 500.
const baseError = logger.error.bind(logger);
logger.error = (message, ...args) => {
  const err = args.find((a) => a instanceof Error);
  if (err) {
    const context = Object.assign(
      {},
      ...args.filter((a) => a && typeof a === 'object' && !(a instanceof Error))
    );
    require('./errorReporter').capture(err, context);
  }
  return baseError(message, ...args);
};

module.exports = logger;
