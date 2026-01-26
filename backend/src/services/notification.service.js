const Notification = require('../models/notification.model');
const { getIO, getSocketIdByUserId } = require('./socket.service');

/**
 * Create and emit notification
 */
exports.createNotification = async (data) => {
  const { recipient, sender, type, post, message } = data;

  // Don't notify yourself
  if (recipient.toString() === sender.toString()) {
    return null;
  }

  // Create notification
  const notification = await Notification.create({
    recipient,
    sender,
    type,
    post,
    message,
  });

  // Populate sender details
  await notification.populate('sender', 'username profilePicture');
  if (notification.post) {
    await notification.populate('post', 'media');
  }

  // Emit real-time notification via Socket.IO
  const io = getIO();
  const recipientSocketId = getSocketIdByUserId(recipient);

  if (recipientSocketId) {
    io.to(recipientSocketId).emit('notification:new', {
      ...notification.toObject(),
      _id: notification._id.toString(),
    });
  }

  return notification;
};

/**
 * Get user notifications with pagination
 */
exports.getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ recipient: userId })
    .populate('sender', 'username profilePicture')
    .populate('post', 'media')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return notifications;
};

/**
 * Get unread count
 */
exports.getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });

  return count;
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { read: true },
    { new: true }
  ).populate('sender', 'username profilePicture');

  return notification;
};

/**
 * Mark all as read
 */
exports.markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );

  return true;
};

/**
 * Delete notification
 */
exports.deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  return notification;
};