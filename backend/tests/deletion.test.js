/**
 * ======================================================
 * ACCOUNT DELETION (full erasure) TESTS
 * ======================================================
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestApp } = require('./helpers/app');

const User = require('../src/models/user.model');
const Post = require('../src/models/Post');
const Reel = require('../src/models/Reel');
const Story = require('../src/models/Story');
const Comment = require('../src/models/Comment');
const Chat = require('../src/models/chat.model');
const Message = require('../src/models/message.model');
const Notification = require('../src/models/notification.model');
const Listing = require('../src/models/Listing');
const Group = require('../src/models/Group');
const Event = require('../src/models/Event');
const Note = require('../src/models/Note');
const s3Client = require('../src/config/s3Client');

let ctx, api, sign;
const s3Deleted = [];

const mkUser = (name) =>
  User.create({
    name,
    username: name,
    email: `${name}@erase.dev`,
    password: 'password123',
    isVerified: true,
  });

before(async () => {
  ctx = await startTestApp();
  ({ api, sign } = ctx);
  // Record S3 deletions instead of calling AWS.
  s3Client.send = async (cmd) => {
    if (cmd.constructor.name === 'DeleteObjectsCommand') {
      s3Deleted.push(...cmd.input.Delete.Objects.map((o) => o.Key));
    }
    return {};
  };
});

after(async () => {
  await ctx.stop();
});

test('deleting an account erases all of its data and footprint', async () => {
  const [gone, friend, other] = await Promise.all([mkUser('gone'), mkUser('friend'), mkUser('other')]);
  const g = gone._id;
  // Mix of URL forms: current CDN URLs and legacy raw-bucket URLs.
  const cdn = 'https://cdn.test';
  const legacy = 'https://test-bucket.s3.us-east-1.amazonaws.com';
  await User.updateOne({ _id: g }, { profilePicture: `${legacy}/users/${g}/posts/images/avatar.jpg` });

  // --- gone's own content
  const ownPost = await Post.create({
    user: g,
    media: {
      type: 'image',
      originalKey: `users/${g}/posts/images/a.jpg`,
      variants: { original: `${cdn}/users/${g}/posts/images/a.jpg`, thumbnail: `${cdn}/users/${g}/posts/images/thumbnail/a.webp` },
    },
  });
  const ownReel = await Reel.create({ user: g, videoKey: `users/${g}/reels/r.mp4`, videoUrl: 'x' });
  await Story.create({ user: g, media: { type: 'image', key: `users/${g}/s.jpg`, url: 'x' } });
  await Comment.create({ user: friend._id, post: ownPost._id, content: 'on gone post' });
  await Listing.create({ title: 'bike', price: 10, seller: g, image: `${cdn}/users/${g}/posts/images/bike.jpg` });
  await Group.create({ name: 'gone group', creator: g, members: [g, friend._id] });
  await Note.create({ user: g, text: 'hi' });

  // --- gone's footprint on other people's stuff
  const friendPost = await Post.create({ user: friend._id, caption: 'fp', likes: [g, other._id], likesCount: 2, commentsCount: 1 });
  await Comment.create({ user: g, post: friendPost._id, content: 'by gone' });
  const friendReel = await Reel.create({
    user: friend._id, videoKey: 'k', videoUrl: 'x', likes: [g], likesCount: 1,
    comments: [{ user: g, text: 'gone reel comment' }, { user: other._id, text: 'keep me' }], commentsCount: 2,
  });
  const friendStory = await Story.create({
    user: friend._id, media: { type: 'image', key: 'k2', url: 'x' }, seenBy: [g, other._id],
    reactions: [{ user: g, emoji: '🔥' }],
  });
  const friendGroup = await Group.create({ name: 'fg', creator: friend._id, members: [friend._id, g] });
  const friendEvent = await Event.create({ name: 'party', date: new Date(Date.now() + 1e8), host: friend._id, attendees: [friend._id, g] });
  await User.updateOne({ _id: other._id }, { savedPosts: [ownPost._id], savedReels: [ownReel._id] });
  const repostByOther = await Post.create({ user: other._id, repostOf: ownPost._id, repostOfModel: 'Post' });

  // --- messages: 1-to-1 chat and a group chat
  const dm = await Chat.create({ participants: [g, friend._id], isGroup: false });
  await Message.create({ chat: dm._id, sender: g, receiver: friend._id, text: 'hello' });
  await Message.create({
    chat: dm._id, sender: friend._id, receiver: g, text: 'pic',
    attachment: { type: 'image', originalKey: `users/${friend._id}/chats/images/p.jpg`, variants: { original: 'x' } },
  });
  const groupChat = await Chat.create({ participants: [g, friend._id, other._id], isGroup: true, admins: [g] });
  await Message.create({ chat: groupChat._id, sender: g, receiver: friend._id, text: 'group hi',
    attachment: { type: 'image', originalKey: `users/${g}/chats/images/g.jpg`, variants: { original: 'x' } } });
  const keptGroupMsg = await Message.create({ chat: groupChat._id, sender: friend._id, receiver: other._id, text: 'still here', readBy: [{ user: g }] });

  // --- graph + notifications
  await api('POST', `/api/v1/users/follow/${friend.id}`, { token: sign(gone.id) });
  await api('POST', `/api/v1/users/follow/${gone.id}`, { token: sign(friend.id) });
  await Notification.create({ recipient: friend._id, sender: g, type: 'like', message: 'x' });

  // ===== delete =====
  const del = await api('DELETE', '/api/v1/users/delete-account', {
    token: sign(gone.id),
    body: { password: 'password123' },
  });
  assert.equal(del.status, 200, JSON.stringify(del.json));

  // own data gone
  assert.equal(await User.exists({ _id: g }), null);
  for (const [M, q] of [
    [Post, { user: g }], [Reel, { user: g }], [Story, { user: g }], [Comment, { user: g }],
    [Listing, { seller: g }], [Group, { creator: g }], [Note, { user: g }],
    [Notification, { $or: [{ sender: g }, { recipient: g }] }],
    [Message, { sender: g }],
  ]) {
    assert.equal(await M.countDocuments(q), 0, `${M.modelName} still has data`);
  }
  assert.equal(await Comment.countDocuments({ post: ownPost._id }), 0, 'comments on deleted post');
  assert.equal(await Post.exists({ _id: repostByOther._id }), null, 'repost of deleted post');

  // 1-to-1 chat removed entirely; group chat kept without them
  assert.equal(await Chat.exists({ _id: dm._id }), null);
  assert.equal(await Message.countDocuments({ chat: dm._id }), 0);
  const gc = await Chat.findById(groupChat._id).lean();
  assert.equal(gc.participants.some((p) => p.equals(g)), false);
  assert.equal(gc.admins.some((p) => p.equals(g)), false);
  const kept = await Message.findById(keptGroupMsg._id).lean();
  assert.ok(kept, "others' group messages stay");
  assert.equal(kept.readBy.some((r) => r.user.equals(g)), false);

  // footprint on others' content removed, counts consistent
  const fp = await Post.findById(friendPost._id).lean();
  assert.deepEqual(fp.likes.map(String), [other.id]);
  assert.equal(fp.likesCount, 1);
  assert.equal(fp.commentsCount, 0);
  const fr = await Reel.findById(friendReel._id).lean();
  assert.equal(fr.likes.length, 0);
  assert.equal(fr.likesCount, 0);
  assert.deepEqual(fr.comments.map((c) => c.text), ['keep me']);
  assert.equal(fr.commentsCount, 1);
  const fs = await Story.findById(friendStory._id).lean();
  assert.deepEqual(fs.seenBy.map(String), [other.id]);
  assert.equal(fs.reactions.length, 0);
  assert.deepEqual((await Group.findById(friendGroup._id).lean()).members.map(String), [friend.id]);
  assert.deepEqual((await Event.findById(friendEvent._id).lean()).attendees.map(String), [friend.id]);
  const o = await User.findById(other._id).select('savedPosts savedReels').lean();
  assert.equal(o.savedPosts.length + o.savedReels.length, 0);

  // social graph rows gone
  const { rows } = await ctx.pool.query(
    'SELECT count(*)::int n FROM follows WHERE follower_id = $1 OR following_id = $1',
    [gone.id]
  );
  assert.equal(rows[0].n, 0);

  // media deleted from S3 (theirs + the attachment in the deleted DM)
  for (const key of [
    `users/${g}/posts/images/a.jpg`,
    `users/${g}/posts/images/thumbnail/a.webp`,
    `users/${g}/reels/r.mp4`,
    `users/${g}/s.jpg`,
    `users/${g}/posts/images/bike.jpg`,
    `users/${g}/posts/images/avatar.jpg`,
    `users/${g}/posts/images/medium/avatar.webp`, // derived by the image Lambda
    `users/${g}/posts/images/medium/a.webp`,
    `users/${g}/posts/images/thumbnail/bike.webp`,
    `users/${g}/chats/images/g.jpg`,
    `users/${friend._id}/chats/images/p.jpg`,
  ]) {
    assert.ok(s3Deleted.includes(key), `S3 key not deleted: ${key}`);
  }
});

test('account deletion requires the correct password', async () => {
  const keep = await mkUser('keepme');
  const wrong = await api('DELETE', '/api/v1/users/delete-account', {
    token: sign(keep.id),
    body: { password: 'wrong-password' },
  });
  assert.equal(wrong.status, 401);
  const odd = await api('DELETE', '/api/v1/users/delete-account', {
    token: sign(keep.id),
    body: { password: { $ne: null } },
  });
  assert.notEqual(odd.status, 200);
  assert.ok(await User.exists({ _id: keep._id }));
});

/* =========================
   SINGLE-ITEM DELETES
========================= */
test('deleting a post removes its media (+variants), comments, reposts and saves', async () => {
  const [owner, fan] = await Promise.all([mkUser('postowner'), mkUser('postfan')]);
  const o = owner._id;
  const post = await Post.create({
    user: o,
    media: { type: 'image', originalKey: `users/${o}/posts/images/p1.jpg`, variants: { original: `https://cdn.test/users/${o}/posts/images/p1.jpg` } },
  });
  await Comment.create({ user: fan._id, post: post._id, content: 'nice' });
  const repost = await Post.create({ user: fan._id, repostOf: post._id, repostOfModel: 'Post' });
  await User.updateOne({ _id: fan._id }, { savedPosts: [post._id] });
  s3Deleted.length = 0;

  const r = await api('DELETE', `/api/v1/feed/posts/${post.id}`, { token: sign(owner.id) });
  assert.equal(r.status, 200);
  assert.equal(await Comment.countDocuments({ post: post._id }), 0);
  assert.equal(await Post.exists({ _id: repost._id }), null);
  assert.equal((await User.findById(fan._id).select('savedPosts').lean()).savedPosts.length, 0);
  for (const key of [
    `users/${o}/posts/images/p1.jpg`,
    `users/${o}/posts/images/thumbnail/p1.webp`,
    `users/${o}/posts/images/medium/p1.webp`,
  ]) {
    assert.ok(s3Deleted.includes(key), `missing ${key}`);
  }
});

