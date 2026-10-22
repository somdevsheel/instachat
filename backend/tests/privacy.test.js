/**
 * ======================================================
 * PRIVATE ACCOUNTS + BLOCKING TESTS
 * ======================================================
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestApp, wait } = require('./helpers/app');

const User = require('../src/models/user.model');
const Post = require('../src/models/Post');
const Reel = require('../src/models/Reel');
const Story = require('../src/models/Story');

let ctx, api, sign, connect;
const u = {};
const t = {};
let privPost, privReel, pubPost;

const mkUser = (name, extra = {}) =>
  User.create({
    name,
    username: name,
    email: `${name}@privacy.dev`,
    password: 'password123',
    isVerified: true,
    ...extra,
  });

const feedAuthors = (r) =>
  new Set((r.json.data || []).map((p) => p.user?.username));

before(async () => {
  ctx = await startTestApp();
  ({ api, sign, connect } = ctx);

  for (const [name, extra] of [
    ['priv', { isPrivate: true }],
    ['fan', {}],
    ['stranger', {}],
    ['pub', {}],
    ['blocker', {}],
    ['pest', {}],
  ]) {
    u[name] = await mkUser(name, extra);
    t[name] = sign(u[name].id);
  }

  privPost = await Post.create({ user: u.priv._id, caption: 'private post' });
  pubPost = await Post.create({ user: u.pub._id, caption: 'public post' });
  privReel = await Reel.create({
    user: u.priv._id,
    videoKey: `users/${u.priv.id}/reels/a.mp4`,
    videoUrl: 'https://cdn.test/a.mp4',
  });

  // fan follows priv (request + accept)
  await api('POST', `/api/v1/users/follow/${u.priv.id}`, { token: t.fan });
  await api('POST', `/api/v1/users/follow-requests/${u.fan.id}/accept`, { token: t.priv });
});

after(async () => {
  await ctx.stop();
});

/* =========================
   PRIVATE ACCOUNTS
========================= */
test('non-follower sees a locked private profile (header only)', async () => {
  const r = await api('GET', '/api/v1/users/profile/priv', { token: t.stranger });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.isPrivate, true);
  assert.equal(r.json.data.isLocked, true);
  assert.deepEqual(r.json.data.posts, []);
  assert.equal(r.json.data.postsCount, 1);
});

test('follower sees the private profile content', async () => {
  const r = await api('GET', '/api/v1/users/profile/priv', { token: t.fan });
  assert.equal(r.json.data.isLocked, false);
  assert.equal(r.json.data.posts.length, 1);
});

test('non-follower is denied every private content endpoint', async () => {
  const pid = privPost.id;
  const rid = privReel.id;
  const cases = [
    ['GET', `/api/v1/feed/posts/user/${u.priv.id}`],
    ['GET', `/api/v1/feed/posts/${pid}`],
    ['PUT', `/api/v1/feed/posts/${pid}/like`],
    ['GET', `/api/v1/feed/posts/${pid}/comments`],
    ['POST', `/api/v1/feed/posts/${pid}/comments`, { text: 'hi' }],
    ['PUT', `/api/v1/feed/posts/${pid}/save`],
    ['POST', `/api/v1/feed/posts/${pid}/repost`],
    ['GET', `/api/v1/reels/${rid}`],
    ['GET', `/api/v1/reels/user/${u.priv.id}`],
    ['PUT', `/api/v1/reels/${rid}/like`],
    ['GET', `/api/v1/reels/${rid}/comments`],
    ['GET', `/api/v1/users/${u.priv.id}/followers`],
  ];
  for (const [method, url, body] of cases) {
    const r = await api(method, url, { token: t.stranger, body });
    assert.equal(r.status, 403, `${method} ${url} -> ${r.status}`);
    assert.equal(r.json.code, 'PRIVATE_ACCOUNT', `${method} ${url}`);
  }
  // Nothing was changed by the denied writes.
  const fresh = await Post.findById(pid).lean();
  assert.equal(fresh.likes?.length || 0, 0);
});

test('follower can view and interact with private content', async () => {
  assert.equal((await api('GET', `/api/v1/feed/posts/${privPost.id}`, { token: t.fan })).status, 200);
  assert.equal((await api('PUT', `/api/v1/feed/posts/${privPost.id}/like`, { token: t.fan })).status, 200);
  assert.equal((await api('GET', `/api/v1/reels/${privReel.id}`, { token: t.fan })).status, 200);
});

