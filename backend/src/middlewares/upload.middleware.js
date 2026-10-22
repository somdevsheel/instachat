const crypto = require('crypto');
const multer = require('multer');
const multerS3 = require('multer-s3');

// ✅ S3 client (default export)
const s3Client = require('../config/aws');

if (!s3Client) {
  throw new Error('❌ S3 client not initialized');
}

const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/x-matroska': '.mkv',
};

/* ======================================================
   FILE FILTER (STRICT + SAFE)
====================================================== */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',

    // Videos
    'video/mp4',
    'video/quicktime', // .mov
    'video/x-matroska', // .mkv
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Invalid file type: ${file.mimetype}`),
      false
    );
  }
};

/* ======================================================
   MULTER + S3 STORAGE
====================================================== */
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,

    // Let AWS infer correct Content-Type
    contentType: multerS3.AUTO_CONTENT_TYPE,

    // Cache headers (important for CDN performance)
    cacheControl: (req, file, cb) => {
      if (file.mimetype.startsWith('video')) {
        cb(null, 'public, max-age=86400'); // 1 day
      } else {
        cb(null, 'public, max-age=31536000, immutable'); // 1 year
      }
    },

    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },

    // ==================================================
    // S3 KEY STRUCTURE (MATCHES YOUR POSTS)
    // users/<userId>/posts/images/...
    // users/<userId>/posts/videos/...
    // ==================================================
    key: (req, file, cb) => {
      const userId = req.user?.id || 'anonymous';

      const baseFolder = file.mimetype.startsWith('video')
        ? 'videos'
        : 'images';

      // Extension from the (allowlisted) MIME type, never from the
      // client-supplied filename — that could be e.g. `.html`.
      const ext = MIME_EXTENSIONS[file.mimetype] || '';
      const filename = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`;

      const key = `users/${userId}/posts/${baseFolder}/${filename}`;

      cb(null, key);
    },
  }),

  fileFilter,

  // Hard limit: 50MB (safe for images + short videos)
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

module.exports = upload;
