const express = require('express');
const router = express.Router();

const { protect } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');
const {
  createStory,
  getStoryFeed,
  markStoriesSeen,
} = require('../../controllers/story.controller');

// CREATE STORY
router.post(
  '/',
  protect,
  upload.single('media'),
  createStory
);

// GET STORY FEED
router.get(
  '/feed',
  protect,
  getStoryFeed
);

router.post('/seen', protect, markStoriesSeen);

module.exports = router;