test('feeds hide private accounts from non-followers', async () => {
  const strangerFeed = await api('GET', '/api/v1/feed?filter=for_you', { token: t.stranger });
  assert.ok(!feedAuthors(strangerFeed).has('priv'));
  assert.ok(feedAuthors(strangerFeed).has('pub'));

  const fanFeed = await api('GET', '/api/v1/feed?filter=for_you', { token: t.fan });
  assert.ok(feedAuthors(fanFeed).has('priv'));

  const reels = await api('GET', '/api/v1/reels/feed', { token: t.stranger });
  assert.ok(!(reels.json.data || []).some((r) => r.user?.username === 'priv'));
});

test('private content cannot be reposted, even by followers', async () => {
  const r = await api('POST', `/api/v1/feed/posts/${privPost.id}/repost`, { token: t.fan });
  assert.equal(r.status, 403);
});

test('old reposts of now-private content are redacted for non-followers', async () => {
  await Post.create({ user: u.pub._id, repostOf: privPost._id, repostOfModel: 'Post' });
  const r = await api('GET', '/api/v1/feed?filter=for_you', { token: t.stranger });
  const repost = r.json.data.find((p) => p.user?.username === 'pub' && (p.repostUnavailable || p.repostOf));
  assert.ok(repost, 'repost should still appear');
  assert.equal(repost.repostOf, null);
  assert.equal(repost.repostUnavailable, true);
});

test('follow request: request, cancel, request again, accept', async () => {
  const req1 = await api('POST', `/api/v1/users/follow/${u.priv.id}`, { token: t.stranger });
  assert.deepEqual([req1.json.following, req1.json.requested], [false, true]);

  const profile = await api('GET', '/api/v1/users/profile/priv', { token: t.stranger });
  assert.equal(profile.json.data.isRequested, true);

  const cancel = await api('POST', `/api/v1/users/follow/${u.priv.id}`, { token: t.stranger });
  assert.equal(cancel.json.requested, false);

  await api('POST', `/api/v1/users/follow/${u.priv.id}`, { token: t.stranger });
  const list = await api('GET', '/api/v1/users/follow-requests', { token: t.priv });
  assert.deepEqual(list.json.data.map((x) => x.username), ['stranger']);

  const notifs = await api('GET', '/api/v1/notifications', { token: t.priv });
  assert.ok(JSON.stringify(notifs.json).includes('follow_request'));

  const acc = await api('POST', `/api/v1/users/follow-requests/${u.stranger.id}/accept`, { token: t.priv });
  assert.equal(acc.status, 200);
  assert.equal(
    (await api('GET', `/api/v1/feed/posts/${privPost.id}`, { token: t.stranger })).status,
    200
  );

  // Clean up: stranger unfollows again for later tests.
  await api('POST', `/api/v1/users/follow/${u.priv.id}`, { token: t.stranger });
});

test('decline removes the request; unknown request gives 404', async () => {
  await api('POST', `/api/v1/users/follow/${u.priv.id}`, { token: t.pub });
  const dec = await api('POST', `/api/v1/users/follow-requests/${u.pub.id}/decline`, { token: t.priv });
  assert.equal(dec.status, 200);
  assert.equal(
    (await api('POST', `/api/v1/users/follow-requests/${u.pub.id}/accept`, { token: t.priv })).status,
    404
  );
});

test('going public accepts all pending requests', async () => {
  const shy = await mkUser('shy', { isPrivate: true });
  await api('POST', `/api/v1/users/follow/${shy.id}`, { token: t.pub });
  await api('PATCH', '/api/v1/users/privacy', { token: sign(shy.id), body: { isPrivate: false } });
  const r = await api('GET', '/api/v1/users/profile/shy', { token: t.pub });
  assert.equal(r.json.data.isFollowing, true);
  assert.equal(r.json.data.followersCount, 1);
});

