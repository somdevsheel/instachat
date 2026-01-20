const Notification = require('../models/notification.model');

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ recipient: userId })
    .populate('sender', 'username name profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return notifications;
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true }
  );

  return notification;
};

/**
 * Mark all as read
 */
const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );
};

/**
 * Delete notification
 */
const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  return notification;
};

/**
 * Create notification
 */
const createNotification = async (data) => {
  const notification = await Notification.create(data);
  return notification;
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};