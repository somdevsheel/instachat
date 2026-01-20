const Message = require('../models/message.model');

/**
 * Send a message
 * @param {ObjectId} senderId
 * @param {ObjectId} receiverId
 * @param {String} content
 */
const sendMessage = async (senderId, receiverId, content) => {
  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content,
  });
  return message;
};

/**
 * Get chat history between two users
 * @param {ObjectId} userId1
 * @param {ObjectId} userId2
 */
const getChatHistory = async (userId1, userId2) => {
  return Message.find({
    $or: [
      { sender: userId1, receiver: userId2 },
      { sender: userId2, receiver: userId1 },
    ],
  })
    .sort({ createdAt: 1 }) // Oldest first
    .populate('sender', 'username profilePicture')
    .populate('receiver', 'username profilePicture');
};

/**
 * Get recent chats list (Simplified version)
 * @param {ObjectId} currentUserId
 */
const getRecentChats = async (currentUserId) => {
  // Find all messages involving this user
  const messages = await Message.find({
    $or: [{ sender: currentUserId }, { receiver: currentUserId }],
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'username profilePicture')
    .populate('receiver', 'username profilePicture');

  return messages;
};

module.exports = {
  sendMessage,
  getChatHistory,
  getRecentChats,
};