test('deleting a story or reel removes its media from S3', async () => {
  const owner = await mkUser('mediaowner');
  const o = owner._id;
  const story = await Story.create({ user: o, media: { type: 'image', key: `users/${o}/posts/images/st.jpg`, url: 'x' } });
  const reel = await Reel.create({
    user: o, videoKey: `users/${o}/reels/rv.mp4`, videoUrl: 'x',
    thumbnailUrl: `https://cdn.test/users/${o}/reels/rv-thumb.jpg`,
  });
  s3Deleted.length = 0;

  assert.equal((await api('DELETE', `/api/v1/stories/${story.id}`, { token: sign(owner.id) })).status, 200);
  assert.equal((await api('DELETE', `/api/v1/reels/${reel.id}`, { token: sign(owner.id) })).status, 200);
  for (const key of [
    `users/${o}/posts/images/st.jpg`,
    `users/${o}/posts/images/thumbnail/st.webp`,
    `users/${o}/reels/rv.mp4`,
    `users/${o}/reels/rv-thumb.jpg`,
  ]) {
    assert.ok(s3Deleted.includes(key), `missing ${key}`);
  }
});

test('"delete for everyone" erases message text and attachment', async () => {
  const [a, b] = await Promise.all([mkUser('dm_a'), mkUser('dm_b')]);
  const chat = await Chat.create({ participants: [a._id, b._id], isGroup: false });
  const msg = await Message.create({
    chat: chat._id, sender: a._id, receiver: b._id, text: 'secret',
    attachment: { type: 'image', originalKey: `users/${a._id}/chats/images/x.jpg`, variants: { original: 'x' } },
  });
  s3Deleted.length = 0;

  const r = await api('POST', `/api/v1/chats/message/${msg.id}/delete`, {
    token: sign(a.id),
    body: { mode: 'everyone' },
  });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const after = await Message.findById(msg._id).lean();
  assert.equal(after.deletedForEveryone, true);
  assert.equal(after.text, '');
  assert.equal(after.attachment, undefined);
  assert.ok(s3Deleted.includes(`users/${a._id}/chats/images/x.jpg`));
});
