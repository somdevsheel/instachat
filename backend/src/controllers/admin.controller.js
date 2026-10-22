const User = require('../models/user.model');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Story = require('../models/Story');
const Comment = require('../models/Comment');
const Report = require('../models/report.model');
const Notification = require('../models/notification.model');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const catchAsync = require('../utils/catchAsync');
const escapeRegex = require('../utils/escapeRegex');
const graph = require('../services/graph.service');
const { deleteAccountData } = require('../services/accountDeletion.service');
const contentDeletion = require('../services/contentDeletion.service');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { getIO } = require('../services/socket.service');

/* =========================
   MODERATION GUARDS
========================= */
const ROLE_RANK = { user: 0, admin: 1, superadmin: 2 };

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Admins may only moderate accounts with a LOWER role than their own,
 * and never themselves — so one admin can't ban/delete another admin
 * or the superadmin, and nobody can lock themselves out by accident.
 */
const assertCanModerate = async (actor, targetId) => {
  if (!mongoose.isValidObjectId(targetId)) throw httpError('User not found', 404);
  if (String(targetId) === actor._id.toString()) {
    throw httpError("You can't moderate your own account", 400);
  }
  const target = await User.findById(targetId).select('role');
  if (!target) throw httpError('User not found', 404);
  if ((ROLE_RANK[target.role] || 0) >= (ROLE_RANK[actor.role] || 0)) {
    throw httpError("You can't moderate an account with equal or higher privileges", 403);
  }
  return target;
};

/**
 * Close a user's live socket connections (on every server process).
 * Bans etc. already block new requests; this stops an open session
 * from continuing to receive realtime events.
 */
const disconnectUser = (userId) => {
  try {
    getIO().in(String(userId)).disconnectSockets(true);
  } catch (err) {
    logger.error('Failed to disconnect user sockets:', err);
  }
};

/* ======================================================
   DASHBOARD STATS
   GET /api/v1/admin/dashboard
====================================================== */
exports.getDashboardStats = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalPosts,
    totalReels,
    totalStories,
    totalReports,
    pendingReports,
    bannedUsers,
    newUsersToday,
    newPostsToday,
    recentReports,
  ] = await Promise.all([
    User.countDocuments(),
    Post.countDocuments(),
    Reel.countDocuments(),
    Story.countDocuments({ expiresAt: { $gt: new Date() } }),
    Report.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    Post.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
    Report.find({ status: 'pending' })
      .populate('reporter', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  // User growth (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Content growth (last 7 days)
  const contentGrowth = await Post.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalPosts,
        totalReels,
        totalStories,
        totalReports,
        pendingReports,
        bannedUsers,
        newUsersToday,
        newPostsToday,
      },
      userGrowth,
      contentGrowth,
      recentReports,
    },
  });
});

/* ======================================================
   USER MANAGEMENT
====================================================== */

