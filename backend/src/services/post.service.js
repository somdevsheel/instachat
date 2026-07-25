const Post = require('../models/Post');
const User = require('../models/user.model');

/**
 * ======================================================
 * CREATE POST
 * ======================================================
 */
const createPost = async (postBody) => {
  return await Post.create(postBody);
};

/**
 * ======================================================
 * QUERY FEED POSTS
 * Adds `isLiked` if currentUserId is provided
 * ======================================================
 */
const queryPosts = async (
  limit = 10,
  page = 1,
  currentUserId = null,
  filter = 'for_you'
) => {
  const skip = (page - 1) * limit;

  const me = currentUserId
    ? await User.findById(currentUserId).select('savedPosts following closeFriends')
    : null;

  const query = {};
  if (filter === 'following' && me) {
    query.user = { $in: [...me.following, currentUserId] };
  } else if (filter === 'close_friends' && me) {
    query.user = { $in: [...me.closeFriends, currentUserId] };
  }

  const posts = await Post.find(query)
    .populate('user', 'username name profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (!currentUserId) return posts;

  const savedSet = new Set((me?.savedPosts || []).map((id) => id.toString()));

  return posts.map((post) => ({
    ...post,
    isLiked: Array.isArray(post.likes)
      ? post.likes.some(
          (id) => id.toString() === currentUserId.toString()
        )
      : false,
    isSaved: savedSet.has(post._id.toString()),
  }));
};

/**
 * ======================================================
 * GET POST BY ID
 * ======================================================
 */
const getPostById = async (postId, currentUserId = null) => {
  const post = await Post.findById(postId)
    .populate('user', 'username name profilePicture')
    .lean();

  if (!post) return null;

  return {
    ...post,
    isLiked: currentUserId
      ? post.likes?.some(
          (id) => id.toString() === currentUserId.toString()
        )
      : false,
  };
};

/**
 * ======================================================
 * DELETE POST
 * ======================================================
 */
const deletePostById = async (postId) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  await Post.findByIdAndDelete(postId);
  return post;
};

/**
 * ======================================================
 * TOGGLE LIKE
 * ======================================================
 */
const toggleLike = async (postId, userId) => {
  const post = await Post.findById(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  const alreadyLiked = post.likes.some(
    (id) => id.toString() === userId.toString()
  );

  if (alreadyLiked) {
    post.likes = post.likes.filter(
      (id) => id.toString() !== userId.toString()
    );
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likes.push(userId);
    post.likesCount += 1;
  }

  await post.save();

  return {
    postId,
    userId,
    liked: !alreadyLiked,
    likesCount: post.likesCount,
  };
};

/**
 * ======================================================
 * GET USER POSTS
 * ======================================================
 */
const getUserPosts = async (userId, currentUserId = null) => {
  const posts = await Post.find({ user: userId })
    .populate('user', 'username name profilePicture')
    .sort({ createdAt: -1 })
    .lean();

  if (!currentUserId) return posts;

  return posts.map((post) => ({
    ...post,
    isLiked: post.likes?.some(
      (id) => id.toString() === currentUserId.toString()
    ),
  }));
};

/**
 * ======================================================
 * ADD COMMENT
 * ======================================================
 */
const addComment = async (postId, commentData) => {
  const post = await Post.findByIdAndUpdate(
    postId,
    {
      $push: { comments: commentData },
      $inc: { commentsCount: 1 },
    },
    { new: true }
  ).populate('comments.user', 'username name profilePicture');

  return post;
};

/**
 * ======================================================
 * GET COMMENTS
 * ======================================================
 */
const getComments = async (postId) => {
  const post = await Post.findById(postId).populate(
    'comments.user',
    'username name profilePicture'
  );

  return post?.comments || [];
};

/**
 * ======================================================
 * TRENDING HASHTAGS
 * Counts hashtag usage across recent posts.
 * ======================================================
 */
const getTrendingHashtags = async (limit = 5, sinceDays = 30) => {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  return Post.aggregate([
    { $match: { createdAt: { $gte: since }, hashtags: { $exists: true, $ne: [] } } },
    { $unwind: '$hashtags' },
    { $group: { _id: '$hashtags', postsCount: { $sum: 1 } } },
    { $sort: { postsCount: -1 } },
    { $limit: limit },
    { $project: { _id: 0, tag: '$_id', postsCount: 1 } },
  ]);
};

module.exports = {
  createPost,
  queryPosts,
  getPostById,
  deletePostById,
  toggleLike,
  getUserPosts,
  addComment,
  getComments,
  getTrendingHashtags,
};
