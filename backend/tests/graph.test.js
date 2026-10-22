/**
 * ======================================================
 * SOCIAL GRAPH (PostgreSQL) TESTS
 * ======================================================
 * Follows, blocks, mutes, close friends, and the one-time
 * MongoDB -> PostgreSQL copy script.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { execFile } = require('child_process');
const mongoose = require('mongoose');
const { startTestApp } = require('./helpers/app');

const User = require('../src/models/user.model');
const Post = require('../src/models/Post');
const Story = require('../src/models/Story');

let ctx, api, sign;
const u = {};
const t = {};

const mkUser = (name, extra = {}) =>
  User.create({
    name,
    username: name,
    email: `${name}@graph.dev`,
    password: 'password123',
    isVerified: true,
    ...extra,
  });

const follow = (from, to) => api('POST', `/api/v1/users/follow/${u[to].id}`, { token: t[from] });

before(async () => {
  ctx = await startTestApp();
  ({ api, sign } = ctx);
  for (const name of ['ann', 'ben', 'cat', 'dan', 'eve']) {
    u[name] = await mkUser(name);
    t[name] = sign(u[name].id);
  }
});

after(async () => {
  await ctx.stop();
});

test('follow / unfollow toggles and returns the new follower count', async () => {
  const f1 = await follow('ann', 'ben');
  assert.equal(f1.status, 200);
  assert.equal(f1.json.following, true);
  assert.equal(f1.json.followersCount, 1);

  const f2 = await follow('ann', 'ben');
  assert.equal(f2.json.following, false);
  assert.equal(f2.json.followersCount, 0);

  await follow('ann', 'ben'); // leave ann -> ben in place
});

test('cannot follow yourself; unknown user gives 404', async () => {
  assert.equal(
    (await api('POST', `/api/v1/users/follow/${u.ann.id}`, { token: t.ann })).status,
    400
  );
  const ghost = new mongoose.Types.ObjectId().toString();
  assert.equal(
    (await api('POST', `/api/v1/users/follow/${ghost}`, { token: t.ann })).status,
    404
  );
});

test('profile shows counts, relationship and mutual followers', async () => {
  await follow('cat', 'ben'); // ann & cat follow ben
  await follow('ann', 'cat'); // ann follows cat
  await follow('ben', 'ann'); // ben follows ann

  const r = await api('GET', '/api/v1/users/profile/ben', { token: t.ann });
  assert.equal(r.status, 200);
  assert.equal(r.json.data.followersCount, 2);
  assert.equal(r.json.data.followingCount, 1);
  assert.equal(r.json.data.isFollowing, true);
  assert.equal(r.json.data.canMessage, true);
  // cat is followed by ann and follows ben -> mutual
  assert.equal(r.json.data.mutualCount, 1);
  assert.equal(r.json.data.mutualPreview[0].username, 'cat');
});

test('follower / following lists are populated from Postgres', async () => {
  const followers = await api('GET', `/api/v1/users/${u.ben.id}/followers`, { token: t.eve });
  assert.equal(followers.status, 200);
  assert.deepEqual(
    followers.json.data.map((x) => x.username).sort(),
    ['ann', 'cat']
  );

  const following = await api('GET', `/api/v1/users/${u.ann.id}/following`, { token: t.ben });
  assert.deepEqual(following.json.data.map((x) => x.username).sort(), ['ben', 'cat']);
  // ben follows ann but not cat/ben themselves
  const flags = Object.fromEntries(following.json.data.map((x) => [x.username, x.isFollowing]));
  assert.equal(flags.cat, false);
});

test('login and /auth/me reflect the Postgres graph', async () => {
  const login = await api('POST', '/api/v1/auth/login', {
    body: { email: 'ann@graph.dev', password: 'password123' },
  });
  assert.equal(login.status, 200);
  assert.deepEqual([...login.json.user.following].sort(), [u.ben.id, u.cat.id].sort());
  assert.deepEqual(login.json.user.followers, [u.ben.id]);
  assert.equal(login.json.user.blockedUsers, undefined);

  const me = await api('GET', '/api/v1/auth/me', { token: t.ann });
  assert.equal(me.json.data.followersCount, 1);
  assert.equal(me.json.data.followingCount, 2);
});

test('suggestions rank friends-of-friends by mutual count', async () => {
  // dan follows ben + cat; eve follows nobody.
  await follow('dan', 'ben');
  await follow('dan', 'cat');
  await follow('ben', 'eve'); // eve is followed by ben (whom ann follows)
  await follow('cat', 'eve'); // ...and by cat -> 2 mutuals for ann

  const r = await api('GET', '/api/v1/users/suggestions', { token: t.ann });
  assert.equal(r.status, 200);
  const first = r.json.data[0];
  assert.equal(first.username, 'eve');
  assert.equal(first.mutualCount, 2);
  // never suggests self or people already followed
  const names = r.json.data.map((x) => x.username);
  assert.ok(!names.includes('ann') && !names.includes('ben') && !names.includes('cat'));
});

test('mutual followers endpoint lists people who follow back', async () => {
  const r = await api('GET', '/api/v1/users/mutual', { token: t.ann });
  assert.deepEqual(r.json.data.map((x) => x.username), ['ben']);
});

test('following feed and story feed use the graph', async () => {
  const mkPost = (user) =>
    Post.create({ user: user._id, caption: `post by ${user.username}` });
  await Promise.all([mkPost(u.ben), mkPost(u.eve)]);
  await Story.create({
    user: u.ben._id,
    media: { type: 'image', key: `users/${u.ben.id}/s.jpg`, url: 'x' },
  });

  const feed = await api('GET', '/api/v1/feed?filter=following', { token: t.ann });
  assert.equal(feed.status, 200);
  const authors = new Set(
    (feed.json.data?.posts || feed.json.data || []).map((p) => p.user?.username)
  );
  assert.ok(authors.has('ben'));
  assert.ok(!authors.has('eve'), 'ann does not follow eve');

  const stories = await api('GET', '/api/v1/stories/feed', { token: t.ann });
  assert.equal(stories.status, 200);
  assert.ok(JSON.stringify(stories.json).includes('"ben"'));
});

test('close friends toggle, list, and close_friends feed', async () => {
  const on = await api('PUT', `/api/v1/users/close-friends/${u.ben.id}`, { token: t.ann });
  assert.equal(on.json.isCloseFriend, true);

  const list = await api('GET', '/api/v1/users/close-friends/manage', { token: t.ann });
  const flags = Object.fromEntries(list.json.data.map((x) => [x.username, x.isCloseFriend]));
  assert.equal(flags.ben, true);
  assert.equal(flags.cat, false);

  const feed = await api('GET', '/api/v1/feed?filter=close_friends', { token: t.ann });
  const authors = new Set(
    (feed.json.data?.posts || feed.json.data || []).map((p) => p.user?.username)
  );
  assert.ok(authors.has('ben'));
});

test('blocking removes follows + close friends both ways and prevents re-follow', async () => {
  // ann <-> ben follow each other, ben is ann's close friend.
  const b = await api('POST', `/api/v1/users/block/${u.ben.id}`, { token: t.ann });
  assert.equal(b.status, 200);
  assert.equal(b.json.blocked, true);

  const rel = await ctx.pool.query(
    `SELECT
       (SELECT count(*) FROM follows WHERE (follower_id=$1 AND following_id=$2) OR (follower_id=$2 AND following_id=$1))::int AS f,
       (SELECT count(*) FROM close_friends WHERE user_id=$1 AND friend_id=$2)::int AS c`,
    [u.ann.id, u.ben.id]
  );
  assert.deepEqual(rel.rows[0], { f: 0, c: 0 });

  assert.equal((await follow('ben', 'ann')).status, 403, 'blocked user cannot follow');
  assert.equal((await follow('ann', 'ben')).status, 403, 'blocker cannot follow either');

  const blocked = await api('GET', '/api/v1/users/blocked', { token: t.ann });
  assert.deepEqual(blocked.json.data.map((x) => x.username), ['ben']);

  const unb = await api('POST', `/api/v1/users/block/${u.ben.id}`, { token: t.ann });
  assert.equal(unb.json.blocked, false);
  assert.equal((await follow('ann', 'ben')).json.following, true);
});

test('mute / unmute and muted list', async () => {
  const m = await api('POST', `/api/v1/users/mute/${u.dan.id}`, { token: t.ann });
  assert.equal(m.json.muted, true);
  const list = await api('GET', '/api/v1/users/muted', { token: t.ann });
  assert.deepEqual(list.json.data.map((x) => x.username), ['dan']);
  const um = await api('POST', `/api/v1/users/mute/${u.dan.id}`, { token: t.ann });
  assert.equal(um.json.muted, false);
});

test('deleting an account removes all of its graph rows', async () => {
  const zed = await mkUser('zed');
  const tz = sign(zed.id);
  await api('POST', `/api/v1/users/follow/${u.ann.id}`, { token: tz });
  await api('POST', `/api/v1/users/follow/${zed.id}`, { token: t.ann });
  await api('POST', `/api/v1/users/mute/${u.ann.id}`, { token: tz });

  const del = await api('DELETE', '/api/v1/users/delete-account', {
    token: tz,
    body: { password: 'password123' },
  });
  assert.equal(del.status, 200);

  const { rows } = await ctx.pool.query(
    `SELECT
       (SELECT count(*) FROM follows WHERE follower_id=$1 OR following_id=$1)::int AS f,
       (SELECT count(*) FROM mutes WHERE muter_id=$1 OR muted_id=$1)::int AS m`,
    [zed.id]
  );
  assert.deepEqual(rows[0], { f: 0, m: 0 });
});

test('copy script moves legacy MongoDB arrays into Postgres (idempotent)', async () => {
  // Legacy-style users with graph data only in MongoDB arrays.
  const [l1, l2, l3] = await Promise.all([mkUser('leg1'), mkUser('leg2'), mkUser('leg3')]);
  const deletedId = new mongoose.Types.ObjectId();
  await User.collection.updateOne(
    { _id: l1._id },
    {
      $set: {
        following: [l2._id, deletedId], // deleted user -> skipped
        blockedUsers: [l3._id],
        closeFriends: [l2._id],
        mutedUsers: [l1._id], // self -> skipped
      },
    }
  );
  // Follow recorded only on the followers side (old inconsistent write).
  await User.collection.updateOne({ _id: l3._id }, { $set: { followers: [l2._id] } });

  const run = () =>
    new Promise((resolve, reject) => {
      execFile(
        process.execPath,
        [path.join(__dirname, '..', 'db', 'scripts', 'migrateGraphToPostgres.js')],
        {
          env: {
            ...process.env,
            MONGO_URI: ctx.mongoUri,
            POSTGRES_URL: ctx.postgresUrl,
          },
        },
        (err, stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve(stdout))
      );
    });

  await run();
  await run(); // second run must not duplicate or fail

  const q = (sql, params) => ctx.pool.query(sql, params).then((r) => r.rows[0].n);
  assert.equal(await q('SELECT count(*)::int n FROM follows WHERE follower_id=$1 AND following_id=$2', [l1.id, l2.id]), 1);
  assert.equal(await q('SELECT count(*)::int n FROM follows WHERE follower_id=$1 AND following_id=$2', [l2.id, l3.id]), 1);
  assert.equal(await q('SELECT count(*)::int n FROM follows WHERE following_id=$1', [deletedId.toString()]), 0);
  assert.equal(await q('SELECT count(*)::int n FROM blocks WHERE blocker_id=$1 AND blocked_id=$2', [l1.id, l3.id]), 1);
  assert.equal(await q('SELECT count(*)::int n FROM close_friends WHERE user_id=$1 AND friend_id=$2', [l1.id, l2.id]), 1);
  assert.equal(await q('SELECT count(*)::int n FROM mutes WHERE muter_id=$1', [l1.id]), 0);
});

test('readiness endpoint reports both databases', async () => {
  const r = await api('GET', '/api/v1/health/ready');
  assert.equal(r.status, 200);
  assert.deepEqual({ mongo: r.json.mongo, postgres: r.json.postgres }, { mongo: 'ok', postgres: 'ok' });
});
