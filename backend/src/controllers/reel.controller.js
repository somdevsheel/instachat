const crypto = require('crypto');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Client');
const catchAsync = require('../utils/catchAsync');

const Reel = require('../models/Reel');
const User = require('../models/user.model'); // ⭐ Use User model instead
const reelService = require('../services/reel.service');
const graph = require('../services/graph.service');
const access = require('../services/access.service');
const contentDeletion = require('../services/contentDeletion.service');
const mongoose = require('mongoose');
const notificationService = require('../services/notification.service');
const { verifyUploadedMedia } = require('../utils/verifyUpload');
const logger = require('../utils/logger');

const CDN_BASE_URL =
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/**
 * ======================================================
 * GET PRESIGNED URL FOR REEL UPLOAD
 * POST /api/v1/reels/presign
 * ======================================================
 */
exports.getPresignedUrl = catchAsync(async (req, res) => {
  const { mimeType, fileSizeMB } = req.body;
  const userId = req.user.id;

  logger.debug('🎬 Reel presign request:', { mimeType, fileSizeMB, userId });

  if (!mimeType) {
    return res.status(400).json({
      success: false,
      message: 'mimeType is required',
    });
  }

  const allowedMimeTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
  if (!allowedMimeTypes.includes(mimeType)) {
    return res.status(400).json({
      success: false,
      message: 'Only MP4, MOV, and MKV videos are allowed',
    });
  }

  const MAX_REEL_MB = 100;
  if (typeof fileSizeMB === 'number' && fileSizeMB > MAX_REEL_MB) {
    return res.status(400).json({
      success: false,
      message: `Reel video must be under ${MAX_REEL_MB}MB`,
    });
  }

  const timestamp = Date.now();
  // Unguessable: media URLs are public on the CDN, so the file name is
  // what protects e.g. a private account's photo from being found.
  const randomId = crypto.randomBytes(16).toString('hex');
  const extension = mimeType.split('/')[1] || 'mp4';
  const key = `users/${userId}/reels/${timestamp}-${randomId}.${extension}`;

  logger.debug('🔑 Generated S3 key:', key);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
    CacheControl: 'public, max-age=86400',
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 900,
  });

  logger.debug('✅ Presigned URL generated for reel');

  res.status(200).json({
    success: true,
    data: {
      uploadUrl,
      key,
      expiresIn: 900,
    },
  });
});

/**
 * ======================================================
 * CREATE REEL (AFTER PRESIGNED UPLOAD)
 * POST /api/v1/reels
 * ======================================================
 */
exports.createReel = catchAsync(async (req, res) => {
  const { videoKey, caption, duration, thumbnailUrl } = req.body;
  const userId = req.user.id;

  logger.debug('🎬 Creating reel:', { videoKey, caption, userId });

  if (!videoKey) {
    return res.status(400).json({
      success: false,
      message: 'videoKey is required',
    });
  }

  await verifyUploadedMedia(videoKey, userId, 'video');

  const videoUrl = `${CDN_BASE_URL}/${videoKey}`;

  logger.debug('🎬 Video URL:', videoUrl);
  logger.debug('🎬 CDN_BASE_URL:', CDN_BASE_URL);

  const reel = await Reel.create({
    user: userId,
    videoKey,
    videoUrl,
    caption: caption || '',
    duration: duration || 0,
    // Only our own CDN, under the uploader's folder. An arbitrary URL
    // here would be loaded by every viewer (a tracking pixel leaking
    // their IP / device to a third-party server).
    thumbnailUrl:
      typeof thumbnailUrl === 'string' &&
      thumbnailUrl.startsWith(`${CDN_BASE_URL}/users/${userId}/`) &&
      !thumbnailUrl.includes('..')
        ? thumbnailUrl
        : '',
  });

  await reel.populate('user', 'username profilePicture');

  logger.debug('✅ Reel created:', {
    id: reel._id,
    videoUrl: reel.videoUrl,
    user: reel.user?.username,
  });

  // Private accounts' reels aren't broadcast to everyone.
  if (!req.user.isPrivate) {
    const io = req.app.get('io');
    if (io) io.emit('new_reel', reel);
  }

  res.status(201).json({
    success: true,
    data: reel,
  });
});

