/**
 * ======================================================
 * ENV VAR VALIDATION
 * ======================================================
 * Runs once at boot, before anything else touches these vars.
 * Without this, a missing MONGO_URI/JWT_SECRET in production
 * doesn't fail until the first request that needs it — a confusing
 * runtime error instead of an obvious startup failure.
 */
const REQUIRED = ['MONGO_URI', 'JWT_SECRET'];

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
    console.error(
      `💥 Missing required environment variable(s): ${missingRequired.join(', ')}`
    );
    console.error('   Check backend/.env — the server cannot start without these.');
    process.exit(1);
  }

  const missingRecommended = RECOMMENDED.filter((key) => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn(
      `⚠️  Missing environment variable(s): ${missingRecommended.join(', ')} — media uploads will fail until these are set.`
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    !process.env.ALLOWED_ORIGINS
  ) {
    console.warn(
      '⚠️  ALLOWED_ORIGINS is not set in production — CORS will reject every browser request. See backend/.env.'
    );
  }
};

module.exports = validateEnv;
