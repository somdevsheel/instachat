const postService = require('../services/post.service');
const notificationService = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');
const extractHashtags = require('../utils/extractHashtags');
const extractMentions = require('../utils/extractMentions');
const User = require('../models/user.model');
const Post = require('../models/Post');

/**
 * ======================================================
 * CDN BASE URL
 * Prefer CloudFront, fallback to S3 public URL
 * ======================================================
 */
const CDN_BASE_URL =
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/**
 * ======================================================
 * CREATE POST
 * POST /api/v1/feed/posts
 * ======================================================
 */
exports.createPost = catchAsync(async (req, res) => {
  const { caption, media, location } = req.body;
  const userId = req.user.id;

  const trimmedCaption = caption?.trim() || '';

  if (!media && !trimmedCaption) {
    return res.status(400).json({
      success: false,
      message: 'Post needs either media or text',
    });
  }

  let mediaWithUrls;
  if (media) {
    if (!media.type || !media.originalKey) {
      return res.status(400).json({
        success: false,
        message: 'Media is required with type and originalKey',
      });
    }

    if (!['image', 'video'].includes(media.type)) {
      return res.status(400).json({
        success: false,
        message: 'Media type must be image or video',
      });
    }

    mediaWithUrls = {
      type: media.type,
      originalKey: media.originalKey,
      variants: {
        original: `${CDN_BASE_URL}/${media.originalKey}`,
      },
    };
  }

  const post = await postService.createPost({
    user: userId,
    caption: trimmedCaption,
    media: mediaWithUrls,
    location: location?.trim() || '',
    hashtags: extractHashtags(trimmedCaption),
  });

  await post.populate('user', 'username profilePicture');

  res.status(201).json({
    success: true,
    data: post,
  });
});

/**
 * ======================================================
 * HOME FEED (ALL USERS)
 * GET /api/v1/feed
 * ======================================================
 */
exports.getFeed = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const currentUserId = req.user?.id || null;

  // 🚫 Disable caching (feeds must always be fresh)
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const filter = ['following', 'close_friends'].includes(req.query.filter)
    ? req.query.filter
    : 'for_you';

  const posts = await postService.queryPosts(limit, page, currentUserId, filter);

  res.status(200).json({
    success: true,
    page,
    limit,
    results: posts.length,
    data: posts,
  });
});

/**
 * ======================================================
 * GET SINGLE POST
 * GET /api/v1/feed/posts/:postId
 * ======================================================
 */
exports.getPostById = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const currentUserId = req.user?.id || null;

  const post = await postService.getPostById(postId, currentUserId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  res.status(200).json({
    success: true,
    data: post,
  });
});

/**
 * ======================================================
 * LIKE / UNLIKE POST
 * PUT /api/v1/feed/posts/:postId/like
 * ======================================================
 */
exports.likePost = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const result = await postService.toggleLike(postId, userId);

  // 🔔 CREATE NOTIFICATION (only when liking, not unliking)
  if (result.liked) {
    try {
      const post = await postService.getPostById(postId);
      
      await notificationService.createNotification({
        recipient: post.user._id,
        sender: userId,
        type: 'like',
        post: postId,
        message: 'liked your post',
      });
    } catch (notifErr) {
      console.error('Failed to create like notification:', notifErr);
      // Don't fail the like action if notification fails
    }
  }

  // 🔔 Real-time update (optional, safe)
  const io = req.app.get('io');
  if (io) {
    io.emit('post_like_updated', {
      postId,
      userId,
      liked: result.liked,
      likesCount: result.likesCount,
    });
  }

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * ======================================================
 * PROFILE POSTS (ONLY ONE USER)
 * GET /api/v1/feed/posts/user/:userId
 * ======================================================
 */
exports.getUserPosts = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id || null;

  const posts = await postService.getUserPosts(userId, currentUserId);

  res.status(200).json({
    success: true,
    results: posts.length,
    data: posts,
  });
});

/**
 * ======================================================
 * ADD COMMENT
 * POST /api/v1/feed/posts/:postId/comments
 * ======================================================
 */
exports.addComment = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const { text, replyTo } = req.body;
  const userId = req.user.id;

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Comment text is required',
    });
  }

  // Resolve @mentions in the text to real users (silently drops any
  // that don't match a real username — no error for a typo'd mention).
  const mentionedUsernames = extractMentions(text);
  const mentionedUsers = mentionedUsernames.length
    ? await User.find({ username: { $in: mentionedUsernames } }).select('_id')
    : [];

  const result = await postService.addComment(postId, {
    user: userId,
    content: text.trim(),
    replyTo: replyTo || null,
    mentions: mentionedUsers.map((u) => u._id),
  });

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  const { comment, postOwnerId, parentAuthorId } = result;

  // 🔔 NOTIFY — the parent comment's author for a reply, otherwise the
  // post owner. createNotification already no-ops on self-notifying.
  try {
    if (replyTo && parentAuthorId) {
      await notificationService.createNotification({
        recipient: parentAuthorId,
        sender: userId,
        type: 'comment',
        post: postId,
        message: 'replied to your comment',
      });
    } else if (postOwnerId) {
      await notificationService.createNotification({
        recipient: postOwnerId,
        sender: userId,
        type: 'comment',
        post: postId,
        message: 'commented on your post',
      });
    }
  } catch (notifErr) {
    console.error('Failed to create comment notification:', notifErr);
    // Don't fail the comment action if notification fails
  }

  // 🔔 NOTIFY mentioned users
  try {
    await Promise.all(
      mentionedUsers.map((user) =>
        notificationService.createNotification({
          recipient: user._id,
          sender: userId,
          type: 'mention',
          post: postId,
          message: 'mentioned you in a comment',
        })
      )
    );
  } catch (notifErr) {
    console.error('Failed to create mention notification:', notifErr);
  }

  res.status(201).json({
    success: true,
    data: comment,
  });
});

