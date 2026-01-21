const { S3Client } = require('@aws-sdk/client-s3');
require('dotenv').config();

/* ============================
   ENV VALIDATION
============================ */
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_BUCKET_NAME',
];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌ Missing env variable: ${key}`);
    process.exit(1);
  }
}

/* ============================
   CREATE S3 CLIENT
============================ */
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/* ============================
   EXPORT (IMPORTANT)
============================ */
module.exports = s3Client;
