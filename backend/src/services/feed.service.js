const Post = require('../models/Post');
const User = require('../models/user.model');
const MediaService = require('./media.service');

/**
 * ======================================================
 * GET MAIN FEED (FOLLOWING + SELF)
 * ======================================================
 * Logic:
 * 1. Get users I follow
 * 2. Include my own userId
 * 3. Fetch posts
 * 4. Sort by newest
 * 5. Add isLiked flag
 */
exports.getFeedForUser = async (userId, page = 1, limit = 10) => {
  const user = await User.findById(userId).select('following');

  if (!user) {
    throw new Error('User not found');
  }

  const followingList = [...user.following, userId];
  const skip = (page - 1) * limit;

  const posts = await Post.find({ user: { $in: followingList } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username profilePicture')
    .lean();

  const postsWithLikeStatus = posts.map(post => ({
    ...post,
    isLiked: post.likes?.some(
      id => id.toString() === userId.toString()
    ),
  }));

  const totalPosts = await Post.countDocuments({
    user: { $in: followingList },
  });

  return {
    posts: postsWithLikeStatus,
    totalPages: Math.ceil(totalPosts / limit),
  };
};

/**
 * ======================================================
 * GET POSTS BY USER (PROFILE GRID)
 * ======================================================
 */
exports.getPostsByUser = async (targetUserId) => {
  return await Post.find({ user: targetUserId })
    .sort({ createdAt: -1 })
    .populate('user', 'username profilePicture');
};

/**
 * ======================================================
 * GET SINGLE POST
 * ======================================================
 */
exports.getPostById = async (postId) => {
  return await Post.findById(postId).populate(
    'user',
    'username profilePicture'
  );
};

/**
 * ======================================================
 * TOGGLE LIKE (ATOMIC)
 * ======================================================
 */
exports.toggleLike = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) throw new Error('Post not found');

  const isLiked = post.likes.includes(userId);

  if (isLiked) {
    await Post.findByIdAndUpdate(postId, {
      $pull: { likes: userId },
      $inc: { likesCount: -1 },
    });
    return { liked: false, likesCount: post.likesCount - 1 };
  } else {
    await Post.findByIdAndUpdate(postId, {
      $push: { likes: userId },
      $inc: { likesCount: 1 },
    });
    return { liked: true, likesCount: post.likesCount + 1 };
  }
};

/**
 * ======================================================
 * DELETE POST (OWNER ONLY)
 * ======================================================
 */
exports.deletePost = async (postId, userId) => {
  const post = await Post.findById(postId).select('+imageKey');

  if (!post) {
    throw new Error('Post not found');
  }

  if (post.user.toString() !== userId.toString()) {
    throw new Error('Not authorized to delete this post');
  }

  if (post.imageKey) {
    await MediaService.deleteFile(post.imageKey);
  }

  await post.deleteOne();
  return true;
};
