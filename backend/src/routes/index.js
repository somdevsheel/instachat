const express = require('express');
const router = express.Router();

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
const noteRoutes = require('./v1/note.routes');

/**
 * ======================================================
 * ADMIN ROUTES
 * ======================================================
 */
const adminRoutes = require('./admin.routes');
const reportRoutes = require('./report.routes');

/**
 * ======================================================
 * COMMUNITY (GROUPS / EVENTS / MARKETPLACE)
 * ======================================================
 */
const groupRoutes = require('./v1/group.routes');
const eventRoutes = require('./v1/event.routes');
const marketplaceRoutes = require('./v1/marketplace.routes');

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
router.use('/notes', noteRoutes);
router.use('/groups', groupRoutes);
router.use('/events', eventRoutes);
router.use('/marketplace', marketplaceRoutes);

/* =========================
   ADMIN & REPORTS
========================= */
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

module.exports = router;