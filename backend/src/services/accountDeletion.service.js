const mongoose = require('mongoose');
const graph = require('./graph.service');
const { urlToKey, derivedKeys, collectMediaKeys, deleteS3Keys } = require('../utils/s3Media');
const logger = require('../utils/logger');

const User = require('../models/user.model');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Story = require('../models/Story');
const Comment = require('../models/Comment');
const Notification = require('../models/notification.model');
const Report = require('../models/report.model');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const Note = require('../models/Note');
const Listing = require('../models/Listing');
const Group = require('../models/Group');
const Event = require('../models/Event');
const Otp = require('../models/Otp.model');

/**
 * ======================================================
 * ACCOUNT DELETION (full erasure)
 * ======================================================
 * Used by both "delete my account" and admin delete. Removes the user
 * and everything that is theirs or points at them:
 *
 * - their posts, reels, stories, comments, notes, listings, events and
 *   groups they created, notifications to/from them, reports by/about
 *   them, OTPs, social-graph rows (Postgres)
 * - every message they sent (+ attachments); 1-to-1 chats with them are
 *   deleted entirely; they're removed from group chats
 * - their likes, story views/reactions, reel comments, group/event
 *   memberships on OTHER people's content (counts kept consistent)
 * - other users' reposts / saves of their deleted content
 * - all their media in S3 (posts, reels, stories, chat attachments,
 *   listing images, avatar), deleted last and best-effort
 */

