const Post = require('../models/Post');

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
  currentUserId = null
) => {
  const skip = (page - 1) * limit;

  const posts = await Post.find()
    .populate('user', 'username name profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (!currentUserId) return posts;

  return posts.map((post) => ({
    ...post,
    isLiked: Array.isArray(post.likes)
      ? post.likes.some(
          (id) => id.toString() === currentUserId.toString()
        )
      : false,
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

module.exports = {
  createPost,
  queryPosts,
  getPostById,
  deletePostById,
  toggleLike,
  getUserPosts,
  addComment,
  getComments,
};
