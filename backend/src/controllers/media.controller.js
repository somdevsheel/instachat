const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Client');
const catchAsync = require('../utils/catchAsync');

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
  const { mediaType, mimeType, fileSizeMB } = req.body;
  const userId = req.user.id;

  console.log('📥 Presign request:', {
    mediaType,
    mimeType,
    fileSizeMB,
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
  const randomId = Math.random().toString(36).slice(2);
  const extension = mimeType.split('/')[1] || 'bin';

  // ✅ MATCHES YOUR FEED + POST STRUCTURE
  const key =
    mediaType === 'image'
      ? `users/${userId}/posts/images/${timestamp}-${randomId}.${extension}`
      : `users/${userId}/posts/videos/${timestamp}-${randomId}.${extension}`;

  console.log('🔑 Generated S3 key:', key);

  /* =========================
     PRESIGN URL
  ========================= */
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
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

  console.log('✅ Presigned URL generated');

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