// GET /api/v1/admin/users
exports.getUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const status = req.query.status; // active, banned, suspended
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;

  const filter = {};

  if (search) {
    filter.$or = [
      { username: { $regex: escapeRegex(search), $options: 'i' } },
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { email: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  if (status === 'banned') filter.isBanned = true;
  if (status === 'suspended') filter.isSuspended = true;
  if (status === 'active') {
    filter.isBanned = { $ne: true };
    filter.isSuspended = { $ne: true };
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -passwordResetToken -loginActivity')
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  // Add post/reel counts (+ follow counts from Postgres)
  const graphCounts = await graph.getCountsMany(users.map((u) => u._id.toString()));
  const enrichedUsers = await Promise.all(
    users.map(async ({ followers, following, closeFriends, blockedUsers, mutedUsers, ...user }) => {
      const [postCount, reelCount] = await Promise.all([
        Post.countDocuments({ user: user._id }),
        Reel.countDocuments({ user: user._id }),
      ]);
      return {
        ...user,
        postCount,
        reelCount,
        ...graphCounts[user._id.toString()],
      };
    })
  );

  res.status(200).json({
    success: true,
    data: enrichedUsers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// GET /api/v1/admin/users/:userId
exports.getUserDetail = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.userId)
    .select('-password -passwordResetToken')
    .lean();

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const [posts, reels, reports, reportsMade] = await Promise.all([
    Post.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Reel.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Report.find({ targetUser: user._id }).sort({ createdAt: -1 }).lean(),
    Report.find({ reporter: user._id }).sort({ createdAt: -1 }).lean(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      ...user,
      posts,
      reels,
      reportsAgainst: reports,
      reportsMade,
      ...(await graph.getCounts(user._id)),
    },
  });
});

// PUT /api/v1/admin/users/:userId/ban
exports.banUser = catchAsync(async (req, res) => {
  const { reason } = req.body;
  await assertCanModerate(req.user, req.params.userId);

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    {
      isBanned: true,
      banReason: reason || 'Violated community guidelines',
    },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  disconnectUser(user._id);

  res.status(200).json({
    success: true,
    message: `User @${user.username} has been banned`,
    data: user,
  });
});

// PUT /api/v1/admin/users/:userId/unban
exports.unbanUser = catchAsync(async (req, res) => {
  await assertCanModerate(req.user, req.params.userId);
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    {
      isBanned: false,
      isSuspended: false,
      suspendedUntil: null,
      banReason: '',
    },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({
    success: true,
    message: `User @${user.username} has been unbanned`,
    data: user,
  });
});

// PUT /api/v1/admin/users/:userId/suspend
exports.suspendUser = catchAsync(async (req, res) => {
  const { days, reason } = req.body;
  await assertCanModerate(req.user, req.params.userId);
  // 1..365 days (negative / huge values would make no sense)
  const suspendDays = Math.min(Math.max(parseInt(days, 10) || 7, 1), 365);

  const suspendedUntil = new Date();
  suspendedUntil.setDate(suspendedUntil.getDate() + suspendDays);

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    {
      isSuspended: true,
      suspendedUntil,
      banReason: reason || `Suspended for ${suspendDays} days`,
    },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  disconnectUser(user._id);

  res.status(200).json({
    success: true,
    message: `User @${user.username} suspended for ${suspendDays} days`,
    data: user,
  });
});

// DELETE /api/v1/admin/users/:userId
exports.deleteUser = catchAsync(async (req, res) => {
  await assertCanModerate(req.user, req.params.userId);
  const user = await User.findById(req.params.userId).select('username');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Full erasure: content, messages, media, likes, graph... (see service)
  await deleteAccountData(user._id);
  disconnectUser(user._id);

  res.status(200).json({
    success: true,
    message: `User @${user.username} and all their content has been deleted`,
  });
});

/* ======================================================
   POST MANAGEMENT
====================================================== */

// GET /api/v1/admin/posts
exports.getPosts = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;

  const filter = {};
  if (search) {
    filter.$or = [
      { caption: { $regex: escapeRegex(search), $options: 'i' } },
      { hashtags: { $regex: escapeRegex(search), $options: 'i' } },
    ];
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate('user', 'username name profilePicture')
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Post.countDocuments(filter),
  ]);

  // Add report count for each post
  const enrichedPosts = await Promise.all(
    posts.map(async (post) => {
      const reportCount = await Report.countDocuments({
        targetPost: post._id,
        targetType: 'post',
      });
      return { ...post, reportCount };
    })
  );

  res.status(200).json({
    success: true,
    data: enrichedPosts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// DELETE /api/v1/admin/posts/:postId
exports.deletePost = catchAsync(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  // Media (S3 + variants), comments, reposts, saves, notifications
  await Promise.all([
    contentDeletion.deletePost(post._id),
    Report.updateMany(
      { targetPost: post._id },
      { status: 'resolved', actionTaken: 'content_removed' }
    ),
  ]);

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully',
  });
});

/* ======================================================
   REEL MANAGEMENT
====================================================== */

// GET /api/v1/admin/reels
exports.getReels = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const order = req.query.order === 'asc' ? 1 : -1;

  const filter = {};
  if (search) {
    filter.caption = { $regex: escapeRegex(search), $options: 'i' };
  }

  const [reels, total] = await Promise.all([
    Reel.find(filter)
      .populate('user', 'username name profilePicture')
      .select('+videoKey')
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Reel.countDocuments(filter),
  ]);

  const enrichedReels = await Promise.all(
    reels.map(async (reel) => {
      const reportCount = await Report.countDocuments({
        targetReel: reel._id,
        targetType: 'reel',
      });
      return { ...reel, reportCount };
    })
  );

  res.status(200).json({
    success: true,
    data: enrichedReels,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// DELETE /api/v1/admin/reels/:reelId
exports.deleteReel = catchAsync(async (req, res) => {
  const reel = await Reel.findById(req.params.reelId).select('+videoKey');
  if (!reel) {
    return res.status(404).json({ success: false, message: 'Reel not found' });
  }

  await Promise.all([
    contentDeletion.deleteReel(reel._id),
    Report.updateMany(
      { targetReel: reel._id },
      { status: 'resolved', actionTaken: 'content_removed' }
    ),
  ]);

  res.status(200).json({
    success: true,
    message: 'Reel deleted successfully',
  });
});

/* ======================================================
   STORY MANAGEMENT
====================================================== */

// GET /api/v1/admin/stories
exports.getStories = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const showExpired = req.query.showExpired === 'true';

  const filter = {};
  if (!showExpired) {
    filter.expiresAt = { $gt: new Date() };
  }

  const [stories, total] = await Promise.all([
    Story.find(filter)
      .populate('user', 'username name profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Story.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: stories,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// DELETE /api/v1/admin/stories/:storyId
exports.deleteStory = catchAsync(async (req, res) => {
  const story = await Story.findById(req.params.storyId);
  if (!story) {
    return res
      .status(404)
      .json({ success: false, message: 'Story not found' });
  }

  await Promise.all([
    contentDeletion.deleteStory(story._id),
    Report.updateMany(
      { targetStory: story._id },
      { status: 'resolved', actionTaken: 'content_removed' }
    ),
  ]);

  res.status(200).json({
    success: true,
    message: 'Story deleted successfully',
  });
});

/* ======================================================
   REPORT MANAGEMENT
====================================================== */

// GET /api/v1/admin/reports
exports.getReports = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status; // pending, reviewing, resolved, dismissed
  const targetType = req.query.targetType; // post, reel, story, comment, user

  const filter = {};
  if (status) filter.status = status;
  if (targetType) filter.targetType = targetType;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('reporter', 'username profilePicture')
      .populate('targetUser', 'username profilePicture')
      .populate('targetPost', 'caption media')
      .populate('targetReel', 'caption videoUrl thumbnailUrl')
      .populate('targetStory', 'media')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Report.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: reports,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// GET /api/v1/admin/reports/:reportId
exports.getReportDetail = catchAsync(async (req, res) => {
  const report = await Report.findById(req.params.reportId)
    .populate('reporter', 'username name profilePicture email')
    .populate('targetUser', 'username name profilePicture email')
    .populate({
      path: 'targetPost',
      populate: { path: 'user', select: 'username profilePicture' },
    })
    .populate({
      path: 'targetReel',
      populate: { path: 'user', select: 'username profilePicture' },
    })
    .populate({
      path: 'targetStory',
      populate: { path: 'user', select: 'username profilePicture' },
    })
    .populate('reviewedBy', 'username')
    .lean();

  if (!report) {
    return res
      .status(404)
      .json({ success: false, message: 'Report not found' });
  }

  res.status(200).json({
    success: true,
    data: report,
  });
});

// PUT /api/v1/admin/reports/:reportId/action
exports.takeReportAction = catchAsync(async (req, res) => {
  const { action, adminNotes } = req.body;
  // action: dismiss, remove_content, warn_user, suspend_user, ban_user

  const report = await Report.findById(req.params.reportId);
  if (!report) {
    return res
      .status(404)
      .json({ success: false, message: 'Report not found' });
  }

  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();
  report.adminNotes = adminNotes || '';

  switch (action) {
    case 'dismiss':
      report.status = 'dismissed';
      report.actionTaken = 'dismissed';
      break;

    case 'remove_content':
      report.status = 'resolved';
      report.actionTaken = 'content_removed';

      // Delete the content
      if (report.targetType === 'post' && report.targetPost) {
        await contentDeletion.deletePost(report.targetPost);
      } else if (report.targetType === 'reel' && report.targetReel) {
        await contentDeletion.deleteReel(report.targetReel);
      } else if (report.targetType === 'story' && report.targetStory) {
        await contentDeletion.deleteStory(report.targetStory);
      } else if (report.targetType === 'comment' && report.targetComment) {
        await Comment.deleteOne({ _id: report.targetComment });
      }
      break;

    case 'warn_user':
      report.status = 'resolved';
      report.actionTaken = 'user_warned';
      // Could send a notification to the user
      if (report.targetUser) {
        await Notification.create({
          recipient: report.targetUser,
          sender: req.user._id,
          type: 'mention',
          message: 'Your content was flagged for violating community guidelines. Please review our policies.',
        });
      }
      break;

    case 'suspend_user':
      if (report.targetUser) await assertCanModerate(req.user, report.targetUser);
      report.status = 'resolved';
      report.actionTaken = 'user_suspended';
      if (report.targetUser) {
        const suspendUntil = new Date();
        suspendUntil.setDate(suspendUntil.getDate() + 7);
        await User.findByIdAndUpdate(report.targetUser, {
          isSuspended: true,
          suspendedUntil: suspendUntil,
          banReason: 'Suspended due to reported content',
        });
        // After the update, so an instant reconnect is already refused.
        disconnectUser(report.targetUser);
      }
      break;

    case 'ban_user':
      if (report.targetUser) await assertCanModerate(req.user, report.targetUser);
      report.status = 'resolved';
      report.actionTaken = 'user_banned';
      if (report.targetUser) {
        await User.findByIdAndUpdate(report.targetUser, {
          isBanned: true,
          banReason: 'Banned due to reported content',
        });
        disconnectUser(report.targetUser);
      }
      break;

    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid action',
      });
  }

  await report.save();

  res.status(200).json({
    success: true,
    message: `Report ${action} successfully`,
    data: report,
  });
});

/* ======================================================
   COMMENT MANAGEMENT
====================================================== */

// GET /api/v1/admin/comments
exports.getComments = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = req.query.search || '';

  const filter = {};
  if (search) {
    filter.content = { $regex: escapeRegex(search), $options: 'i' };
  }

  const [comments, total] = await Promise.all([
    Comment.find(filter)
      .populate('user', 'username profilePicture')
      .populate('post', 'caption')
      .populate('reel', 'caption')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Comment.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: comments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// DELETE /api/v1/admin/comments/:commentId
exports.deleteComment = catchAsync(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    return res
      .status(404)
      .json({ success: false, message: 'Comment not found' });
  }

  // Decrement comment count on parent
  if (comment.post) {
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 },
    });
  }
  if (comment.reel) {
    await Reel.findByIdAndUpdate(comment.reel, {
      $inc: { commentsCount: -1 },
    });
  }

  await Comment.deleteOne({ _id: comment._id });

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully',
  });
});

