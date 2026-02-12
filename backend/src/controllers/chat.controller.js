// const catchAsync = require('../utils/catchAsync');
// const Chat = require('../models/chat.model');
// const Message = require('../models/message.model');
// const User = require('../models/user.model');
// const { getIO } = require('../services/socket.service');
// const { getUserStatus } = require('../utils/userStatus.util');

// /**
//  * ======================================================
//  * GET OR CREATE CHAT (1-1)
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
//     participants: { $size: 2, $all: [currentUserId, userId] },
//   })
//     .populate('participants', 'username profilePicture lastSeen')
//     .populate({
//       path: 'lastMessage',
//       populate: [
//         { path: 'sender receiver', select: 'username profilePicture' },
//         {
//           path: 'story',
//           select: 'media user createdAt',
//           populate: { path: 'user', select: 'username profilePicture' },
//         },
//       ],
//     });

//   if (!chat) {
//     chat = await Chat.create({
//       isGroup: false,
//       participants: [currentUserId, userId],
//       encryptionMode: 'plain',
//     });

//     chat = await Chat.findById(chat._id)
//       .populate('participants', 'username profilePicture lastSeen')
//       .populate({
//         path: 'lastMessage',
//         populate: [
//           { path: 'sender receiver', select: 'username profilePicture' },
//           {
//             path: 'story',
//             select: 'media user createdAt',
//             populate: { path: 'user', select: 'username profilePicture' },
//           },
//         ],
//       });
//   }

//   const participantsWithStatus = await Promise.all(
//     chat.participants.map(async (user) => {
//       const status = await getUserStatus(user);
//       return { ...user.toObject(), ...status };
//     })
//   );

//   res.status(200).json({
//     success: true,
//     data: {
//       ...chat.toObject(),
//       participants: participantsWithStatus,
//     },
//   });
// });

// /**
//  * ======================================================
//  * SEND MESSAGE (NORMAL + STORY REPLY)
//  * ======================================================
//  */
// exports.sendMessage = catchAsync(async (req, res) => {
//   const { chatId, receiverId, text, storyId } = req.body;
//   const senderId = req.user.id;

//   if (!chatId || !receiverId || typeof text !== 'string') {
//     return res.status(400).json({
//       success: false,
//       message: 'chatId, receiverId and text are required',
//     });
//   }

//   const chat = await Chat.findById(chatId).populate(
//     'participants',
//     '_id username profilePicture lastSeen'
//   );

//   if (!chat) {
//     return res.status(404).json({ success: false, message: 'Chat not found' });
//   }

//   const receiver = chat.participants.find(
//     (u) => u._id.toString() === receiverId
//   );

//   if (!receiver) {
//     return res.status(400).json({
//       success: false,
//       message: 'Receiver not in this chat',
//     });
//   }

//   let message = await Message.create({
//     chat: chatId,
//     sender: senderId,
//     receiver: receiverId,
//     text,
//     story: storyId || null,
//     encryptionMode: 'plain',
//     type: 'text',
//     readBy: [{ user: senderId }],
//   });

//   message = await message.populate([
//     { path: 'sender receiver', select: 'username profilePicture' },
//     {
//       path: 'story',
//       select: 'media user createdAt',
//       populate: { path: 'user', select: 'username profilePicture' },
//     },
//   ]);

//   chat.lastMessage = message._id;
//   await chat.save();

//   const io = getIO();
  
//   // Emit message to receiver
//   io.to(receiverId.toString()).emit('message_received', {
//     _id: message._id,
//     chat: chatId,
//     sender: message.sender,
//     receiver: message.receiver,
//     text: message.text,
//     story: message.story,
//     createdAt: message.createdAt,
//   });

//   // ✅ EMIT UNREAD COUNT UPDATE TO RECEIVER
//   const unreadCount = await Message.countDocuments({
//     receiver: receiverId,
//     'readBy.user': { $ne: receiverId },
//   });

//   io.to(receiverId.toString()).emit('unread_count_updated', {
//     count: unreadCount,
//   });

