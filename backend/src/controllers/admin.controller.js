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
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Client');

const BUCKET = process.env.AWS_BUCKET_NAME;

/* ======================================================
   HELPER: Delete S3 Object
====================================================== */
const deleteFromS3 = async (key) => {
  if (!key) return;
  try {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
    );
    console.log('🗑️ S3 deleted:', key);
  } catch (err) {
    console.error('S3 delete error:', err.message);
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
      { username: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
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

  // Add post/reel counts
  const enrichedUsers = await Promise.all(
    users.map(async (user) => {
      const [postCount, reelCount] = await Promise.all([
        Post.countDocuments({ user: user._id }),
        Reel.countDocuments({ user: user._id }),
      ]);
      return {
        ...user,
        postCount,
        reelCount,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
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
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
    },
  });
});

// PUT /api/v1/admin/users/:userId/ban
exports.banUser = catchAsync(async (req, res) => {
  const { reason } = req.body;

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

  res.status(200).json({
    success: true,
    message: `User @${user.username} has been banned`,
    data: user,
  });
});

// PUT /api/v1/admin/users/:userId/unban
exports.unbanUser = catchAsync(async (req, res) => {
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
  const suspendDays = parseInt(days) || 7;

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

  res.status(200).json({
    success: true,
    message: `User @${user.username} suspended for ${suspendDays} days`,
    data: user,
  });
});

// DELETE /api/v1/admin/users/:userId
exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Delete all user content
  const [posts, reels, stories] = await Promise.all([
    Post.find({ user: user._id }).lean(),
    Reel.find({ user: user._id }).select('+videoKey').lean(),
    Story.find({ user: user._id }).lean(),
  ]);

  // Delete S3 media
  for (const post of posts) {
    if (post.media?.originalKey) await deleteFromS3(post.media.originalKey);
  }
  for (const reel of reels) {
    if (reel.videoKey) await deleteFromS3(reel.videoKey);
  }
  for (const story of stories) {
    if (story.media?.key) await deleteFromS3(story.media.key);
  }

  // Delete all DB records
  await Promise.all([
    Post.deleteMany({ user: user._id }),
    Reel.deleteMany({ user: user._id }),
    Story.deleteMany({ user: user._id }),
    Comment.deleteMany({ user: user._id }),
    Notification.deleteMany({
      $or: [{ recipient: user._id }, { sender: user._id }],
    }),
    Report.deleteMany({
      $or: [{ reporter: user._id }, { targetUser: user._id }],
    }),
    // Remove from followers/following lists
    User.updateMany(
      { followers: user._id },
      { $pull: { followers: user._id } }
    ),
    User.updateMany(
      { following: user._id },
      { $pull: { following: user._id } }
    ),
    User.deleteOne({ _id: user._id }),
  ]);

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
      { caption: { $regex: search, $options: 'i' } },
      { hashtags: { $regex: search, $options: 'i' } },
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

  // Delete media from S3
  if (post.media?.originalKey) {
    await deleteFromS3(post.media.originalKey);
  }

  // Delete associated comments and notifications
  await Promise.all([
    Comment.deleteMany({ post: post._id }),
    Notification.deleteMany({ post: post._id }),
    Report.updateMany(
      { targetPost: post._id },
      { status: 'resolved', actionTaken: 'content_removed' }
    ),
    Post.deleteOne({ _id: post._id }),
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
    filter.caption = { $regex: search, $options: 'i' };
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

  if (reel.videoKey) await deleteFromS3(reel.videoKey);

  await Promise.all([
    Comment.deleteMany({ reel: reel._id }),
    Report.updateMany(
      { targetReel: reel._id },
      { status: 'resolved', actionTaken: 'content_removed' }
    ),
    Reel.deleteOne({ _id: reel._id }),
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

  if (story.media?.key) await deleteFromS3(story.media.key);

  await Promise.all([
    Report.updateMany(
      { targetStory: story._id },
      { status: 'resolved', actionTaken: 'content_removed' }
    ),
    Story.deleteOne({ _id: story._id }),
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
        const post = await Post.findById(report.targetPost);
        if (post) {
          if (post.media?.originalKey) await deleteFromS3(post.media.originalKey);
          await Comment.deleteMany({ post: post._id });
          await Post.deleteOne({ _id: post._id });
        }
      } else if (report.targetType === 'reel' && report.targetReel) {
        const reel = await Reel.findById(report.targetReel).select('+videoKey');
        if (reel) {
          if (reel.videoKey) await deleteFromS3(reel.videoKey);
          await Comment.deleteMany({ reel: reel._id });
          await Reel.deleteOne({ _id: reel._id });
        }
      } else if (report.targetType === 'story' && report.targetStory) {
        const story = await Story.findById(report.targetStory);
        if (story) {
          if (story.media?.key) await deleteFromS3(story.media.key);
          await Story.deleteOne({ _id: story._id });
        }
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
      }
      break;

    case 'ban_user':
      report.status = 'resolved';
      report.actionTaken = 'user_banned';
      if (report.targetUser) {
        await User.findByIdAndUpdate(report.targetUser, {
          isBanned: true,
          banReason: 'Banned due to reported content',
        });
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
    filter.content = { $regex: search, $options: 'i' };
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

  const report = await Report.create(reportData);

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully',
    data: report,
  });
});
