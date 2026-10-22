const crypto = require('crypto');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Client');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

/**
 * ======================================================
 * GENERATE PRESIGNED UPLOAD URL
 * POST /api/v1/media/presign
 * ======================================================
 *
 * Body:
 * {
 *   mediaType: 'image' | 'video',
 *   mimeType: 'image/jpeg' | 'video/mp4',
 *   fileSizeMB: number
 * }
 */
exports.getPresignedUploadUrl = catchAsync(async (req, res) => {
  const { mediaType, mimeType, fileSizeMB, context } = req.body;
  const userId = req.user.id;

  logger.debug('📥 Presign request:', {
    mediaType,
    mimeType,
    fileSizeMB,
    context,
    userId,
  });

  /* =========================
     VALIDATION
  ========================= */
  if (!mediaType || !mimeType) {
    return res.status(400).json({
      success: false,
      message: 'mediaType and mimeType are required',
    });
  }

  if (!['image', 'video'].includes(mediaType)) {
    return res.status(400).json({
      success: false,
      message: 'mediaType must be "image" or "video"',
    });
  }

  // Allowlist so nobody can presign text/html, image/svg+xml, etc. and
  // host executable content on our CDN. Maps MIME -> file extension.
  const ALLOWED_MIME = {
    image: {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/heic': 'heic',
      'image/heif': 'heif',
    },
    video: {
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/x-matroska': 'mkv',
      'video/webm': 'webm',
      'video/3gpp': '3gp',
    },
  };

  const normalizedMime = String(mimeType).toLowerCase().trim();
  const extension = ALLOWED_MIME[mediaType][normalizedMime];
  if (!extension) {
    return res.status(400).json({
      success: false,
      message: `Unsupported ${mediaType} type: ${mimeType}`,
    });
  }

  // Hard limits (frontend should also enforce)
  const MAX_IMAGE_MB = 10;
  const MAX_VIDEO_MB = 100;

  if (
    typeof fileSizeMB === 'number' &&
    ((mediaType === 'image' && fileSizeMB > MAX_IMAGE_MB) ||
      (mediaType === 'video' && fileSizeMB > MAX_VIDEO_MB))
  ) {
    return res.status(400).json({
      success: false,
      message:
        mediaType === 'image'
          ? `Image must be under ${MAX_IMAGE_MB}MB`
          : `Video must be under ${MAX_VIDEO_MB}MB`,
    });
  }

  /* =========================
     S3 KEY GENERATION
  ========================= */
  const timestamp = Date.now();
  // Unguessable: media URLs are public on the CDN, so the file name is
  // what protects e.g. a private account's photo from being found.
  const randomId = crypto.randomBytes(16).toString('hex');

  // ✅ MATCHES YOUR FEED + POST STRUCTURE (chat attachments get their own prefix)
  const folder = context === 'chat' ? 'chats' : 'posts';
  const key =
    mediaType === 'image'
      ? `users/${userId}/${folder}/images/${timestamp}-${randomId}.${extension}`
      : `users/${userId}/${folder}/videos/${timestamp}-${randomId}.${extension}`;

  logger.debug('🔑 Generated S3 key:', key);

  /* =========================
     PRESIGN URL
  ========================= */
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    // Must match the Content-Type header the client PUTs with.
    ContentType: mimeType,

    // Cache rules
    CacheControl:
      mediaType === 'video'
        ? 'public, max-age=86400'
        : 'public, max-age=31536000, immutable',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 600, // 10 minutes
  });

  logger.debug('✅ Presigned URL generated');

  /* =========================
     RESPONSE
  ========================= */
  res.status(200).json({
    success: true,
    data: {
      uploadUrl,
      key,
      expiresIn: 600,
    },
  });
});
