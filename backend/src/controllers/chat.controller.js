// const catchAsync = require('../utils/catchAsync');
// const Chat = require('../models/chat.model');
// const Message = require('../models/message.model');
// const User = require('../models/user.model');
// const { getIO } = require('../services/socket.service');

// /**
//  * ======================================================
//  * GET OR CREATE CHAT (1-1)
//  * GET /api/v1/chats/with/:userId
//  * ======================================================
//  */
// exports.getOrCreateChat = catchAsync(async (req, res) => {
//   const { userId } = req.params;
//   const currentUserId = req.user.id;

//   if (currentUserId === userId) {
//     return res.status(400).json({
//       success: false,
//       message: 'Cannot chat with yourself',
//     });
//   }

//   const receiverExists = await User.exists({ _id: userId });
//   if (!receiverExists) {
//     return res.status(404).json({
//       success: false,
//       message: 'User not found',
//     });
//   }

//   let chat = await Chat.findOne({
//     isGroup: false,
//     participants: {
//       $size: 2,
//       $all: [currentUserId, userId],
//     },
//   })
//     .populate('participants', 'username profilePicture')
//     .populate({
//       path: 'lastMessage',
//       populate: { path: 'sender receiver', select: 'username profilePicture' },
//     });

//   if (!chat) {
//     chat = await Chat.create({
//       isGroup: false,
//       participants: [currentUserId, userId],
//     });

//     chat = await Chat.findById(chat._id)
//       .populate('participants', 'username profilePicture')
//       .populate({
//         path: 'lastMessage',
//         populate: { path: 'sender receiver', select: 'username profilePicture' },
//       });
//   }

//   res.status(200).json({
//     success: true,
//     data: chat,
//   });
// });

// /**
//  * ======================================================
//  * SEND MESSAGE (🔐 E2EE)
//  * POST /api/v1/chats/message
//  * ======================================================
//  */
// exports.sendMessage = catchAsync(async (req, res) => {
//   const { chatId, receiverId, cipherText, nonce } = req.body;
//   const senderId = req.user.id;

//   console.log('📥 Received message request:', {
//     chatId,
//     senderId,
//     receiverId,
//     hasCipherText: !!cipherText,
//     hasNonce: !!nonce,
//   });

//   // ✅ Validate required fields
//   if (!chatId || !receiverId || !cipherText || !nonce) {
//     return res.status(400).json({
//       success: false,
//       message: 'Missing required fields: chatId, receiverId, cipherText, nonce',
//     });
//   }

//   // ✅ Verify chat exists
//   const chat = await Chat.findById(chatId).populate(
//     'participants',
//     '_id username profilePicture'
//   );

//   if (!chat) {
//     return res.status(404).json({
//       success: false,
//       message: 'Chat not found',
//     });
//   }

//   // ✅ Verify receiver is in chat
//   const receiver = chat.participants.find(
//     u => u._id.toString() === receiverId
//   );

//   if (!receiver) {
//     return res.status(400).json({
//       success: false,
//       message: 'Receiver not in this chat',
//     });
//   }

//   // ✅ Save encrypted message
//   let message = await Message.create({
//     chat: chatId,
//     sender: senderId,
//     receiver: receiverId,
//     cipherText,
//     nonce,
//     type: 'text',
//   });

//   message = await message.populate(
//     'sender receiver',
//     'username profilePicture'
//   );

//   // ✅ Update chat's last message
//   chat.lastMessage = message._id;
//   await chat.save();

//   console.log('✅ Message saved:', message._id);

//   // ✅ Real-time emit via socket
//   try {
//     const io = getIO();
//     io.to(receiverId.toString()).emit('message_received', message);
//     console.log('📡 Socket emitted to:', receiverId);
//   } catch (socketError) {
//     console.warn('⚠️ Socket emit failed:', socketError.message);
//   }

//   res.status(201).json({
//     success: true,
//     data: message,
//   });
// });

// /**
//  * ======================================================
//  * GET CHAT HISTORY
//  * GET /api/v1/chats/:chatId
//  * ======================================================
//  */
// exports.getChatHistory = catchAsync(async (req, res) => {
//   const { chatId } = req.params;

//   const messages = await Message.find({ chat: chatId })
//     .populate('sender receiver', 'username profilePicture')
//     .sort({ createdAt: 1 });

//   res.status(200).json({
//     success: true,
//     results: messages.length,
//     data: messages,
//   });
// });

// /**
//  * ======================================================
//  * GET RECENT CHATS (INBOX)
//  * GET /api/v1/chats
//  * ======================================================
//  */
// exports.getRecentChats = catchAsync(async (req, res) => {
//   const userId = req.user.id;

//   const chats = await Chat.find({
//     participants: userId,
//   })
//     .populate('participants', 'username profilePicture')
//     .populate({
//       path: 'lastMessage',
//       populate: {
//         path: 'sender receiver',
//         select: 'username profilePicture',
//       },
//     })
//     .sort({ updatedAt: -1 });

//   // Deduplicate same-user 1-1 chats
//   const uniqueChats = [];
//   const seenUsers = new Set();

//   for (const chat of chats) {
//     if (chat.isGroup) {
//       uniqueChats.push(chat);
//       continue;
//     }

//     const otherUser = chat.participants.find(
//       u => u._id.toString() !== userId
//     );

//     if (!otherUser) continue;

