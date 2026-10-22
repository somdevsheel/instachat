/**
 * ======================================================
 * SECURITY / PRODUCTION-READINESS TESTS
 * ======================================================
 * Runs the real app in-process (see helpers/app.js).
 *
 *   npm test
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { startTestApp, wait } = require('./helpers/app');

const User = require('../src/models/user.model');
const Chat = require('../src/models/chat.model');
const Post = require('../src/models/Post');
const Otp = require('../src/models/Otp.model');

let ctx, api, sign, connect;
let alice, bob, carol, banned;
let tA, tB, tC;
let chat;

before(async () => {
  ctx = await startTestApp();
  ({ api, sign, connect } = ctx);

  const mk = (u, extra = {}) =>
    User.create({
      name: u,
      username: u,
      email: `${u}@test.dev`,
      password: 'password123',
      isVerified: true,
      ...extra,
    });
  [alice, bob, carol, banned] = await Promise.all([
    mk('alice'),
    mk('bob'),
    mk('carol'),
    mk('banned', { isBanned: true }),
  ]);
  chat = await Chat.create({ participants: [alice._id, bob._id], isGroup: false });
  tA = sign(alice.id);
  tB = sign(bob.id);
  tC = sign(carol.id);
});

after(async () => {
  await ctx.stop();
});

/* =========================
   ROUTES / BASICS
========================= */
test('health endpoint responds', async () => {
  assert.equal((await api('GET', '/api/v1/health')).status, 200);
});

test('debug force-reset-password route does not exist', async () => {
  const r = await api('POST', '/api/debug/force-reset-password', {
    body: { userId: alice.id, newPassword: 'hacked123' },
  });
  assert.equal(r.status, 404);
});

/* =========================
   LOGIN
========================= */
test('login returns a token', async () => {
  const r = await api('POST', '/api/v1/auth/login', {
    body: { email: 'alice@test.dev', password: 'password123' },
  });
  assert.equal(r.status, 200);
  assert.ok(r.json.token);
});

test('banned user cannot log in', async () => {
  const r = await api('POST', '/api/v1/auth/login', {
    body: { email: 'banned@test.dev', password: 'password123' },
  });
  assert.equal(r.status, 403);
});

test('Mongo operator injection in login is rejected with 400', async () => {
  const r = await api('POST', '/api/v1/auth/login', {
    body: { email: { $ne: null }, password: 'x' },
  });
  assert.equal(r.status, 400);
});

test('non-string auth fields give 400, not 500', async () => {
  const r = await api('POST', '/api/v1/auth/forgot-password/verify-otp', {
    body: { email: ['x'], otp: 1, newPassword: {} },
  });
  assert.equal(r.status, 400);
});

test('failed logins are limited per IP+email without blocking other accounts', async () => {
  let last;
  for (let i = 0; i < 11; i++) {
    last = await api('POST', '/api/v1/auth/login', {
      body: { email: 'victim@test.dev', password: 'wrong' },
    });
  }
  assert.equal(last.status, 429);

  const other = await api('POST', '/api/v1/auth/login', {
    body: { email: 'bob@test.dev', password: 'password123' },
  });
  assert.equal(other.status, 200);
});

/* =========================
   TOKEN VERIFICATION
========================= */
test('valid token is accepted', async () => {
  assert.equal((await api('GET', '/api/v1/auth/me', { token: tA })).status, 200);
});

test('banned user token is rejected', async () => {
  assert.equal(
    (await api('GET', '/api/v1/auth/me', { token: sign(banned.id) })).status,
    403
  );
});

test('token for a deleted user gives 401, not 500', async () => {
  const ghost = sign(new mongoose.Types.ObjectId().toString());
  assert.equal((await api('GET', '/api/v1/users/privacy', { token: ghost })).status, 401);
});