/* ======================================================
   REPORT CREATION (For regular users - add to user routes)
   POST /api/v1/reports
====================================================== */
exports.createReport = catchAsync(async (req, res) => {
  const { targetType, targetId, reason, description } = req.body;

  if (!targetType || !targetId || !reason) {
    return res.status(400).json({
      success: false,
      message: 'targetType, targetId, and reason are required',
    });
  }

  if (!mongoose.isValidObjectId(targetId)) {
    return res.status(404).json({ success: false, message: 'Reported content not found' });
  }

  const reportData = {
    reporter: req.user.id,
    targetType,
    reason,
    description: description || '',
  };

  // Set the correct target reference
  switch (targetType) {
    case 'post':
      reportData.targetPost = targetId;
      const post = await Post.findById(targetId);
      if (post) reportData.targetUser = post.user;
      break;
    case 'reel':
      reportData.targetReel = targetId;
      const reel = await Reel.findById(targetId);
      if (reel) reportData.targetUser = reel.user;
      break;
    case 'story':
      reportData.targetStory = targetId;
      const story = await Story.findById(targetId);
      if (story) reportData.targetUser = story.user;
      break;
    case 'comment':
      reportData.targetComment = targetId;
      const comment = await Comment.findById(targetId);
      if (comment) reportData.targetUser = comment.user;
      break;
    case 'user':
      reportData.targetUser = targetId;
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid target type',
      });
  }

  const targetField = {
    post: 'targetPost',
    reel: 'targetReel',
    story: 'targetStory',
    comment: 'targetComment',
    user: 'targetUser',
  }[targetType];

  // Reporting something that doesn't exist.
  if (targetType !== 'user' && !reportData.targetUser) {
    return res.status(404).json({ success: false, message: 'Reported content not found' });
  }
  if (targetType === 'user' && !(await User.exists({ _id: targetId }))) {
    return res.status(404).json({ success: false, message: 'Reported user not found' });
  }

  // One open report per reporter per target (no report spamming).
  const existing = await Report.findOne({
    reporter: req.user.id,
    [targetField]: targetId,
    status: { $in: ['pending', 'reviewing'] },
  });
  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'You have already reported this',
      data: existing,
    });
  }

  const report = await Report.create(reportData);

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully',
    data: report,
  });
});