/**
 * ======================================================
 * GET REELS FEED - ⭐ UPDATED WITH isFollowing (User-based)
 * GET /api/v1/reels/feed
 * ======================================================
 */
exports.getReels = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  logger.debug('🎬 Fetching reels feed:', { userId, page, limit });

  // Blocked, private-not-followed and muted authors stay out of the feed.
  const hidden = await access.getFeedExcludedAuthorIds(userId);
  const reels = await Reel.find({
    $or: [
      { isActive: true },
      { isActive: { $exists: false } }
    ],
    ...(hidden.length ? { user: { $nin: hidden } } : {}),
  })
    .populate('user', 'username profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  logger.debug('🎬 Found reels:', reels.length);

  // ⭐ Get current user's following list
  const [currentUser, followingIds] = await Promise.all([
    User.findById(userId).select('savedReels repostedReels').lean(),
    graph.getFollowingIds(userId),
  ]);
  const followingIdsSet = new Set(followingIds);
  const savedReelsSet = new Set((currentUser?.savedReels || []).map((id) => id.toString()));
  const repostedReelsSet = new Set(
    (currentUser?.repostedReels || []).map((entry) => entry.reel.toString())
  );

  // Helper to construct proper video URL
  const getProperVideoUrl = (reel) => {
    if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
      if (reel.videoKey) {
        return `${CDN_BASE_URL}/${reel.videoKey}`;
      }
    }
    return reel.videoUrl;
  };

  // Add isLiked AND isFollowing flags
  const reelsWithStatus = reels.map((reel) => {
    const fixedUrl = getProperVideoUrl(reel);
    const { videoKey, ...reelWithoutKey } = reel;

    // Check if user liked this reel
    const isLiked = reel.likes?.some((id) => id.toString() === userId.toString());

    // Check if user saved this reel
    const isSaved = savedReelsSet.has(reel._id.toString());

    // Check if user already reposted this reel
    const isReposted = repostedReelsSet.has(reel._id.toString());

    // ⭐ Check if user is following the reel creator
    const isFollowing = reel.user && reel.user._id
      ? followingIdsSet.has(reel.user._id.toString())
      : false;

    return {
      ...reelWithoutKey,
      videoUrl: fixedUrl,
      isLiked,
      isSaved,
      isReposted,
      user: {
        ...reel.user,
        isFollowing // ⭐ Add isFollowing to user object
      }
    };
  });

  const totalReels = await Reel.countDocuments({ 
    $or: [
      { isActive: true },
      { isActive: { $exists: false } }
    ]
  });

  logger.debug('🎬 Returning reels:', {
    count: reelsWithStatus.length,
    totalReels,
    firstReel: reelsWithStatus[0] ? {
      id: reelsWithStatus[0]._id,
      videoUrl: reelsWithStatus[0].videoUrl,
      user: reelsWithStatus[0].user?.username,
      isFollowing: reelsWithStatus[0].user?.isFollowing
    } : null,
  });

  res.status(200).json({
    success: true,
    data: reelsWithStatus,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalReels / limit),
      totalReels,
    },
  });
});

/**
 * ======================================================
 * GET SINGLE REEL - ⭐ UPDATED WITH isFollowing
 * GET /api/v1/reels/:reelId
 * ======================================================
 */
exports.getReel = catchAsync(async (req, res) => {
  const userId = req.user.id;
  await access.loadViewable(Reel, req.params.reelId, userId);
  const reel = await Reel.findById(req.params.reelId)
    .populate('user', 'username profilePicture')
    .lean();

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  // Fix broken videoUrl
  if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
    if (reel.videoKey) {
      reel.videoUrl = `${CDN_BASE_URL}/${reel.videoKey}`;
    }
  }

  // Add isLiked flag
  reel.isLiked = reel.likes?.some((id) => id.toString() === userId.toString());

  // ⭐ Add isFollowing flag using User model
  if (reel.user && reel.user._id && reel.user._id.toString() !== userId.toString()) {
    reel.user.isFollowing = await graph.isFollowing(userId, reel.user._id);
  } else {
    reel.user.isFollowing = false;
  }

  res.status(200).json({
    success: true,
    data: reel,
  });
});

/**
 * ======================================================
 * GET USER'S REELS - ⭐ UPDATED WITH isFollowing
 * GET /api/v1/reels/user/:userId
 * ======================================================
 */
