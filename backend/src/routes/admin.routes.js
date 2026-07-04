const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { adminProtect, superAdminOnly } = require('../middlewares/admin.middleware');

/**
 * ======================================================
 * ADMIN ROUTES
 * All routes require admin authentication
 * Mount at: /api/v1/admin
 * ======================================================
 */

// All admin routes require authentication
router.use(adminProtect);

/* =========================
   DASHBOARD
========================= */
router.get('/dashboard', adminController.getDashboardStats);

/* =========================
   USER MANAGEMENT
========================= */
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserDetail);
router.put('/users/:userId/ban', adminController.banUser);
router.put('/users/:userId/unban', adminController.unbanUser);
router.put('/users/:userId/suspend', adminController.suspendUser);
router.delete('/users/:userId', superAdminOnly, adminController.deleteUser);

/* =========================
   POST MANAGEMENT
========================= */
router.get('/posts', adminController.getPosts);
router.delete('/posts/:postId', adminController.deletePost);

/* =========================
   REEL MANAGEMENT
========================= */
router.get('/reels', adminController.getReels);
router.delete('/reels/:reelId', adminController.deleteReel);

/* =========================
   STORY MANAGEMENT
========================= */
router.get('/stories', adminController.getStories);
router.delete('/stories/:storyId', adminController.deleteStory);

/* =========================
   COMMENT MANAGEMENT
========================= */
router.get('/comments', adminController.getComments);
router.delete('/comments/:commentId', adminController.deleteComment);

/* =========================
   REPORT MANAGEMENT
========================= */
router.get('/reports', adminController.getReports);
router.get('/reports/:reportId', adminController.getReportDetail);
router.put('/reports/:reportId/action', adminController.takeReportAction);

module.exports = router;
