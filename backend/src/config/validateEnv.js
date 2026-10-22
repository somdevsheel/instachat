const logger = require('../utils/logger');
/**
 * ======================================================
 * ENV VAR VALIDATION
 * ======================================================
 * Runs once at boot, before anything else touches these vars.
 * Without this, a missing MONGO_URI/JWT_SECRET in production
 * doesn't fail until the first request that needs it — a confusing
 * runtime error instead of an obvious startup failure.
 */
const REQUIRED = ['MONGO_URI', 'POSTGRES_URL', 'JWT_SECRET'];

// Needed for real feature coverage (media uploads, CDN URLs) but the
// server can still boot and serve non-media routes without them — so
// these only warn, they don't block startup.
const RECOMMENDED = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
  'AWS_REGION',
];

const validateEnv = () => {
  const missingRequired = REQUIRED.filter((key) => !process.env[key]);

  if (missingRequired.length > 0) {
    logger.error(
      `💥 Missing required environment variable(s): ${missingRequired.join(', ')}`
    );
    logger.error('   Check backend/.env — the server cannot start without these.');
    process.exit(1);
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET.length < 32
  ) {
    logger.error(
      '💥 JWT_SECRET is too short for production (min 32 chars). Generate one with: openssl rand -hex 48'
    );
    process.exit(1);
  }

  const missingRecommended = RECOMMENDED.filter((key) => !process.env[key]);
  if (missingRecommended.length > 0) {
    logger.warn(
      `⚠️  Missing environment variable(s): ${missingRecommended.join(', ')} — media uploads will fail until these are set.`
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.ALLOWED_ORIGINS
  ) {
    logger.warn(
      '⚠️  ALLOWED_ORIGINS is not set in production — CORS will reject every browser request. See backend/.env.'
    );
  }
};

module.exports = validateEnv;
