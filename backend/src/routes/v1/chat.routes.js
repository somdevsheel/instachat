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

// 3️⃣ Send message (E2EE)
router.post('/message', chatController.sendMessage);

// 4️⃣ ✅ MARK MESSAGES AS READ
router.post('/:chatId/read', chatController.markMessagesRead);

// 5️⃣ Delete message (me / everyone)
router.post(
  '/message/:messageId/delete',
  chatController.deleteMessage
);

// 6️⃣ Chat history
router.get('/:chatId', chatController.getChatHistory);

module.exports = router;
