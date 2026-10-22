const catchAsync = require('../utils/catchAsync');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Note = require('../models/Note');
const { getIO } = require('../services/socket.service');
const { getUserStatus } = require('../utils/userStatus.util');
const pushService = require('../services/push.service');
const access = require('../services/access.service');
const { collectMediaKeys, deleteS3Keys } = require('../utils/s3Media');

const CDN_BASE_URL =
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

const mongoose = require('mongoose');
const { verifyUploadedMedia } = require('../utils/verifyUpload');
const logger = require('../utils/logger');

/**
 * "Read receipts" privacy setting, as the app describes it:
 * - if a user turns it off, others can't see that they've read a message
 * - and they can't see anyone else's read receipts either (reciprocal)
 * - group chats always show read receipts
 * Entries are still stored, so unread counts keep working.
 */
const getReceiptsOffIds = async (userIds) => {
  if (!userIds.length) return new Set();
  const rows = await User.find({ _id: { $in: userIds }, showReadReceipts: false })
    .select('_id')
    .lean();
  return new Set(rows.map((u) => u._id.toString()));
};

const redactReadBy = (message, viewer, receiptsOff, isGroup) => {
  if (!message || !Array.isArray(message.readBy) || isGroup) return message;
  const viewerId = String(viewer._id);
  const viewerOff = viewer.showReadReceipts === false;
  if (!viewerOff && !receiptsOff.size) return message;
  return {
    ...message,
    readBy: message.readBy.filter((r) => {
      const reader = (r.user?._id || r.user)?.toString();
      if (reader === viewerId) return true;
      if (viewerOff) return false;
      return !receiptsOff.has(reader);
    }),
  };
};

