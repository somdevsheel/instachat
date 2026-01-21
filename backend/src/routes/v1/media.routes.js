const express = require('express');
const router = express.Router();

const { protect } = require('../../middlewares/auth.middleware');
const mediaController = require('../../controllers/media.controller');

/**
 * ======================================================
 * MEDIA ROUTES (STABLE VERSION)
 * ======================================================
 * - Presigned uploads only
 * - No multipart
 * - No backend file handling
 */

// Generate presigned upload URL (image + video)
router.post(
  '/presign',
  protect,
  mediaController.getPresignedUploadUrl
);

module.exports = router;
