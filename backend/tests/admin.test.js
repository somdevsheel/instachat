/**
 * ======================================================
 * ADMIN MODERATION + INPUT VALIDATION TESTS
 * ======================================================
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestApp, wait } = require('./helpers/app');

const User = require('../src/models/user.model');
const Post = require('../src/models/Post');
const Report = require('../src/models/report.model');
const Group = require('../src/models/Group');

let ctx, api, sign, connect;
const u = {};
const t = {};

const mkUser = (name, extra = {}) =>
  User.create({
    name,
    username: name,
    email: `${name}@admin.dev`,
    password: 'password123',
    isVerified: true,
    ...extra,
  });

before(async () => {
  ctx = await startTestApp();
  ({ api, sign, connect } = ctx);
  for (const [name, extra] of [
    ['boss', { role: 'superadmin' }],
    ['mod', { role: 'admin' }],
    ['mod2', { role: 'admin' }],
    ['member', {}],
    ['troll', {}],
  ]) {
    u[name] = await mkUser(name, extra);
    t[name] = sign(u[name].id);
  }
});

after(async () => {
  await ctx.stop();
});

/* =========================
   ROLE GUARDS
========================= */
test('admin cannot ban, suspend or unban another admin or the superadmin', async () => {
  for (const target of ['mod2', 'boss']) {
    for (const [method, path] of [
      ['PUT', `/api/v1/admin/users/${u[target].id}/ban`],
      ['PUT', `/api/v1/admin/users/${u[target].id}/suspend`],
      ['PUT', `/api/v1/admin/users/${u[target].id}/unban`],
    ]) {
      const r = await api(method, path, { token: t.mod });
      assert.equal(r.status, 403, `${method} ${path}`);
    }
  }
  assert.equal((await User.findById(u.boss._id)).isBanned, false);
});

test('admins cannot moderate themselves', async () => {
  const r = await api('PUT', `/api/v1/admin/users/${u.mod.id}/ban`, { token: t.mod });
  assert.equal(r.status, 400);
});

test('superadmin can moderate an admin; nobody can delete the superadmin', async () => {
  const s = await api('PUT', `/api/v1/admin/users/${u.mod2.id}/suspend`, {
    token: t.boss,
    body: { days: 1 },
  });
  assert.equal(s.status, 200);
  await api('PUT', `/api/v1/admin/users/${u.mod2.id}/unban`, { token: t.boss });

  assert.equal((await api('DELETE', `/api/v1/admin/users/${u.boss.id}`, { token: t.boss })).status, 400);
});

test('suspension length is clamped to 1..365 days', async () => {
  const r = await api('PUT', `/api/v1/admin/users/${u.member.id}/suspend`, {
    token: t.mod,
    body: { days: 100000 },
  });
  assert.equal(r.status, 200);
  const until = (await User.findById(u.member._id)).suspendedUntil;
  const days = (until - Date.now()) / 86400000;
  assert.ok(days <= 366 && days > 364, `got ${days} days`);
  await api('PUT', `/api/v1/admin/users/${u.member.id}/unban`, { token: t.mod });
});

test('banning disconnects the user\'s live socket and blocks reconnecting', async () => {
  const sock = await connect(t.troll);
  assert.ok(sock.ok);
  const closed = new Promise((resolve) => sock.s.on('disconnect', resolve));

  const r = await api('PUT', `/api/v1/admin/users/${u.troll.id}/ban`, { token: t.mod });
  assert.equal(r.status, 200);

  const reason = await Promise.race([closed, wait(2000).then(() => null)]);
  assert.ok(reason, 'socket was not disconnected');
  sock.s.close();

  const again = await connect(t.troll);
  assert.equal(again.ok, false, 'banned user reconnected');
  again.s.close();
});

test('report action ban_user also respects role guards', async () => {
  const report = await Report.create({
    reporter: u.member._id,
    targetType: 'user',
    targetUser: u.mod2._id,
    reason: 'spam',
  });
  const r = await api('PUT', `/api/v1/admin/reports/${report.id}/action`, {
    token: t.mod,
    body: { action: 'ban_user' },
  });
  assert.equal(r.status, 403);
  assert.equal((await User.findById(u.mod2._id)).isBanned, false);
});

/* =========================
   REPORTS
========================= */
test('duplicate reports are de-duplicated; missing targets give 404', async () => {
  const post = await Post.create({ user: u.mod._id, caption: 'reported' });
  const body = { targetType: 'post', targetId: post.id, reason: 'spam' };

  const first = await api('POST', '/api/v1/reports', { token: t.member, body });
  assert.equal(first.status, 201);
  const second = await api('POST', '/api/v1/reports', { token: t.member, body });
  assert.equal(second.status, 200);
  assert.equal(second.json.data._id, first.json.data._id);
  assert.equal(await Report.countDocuments({ targetPost: post._id }), 1);

  const ghost = await api('POST', '/api/v1/reports', {
    token: t.member,
    body: { targetType: 'post', targetId: '0123456789abcdef01234567', reason: 'spam' },
  });
  assert.equal(ghost.status, 404);
});

/* =========================
   SESSIONS
========================= */
test('session failures carry code SESSION_INVALID; other 401s do not', async () => {
  const noToken = await api('GET', '/api/v1/auth/me');
  assert.equal(noToken.json.code, 'SESSION_INVALID');

  const banned = await api('GET', '/api/v1/auth/me', { token: t.troll });
  assert.equal(banned.status, 403);
  assert.equal(banned.json.code, 'SESSION_INVALID');

  const wrongPassword = await api('POST', '/api/v1/auth/login', {
    body: { email: 'member@admin.dev', password: 'nope-nope' },
  });
  assert.equal(wrongPassword.status, 401);
  assert.notEqual(wrongPassword.json.code, 'SESSION_INVALID');
});

/* =========================
   INPUT VALIDATION
========================= */
test('over-long profile fields are rejected with 400', async () => {
  const r = await api('PUT', '/api/v1/users/update', {
    token: t.member,
    body: { bio: 'x'.repeat(151) },
  });
  assert.equal(r.status, 400);
  assert.match(r.json.message, /Bio cannot exceed 150/);

  const ok = await api('PUT', '/api/v1/users/update', {
    token: t.member,
    body: { bio: 'x'.repeat(150) },
  });
  assert.equal(ok.status, 200);
});

test('wrong-type fields give 400, not 500', async () => {
  const cases = [
    ['POST', '/api/v1/groups', { name: { a: 1 } }],
    ['POST', '/api/v1/events', { name: 5, date: '2030-01-01' }],
    ['POST', '/api/v1/marketplace', { title: ['x'], price: 1 }],
  ];
  for (const [method, url, body] of cases) {
    const r = await api(method, url, { token: t.member, body });
    assert.equal(r.status, 400, `${method} ${url}`);
  }
  const weird = await api('POST', '/api/v1/groups', {
    token: t.member,
    body: { name: 'ok', description: { not: 'a string' } },
  });
  assert.equal(weird.status, 201);
});

test('list endpoints are paginated', async () => {
  await Group.insertMany(
    Array.from({ length: 60 }, (_, i) => ({ name: `g${i}`, creator: u.member._id, members: [u.member._id] }))
  );
  const first = await api('GET', '/api/v1/groups', { token: t.member });
  assert.equal(first.json.data.length, 50, 'default page size');
  const capped = await api('GET', '/api/v1/groups?limit=100000', { token: t.member });
  assert.ok(capped.json.data.length <= 100, 'limit is capped');
  const page2 = await api('GET', '/api/v1/groups?page=2&limit=50', { token: t.member });
  assert.ok(page2.json.data.length >= 11);
});
