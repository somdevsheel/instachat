const ChatKey = require('../models/chatKey.model');
const Chat = require('../models/chat.model');

/**
 * Initialize chat encryption
 * Called when first message is sent in a chat
 */
const initializeChatKey = async (chatId, encryptedKeys) => {
  // Check if already initialized
  const existing = await ChatKey.findOne({ chat: chatId });
  if (existing) {
    return existing;
  }

  // Create new chat key document
  const chatKey = await ChatKey.create({
    chat: chatId,
    encryptedKeys,
    version: 1,
  });

  return chatKey;
};

/**
 * Get encrypted CEK for a user in a chat
 */
const getChatKeyForUser = async (chatId, userId) => {
  const chatKey = await ChatKey.findOne({ chat: chatId });

  if (!chatKey) {
    return null;
  }

  // Return encrypted key for this user
  return chatKey.encryptedKeys.get(userId.toString());
};

/**
 * Get all chat keys for a user (for login sync)
 */
const getAllChatKeysForUser = async (userId) => {
  // Find all chats where user is participant
  const chats = await Chat.find({
    participants: userId,
  }).select('_id');

  const chatIds = chats.map((c) => c._id);

  // Get all chat keys
  const chatKeys = await ChatKey.find({
    chat: { $in: chatIds },
  });

  // Format response
  const keys = chatKeys
    .map((ck) => {
      const encryptedKey = ck.encryptedKeys.get(userId.toString());
      if (!encryptedKey) return null;

      return {
        chatId: ck.chat.toString(),
        encryptedKey,
        version: ck.version,
      };
    })
    .filter(Boolean);

  return keys;
};

/**
 * Add encrypted key for new participant (group chats)
 */
const addParticipantKey = async (chatId, userId, encryptedKey) => {
  const chatKey = await ChatKey.findOne({ chat: chatId });

  if (!chatKey) {
    throw new Error('Chat key not found');
  }

  chatKey.encryptedKeys.set(userId.toString(), encryptedKey);
  await chatKey.save();

  return chatKey;
};

module.exports = {
  initializeChatKey,
  getChatKeyForUser,
  getAllChatKeysForUser,
  addParticipantKey,
};