exports.getUserReels = catchAsync(async (req, res) => {
  const targetUserId = req.params.userId;
  const currentUserId = req.user.id;

  const owner = mongoose.isValidObjectId(targetUserId)
    ? await User.findById(targetUserId).select('isPrivate').lean()
    : null;
  if (!owner) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  await access.assertCanView(currentUserId, owner);

  const result = await reelService.getUserReelsWithReposts(
    targetUserId,
    currentUserId
  );
  const ownReels = result.ownReels;
  // Reposted reels whose author is hidden from me (private / blocked)
  // are left out.
  const hiddenSet = new Set(await access.getHiddenAuthorIds(currentUserId));
  const repostedReels = result.repostedReels.filter(
    (reel) => !hiddenSet.has((reel.user?._id || reel.user)?.toString())
  );

  // ⭐ Check if current user follows the target user
  let isFollowingUser = false;
  if (targetUserId !== currentUserId.toString()) {
    isFollowingUser = await graph.isFollowing(currentUserId, targetUserId);
  }

  const decorate = (reel) => {
    let fixedVideoUrl = reel.videoUrl;
    if (!reel.videoUrl || reel.videoUrl.startsWith('undefined') || reel.videoUrl.includes('.s3.')) {
      if (reel.videoKey) {
        fixedVideoUrl = `${CDN_BASE_URL}/${reel.videoKey}`;
      }
    }

    return {
      ...reel,
      videoUrl: fixedVideoUrl,
      isLiked: reel.likes?.some((id) => id.toString() === currentUserId.toString()),
      user: {
        ...reel.user,
        isFollowing: isFollowingUser, // ⭐ Add isFollowing
      },
    };
  };

  const merged = [...ownReels.map(decorate), ...repostedReels.map(decorate)].sort((a, b) => {
    const aTime = new Date(a.isRepost ? a.repostedAt : a.createdAt);
    const bTime = new Date(b.isRepost ? b.repostedAt : b.createdAt);
    return bTime - aTime;
  });

  res.status(200).json({
    success: true,
    data: merged,
  });
});

/**
 * ======================================================
 * LIKE / UNLIKE REEL
 * PUT /api/v1/reels/:reelId/like
 * ======================================================
 */
exports.toggleLike = catchAsync(async (req, res) => {
  const { reelId } = req.params;
  const userId = req.user.id;

  const target = await access.loadViewable(Reel, reelId, userId);
  const reel = await Reel.findById(reelId);

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  const isLiked = reel.likes.includes(userId);

  if (isLiked) {
    await Reel.findByIdAndUpdate(reelId, {
      $pull: { likes: userId },
      $inc: { likesCount: -1 },
    });

    access.emitForOwner(req.app.get('io'), target.user, 'reel_like_updated', {
      reelId,
      userId,
      liked: false,
      likesCount: reel.likesCount - 1,
    });

    return res.status(200).json({
      success: true,
      data: {
        liked: false,
        likesCount: reel.likesCount - 1,
      },
    });
  } else {
    await Reel.findByIdAndUpdate(reelId, {
      $push: { likes: userId },
      $inc: { likesCount: 1 },
    });

    const io = req.app.get('io');
    access.emitForOwner(io, target.user, 'reel_like_updated', {
      reelId,
      userId,
      liked: true,
      likesCount: reel.likesCount + 1,
    });
    if (io) {
      if (reel.user.toString() !== userId.toString()) {
        io.to(reel.user.toString()).emit('notification', {
          type: 'REEL_LIKE',
          from: userId,
          reelId,
          text: 'liked your reel',
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        liked: true,
        likesCount: reel.likesCount + 1,
      },
    });
  }
});

/**
 * ======================================================
 * INCREMENT VIEW COUNT
 * PUT /api/v1/reels/:reelId/view
 * ======================================================
 */
exports.incrementView = catchAsync(async (req, res) => {
  const { reelId } = req.params;

  await access.loadViewable(Reel, reelId, req.user.id);

  const reel = await Reel.findByIdAndUpdate(
    reelId,
    { $inc: { viewsCount: 1 } },
    { new: true }
  );

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      viewsCount: reel.viewsCount,
    },
  });
});