//     if (!seenUsers.has(otherUser._id.toString())) {
//       seenUsers.add(otherUser._id.toString());
//       uniqueChats.push(chat);
//     }
//   }

//   res.status(200).json({
//     success: true,
//     results: uniqueChats.length,
//     data: uniqueChats,
//   });
// });




const catchAsync = require('../utils/catchAsync');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const { getIO } = require('../services/socket.service');

/**
 * ======================================================
 * GET OR CREATE CHAT (1-1)
 * GET /api/v1/chats/with/:userId
 * ======================================================
 */
exports.getOrCreateChat = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  if (currentUserId === userId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot chat with yourself',
    });
  }

  const receiverExists = await User.exists({ _id: userId });
  if (!receiverExists) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  let chat = await Chat.findOne({
    isGroup: false,
    participants: { $size: 2, $all: [currentUserId, userId] },
  })
    .populate('participants', 'username profilePicture')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender receiver', select: 'username profilePicture' },
    });

  if (!chat) {
    chat = await Chat.create({
      isGroup: false,
      participants: [currentUserId, userId],
    });

    chat = await Chat.findById(chat._id)
      .populate('participants', 'username profilePicture')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender receiver', select: 'username profilePicture' },
      });
  }

  res.status(200).json({
    success: true,
    data: chat,
  });
});

/**
 * ======================================================
 * SEND MESSAGE (🔐 MULTI-DEVICE E2EE)
 * POST /api/v1/chats/message
 * ======================================================
 */
 exports.sendMessage = catchAsync(async (req, res) => {
  const { chatId, receiverId, encryptedPayloads } = req.body;
  const senderId = req.user.id;

  if (
    !chatId ||
    !receiverId ||
    !Array.isArray(encryptedPayloads) ||
    encryptedPayloads.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Missing encrypted payloads',
    });
  }

  const chat = await Chat.findById(chatId).populate(
    'participants',
    '_id username profilePicture'
  );

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found',
    });
  }

  const receiver = chat.participants.find(
    u => u._id.toString() === receiverId
  );

  if (!receiver) {
    return res.status(400).json({
      success: false,
      message: 'Receiver not in this chat',
    });
  }

  // ✅ Save ONE message containing ALL device payloads
  let message = await Message.create({
    chat: chatId,
    sender: senderId,
    receiver: receiverId,
    encryptedPayloads, // 🔐 multi-device
    type: 'text',
    readBy: [{ user: senderId }],
  });

  message = await message.populate(
    'sender receiver',
    'username profilePicture'
  );

  chat.lastMessage = message._id;
  await chat.save();

  const io = getIO();
  io.to(receiverId.toString()).emit('message_received', message);

  return res.status(201).json({
    success: true,
    data: message,
  });
});







/// Mark as read
exports.markMessagesRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const readerId = req.user.id;

    const messages = await Message.find({
      chat: chatId,
      sender: { $ne: readerId },
      'readBy.user': { $ne: readerId },
    });

    if (!messages.length) {
      return res.status(200).json({ success: true });
    }

    await Message.updateMany(
      {
        _id: { $in: messages.map(m => m._id) },
      },
      {
        $push: {
          readBy: { user: readerId },
        },
      }
    );

    const io = getIO();

    // 🔔 Notify EACH sender that messages were read
    messages.forEach(msg => {
      io.to(msg.sender.toString()).emit('messages_read', {
        chatId,
        readerId,
      });
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ success: false });
  }
};





/**
 * ======================================================
 * DELETE MESSAGE
 * POST /api/v1/chats/message/:messageId/delete
 * body: { mode: 'me' | 'everyone' }
 * ======================================================
 */
exports.deleteMessage = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const { mode } = req.body; // 'me' | 'everyone'
  const userId = req.user.id;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }

  /* =========================
     DELETE FOR EVERYONE
  ========================= */
  if (mode === 'everyone') {
    // Only sender can delete for everyone
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed',
      });
    }

    message.deletedForEveryone = true;
    message.deletedAt = new Date();
    await message.save();

    // 🔔 Notify other user
    const io = getIO();
    io.to(message.receiver.toString()).emit(
      'message_deleted',
      {
        messageId: message._id,
        chatId: message.chat,
        mode: 'everyone',
      }
    );

    return res.status(200).json({
      success: true,
      mode: 'everyone',
    });
  }

  /* =========================
     DELETE FOR ME
  ========================= */
  if (mode === 'me') {
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    return res.status(200).json({
      success: true,
      mode: 'me',
    });
  }

  return res.status(400).json({
    success: false,
    message: 'Invalid delete mode',
  });
});

/**
 * ======================================================
 * GET CHAT HISTORY
 * (RESPECT DELETE RULES)
 * ======================================================
 */
exports.getChatHistory = catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  const messages = await Message.find({
    chat: chatId,
    deletedForEveryone: false,
    deletedFor: { $ne: userId },
  })
    .populate('sender receiver', 'username profilePicture')
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    results: messages.length,
    data: messages,
  });
});

/**
 * ======================================================
 * GET RECENT CHATS (INBOX)
 * ======================================================
 */
exports.getRecentChats = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const chats = await Chat.find({
    participants: userId,
  })
    .populate('participants', 'username profilePicture')
    .populate({
      path: 'lastMessage',
      match: {
        deletedForEveryone: false,
        deletedFor: { $ne: userId },
      },
      populate: {
        path: 'sender receiver',
        select: 'username profilePicture',
      },
    })
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    data: chats,
  });
});
