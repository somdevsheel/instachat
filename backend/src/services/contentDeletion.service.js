const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Story = require('../models/Story');
const Comment = require('../models/Comment');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const { urlToKey, derivedKeys, collectMediaKeys, deleteS3Keys } = require('../utils/s3Media');

/**
 * ======================================================
 * CONTENT DELETION
 * ======================================================
 * Deleting a post / reel / story removes it everywhere — not just the
 * DB document: its media in S3 (incl. Lambda-generated variants), its
 * comments, other users' reposts and saves of it, and notifications
 * pointing at it. Used by both the owner's delete and admin delete.
 */

const deletePost = async (postId) => {
  const post = await Post.findById(postId).select('media repostOf').lean();
  if (!post) return false;

  await Promise.all([
    Post.deleteOne({ _id: post._id }),
    Comment.deleteMany({ post: post._id }),
    Post.deleteMany({ repostOf: post._id }),
    Notification.deleteMany({ post: post._id }),
    User.updateMany({ savedPosts: post._id }, { $pull: { savedPosts: post._id } }),
  ]);

  // Reposts have no media of their own.
  if (!post.repostOf) await deleteS3Keys(collectMediaKeys(post.media));
  return true;
};

const deleteReel = async (reelId) => {
  // '+videoKey' alone: mixing it with a field list drops the hidden field.
  const reel = await Reel.findById(reelId).select('+videoKey').lean();
  if (!reel) return false;

  await Promise.all([
    Reel.deleteOne({ _id: reel._id }),
    Comment.deleteMany({ reel: reel._id }),
    Post.deleteMany({ repostOf: reel._id }),
    User.updateMany(
      { $or: [{ savedReels: reel._id }, { 'repostedReels.reel': reel._id }] },
      { $pull: { savedReels: reel._id, repostedReels: { reel: reel._id } } }
    ),
  ]);

  await deleteS3Keys([
    reel.videoKey,
    ...derivedKeys(reel.videoKey),
    urlToKey(reel.thumbnailUrl),
  ]);
  return true;
};

const deleteStory = async (storyId) => {
  const story = await Story.findById(storyId).select('media').lean();
  if (!story) return false;

  await Story.deleteOne({ _id: story._id });
  await deleteS3Keys(collectMediaKeys(story.media));
  return true;
};

module.exports = { deletePost, deleteReel, deleteStory };