//   return res.status(201).json({
//     success: true,
//     data: message,
//   });
// });

// /**
//  * ======================================================
//  * MARK MESSAGES READ
//  * ======================================================
//  */
// exports.markMessagesRead = catchAsync(async (req, res) => {
//   const { chatId } = req.params;
//   const readerId = req.user.id;

//   const messages = await Message.find({
//     chat: chatId,
//     sender: { $ne: readerId },
//     'readBy.user': { $ne: readerId },
//   });

//   if (!messages.length) {
//     return res.status(200).json({ success: true });
//   }

//   await Message.updateMany(
//     { _id: { $in: messages.map((m) => m._id) } },
//     { $push: { readBy: { user: readerId } } }
//   );

//   const io = getIO();
//   messages.forEach((msg) => {
//     io.to(msg.sender.toString()).emit('messages_read', {
//       chatId,
//       readerId,
//     });
//   });

//   // ✅ EMIT UPDATED UNREAD COUNT TO READER
//   const unreadCount = await Message.countDocuments({
//     receiver: readerId,
//     'readBy.user': { $ne: readerId },
//   });

//   io.to(readerId.toString()).emit('unread_count_updated', {
//     count: unreadCount,
//   });

//   res.status(200).json({ success: true });
// });

// /**
//  * ======================================================
//  * GET UNREAD MESSAGE COUNT
//  * ======================================================
//  */
// exports.getUnreadCount = catchAsync(async (req, res) => {
//   const userId = req.user.id;

//   const count = await Message.countDocuments({
//     receiver: userId,
//     'readBy.user': { $ne: userId },
//   });

//   res.status(200).json({
//     success: true,
//     data: { count },
//   });
// });

// /**
//  * ======================================================
//  * DELETE MESSAGE
//  * ======================================================
//  */
// exports.deleteMessage = catchAsync(async (req, res) => {
//   const { messageId } = req.params;
//   const { mode } = req.body;
//   const userId = req.user.id;

//   const message = await Message.findById(messageId);
//   if (!message) {
//     return res.status(404).json({ success: false, message: 'Message not found' });
//   }

//   if (mode === 'everyone') {
//     if (message.sender.toString() !== userId) {
//       return res.status(403).json({ success: false, message: 'Not allowed' });
//     }

//     message.deletedForEveryone = true;
//     message.deletedAt = new Date();
//     await message.save();

//     const io = getIO();
//     io.to(message.receiver.toString()).emit('message_deleted', {
//       messageId,
//       chatId: message.chat,
//       mode: 'everyone',
//     });

//     return res.status(200).json({ success: true });
//   }

//   if (mode === 'me') {
//     if (!message.deletedFor.includes(userId)) {
//       message.deletedFor.push(userId);
//       await message.save();
//     }
//     return res.status(200).json({ success: true });
//   }

//   res.status(400).json({ success: false, message: 'Invalid delete mode' });
// });

// /**
//  * ======================================================
//  * GET CHAT HISTORY
//  * ======================================================
//  */
// exports.getChatHistory = catchAsync(async (req, res) => {
//   const { chatId } = req.params;
//   const userId = req.user.id;

//   const messages = await Message.find({
//     chat: chatId,
//     deletedForEveryone: false,
//     deletedFor: { $ne: userId },
//   })
//     .populate('sender receiver', 'username profilePicture')
//     .populate({
//       path: 'story',
//       select: 'media user createdAt',
//       populate: { path: 'user', select: 'username profilePicture' },
//     })
//     .sort({ createdAt: 1 });

//   res.status(200).json({
//     success: true,
//     results: messages.length,
//     data: messages,
//   });
// });

// /**
//  * ======================================================
//  * GET RECENT CHATS
//  * ======================================================
//  */
// exports.getRecentChats = catchAsync(async (req, res) => {
//   const userId = req.user.id;

