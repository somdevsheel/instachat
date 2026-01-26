const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/notification.controller');
const { protect } = require('../../middlewares/auth.middleware');

console.log('🔔 Notification routes file loaded'); // ✅ Add this

// GET /api/v1/notifications
router.get('/', protect, notificationController.getNotifications);

// GET /api/v1/notifications/unread-count
router.get('/unread-count', protect, notificationController.getUnreadCount);

// PUT /api/v1/notifications/:notificationId/read
router.put('/:notificationId/read', protect, notificationController.markAsRead);

// PUT /api/v1/notifications/read/all
router.put('/read/all', protect, notificationController.markAllAsRead);

// DELETE /api/v1/notifications/:notificationId
router.delete('/:notificationId', protect, notificationController.deleteNotification);

console.log('🔔 Notification routes registered'); // ✅ Add this

module.exports = router;