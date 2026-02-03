const express = require('express');
const router = express.Router();

const { protect } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

const {
  createStory,
  getStoryFeed,
  markStoriesSeen,
  getStoryViewers,
  reactToStory,
  getStoryReactions,
  deleteStory, // ✅ MISSING IMPORT (THIS WAS THE CRASH)
} = require('../../controllers/story.controller');

// CREATE STORY
router.post(
  '/',
  protect,
  upload.single('media'),
  createStory
);

// GET STORY FEED
router.get('/feed', protect, getStoryFeed);

// MARK SEEN
router.post('/seen', protect, markStoriesSeen);

// STORY VIEWERS
router.get('/:id/viewers', protect, getStoryViewers);

// DELETE STORY ✅
router.delete('/:id', protect, deleteStory);

// REACT
router.post('/:id/react', protect, reactToStory);

// GET REACTIONS
router.get('/:id/reactions', protect, getStoryReactions);

module.exports = router;
