const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const s3Client = require('../config/aws');

/* ======================================================
   ENV VALIDATION
====================================================== */
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

if (!BUCKET_NAME) {
  throw new Error('AWS_BUCKET_NAME is not defined');
}

/* ======================================================
   LIMITS & ALLOWED TYPES
====================================================== */
const IMAGE_MAX_SIZE_MB = 10;
const VIDEO_MAX_SIZE_MB = 100;

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
];

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/mov',
];

/* ======================================================
   VALIDATION
====================================================== */
const validateMedia = (mediaType, mimeType, sizeMB) => {
  if (!['image', 'video'].includes(mediaType)) {
    throw new Error('Invalid media type');
  }

  if (mediaType === 'image') {
    if (!IMAGE_MIME_TYPES.includes(mimeType)) {
      throw new Error('Invalid image format');
    }
    if (sizeMB > IMAGE_MAX_SIZE_MB) {
      throw new Error('Image too large');
    }
  }

  if (mediaType === 'video') {
    if (!VIDEO_MIME_TYPES.includes(mimeType)) {
      throw new Error('Invalid video format');
    }
    if (sizeMB > VIDEO_MAX_SIZE_MB) {
      throw new Error('Video too large');
    }
  }
};

/* ======================================================
   PRESIGNED UPLOAD URL
====================================================== */
exports.getPresignedUploadUrl = async ({
  userId,
  mediaType,
  mimeType,
  fileSizeMB,
}) => {
  validateMedia(mediaType, mimeType, fileSizeMB);

  const extension = mimeType.split('/')[1] || 'bin';

  const folder =
    mediaType === 'image'
      ? `users/${userId}/posts/images`
      : `users/${userId}/posts/videos`;

  const key = `${folder}/${Date.now()}-${crypto
    .randomBytes(6)
    .toString('hex')}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: mimeType,

    CacheControl:
      mediaType === 'video'
        ? 'public, max-age=86400'
        : 'public, max-age=31536000, immutable',

    Metadata: {
      uploadedBy: userId,
      mediaType,
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 600, // 10 minutes
  });

  return {
    uploadUrl,
    key,
    expiresIn: 600,
  };
};

/* ======================================================
   DELETE FILE (OPTIONAL / CLEANUP)
====================================================== */
exports.deleteFile = async fileKey => {
  if (!fileKey) return;

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
    console.log(`🗑️ S3 deleted: ${fileKey}`);
  } catch (err) {
    console.error('❌ S3 delete failed:', err.message);
  }
};
