/**
 * ======================================================
 * USER PRIVACY SETTINGS + RIGHTS TESTS
 * ======================================================
 * Activity status, read receipts, mute, login activity, data export,
 * sign-up consent.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestApp, wait } = require('./helpers/app');

const User = require('../src/models/user.model');
const Post = require('../src/models/Post');
const Reel = require('../src/models/Reel');
const Story = require('../src/models/Story');
const Chat = require('../src/models/chat.model');
const Message = require('../src/models/message.model');

let ctx, api, sign, connect, redis;
const u = {};
const t = {};

const mkUser = (name, extra = {}) =>
  User.create({
    name,
    username: name,
    email: `${name}@privacy2.dev`,
    password: 'password123',
    isVerified: true,
    lastSeen: new Date(Date.now() - 3600000),
    ...extra,
  });

before(async () => {
  ctx = await startTestApp();
  ({ api, sign, connect, redis } = ctx);
  for (const name of ['amy', 'bo', 'cy', 'di']) {
    u[name] = await mkUser(name);
    t[name] = sign(u[name].id);
  }
});

after(async () => {
  await ctx.stop();
});

/* =========================
   ACTIVITY STATUS
========================= */
test('activity status: hidden when turned off, and reciprocal', async () => {
  const seen = async (viewer, target) => {
    const r = await api('GET', `/api/v1/users/profile/${target}`, { token: t[viewer] });
    return { online: r.json.data.online, lastSeen: r.json.data.lastSeen };
  };

  assert.notEqual((await seen('amy', 'bo')).lastSeen, null, 'visible by default');

  await api('PATCH', '/api/v1/users/privacy', { token: t.bo, body: { activityStatusVisible: false } });
  assert.deepEqual(await seen('amy', 'bo'), { online: false, lastSeen: null }, 'bo hid it');
  assert.deepEqual(await seen('bo', 'amy'), { online: false, lastSeen: null }, 'bo can no longer see others');

  const search = await api('GET', '/api/v1/users/search?q=bo', { token: t.amy });
  const row = search.json.data.find((x) => x.username === 'bo');
  assert.equal(row.lastSeen, null);

  await api('PATCH', '/api/v1/users/privacy', { token: t.bo, body: { activityStatusVisible: true } });
  assert.notEqual((await seen('amy', 'bo')).lastSeen, null, 'visible again');
});

/* =========================
   READ RECEIPTS
========================= */
test('read receipts: off hides them both ways in 1:1 chats, never in groups', async () => {
  const dm = await Chat.create({ participants: [u.amy._id, u.bo._id], isGroup: false });
  await Message.create({ chat: dm._id, sender: u.amy._id, receiver: u.bo._id, text: 'hi bo', readBy: [{ user: u.amy._id }] });

  await api('PATCH', '/api/v1/users/privacy', { token: t.bo, body: { showReadReceipts: false } });

  // bo reads amy's message: amy must not get a live receipt.
  const amySock = await connect(t.amy);
  let receipt = null;
  amySock.s.on('messages_read', (p) => { receipt = p; });
  await api('POST', `/api/v1/chats/${dm.id}/read`, { token: t.bo });
  await wait(300);
  assert.equal(receipt, null, 'no live read receipt');
  amySock.s.close();

  const amyView = await api('GET', `/api/v1/chats/${dm.id}`, { token: t.amy });
  assert.deepEqual(
    amyView.json.data[0].readBy.map((r) => String(r.user)),
    [u.amy.id],
    "amy can't see that bo read it"
  );
  const boView = await api('GET', `/api/v1/chats/${dm.id}`, { token: t.bo });
  assert.ok(boView.json.data[0].readBy.some((r) => String(r.user) === u.bo.id), 'bo still sees own state');

  // Reciprocal: bo (receipts off) can't see amy's receipts either.
  await Message.create({ chat: dm._id, sender: u.bo._id, receiver: u.amy._id, text: 'hey', readBy: [{ user: u.bo._id }, { user: u.amy._id }] });
  const boView2 = await api('GET', `/api/v1/chats/${dm.id}`, { token: t.bo });
  const last = boView2.json.data[boView2.json.data.length - 1];
  assert.equal(last.readBy.some((r) => String(r.user) === u.amy.id), false);

  // Group chats always show receipts.
  const group = await Chat.create({ participants: [u.amy._id, u.bo._id, u.cy._id], isGroup: true });
  await Message.create({ chat: group._id, sender: u.amy._id, receiver: u.cy._id, text: 'group', readBy: [{ user: u.amy._id }, { user: u.bo._id }] });
  const groupView = await api('GET', `/api/v1/chats/${group.id}`, { token: t.amy });
  assert.ok(groupView.json.data[0].readBy.some((r) => String(r.user) === u.bo.id), 'group receipts shown');

  await api('PATCH', '/api/v1/users/privacy', { token: t.bo, body: { showReadReceipts: true } });
});