/**
 * ======================================================
 * GET COMMENTS (top-level only, with reply counts)
 * GET /api/v1/feed/posts/:postId/comments
 * ======================================================
 */
exports.getComments = catchAsync(async (req, res) => {
  const { postId } = req.params;

  const comments = await postService.getComments(postId, req.user.id);

  res.status(200).json({
    success: true,
    results: comments.length,
    data: comments,
  });
});

/**
 * ======================================================
 * GET REPLIES TO A COMMENT
 * GET /api/v1/feed/comments/:commentId/replies
 * ======================================================
 */
exports.getCommentReplies = catchAsync(async (req, res) => {
  const { commentId } = req.params;

  const replies = await postService.getCommentReplies(commentId, req.user.id);

  res.status(200).json({
    success: true,
    results: replies.length,
    data: replies,
  });
});

/**
 * ======================================================
 * TOGGLE COMMENT LIKE
 * PUT /api/v1/feed/comments/:commentId/like
 * ======================================================
 */
exports.toggleCommentLike = catchAsync(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const result = await postService.toggleCommentLike(commentId, userId);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found',
    });
  }

  if (
    result.liked &&
    result.commentUserId &&
    result.commentUserId.toString() !== userId.toString()
  ) {
    try {
      await notificationService.createNotification({
        recipient: result.commentUserId,
        sender: userId,
        type: 'like',
        message: 'liked your comment',
      });
    } catch (notifErr) {
      console.error('Failed to create comment-like notification:', notifErr);
    }
  }

  res.status(200).json({
    success: true,
    data: { liked: result.liked, likesCount: result.likesCount },
  });
});

/**
 * ======================================================
 * REPOST A POST
 * POST /api/v1/feed/posts/:postId/repost
 * ======================================================
 */
exports.repostPost = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const { caption } = req.body;
  const userId = req.user.id;

  const result = await postService.repostContent(postId, 'post', userId, caption);

  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  const { repost, originalOwnerId } = result;

  if (originalOwnerId && originalOwnerId.toString() !== userId.toString()) {
    try {
      await notificationService.createNotification({
        recipient: originalOwnerId,
        sender: userId,
        type: 'repost',
        post: repost.repostOf,
        message: 'reposted your post',
      });
    } catch (notifErr) {
      console.error('Failed to create repost notification:', notifErr);
    }
  }

  res.status(201).json({
    success: true,
    data: repost,
  });
});

/**
 * ======================================================
 * DELETE POST
 * DELETE /api/v1/feed/posts/:postId
 * ======================================================
 */
exports.deletePost = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const post = await postService.getPostById(postId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  if (post.user._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this post',
    });
  }

  await postService.deletePostById(postId);

  res.status(200).json({
    success: true,
    message: 'Post deleted successfully',
  });
});

/**
 * ======================================================
 * TRENDING HASHTAGS
 * GET /api/v1/feed/trending
 * ======================================================
 */
exports.getTrending = catchAsync(async (req, res) => {
  const tags = await postService.getTrendingHashtags();

  res.status(200).json({
    success: true,
    data: tags,
  });
});

/**
 * ======================================================
 * TOGGLE SAVE POST
 * PUT /api/v1/feed/posts/:postId/save
 * ======================================================
 */
exports.toggleSavePost = catchAsync(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  const post = await Post.exists({ _id: postId });
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  const user = await User.findById(userId).select('savedPosts');
  const alreadySaved = user.savedPosts.some((id) => id.toString() === postId);

  if (alreadySaved) {
    user.savedPosts.pull(postId);
  } else {
    user.savedPosts.push(postId);
  }
  await user.save();

  res.status(200).json({
    success: true,
    data: { saved: !alreadySaved },
  });
});

/**
 * ======================================================
 * INCREMENT SHARE COUNT
 * PUT /api/v1/feed/posts/:postId/share
 * ======================================================
 */
exports.sharePost = catchAsync(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findByIdAndUpdate(
    postId,
    { $inc: { shareCount: 1 } },
    { new: true }
  ).select('shareCount');

  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  res.status(200).json({
    success: true,
    data: { shareCount: post.shareCount },
  });
});

/**
 * ======================================================
 * GET SAVED POSTS
 * GET /api/v1/feed/saved
 * ======================================================
 */
exports.getSavedPosts = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('savedPosts');

  const posts = await Post.find({ _id: { $in: user.savedPosts } })
    .populate('user', 'username name profilePicture')
    .populate({
      path: 'repostOf',
      populate: { path: 'user', select: 'username name profilePicture' },
    })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    results: posts.length,
    data: posts,
  });
});