const mongoose = require('mongoose');
const graph = require('./graph.service');

const User = require('../models/user.model');
const Post = require('../models/Post');
const Reel = require('../models/Reel');
const Story = require('../models/Story');
const Comment = require('../models/Comment');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const Notification = require('../models/notification.model');
const Report = require('../models/report.model');
const Listing = require('../models/Listing');
const Group = require('../models/Group');
const Event = require('../models/Event');
const Note = require('../models/Note');

/**
 * ======================================================
 * DATA EXPORT ("Download your data")
 * ======================================================
 * Everything we hold about a user, in a machine-readable JSON document
 * (right of access / data portability). Secrets are never included:
 * password hash, reset tokens, push tokens, token version.
 */

const usernamesFor = async (ids) => {
  if (!ids.length) return [];
  const users = await User.find({ _id: { $in: ids } }).select('username').lean();
  const byId = new Map(users.map((u) => [u._id.toString(), u.username]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
};

const exportUserData = async (userId) => {
  const uid = new mongoose.Types.ObjectId(String(userId));

  const user = await User.findById(uid)
    .select(
      'name username email phone gender dateOfBirth bio location website profilePicture ' +
        'isPrivate activityStatusVisible showReadReceipts twoFactorEnabled isVerified ' +
        'loginActivity savedPosts savedReels repostedReels createdAt updatedAt'
    )
    .lean();
  if (!user) return null;

  const chats = await Chat.find({ participants: uid }).select('_id isGroup groupName participants').lean();
  const chatIds = chats.map((c) => c._id);

  const [
    posts, reels, stories, comments, messages, notifications, reports, listings,
    groups, events, notes, followers, following, blocked, muted, closeFriends, requests,
  ] = await Promise.all([
    Post.find({ user: uid }).select('caption location hashtags media repostOf likesCount commentsCount createdAt').lean(),
    Reel.find({ user: uid }).select('caption videoUrl thumbnailUrl likesCount viewsCount commentsCount createdAt').lean(),
    Story.find({ user: uid }).select('media createdAt expiresAt').lean(),
    Comment.find({ user: uid }).select('content post reel replyTo createdAt').lean(),
    Message.find({ chat: { $in: chatIds }, deletedForEveryone: { $ne: true }, deletedFor: { $ne: uid } })
      .select('chat sender text attachment sharedPost sharedReel story createdAt')
      .sort({ createdAt: 1 })
      .lean(),
    Notification.find({ recipient: uid }).select('type message sender post createdAt read').lean(),
    Report.find({ reporter: uid }).select('targetType reason description status createdAt').lean(),
    Listing.find({ seller: uid }).select('title description price category location image isSold createdAt').lean(),
    Group.find({ members: uid }).select('name description creator createdAt').lean(),
    Event.find({ attendees: uid }).select('name description date location host').lean(),
    Note.find({ user: uid }).select('text createdAt expiresAt').lean(),
    graph.getFollowerIds(String(uid)).then(usernamesFor),
    graph.getFollowingIds(String(uid)).then(usernamesFor),
    graph.getBlockedIds(String(uid)).then(usernamesFor),
    graph.getMutedIds(String(uid)).then(usernamesFor),
    graph.getCloseFriendIds(String(uid)).then(usernamesFor),
    graph.getFollowRequestIds(String(uid)).then(usernamesFor),
  ]);

  // Show conversation partners by username rather than raw ids.
  const participantNames = new Map();
  (await User.find({ _id: { $in: chats.flatMap((c) => c.participants) } }).select('username').lean())
    .forEach((u) => participantNames.set(u._id.toString(), u.username));
  const nameOf = (id) => participantNames.get(String(id)) || '(deleted user)';

  const { loginActivity, savedPosts, savedReels, repostedReels, ...profile } = user;

  return {
    exportedAt: new Date().toISOString(),
    about:
      'Your InstaChat data. Media links point to the files themselves; ' +
      'messages include both sides of your conversations.',
    profile,
    settings: {
      privateAccount: !!user.isPrivate,
      activityStatusVisible: user.activityStatusVisible !== false,
      readReceipts: user.showReadReceipts !== false,
      twoFactorEnabled: !!user.twoFactorEnabled,
    },
    connections: {
      followers,
      following,
      blocked,
      muted,
      closeFriends,
      pendingFollowRequests: requests,
    },
    posts,
    reels,
    stories,
    comments,
    conversations: chats.map((c) => ({
      id: c._id,
      group: c.isGroup ? c.groupName || 'Group chat' : null,
      with: c.participants.map(nameOf).filter((n) => n !== user.username),
      messages: messages
        .filter((m) => m.chat.equals(c._id))
        .map((m) => ({
          from: nameOf(m.sender),
          text: m.text || '',
          attachment: m.attachment?.variants?.original || null,
          sharedPost: m.sharedPost || null,
          sharedReel: m.sharedReel || null,
          storyReply: m.story || null,
          sentAt: m.createdAt,
        })),
    })),
    saved: { posts: savedPosts || [], reels: savedReels || [], repostedReels: repostedReels || [] },
    notes,
    listings,
    groups,
    events,
    notifications,
    reportsYouFiled: reports,
    loginActivity: loginActivity || [],
  };
};

module.exports = { exportUserData };
