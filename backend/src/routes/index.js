const express = require('express');
const router = express.Router();

/**
 * ======================================================
 * AUTH (UNVERSIONED)
 * ======================================================
 * Public routes like login, register, me
 */
const authRoutes = require('./auth.routes');

/**
 * ======================================================
 * VERSIONED API ROUTES (/api/v1)
 * ======================================================
 */
const userRoutes = require('./v1/user.routes');
const chatRoutes = require('./v1/chat.routes');
const feedRoutes = require('./v1/feed.routes');
const mediaRoutes = require('./v1/media.routes');
const keyRoutes = require('./v1/key.routes');
const storyRoutes = require('./v1/story.routes');
const reelRoutes = require('./v1/reel.routes');

/* =========================
   ROUTE MOUNTING
========================= */

// Auth (no versioning by design)
router.use('/auth', authRoutes);

// v1 feature routes
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/feed', feedRoutes);
router.use('/media', mediaRoutes);
router.use('/keys', keyRoutes);
router.use('/stories', storyRoutes);
router.use('/reels', reelRoutes);

module.exports = router;