/**
 * ======================================================
 * DELETE REEL (OWNER ONLY)
 * DELETE /api/v1/reels/:reelId
 * ======================================================
 */
exports.deleteReel = catchAsync(async (req, res) => {
  const { reelId } = req.params;
  const userId = req.user.id;

  const reel = await Reel.findById(reelId).select('+videoKey');

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  if (reel.user.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this reel',
    });
  }

  // Video + thumbnail in S3, comments, reposts, saves.
  await contentDeletion.deleteReel(reel._id);

  const io = req.app.get('io');
  if (io) {
    io.emit('reel_deleted', { reelId });
  }

  logger.debug('✅ Reel deleted:', reelId);

  res.status(200).json({
    success: true,
    message: 'Reel deleted successfully',
  });
});

/**
 * ======================================================
 * GET REEL COMMENTS
 * GET /api/v1/reels/:reelId/comments
 * ======================================================
 */
exports.getComments = catchAsync(async (req, res) => {
  const { reelId } = req.params;

  await access.loadViewable(Reel, reelId, req.user.id);

  const reel = await Reel.findById(reelId)
    .select('comments commentsCount')
    .populate('comments.user', 'username profilePicture');

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  res.status(200).json({
    success: true,
    results: reel.comments.length,
    data: reel.comments,
  });
});

/**
 * ======================================================
 * ADD COMMENT TO REEL
 * POST /api/v1/reels/:reelId/comments
 * ======================================================
 */
exports.addComment = catchAsync(async (req, res) => {
  const { reelId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Comment text is required',
    });
  }

  await access.loadViewable(Reel, reelId, userId);

  const reel = await Reel.findById(reelId);

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  const commentData = {
    user: userId,
    text: text.trim(),
    createdAt: new Date(),
  };

  reel.comments.push(commentData);
  reel.commentsCount = reel.comments.length;
  await reel.save();

  await reel.populate('comments.user', 'username profilePicture');

  const newComment = reel.comments[reel.comments.length - 1];

  const io = req.app.get('io');
  if (io) {
    if (reel.user.toString() !== userId.toString()) {
      io.to(reel.user.toString()).emit('notification', {
        type: 'REEL_COMMENT',
        from: userId,
        reelId,
        text: 'commented on your reel',
      });
    }
  }

  logger.debug('✅ Comment added to reel:', reelId);

  res.status(201).json({
    success: true,
    data: newComment,
  });
});

/**
 * ======================================================
 * TOGGLE SAVE REEL
 * PUT /api/v1/reels/:reelId/save
 * ======================================================
 */
exports.toggleSaveReel = catchAsync(async (req, res) => {
  const { reelId } = req.params;
  const userId = req.user.id;

  await access.loadViewable(Reel, reelId, userId);

  const result = await reelService.toggleSaveReel(reelId, userId);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * ======================================================
 * GET SAVED REELS
 * GET /api/v1/reels/saved
 * ======================================================
 */
exports.getSavedReels = catchAsync(async (req, res) => {
  const hidden = new Set(await access.getHiddenAuthorIds(req.user.id));
  const reels = (await reelService.getSavedReels(req.user.id)).filter(
    (reel) => !hidden.has((reel.user?._id || reel.user)?.toString())
  );

  res.status(200).json({
    success: true,
    results: reels.length,
    data: reels,
  });
});

/**
 * ======================================================
 * REPOST A REEL
 * POST /api/v1/reels/:reelId/repost
 * ======================================================
 */
exports.repostReel = catchAsync(async (req, res) => {
  const { reelId } = req.params;
  const userId = req.user.id;

  await access.loadViewable(Reel, reelId, userId);
  await access.assertRepostable(Reel, reelId, userId);

  const result = await reelService.repostReelToProfile(reelId, userId);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
    });
  }

  const { originalOwnerId, alreadyReposted } = result;

  if (!alreadyReposted && originalOwnerId && originalOwnerId.toString() !== userId.toString()) {
    try {
      await notificationService.createNotification({
        recipient: originalOwnerId,
        sender: userId,
        type: 'repost',
        message: 'reposted your reel',
      });
    } catch (notifErr) {
      logger.error('Failed to create repost notification:', notifErr);
    }
  }

  res.status(201).json({
    success: true,
    data: { reelId, alreadyReposted },
  });
});