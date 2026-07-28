const Post = require('../models/Post');
const User = require('../models/user.model');
const Comment = require('../models/Comment');
const Reel = require('../models/Reel');

const REPOST_POPULATE = {
  path: 'repostOf',
  populate: { path: 'user', select: 'username name profilePicture' },
};

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
    .populate(REPOST_POPULATE)
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
    .populate(REPOST_POPULATE)
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
 * REPOST (a Post or a Reel)
 * Reposts are represented as a new Post document with
 * repostOf/repostOfModel pointing at the original content,
 * so they surface in feeds/profiles like any other post.
 * Reposting a repost re-targets onto the original content
 * instead of nesting repost-of-a-repost chains.
 * ======================================================
 */
const repostContent = async (contentId, contentType, userId, caption = '') => {
  const SourceModel = contentType === 'reel' ? Reel : Post;
  const source = await SourceModel.findById(contentId).select('repostOf repostOfModel');
  if (!source) return null;

  const targetId = source.repostOf || source._id;
  const targetModel = source.repostOfModel || (contentType === 'reel' ? 'Reel' : 'Post');
  const TargetModel = targetModel === 'Reel' ? Reel : Post;

  const original = await TargetModel.findById(targetId).select('user');
  if (!original) return null;

  const repost = await Post.create({
    user: userId,
    caption: caption?.trim() || '',
    repostOf: targetId,
    repostOfModel: targetModel,
  });

  await TargetModel.findByIdAndUpdate(targetId, { $inc: { shareCount: 1 } });
  await repost.populate('user', 'username name profilePicture');
  await repost.populate(REPOST_POPULATE);

  return { repost, originalOwnerId: original.user };
};

/**
 * ======================================================
 * GET USER POSTS
 * ======================================================
 */
const getUserPosts = async (userId, currentUserId = null) => {
  const posts = await Post.find({ user: userId })
    .populate('user', 'username name profilePicture')
    .populate(REPOST_POPULATE)
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
 * ADD COMMENT (or reply, if commentData.replyTo is set)
 * ======================================================
 */
const addComment = async (postId, commentData) => {
  const post = await Post.findById(postId).select('user');
  if (!post) return null;

  let parentAuthorId = null;
  let replyTo = commentData.replyTo || null;

  if (replyTo) {
    const parent = await Comment.findById(replyTo).select('user replyTo');
    if (!parent) {
      replyTo = null;
    } else {
      parentAuthorId = parent.user;
      // Replies stay one level deep in storage: replying to a reply
      // re-parents onto that reply's thread root, so the whole thread
      // still surfaces as one flat "View replies" list.
      if (parent.replyTo) {
        replyTo = parent.replyTo;
      }
    }
  }

  const comment = await Comment.create({
    post: postId,
    user: commentData.user,
    content: commentData.content,
    replyTo,
    mentions: commentData.mentions || [],
  });

  await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
  await comment.populate('user', 'username name profilePicture');
  await comment.populate('mentions', 'username');

  return { comment, postOwnerId: post.user, parentAuthorId };
};

/**
 * ======================================================
 * GET TOP-LEVEL COMMENTS (with reply counts)
 * ======================================================
 */
const getComments = async (postId, currentUserId = null) => {
  const comments = await Comment.find({ post: postId, replyTo: null })
    .sort({ createdAt: -1 })
    .populate('user', 'username name profilePicture')
    .populate('mentions', 'username')
    .lean();

  if (comments.length === 0) return [];

  const replyCounts = await Comment.aggregate([
    { $match: { replyTo: { $in: comments.map((c) => c._id) } } },
    { $group: { _id: '$replyTo', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(replyCounts.map((r) => [r._id.toString(), r.count]));

  return comments.map((c) => ({
    ...c,
    repliesCount: countMap.get(c._id.toString()) || 0,
    isLiked: currentUserId
      ? (c.likes || []).some((id) => id.toString() === currentUserId.toString())
      : false,
  }));
};

/**
 * ======================================================
 * GET REPLIES TO A COMMENT
 * ======================================================
 */
const getCommentReplies = async (commentId, currentUserId = null) => {
  const replies = await Comment.find({ replyTo: commentId })
    .sort({ createdAt: 1 })
    .populate('user', 'username name profilePicture')
    .populate('mentions', 'username')
    .lean();

  return replies.map((r) => ({
    ...r,
    isLiked: currentUserId
      ? (r.likes || []).some((id) => id.toString() === currentUserId.toString())
      : false,
  }));
};

/**
 * ======================================================
 * TOGGLE COMMENT LIKE
 * ======================================================
 */
const toggleCommentLike = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) return null;

  const liked = comment.likes.some((id) => id.toString() === userId.toString());
  if (liked) {
    comment.likes.pull(userId);
  } else {
    comment.likes.push(userId);
  }
  comment.likesCount = comment.likes.length;
  await comment.save();

  return { liked: !liked, likesCount: comment.likesCount, commentUserId: comment.user };
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
  getCommentReplies,
  toggleCommentLike,
  getTrendingHashtags,
  repostContent,
};
