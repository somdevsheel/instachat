const postService = require('../services/post.service');
const notificationService = require('../services/notification.service');
const catchAsync = require('../utils/catchAsync');

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
  const { caption, media } = req.body;
  const userId = req.user.id;

  if (!media || !media.type || !media.originalKey) {
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

  const mediaWithUrls = {
    type: media.type,
    originalKey: media.originalKey,
    variants: {
      original: `${CDN_BASE_URL}/${media.originalKey}`,
    },
  };

  const post = await postService.createPost({
    user: userId,
    caption: caption?.trim() || '',
    media: mediaWithUrls,
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

  const posts = await postService.queryPosts(limit, page, currentUserId);

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
  const { text } = req.body;
  const userId = req.user.id;

  if (!text || !text.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Comment text is required',
    });
  }

  const commentData = {
    user: userId,
    text: text.trim(),
    createdAt: new Date(),
  };

  const post = await postService.addComment(postId, commentData);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found',
    });
  }

  // 🔔 CREATE NOTIFICATION
  try {
    await notificationService.createNotification({
      recipient: post.user._id,
      sender: userId,
      type: 'comment',
      post: postId,
      message: 'commented on your post',
    });
  } catch (notifErr) {
    console.error('Failed to create comment notification:', notifErr);
    // Don't fail the comment action if notification fails
  }

  res.status(201).json({
    success: true,
    data: post.comments,
  });
});

/**
 * ======================================================
 * GET COMMENTS
 * GET /api/v1/feed/posts/:postId/comments
 * ======================================================
 */
exports.getComments = catchAsync(async (req, res) => {
  const { postId } = req.params;

  const comments = await postService.getComments(postId);

  res.status(200).json({
    success: true,
    results: comments.length,
    data: comments,
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