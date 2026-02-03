const express = require('express');
const chatController = require('../../controllers/chat.controller');
const { protect } = require('../../middlewares/auth.middleware');

const router = express.Router();

// 🔒 Protect all chat routes
router.use(protect);

/**
 * ============================
 * ORDER MATTERS
 * ============================
 */

// 1️⃣ Get or create 1-1 chat
router.get('/with/:userId', chatController.getOrCreateChat);

// 2️⃣ Inbox (recent chats)
router.get('/', chatController.getRecentChats);

// 3️⃣ ✅ GET UNREAD MESSAGE COUNT
router.get('/unread-count', chatController.getUnreadCount);

// 4️⃣ Send message
router.post('/message', chatController.sendMessage);

// 5️⃣ Mark messages as read
router.post('/:chatId/read', chatController.markMessagesRead);

// 6️⃣ Delete message (me / everyone)
router.post(
  '/message/:messageId/delete',
  chatController.deleteMessage
);

// 7️⃣ Chat history
router.get('/:chatId', chatController.getChatHistory);

module.exports = router;