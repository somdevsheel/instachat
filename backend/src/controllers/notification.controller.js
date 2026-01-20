const notificationService = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');

/**
 * Get user notifications
 */
exports.getNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const notifications = await notificationService.getUserNotifications(
    userId,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    results: notifications.length,
    data: notifications,
  });
});

/**
 * Mark notification as read
 */
exports.markAsRead = catchAsync(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const notification = await notificationService.markAsRead(
    notificationId,
    userId
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
});

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;

  await notificationService.markAllAsRead(userId);

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

/**
 * Delete notification
 */
exports.deleteNotification = catchAsync(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const notification = await notificationService.deleteNotification(
    notificationId,
    userId
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted',
  });
});