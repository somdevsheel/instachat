const express = require('express');
const reelController = require('../../controllers/reel.controller');
const { protect } = require('../../middlewares/auth.middleware');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * ======================================================
 * REEL ROUTES
 * ======================================================
 * Base: /api/v1/reels
 */

/* =========================
   PRESIGNED UPLOAD
========================= */
router.post('/presign', protect, reelController.getPresignedUrl);

/* =========================
   FEED & DISCOVERY
========================= */
router.get('/feed', protect, reelController.getReels);

/* =========================
   USER REELS
========================= */
router.get('/user/:userId', protect, reelController.getUserReels);

/* =========================
   SAVED REELS
   (must come before the /:reelId catch-all)
========================= */
router.get('/saved', protect, reelController.getSavedReels);

/* =========================
   CRUD
========================= */
router.post('/', protect, reelController.createReel);
router.get('/:reelId', protect, reelController.getReel);
router.delete('/:reelId', protect, reelController.deleteReel);

/* =========================
   ENGAGEMENT
========================= */
router.put('/:reelId/like', protect, reelController.toggleLike);
router.put('/:reelId/view', protect, reelController.incrementView);
router.put('/:reelId/save', protect, reelController.toggleSaveReel);
router.post('/:reelId/repost', protect, reelController.repostReel);

/* =========================
   COMMENTS
========================= */
router.post('/:reelId/comments', protect, reelController.addComment);
router.get('/:reelId/comments', protect, reelController.getComments);

logger.debug('✅ Reel routes loaded');

module.exports = router;