//   const chats = await Chat.find({ participants: userId })
//     .populate('participants', 'username profilePicture lastSeen')
//     .populate({
//       path: 'lastMessage',
//       populate: [
//         { path: 'sender receiver', select: 'username profilePicture' },
//         {
//           path: 'story',
//           select: 'media user createdAt',
//           populate: { path: 'user', select: 'username profilePicture' },
//         },
//       ],
//     })
//     .sort({ updatedAt: -1 });

//   const chatsWithStatus = await Promise.all(
//     chats.map(async (chat) => {
//       const participantsWithStatus = await Promise.all(
//         chat.participants.map(async (user) => {
//           const status = await getUserStatus(user);
//           return { ...user.toObject(), ...status };
//         })
//       );

//       return { ...chat.toObject(), participants: participantsWithStatus };
//     })
//   );

//   res.status(200).json({
//     success: true,
//     data: chatsWithStatus,
//   });
// });







const catchAsync = require('../utils/catchAsync');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const { getIO } = require('../services/socket.service');
const { getUserStatus } = require('../utils/userStatus.util');

/**
 * ======================================================
 * GET OR CREATE CHAT (1-1)
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
    .populate('participants', 'username profilePicture lastSeen')
    .populate({
      path: 'lastMessage',
      populate: [
        { path: 'sender receiver', select: 'username profilePicture' },
        {
          path: 'story',
          select: 'media user createdAt',
          populate: { path: 'user', select: 'username profilePicture' },
        },
      ],
    });

  if (!chat) {
    chat = await Chat.create({
      isGroup: false,
      participants: [currentUserId, userId],
      encryptionMode: 'plain',
    });

    chat = await Chat.findById(chat._id)
      .populate('participants', 'username profilePicture lastSeen')
      .populate({
        path: 'lastMessage',
        populate: [
          { path: 'sender receiver', select: 'username profilePicture' },
          {
            path: 'story',
            select: 'media user createdAt',
            populate: { path: 'user', select: 'username profilePicture' },
          },
        ],
      });
  }

  const participantsWithStatus = await Promise.all(
    chat.participants.map(async (user) => {
      const status = await getUserStatus(user);
      return { ...user.toObject(), ...status };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      ...chat.toObject(),
      participants: participantsWithStatus,
    },
  });
});

/**
 * ======================================================
 * SEND MESSAGE (NORMAL + STORY REPLY)
 * ======================================================
 */
exports.sendMessage = catchAsync(async (req, res) => {
  const { chatId, receiverId, text, storyId } = req.body;
  const senderId = req.user.id;

  if (!chatId || !receiverId || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'chatId, receiverId and text are required',
    });
  }

  const chat = await Chat.findById(chatId).populate(
    'participants',
    '_id username profilePicture lastSeen'
  );

  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

  const receiver = chat.participants.find(
    (u) => u._id.toString() === receiverId
  );

  if (!receiver) {
    return res.status(400).json({
      success: false,
      message: 'Receiver not in this chat',
    });
  }

  let message = await Message.create({
    chat: chatId,
    sender: senderId,
    receiver: receiverId,
    text,
    story: storyId || null,
    encryptionMode: 'plain',
    type: 'text',
    readBy: [{ user: senderId }],
  });

  message = await message.populate([
    { path: 'sender receiver', select: 'username profilePicture' },
    {
      path: 'story',
      select: 'media user createdAt',
      populate: { path: 'user', select: 'username profilePicture' },
    },
  ]);

  chat.lastMessage = message._id;
  await chat.save();

  const io = getIO();
  
  // Emit message to receiver
  io.to(receiverId.toString()).emit('message_received', {
    _id: message._id,
    chat: chatId,
    sender: message.sender,
    receiver: message.receiver,
    text: message.text,
    story: message.story,
    createdAt: message.createdAt,
  });

  // ✅ EMIT UNREAD COUNT UPDATE TO RECEIVER
  const unreadCount = await Message.countDocuments({
    receiver: receiverId,
    'readBy.user': { $ne: receiverId },
  });

  io.to(receiverId.toString()).emit('unread_count_updated', {
    count: unreadCount,
  });

  return res.status(201).json({
    success: true,
    data: message,
  });
});

