const express = require('express');
const router = express.Router();

const notificationController = require('../../controllers/notification.controller');
const { protect } = require('../../middlewares/auth.middleware');

// GET /api/v1/notifications
router.get('/', protect, notificationController.getNotifications);

// PUT /api/v1/notifications/:notificationId/read
router.put('/:notificationId/read', protect, notificationController.markAsRead);

// PUT /api/v1/notifications/read/all
router.put('/read/all', protect, notificationController.markAllAsRead);

// DELETE /api/v1/notifications/:notificationId
router.delete('/:notificationId', protect, notificationController.deleteNotification);

module.exports = router;