/* =========================
   MUTE
========================= */
test('muting hides someone from your feeds but not from their profile', async () => {
  await api('POST', `/api/v1/users/follow/${u.cy.id}`, { token: t.di });
  await Post.create({ user: u.cy._id, caption: 'cy post' });
  await Reel.create({ user: u.cy._id, videoKey: 'k', videoUrl: 'x', caption: 'cy reel' });
  await Story.create({ user: u.cy._id, media: { type: 'image', key: 'k', url: 'x' } });

  const authors = async (path) =>
    ((await api('GET', path, { token: t.di })).json.data || []).map((p) => p.user?.username || p.user?.username);
  assert.ok((await authors('/api/v1/feed?filter=for_you')).includes('cy'));

  await api('POST', `/api/v1/users/mute/${u.cy.id}`, { token: t.di });

  assert.ok(!(await authors('/api/v1/feed?filter=for_you')).includes('cy'), 'home feed');
  assert.ok(!(await authors('/api/v1/feed?filter=following')).includes('cy'), 'following feed');
  assert.ok(!(await authors('/api/v1/reels/feed')).includes('cy'), 'reels feed');
  const stories = await api('GET', '/api/v1/stories/feed', { token: t.di });
  assert.ok(!JSON.stringify(stories.json).includes('"cy"'), 'stories tray');

  const profile = await api('GET', `/api/v1/feed/posts/user/${u.cy.id}`, { token: t.di });
  assert.equal(profile.status, 200);
  assert.ok(profile.json.data.length >= 1, 'profile still reachable');
});

/* =========================
   LOGIN ACTIVITY
========================= */
test('logins are recorded (device, IP, time), capped at 10', async () => {
  for (let i = 0; i < 12; i++) {
    await fetch(ctx.BASE + '/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0 Safari/537.36',
      },
      body: JSON.stringify({ email: 'amy@privacy2.dev', password: 'password123' }),
    });
  }
  const r = await api('GET', '/api/v1/users/login-activity', { token: t.amy });
  assert.equal(r.json.data.length, 10);
  assert.equal(r.json.data[0].device, 'Chrome on Windows');
  assert.ok(r.json.data[0].ip);
  assert.ok(new Date(r.json.data[0].loginAt) <= new Date());
});

/* =========================
   DATA EXPORT
========================= */
test('data export contains the user\'s data and no secrets', async () => {
  const r = await api('GET', '/api/v1/users/me/export', { token: t.amy });
  assert.equal(r.status, 200);
  const d = r.json.data;
  assert.equal(d.profile.username, 'amy');
  assert.equal(d.profile.email, 'amy@privacy2.dev');
  assert.ok(Array.isArray(d.connections.followers));
  const dm = d.conversations.find((c) => c.with.includes('bo') && !c.group);
  assert.ok(dm, 'conversation with bo');
  assert.deepEqual(dm.messages.map((m) => m.from), ['amy', 'bo'], 'both sides included');
  assert.ok(d.loginActivity.length > 0);

  const raw = JSON.stringify(d);
  for (const secret of ['password', 'pushTokens', 'tokenVersion', 'passwordResetToken']) {
    assert.ok(!raw.includes(`"${secret}"`), `export must not include ${secret}`);
  }
});

test('data export is rate limited (3 per hour)', async () => {
  const token = t.cy;
  const statuses = [];
  for (let i = 0; i < 4; i++) {
    statuses.push((await api('GET', '/api/v1/users/me/export', { token })).status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 429]);
});

/* =========================
   SIGN-UP CONSENT + MEDIA KEYS
========================= */
test('sign-up requires accepting Terms/Privacy (13+) and records consent', async () => {
  const Otp = require('../src/models/Otp.model');
  await Otp.create({ email: 'consent@privacy2.dev', otp: '111111', purpose: 'register', expiresAt: new Date(Date.now() + 300000) });
  const base = { email: 'consent@privacy2.dev', otp: '111111', password: 'password123', username: 'consent', fullName: 'Con Sent' };

  const no = await api('POST', '/api/v1/auth/register/verify-otp', { body: base });
  assert.equal(no.status, 400);
  assert.equal(no.json.code, 'TERMS_REQUIRED');

  const yes = await api('POST', '/api/v1/auth/register/verify-otp', { body: { ...base, acceptedTerms: true } });
  assert.equal(yes.status, 201, JSON.stringify(yes.json));
  const created = await User.findOne({ username: 'consent' }).lean();
  assert.ok(created.termsAcceptedAt instanceof Date);
  assert.match(created.termsVersion, /^\d{4}-\d{2}-\d{2}$/);
});

test('media file names use 128-bit random ids', async () => {
  const r = await api('POST', '/api/v1/media/presign', {
    token: t.amy,
    body: { mediaType: 'image', mimeType: 'image/jpeg' },
  });
  assert.match(r.json.data.key, /\/\d+-[0-9a-f]{32}\.jpg$/);
});