/**
 * ======================================================
 * MARK MESSAGES READ
 * ======================================================
 */
exports.markMessagesRead = catchAsync(async (req, res) => {
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
    { _id: { $in: messages.map((m) => m._id) } },
    { $push: { readBy: { user: readerId } } }
  );

  const io = getIO();
  messages.forEach((msg) => {
    io.to(msg.sender.toString()).emit('messages_read', {
      chatId,
      readerId,
    });
  });

  // ✅ EMIT UPDATED UNREAD COUNT TO READER
  const unreadCount = await Message.countDocuments({
    receiver: readerId,
    'readBy.user': { $ne: readerId },
  });

  io.to(readerId.toString()).emit('unread_count_updated', {
    count: unreadCount,
  });

  res.status(200).json({ success: true });
});

/**
 * ======================================================
 * GET UNREAD MESSAGE COUNT
 * ======================================================
 */
exports.getUnreadCount = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const count = await Message.countDocuments({
    receiver: userId,
    'readBy.user': { $ne: userId },
  });

  res.status(200).json({
    success: true,
    data: { count },
  });
});

/**
 * ======================================================
 * MARK ALL MESSAGES AS READ
 * ======================================================
 */
exports.markAllMessagesAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Find all unread messages for this user
  const unreadMessages = await Message.find({
    receiver: userId,
    'readBy.user': { $ne: userId },
  });

  if (!unreadMessages.length) {
    return res.status(200).json({
      success: true,
      message: 'No unread messages',
      data: { count: 0 },
    });
  }

  // Mark all as read
  await Message.updateMany(
    {
      _id: { $in: unreadMessages.map(m => m._id) },
    },
    {
      $push: { readBy: { user: userId } },
    }
  );

  // Emit updated count to user
  const io = getIO();
  io.to(userId.toString()).emit('unread_count_updated', {
    count: 0,
  });

  res.status(200).json({
    success: true,
    message: `Marked ${unreadMessages.length} messages as read`,
    data: { count: 0 },
  });
});

/**
 * ======================================================
 * DELETE MESSAGE
 * ======================================================
 */
exports.deleteMessage = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const { mode } = req.body;
  const userId = req.user.id;

  const message = await Message.findById(messageId);
  if (!message) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }

  if (mode === 'everyone') {
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }

    message.deletedForEveryone = true;
    message.deletedAt = new Date();
    await message.save();

    const io = getIO();
    io.to(message.receiver.toString()).emit('message_deleted', {
      messageId,
      chatId: message.chat,
      mode: 'everyone',
    });

    return res.status(200).json({ success: true });
  }

  if (mode === 'me') {
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }
    return res.status(200).json({ success: true });
  }

  res.status(400).json({ success: false, message: 'Invalid delete mode' });
});

/**
 * ======================================================
 * GET CHAT HISTORY
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
    .populate({
      path: 'story',
      select: 'media user createdAt',
      populate: { path: 'user', select: 'username profilePicture' },
    })
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    results: messages.length,
    data: messages,
  });
});

/**
 * ======================================================
 * GET RECENT CHATS
 * ======================================================
 */
exports.getRecentChats = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const chats = await Chat.find({ participants: userId })
    .populate('participants', 'username profilePicture lastSeen')
    .populate({
      path: 'lastMessage',
      populate: [
        { path: 'sender receiver', select: 'username profilePicture' },
        {
          path: 'story',
          select: 'media user createdAt',
          populate: { path: 'user', select: 'username profilePicture' },
        },
      ],
    })
    .sort({ updatedAt: -1 });

  const chatsWithStatus = await Promise.all(
    chats.map(async (chat) => {
      const participantsWithStatus = await Promise.all(
        chat.participants.map(async (user) => {
          const status = await getUserStatus(user);
          return { ...user.toObject(), ...status };
        })
      );

      return { ...chat.toObject(), participants: participantsWithStatus };
    })
  );

  res.status(200).json({
    success: true,
    data: chatsWithStatus,
  });
});