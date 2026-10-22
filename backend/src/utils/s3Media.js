const { DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Client');
const logger = require('./logger');

/**
 * ======================================================
 * S3 MEDIA HELPERS
 * ======================================================
 * Turning stored media references into S3 keys and deleting them, so
 * deleted content is actually gone from the bucket/CDN (not just from
 * the database).
 */

const CDN_BASE_URL = () =>
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// Stored media URLs -> S3 keys. Accepts the CDN form and the raw
// bucket form (older records were saved with the S3 URL before the CDN
// existed — see scripts/fixMediaDomain.js). Anything else is ignored.
const urlToKey = (url) => {
  if (typeof url !== 'string' || !url) return null;
  const bases = [
    CDN_BASE_URL(),
    `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
    `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com`,
  ].map((b) => `${b.replace(/\/+$/, '')}/`);
  const base = bases.find((b) => url.startsWith(b));
  return base ? decodeURIComponent(url.slice(base.length).split('?')[0]) : null;
};

/**
 * Keys the media Lambdas derive from an upload (lambdas/*Processor.js).
 * They aren't all stored in the DB, so compute them from the original:
 *   users/U/posts/images/F.ext -> users/U/posts/images/{thumbnail,medium}/F.webp
 *   users/U/posts/videos/F.ext -> users/U/posts/videos/thumbnails/F.jpg
 */
const derivedKeys = (key) => {
  if (typeof key !== 'string') return [];
  const m = key.match(/^(users\/[^/]+\/posts\/(images|videos))\/([^/]+)\.[^./]+$/);
  if (!m) return [];
  const [, dir, kind, name] = m;
  return kind === 'images'
    ? [`${dir}/thumbnail/${name}.webp`, `${dir}/medium/${name}.webp`]
    : [`${dir}/thumbnails/${name}.jpg`];
};

const collectMediaKeys = (media) => {
  if (!media) return [];
  const keys = [media.originalKey, media.key, urlToKey(media.url)];
  Object.values(media.variants || {}).forEach((v) => keys.push(urlToKey(v)));
  return keys.concat(keys.flatMap(derivedKeys));
};

/** Delete keys in batches of 1000. Best-effort: failures are logged. */
const deleteS3Keys = async (keys) => {
  const unique = [...new Set(keys.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 1000) {
    const batch = unique.slice(i, i + 1000);
    try {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
        })
      );
    } catch (err) {
      // The DB delete already succeeded; leftover objects are logged for
      // manual cleanup rather than failing the request.
      logger.error('S3 media cleanup failed', err, { keys: batch.length });
    }
  }
  return unique.length;
};

module.exports = { urlToKey, derivedKeys, collectMediaKeys, deleteS3Keys };