test('token issued before a password change is rejected', async () => {
  const dave = await User.create({
    name: 'dave', username: 'dave', email: 'dave@test.dev', password: 'password123',
  });
  const oldToken = jwt.sign(
    { id: dave.id, iat: Math.floor(Date.now() / 1000) - 3600 },
    process.env.JWT_SECRET
  );
  await User.updateOne({ _id: dave._id }, { passwordChangedAt: new Date(Date.now() - 1000) });

  assert.equal((await api('GET', '/api/v1/auth/me', { token: oldToken })).status, 401);
  assert.equal((await api('GET', '/api/v1/auth/me', { token: sign(dave.id) })).status, 200);
});

/* =========================
   SESSION REVOCATION
========================= */
const loginAs = async (email) =>
  (await api('POST', '/api/v1/auth/login', { body: { email, password: 'password123' } })).json.token;

test('logout revokes that session only', async (t) => {
  await User.create({
    name: 'sessions', username: 'sessions', email: 'sessions@test.dev',
    password: 'password123', isVerified: true,
  });
  await wait(200); // let Redis connect
  if (ctx.redis.status !== 'ready') return t.skip('Redis not available');

  const phone = await loginAs('sessions@test.dev');
  const laptop = await loginAs('sessions@test.dev');

  assert.equal((await api('POST', '/api/v1/auth/logout', { token: phone })).status, 200);
  assert.equal((await api('GET', '/api/v1/auth/me', { token: phone })).status, 401);
  assert.equal((await api('GET', '/api/v1/auth/me', { token: laptop })).status, 200);
});

test('logout-all revokes every session, new logins still work', async () => {
  const a1 = await loginAs('sessions@test.dev');
  const a2 = await loginAs('sessions@test.dev');

  assert.equal((await api('POST', '/api/v1/auth/logout-all', { token: a1 })).status, 200);
  assert.equal((await api('GET', '/api/v1/auth/me', { token: a1 })).status, 401);
  assert.equal((await api('GET', '/api/v1/auth/me', { token: a2 })).status, 401);

  const fresh = await loginAs('sessions@test.dev');
  assert.equal((await api('GET', '/api/v1/auth/me', { token: fresh })).status, 200);
});

test('responses carry a request id', async () => {
  const r = await fetch(ctx.BASE + '/api/v1/health');
  assert.match(r.headers.get('x-request-id') || '', /^[0-9a-f-]{36}$/);
});

/* =========================
   CHAT AUTHORIZATION
========================= */
test('participants can send and read messages', async () => {
  const sent = await api('POST', '/api/v1/chats/message', {
    token: tA,
    body: { chatId: chat.id, receiverId: bob.id, text: 'hi bob' },
  });
  assert.ok([200, 201].includes(sent.status), JSON.stringify(sent.json));

  const hist = await api('GET', `/api/v1/chats/${chat.id}`, { token: tB });
  assert.equal(hist.status, 200);
  assert.ok(hist.json.data.length >= 1);
});

test('non-participant cannot read chat history', async () => {
  const r = await api('GET', `/api/v1/chats/${chat.id}`, { token: tC });
  assert.equal(r.status, 404);
  assert.equal(r.json.data, undefined);
});

test('non-participant cannot inject a message', async () => {
  const r = await api('POST', '/api/v1/chats/message', {
    token: tC,
    body: { chatId: chat.id, receiverId: bob.id, text: 'forged' },
  });
  assert.equal(r.status, 403);
});

test('non-participant cannot mark messages read', async () => {
  assert.equal((await api('POST', `/api/v1/chats/${chat.id}/read`, { token: tC })).status, 404);
});

test('malformed chat id gives 404, not 500', async () => {
  assert.equal((await api('GET', '/api/v1/chats/not-an-id', { token: tA })).status, 404);
});

/* =========================
   UPLOADS
========================= */
test('presign rejects browser-executable types', async () => {
  for (const mimeType of ['text/html', 'image/svg+xml', 'application/javascript']) {
    const r = await api('POST', '/api/v1/media/presign', {
      token: tA,
      body: { mediaType: 'image', mimeType },
    });
    assert.equal(r.status, 400, mimeType);
  }
});