const deleteAccountData = async (userId) => {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const user = await User.findById(uid).select('email profilePicture').lean();
  if (!user) return null;

  /* ---------- gather what is being deleted ---------- */
  const [posts, reels, stories, listings, sentAttachments, chats] = await Promise.all([
    Post.find({ user: uid }).select('_id media').lean(),
    Reel.find({ user: uid }).select('_id videoKey thumbnailUrl').lean(),
    Story.find({ user: uid }).select('_id media').lean(),
    Listing.find({ seller: uid }).select('image').lean(),
    Message.find({ sender: uid, 'attachment.originalKey': { $exists: true } })
      .select('attachment')
      .lean(),
    Chat.find({ participants: uid }).select('_id isGroup').lean(),
  ]);

  const postIds = posts.map((p) => p._id);
  const reelIds = reels.map((r) => r._id);
  const storyIds = stories.map((s) => s._id);
  const directChatIds = chats.filter((c) => !c.isGroup).map((c) => c._id);
  const groupChatIds = chats.filter((c) => c.isGroup).map((c) => c._id);

  const s3Keys = [
    ...posts.flatMap((p) => collectMediaKeys(p.media)),
    ...reels.flatMap((r) => [r.videoKey, urlToKey(r.thumbnailUrl)]),
    ...stories.flatMap((s) => collectMediaKeys(s.media)),
    ...listings.flatMap((l) => [urlToKey(l.image), ...derivedKeys(urlToKey(l.image))]),
    ...sentAttachments.flatMap((m) => collectMediaKeys(m.attachment)),
    urlToKey(user.profilePicture),
    ...derivedKeys(urlToKey(user.profilePicture)),
  ];

  // Attachments in 1-to-1 chats from the OTHER person go too (the whole
  // conversation is removed).
  if (directChatIds.length) {
    const otherAttachments = await Message.find({
      chat: { $in: directChatIds },
      sender: { $ne: uid },
      'attachment.originalKey': { $exists: true },
    })
      .select('attachment')
      .lean();
    otherAttachments.forEach((m) => s3Keys.push(...collectMediaKeys(m.attachment)));
  }

  /* ---------- comments: keep counts on others' content right ---------- */
  const userComments = await Comment.find({ user: uid }).select('post reel').lean();
  const commentCounts = new Map();
  userComments.forEach((c) => {
    const key = c.post ? `Post:${c.post}` : c.reel ? `Reel:${c.reel}` : null;
    if (key) commentCounts.set(key, (commentCounts.get(key) || 0) + 1);
  });

  /* ---------- delete / detach ---------- */
  await Promise.all([
    // their own content (+ comments/reposts attached to it)
    Post.deleteMany({ user: uid }),
    Reel.deleteMany({ user: uid }),
    Story.deleteMany({ user: uid }),
    Comment.deleteMany({
      $or: [{ user: uid }, { post: { $in: postIds } }, { reel: { $in: reelIds } }],
    }),
    Post.deleteMany({ repostOf: { $in: [...postIds, ...reelIds] } }),
    Note.deleteMany({ user: uid }),
    Listing.deleteMany({ seller: uid }),
    Group.deleteMany({ creator: uid }),
    Event.deleteMany({ host: uid }),
    Notification.deleteMany({ $or: [{ recipient: uid }, { sender: uid }] }),
    Report.deleteMany({ $or: [{ reporter: uid }, { targetUser: uid }] }),
    Otp.deleteMany({ $or: [{ email: user.email }, { user: uid }] }),

    // messages: everything they sent, plus whole 1-to-1 conversations
    Message.deleteMany({ $or: [{ sender: uid }, { chat: { $in: directChatIds } }] }),
    Chat.deleteMany({ _id: { $in: directChatIds } }),
    Chat.updateMany(
      { _id: { $in: groupChatIds } },
      { $pull: { participants: uid, admins: uid } }
    ),
    Message.updateMany(
      { $or: [{ 'readBy.user': uid }, { deletedFor: uid }] },
      { $pull: { readBy: { user: uid }, deletedFor: uid } }
    ),

    // their footprint on other people's content
    Post.updateMany({ likes: uid }, { $pull: { likes: uid }, $inc: { likesCount: -1 } }),
    Reel.updateMany({ likes: uid }, { $pull: { likes: uid }, $inc: { likesCount: -1 } }),
    Comment.updateMany({ likes: uid }, { $pull: { likes: uid }, $inc: { likesCount: -1 } }),
    Comment.updateMany({ mentions: uid }, { $pull: { mentions: uid } }),
    // Reel comments are embedded: remove theirs and recount.
    Reel.updateMany({ 'comments.user': uid }, [
      {
        $set: {
          comments: {
            $filter: { input: '$comments', cond: { $ne: ['$$this.user', uid] } },
          },
        },
      },
      { $set: { commentsCount: { $size: '$comments' } } },
    ]),
    Story.updateMany(
      { $or: [{ seenBy: uid }, { 'reactions.user': uid }] },
      { $pull: { seenBy: uid, reactions: { user: uid } } }
    ),
    Group.updateMany({ members: uid }, { $pull: { members: uid } }),
    Event.updateMany({ attendees: uid }, { $pull: { attendees: uid } }),
    User.updateMany(
      {
        $or: [
          { savedPosts: { $in: postIds } },
          { savedReels: { $in: reelIds } },
          { 'repostedReels.reel': { $in: reelIds } },
        ],
      },
      {
        $pull: {
          savedPosts: { $in: postIds },
          savedReels: { $in: reelIds },
          repostedReels: { reel: { $in: reelIds } },
        },
      }
    ),

    graph.deleteUserGraph(String(uid)),
  ]);

  // Comment counters on other people's posts/reels they commented on.
  await Promise.all(
    [...commentCounts].map(([key, n]) => {
      const [model, id] = key.split(':');
      const M = model === 'Post' ? Post : Reel;
      return M.updateOne(
        { _id: id, commentsCount: { $gte: n } },
        { $inc: { commentsCount: -n } }
      );
    })
  );

  await User.deleteOne({ _id: uid });

  const mediaDeleted = await deleteS3Keys(s3Keys);
  logger.info('Account deleted', {
    userId: String(uid),
    posts: postIds.length,
    reels: reelIds.length,
    stories: storyIds.length,
    chats: directChatIds.length,
    mediaDeleted,
  });

  return { userId: String(uid), mediaDeleted };
};

module.exports = { deleteAccountData };
