const { HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Client');
const logger = require('./logger');

/**
 * ======================================================
 * VERIFY UPLOADED MEDIA
 * ======================================================
 * Presigned PUT URLs can't enforce a size limit — the client's
 * `fileSizeMB` is only a claim. So before a client-supplied S3 key is
 * attached to a post/story/reel/message/avatar/listing we check the
 * real object:
 * - key was issued to this user (all presigned keys are
 *   `users/<userId>/...`), so nobody can attach someone else's upload
 * - object actually exists
 * - real size is within the limit (oversized objects are deleted)
 *
 * Throws an Error with `statusCode` on failure.
 */
const MAX_BYTES = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

const uploadError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

// Test-only escape hatch (no S3 in the test environment). Ignored in
// production.
const verificationDisabled = () =>
  process.env.NODE_ENV !== 'production' &&
  process.env.SKIP_UPLOAD_VERIFICATION === 'true';

const verifyUploadedMedia = async (key, userId, mediaType) => {
  if (typeof key !== 'string' || !key) {
    throw uploadError('Media key is required');
  }

  if (!key.startsWith(`users/${userId}/`) || key.includes('..')) {
    throw uploadError('Invalid media key', 403);
  }

  if (verificationDisabled()) return;

  const maxBytes = MAX_BYTES[mediaType] || MAX_BYTES.image;

  let head;
  try {
    head = await s3Client.send(
      new HeadObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key })
    );
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') {
      throw uploadError('Uploaded media not found. Please upload again.');
    }
    logger.error('verifyUploadedMedia S3 error:', err?.message || err);
    throw uploadError('Could not verify upload. Please try again.', 503);
  }

  if (head.ContentLength > maxBytes) {
    s3Client
      .send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }))
      .catch(() => {});
    throw uploadError(
      `${mediaType === 'video' ? 'Video' : 'Image'} must be under ${maxBytes / (1024 * 1024)}MB`,
      413
    );
  }
};

module.exports = { verifyUploadedMedia, MAX_BYTES };
