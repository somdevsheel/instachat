const express = require('express');
const router = express.Router();

console.log('🔥 Loading routes...'); // ✅ Add this

/**
 * ======================================================
 * AUTH (UNVERSIONED)
 * ======================================================
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
const storyRoutes = require('./v1/story.routes');
const reelRoutes = require('./v1/reel.routes');
const notificationRoutes = require('./v1/notification.routes');

console.log('✅ All route files loaded'); // ✅ Add this

/* =========================
   ROUTE MOUNTING
========================= */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chats', chatRoutes);
router.use('/feed', feedRoutes);
router.use('/media', mediaRoutes);
router.use('/stories', storyRoutes);
router.use('/reels', reelRoutes);
router.use('/notifications', notificationRoutes);

console.log('✅ All routes mounted'); // ✅ Add this

module.exports = router;