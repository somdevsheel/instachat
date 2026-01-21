const { S3Client } = require('@aws-sdk/client-s3');

/**
 * ======================================================
 * AWS S3 CLIENT (SINGLE SOURCE OF TRUTH)
 * ======================================================
 * - Used for:
 *   • Presigned URL generation
 *   • Media uploads (direct from client)
 *   • Media deletion (cleanup)
 *   • Lambda media processing
 *
 * ❗ Never hardcode credentials here
 * ❗ Always use environment variables or IAM roles
 */

const s3Client = new S3Client({
  region: process.env.AWS_REGION,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // Optional performance tuning
  maxAttempts: 3,
});

module.exports = s3Client;