const isChatParticipant = async (chatId, userId) => {
  if (!mongoose.isValidObjectId(chatId)) return false;
  return !!(await Chat.exists({ _id: chatId, participants: userId }));
};

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

  await access.assertNotBlocked(currentUserId, userId);

  let chat = await Chat.findOne({
    isGroup: false,
    participants: { $size: 2, $all: [currentUserId, userId] },
  })
    .populate('participants', 'username profilePicture lastSeen activityStatusVisible')
    .populate({
      path: 'lastMessage',
      populate: [
        { path: 'sender receiver', select: 'username profilePicture' },
        {
          path: 'story',
          select: 'media user createdAt',
          populate: { path: 'user', select: 'username profilePicture' },
        },
        {
          path: 'sharedPost',
          select: 'media caption likesCount commentsCount user',
          populate: { path: 'user', select: 'username profilePicture' },
        },
        {
          path: 'sharedReel',
          select: 'videoUrl thumbnailUrl caption likesCount viewsCount user',
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
      .populate('participants', 'username profilePicture lastSeen activityStatusVisible')
      .populate({
        path: 'lastMessage',
        populate: [
          { path: 'sender receiver', select: 'username profilePicture' },
          {
            path: 'story',
            select: 'media user createdAt',
            populate: { path: 'user', select: 'username profilePicture' },
          },
          {
            path: 'sharedPost',
            select: 'media caption likesCount commentsCount user',
            populate: { path: 'user', select: 'username profilePicture' },
          },
          {
            path: 'sharedReel',
            select: 'videoUrl thumbnailUrl caption likesCount viewsCount user',
            populate: { path: 'user', select: 'username profilePicture' },
          },
        ],
      });
  }

  const participantsWithStatus = await Promise.all(
    chat.participants.map(async (user) => {
      const status = await getUserStatus(user, req.user);
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
  const { chatId, receiverId, text, storyId, sharedPostId, sharedReelId, attachment } = req.body;
  const senderId = req.user.id;

  const trimmedText = typeof text === 'string' ? text.trim() : '';

  if (!chatId || !receiverId) {
    return res.status(400).json({
      success: false,
      message: 'chatId and receiverId are required',
    });
  }

  if (!trimmedText && !attachment && !sharedPostId && !sharedReelId) {
    return res.status(400).json({
      success: false,
      message: 'Message needs text, an attachment, or shared content',
    });
  }

  if (sharedPostId && sharedReelId) {
    return res.status(400).json({
      success: false,
      message: 'A message cannot share both a post and a reel',
    });
  }

  let attachmentDoc = null;
  if (attachment) {
    if (!attachment.type || !attachment.originalKey) {
      return res.status(400).json({
        success: false,
        message: 'Attachment requires type and originalKey',
      });
    }

    if (!['image', 'video'].includes(attachment.type)) {
      return res.status(400).json({
        success: false,
        message: 'Attachment type must be image or video',
      });
    }

    await verifyUploadedMedia(attachment.originalKey, senderId, attachment.type);

    attachmentDoc = {
      type: attachment.type,
      originalKey: attachment.originalKey,
      variants: {
        original: `${CDN_BASE_URL}/${attachment.originalKey}`,
      },
    };
  }

  const chat = await Chat.findById(chatId).populate(
    'participants',
    '_id username profilePicture lastSeen activityStatusVisible'
  );

  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

  if (!chat.participants.some((u) => u._id.toString() === senderId)) {
    return res.status(403).json({ success: false, message: 'Not a participant of this chat' });
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

  await access.assertNotBlocked(senderId, receiverId);

  // Shared posts/reels are embedded in the message, so both sides must
  // be allowed to see them (no leaking private posts via DM).
  if (sharedPostId || sharedReelId) {
    const Model = sharedPostId ? Post : Reel;
    const contentId = sharedPostId || sharedReelId;
    await access.loadViewable(Model, contentId, senderId);
    try {
      await access.loadViewable(Model, contentId, receiverId);
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "The recipient can't see this content",
      });
    }
  }

  let sharedPost = null;
  let sharedReel = null;
  let type = 'text';

  if (sharedPostId) {
    sharedPost = await Post.exists({ _id: sharedPostId });
    if (!sharedPost) {
      return res.status(404).json({ success: false, message: 'Shared post not found' });
    }
    type = 'shared_post';
  } else if (sharedReelId) {
    sharedReel = await Reel.exists({ _id: sharedReelId });
    if (!sharedReel) {
      return res.status(404).json({ success: false, message: 'Shared reel not found' });
    }
    type = 'shared_reel';
  } else if (attachmentDoc) {
    type = attachmentDoc.type;
  }

  let message = await Message.create({
    chat: chatId,
    sender: senderId,
    receiver: receiverId,
    text: trimmedText,
    story: storyId || null,
    sharedPost: sharedPostId || null,
    sharedReel: sharedReelId || null,
    attachment: attachmentDoc || undefined,
    encryptionMode: 'plain',
    type,
    readBy: [{ user: senderId }],
  });

  message = await message.populate([
    { path: 'sender receiver', select: 'username profilePicture' },
    {
      path: 'story',
      select: 'media user createdAt',
      populate: { path: 'user', select: 'username profilePicture' },
    },
    {
      path: 'sharedPost',
      select: 'media caption likesCount commentsCount user',
      populate: { path: 'user', select: 'username profilePicture' },
    },
    {
      path: 'sharedReel',
      select: 'videoUrl thumbnailUrl caption likesCount viewsCount user',
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
    sharedPost: message.sharedPost,
    sharedReel: message.sharedReel,
    attachment: message.attachment,
    type: message.type,
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

  const pushBody =
    type === 'shared_post'
      ? 'Shared a post with you'
      : type === 'shared_reel'
      ? 'Shared a reel with you'
      : type === 'image'
      ? trimmedText || 'Sent a photo'
      : type === 'video'
      ? trimmedText || 'Sent a video'
      : trimmedText;

  pushService
    .sendPushToUsers(receiverId, {
      title: message.sender.username,
      body: pushBody,
      data: {
        type: 'chat',
        chatId: chatId.toString(),
        senderId: senderId.toString(),
        senderUsername: message.sender.username,
      },
    })
    .catch((err) => logger.error('Push notification error:', err.message));

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

  if (!(await isChatParticipant(chatId, readerId))) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

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
  // Read receipts (1:1 chats): sent only if neither the reader nor the
  // sender has turned them off. Group chats always send them.
  const chatInfo = await Chat.findById(chatId).select('isGroup').lean();
  const senderIds = [...new Set(messages.map((m) => m.sender.toString()))];
  const sendersOff = chatInfo?.isGroup ? new Set() : await getReceiptsOffIds(senderIds);
  const readerOff = !chatInfo?.isGroup && req.user.showReadReceipts === false;
  if (!readerOff) {
    senderIds
      .filter((id) => !sendersOff.has(id))
      .forEach((id) => {
        io.to(id).emit('messages_read', { chatId, readerId });
      });
  }

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

    // Actually remove the content (not just hide it): text, shared
    // references and the attachment file in S3.
    const attachmentKeys = collectMediaKeys(message.attachment?.toObject?.() || message.attachment);
    message.deletedForEveryone = true;
    message.deletedAt = new Date();
    message.text = '';
    message.attachment = undefined;
    message.sharedPost = null;
    message.sharedReel = null;
    message.story = null;
    await message.save();
    await deleteS3Keys(attachmentKeys);

    const io = getIO();
    io.to(message.receiver.toString()).emit('message_deleted', {
      messageId,
      chatId: message.chat,
      mode: 'everyone',
    });

    return res.status(200).json({ success: true });
  }

  if (mode === 'me') {
    const isParty =
      message.sender.toString() === userId ||
      message.receiver?.toString() === userId;
    if (!isParty) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
    }
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

  if (!(await isChatParticipant(chatId, userId))) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

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
    .populate({
      path: 'sharedPost',
      select: 'media caption likesCount commentsCount user',
      populate: { path: 'user', select: 'username profilePicture' },
    })
    .populate({
      path: 'sharedReel',
      select: 'videoUrl thumbnailUrl caption likesCount viewsCount user',
      populate: { path: 'user', select: 'username profilePicture' },
    })
    .sort({ createdAt: 1 })
    .lean();

  const chat = await Chat.findById(chatId).select('participants isGroup').lean();
  const receiptsOff = await getReceiptsOffIds(
    (chat?.participants || []).map(String).filter((id) => id !== userId)
  );

  res.status(200).json({
    success: true,
    results: messages.length,
    data: messages.map((m) => redactReadBy(m, req.user, receiptsOff, chat?.isGroup)),
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
    .populate('participants', 'username profilePicture lastSeen activityStatusVisible')
    .populate({
      path: 'lastMessage',
      populate: [
        { path: 'sender receiver', select: 'username profilePicture' },
        {
          path: 'story',
          select: 'media user createdAt',
          populate: { path: 'user', select: 'username profilePicture' },
        },
        {
          path: 'sharedPost',
          select: 'media caption likesCount commentsCount user',
          populate: { path: 'user', select: 'username profilePicture' },
        },
        {
          path: 'sharedReel',
          select: 'videoUrl thumbnailUrl caption likesCount viewsCount user',
          populate: { path: 'user', select: 'username profilePicture' },
        },
      ],
    })
    .sort({ updatedAt: -1 });

  // Active "notes" (short-lived status text) for everyone across these
  // chats, fetched once up front instead of per participant.
  const allParticipantIds = [
    ...new Set(
      chats.flatMap((chat) => chat.participants.map((p) => p._id.toString()))
    ),
  ];
  const activeNotes = await Note.find({
    user: { $in: allParticipantIds },
    expiresAt: { $gt: new Date() },
  }).select('user text');
  const noteByUser = new Map(
    activeNotes.map((n) => [n.user.toString(), n.text])
  );

  // Unread counts for every chat in ONE aggregation (was one
  // countDocuments query per chat).
  const me = new mongoose.Types.ObjectId(userId);
  const unreadRows = chats.length
    ? await Message.aggregate([
        {
          $match: {
            chat: { $in: chats.map((c) => c._id) },
            sender: { $ne: me },
            'readBy.user': { $ne: me },
          },
        },
        { $group: { _id: '$chat', count: { $sum: 1 } } },
      ])
    : [];
  const unreadByChat = new Map(unreadRows.map((r) => [r._id.toString(), r.count]));
  const receiptsOff = await getReceiptsOffIds(
    allParticipantIds.filter((id) => id !== userId)
  );

  const chatsWithStatus = await Promise.all(
    chats.map(async (chat) => {
      const participantsWithStatus = await Promise.all(
        chat.participants.map(async (user) => {
          const status = await getUserStatus(user, req.user);
          return {
            ...user.toObject(),
            ...status,
            note: noteByUser.get(user._id.toString()) || null,
          };
        })
      );

      const chatObj = chat.toObject();
      return {
        ...chatObj,
        lastMessage: redactReadBy(chatObj.lastMessage, req.user, receiptsOff, chatObj.isGroup),
        participants: participantsWithStatus,
        unreadCount: unreadByChat.get(chat._id.toString()) || 0,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: chatsWithStatus,
  });
});