test('private like events are not broadcast to everyone', async () => {
  const watcher = await connect(t.stranger);
  const owner = await connect(t.priv);
  try {
    const seen = { watcher: 0, owner: 0 };
    watcher.s.on('post_like_updated', () => seen.watcher++);
    owner.s.on('post_like_updated', () => seen.owner++);
    await api('PUT', `/api/v1/feed/posts/${privPost.id}/like`, { token: t.fan });
    await wait(300);
    assert.equal(seen.owner, 1);
    assert.equal(seen.watcher, 0);
  } finally {
    watcher.s.close();
    owner.s.close();
  }
});

test('private posts cannot be shared by DM to someone who cannot see them', async () => {
  const chat = await api('GET', `/api/v1/chats/with/${u.stranger.id}`, { token: t.fan });
  const r = await api('POST', '/api/v1/chats/message', {
    token: t.fan,
    body: { chatId: chat.json.data._id, receiverId: u.stranger.id, sharedPostId: privPost.id },
  });
  assert.equal(r.status, 403);
});

/* =========================
   BLOCKING
========================= */
test('blocking hides everything in both directions', async () => {
  const blockerPost = await Post.create({ user: u.blocker._id, caption: 'mine' });
  const pestPost = await Post.create({ user: u.pest._id, caption: 'pest post' });

  const b = await api('POST', `/api/v1/users/block/${u.pest.id}`, { token: t.blocker });
  assert.equal(b.json.blocked, true);

  // pest can't see or touch blocker
  assert.equal((await api('GET', '/api/v1/users/profile/blocker', { token: t.pest })).status, 404);
  assert.equal((await api('GET', `/api/v1/feed/posts/${blockerPost.id}`, { token: t.pest })).status, 404);
  assert.equal((await api('PUT', `/api/v1/feed/posts/${blockerPost.id}/like`, { token: t.pest })).status, 404);
  assert.equal(
    (await api('POST', `/api/v1/feed/posts/${blockerPost.id}/comments`, { token: t.pest, body: { text: 'hey' } })).status,
    404
  );
  assert.equal((await api('GET', `/api/v1/chats/with/${u.blocker.id}`, { token: t.pest })).status, 403);
  assert.equal((await api('POST', `/api/v1/users/follow/${u.blocker.id}`, { token: t.pest })).status, 403);

  const search = await api('GET', '/api/v1/users/search?q=block', { token: t.pest });
  assert.ok(!search.json.data.some((x) => x.username === 'blocker'));

  const pestFeed = await api('GET', '/api/v1/feed?filter=for_you', { token: t.pest });
  assert.ok(!feedAuthors(pestFeed).has('blocker'));

  // ...and the blocker doesn't see the pest either
  const blockerFeed = await api('GET', '/api/v1/feed?filter=for_you', { token: t.blocker });
  assert.ok(!feedAuthors(blockerFeed).has('pest'));
  assert.equal((await api('GET', `/api/v1/feed/posts/${pestPost.id}`, { token: t.blocker })).status, 404);
});

test('blocked users cannot message through an existing chat', async () => {
  // A chat that existed before the block.
  const Chat = require('../src/models/chat.model');
  const chat = await Chat.create({ participants: [u.blocker._id, u.pest._id], isGroup: false });
  const r = await api('POST', '/api/v1/chats/message', {
    token: t.pest,
    body: { chatId: chat.id, receiverId: u.blocker.id, text: 'let me in' },
  });
  assert.equal(r.status, 403);
});

test('story reactions are visible only to the story owner', async () => {
  const story = await Story.create({
    user: u.pub._id,
    media: { type: 'image', key: `users/${u.pub.id}/s.jpg`, url: 'x' },
  });
  await api('POST', `/api/v1/stories/${story.id}/react`, { token: t.fan, body: { reaction: '🔥' } });
  assert.equal((await api('GET', `/api/v1/stories/${story.id}/reactions`, { token: t.stranger })).status, 403);
  const own = await api('GET', `/api/v1/stories/${story.id}/reactions`, { token: t.pub });
  assert.equal(own.status, 200);
  assert.equal(own.json.data.length, 1);
});

test('cannot react to a story you are not allowed to see', async () => {
  const story = await Story.create({
    user: u.priv._id,
    media: { type: 'image', key: `users/${u.priv.id}/s.jpg`, url: 'x' },
  });
  const r = await api('POST', `/api/v1/stories/${story.id}/react`, { token: t.stranger, body: { reaction: '🔥' } });
  assert.equal(r.status, 403);
});