test('presign accepts jpeg and derives extension from MIME', async () => {
  const r = await api('POST', '/api/v1/media/presign', {
    token: tA,
    body: { mediaType: 'image', mimeType: 'image/jpeg' },
  });
  assert.equal(r.status, 200);
  assert.match(r.json.data.key, new RegExp(`^users/${alice.id}/posts/images/.+\\.jpg$`));
});

test("cannot attach another user's uploaded key", async () => {
  const r = await api('POST', '/api/v1/feed/posts', {
    token: tC,
    body: { media: { type: 'image', originalKey: `users/${alice.id}/posts/images/x.jpg` } },
  });
  assert.equal(r.status, 403);
});

test('can attach own uploaded key', async () => {
  const r = await api('POST', '/api/v1/feed/posts', {
    token: tA,
    body: { media: { type: 'image', originalKey: `users/${alice.id}/posts/images/x.jpg` } },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
});

/* =========================
   SEARCH
========================= */
test('regex metacharacters in search do not error', async () => {
  const r = await api('GET', '/api/v1/users/search?q=' + encodeURIComponent('(a+)+$['), {
    token: tA,
  });
  assert.equal(r.status, 200);
});

/* =========================
   ACCOUNT CHANGES
========================= */
test('email change requires a code sent to the new address', async () => {
  const noCode = await api('PATCH', '/api/v1/users/account-info', {
    token: tB,
    body: { email: 'bob.new@test.dev' },
  });
  assert.equal(noCode.status, 400);
  assert.equal(noCode.json.code, 'EMAIL_OTP_REQUIRED');

  // Simulate the emailed code (SMTP is not available in tests).
  await Otp.create({
    email: 'bob.new@test.dev',
    user: bob._id,
    otp: '424242',
    purpose: 'change-email',
    expiresAt: new Date(Date.now() + 300000),
  });

  const wrong = await api('PATCH', '/api/v1/users/account-info', {
    token: tB,
    body: { email: 'bob.new@test.dev', emailOtp: '000000' },
  });
  assert.equal(wrong.status, 400);

  const ok = await api('PATCH', '/api/v1/users/account-info', {
    token: tB,
    body: { email: 'bob.new@test.dev', emailOtp: '424242' },
  });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  assert.equal((await User.findById(bob._id)).email, 'bob.new@test.dev');
});

test("another user's email-change code cannot be used", async () => {
  await Otp.create({
    email: 'stolen@test.dev',
    user: alice._id,
    otp: '515151',
    purpose: 'change-email',
    expiresAt: new Date(Date.now() + 300000),
  });
  const r = await api('PATCH', '/api/v1/users/account-info', {
    token: tC,
    body: { email: 'stolen@test.dev', emailOtp: '515151' },
  });
  assert.equal(r.status, 400);
});

test('profile update rejects a taken username', async () => {
  const r = await api('PUT', '/api/v1/users/update', {
    token: tC,
    body: { username: 'alice' },
  });
  assert.equal(r.status, 400);
});

/* =========================
   OTP BRUTE FORCE
========================= */
test('OTP is burned after 5 wrong guesses', async () => {
  await Otp.create({
    email: 'alice@test.dev',
    otp: '123456',
    purpose: 'forgot',
    expiresAt: new Date(Date.now() + 300000),
  });
  for (let i = 0; i < 5; i++) {
    await api('POST', '/api/v1/auth/forgot-password/verify-otp', {
      body: { email: 'alice@test.dev', otp: `00000${i}`, newPassword: 'newpassword1' },
    });
  }
  const r = await api('POST', '/api/v1/auth/forgot-password/verify-otp', {
    body: { email: 'alice@test.dev', otp: '123456', newPassword: 'newpassword1' },
  });
  assert.equal(r.status, 400);
});

/* =========================
   SOCKETS
========================= */
test('socket rooms and events are restricted to participants', async () => {
  const sa = await connect(tA);
  const sb = await connect(tB);
  const sc = await connect(tC);
  const sBanned = await connect(sign(banned.id));
  try {
    assert.ok(sa.ok && sb.ok && sc.ok, [sa.err, sb.err, sc.err].join());
    assert.equal(sBanned.ok, false, 'banned user socket should be rejected');

    const got = { b: [], c: [] };
    sb.s.on('typing', (p) => got.b.push(p));
    sc.s.on('typing', (p) => got.c.push(p));
    sb.s.on('message_received', (p) => got.b.push({ forged: p }));

    [sa, sb, sc].forEach((x) => x.s.emit('join_chat', chat.id));
    await wait(300);

    sa.s.emit('typing', chat.id);
    await wait(300);
    assert.ok(got.b.some((p) => p.userId === alice.id), 'bob should see typing');
    assert.equal(got.c.length, 0, 'carol must not join the room');

    sc.s.emit('typing', chat.id);
    sc.s.emit('new_message', {
      chat: { _id: chat.id, users: [{ _id: bob.id }] },
      sender: alice.id,
      text: 'forged!',
    });
    await wait(300);
    assert.ok(!got.b.some((p) => p.userId === carol.id || p.forged));
  } finally {
    [sa, sb, sc, sBanned].forEach((x) => x.s.close());
  }
});

test('realtime broadcasts reach clients (io is wired into the app)', async () => {
  const sb = await connect(tB);
  try {
    const post = await Post.create({
      user: bob._id,
      media: { type: 'image', originalKey: 'k', variants: { original: 'u' } },
    });
    let evt = null;
    sb.s.on('post_like_updated', (p) => {
      evt = p;
    });
    await api('PUT', `/api/v1/feed/posts/${post.id}/like`, { token: tA });
    await wait(300);
    assert.ok(evt, 'expected post_like_updated event');
  } finally {
    sb.s.close();
  }
});

/* =========================
   DATA LAYER
========================= */
test('chat list unread counts are correct (single aggregation)', async () => {
  const bobView = await api('GET', '/api/v1/chats', { token: tB });
  const aliceView = await api('GET', '/api/v1/chats', { token: tA });
  const forChat = (r) => r.json.data.find((c) => c._id === chat.id);
  assert.ok(forChat(bobView).unreadCount >= 1, 'bob has unread messages from alice');
  assert.equal(forChat(aliceView).unreadCount, 0, "alice's own messages aren't unread");

  await api('POST', `/api/v1/chats/${chat.id}/read`, { token: tB });
  const after = await api('GET', '/api/v1/chats', { token: tB });
  assert.equal(forChat(after).unreadCount, 0);
});

test('every model builds its indexes without conflicts', async () => {
  for (const name of mongoose.modelNames()) {
    // syncIndexes throws on conflicting definitions (e.g. two indexes
    // on the same key with different options).
    await mongoose.model(name).syncIndexes();
  }
});

test('reel thumbnails must be on our CDN under the uploader\'s folder', async () => {
  const evil = await api('POST', '/api/v1/reels', {
    token: tA,
    body: {
      videoKey: `users/${alice.id}/reels/v1.mp4`,
      thumbnailUrl: 'https://tracker.example/pixel.gif?victim=1',
    },
  });
  assert.equal(evil.status, 201, JSON.stringify(evil.json));
  assert.equal(evil.json.data.thumbnailUrl, '', 'third-party URL must be dropped');

  const otherUsers = await api('POST', '/api/v1/reels', {
    token: tA,
    body: {
      videoKey: `users/${alice.id}/reels/v2.mp4`,
      thumbnailUrl: `https://cdn.test/users/${bob.id}/reels/t.jpg`,
    },
  });
  assert.equal(otherUsers.json.data.thumbnailUrl, '', "someone else's file must be dropped");

  const own = await api('POST', '/api/v1/reels', {
    token: tA,
    body: {
      videoKey: `users/${alice.id}/reels/v3.mp4`,
      thumbnailUrl: `https://cdn.test/users/${alice.id}/reels/t.jpg`,
    },
  });
  assert.equal(own.json.data.thumbnailUrl, `https://cdn.test/users/${alice.id}/reels/t.jpg`);
});
