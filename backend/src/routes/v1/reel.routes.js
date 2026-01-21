const express = require('express');
const reelController = require('../../controllers/reel.controller');
const { protect } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

const router = express.Router();

// GET /api/v1/reels/feed
router.get('/feed', protect, reelController.getReels);

// POST /api/v1/reels (create reel)
// FIELD NAME: video
router.post(
  '/',
  protect,
  upload.single('video'),
  reelController.createReel
);

// GET /api/v1/reels/:reelId
router.get('/:reelId', protect, reelController.getReel);

module.exports = router;
