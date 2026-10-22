/**
 * ======================================================
 * ONE-TIME: COPY SOCIAL GRAPH  MongoDB -> PostgreSQL
 * ======================================================
 * Reads the legacy arrays on each MongoDB user (followers, following,
 * blockedUsers, mutedUsers, closeFriends) and inserts the equivalent
 * rows into Postgres. Idempotent (ON CONFLICT DO NOTHING) — safe to
 * re-run, e.g. once before deploy and once right after.
 *
 * - `following` and `followers` are both read and unioned, so a follow
 *   recorded on only one side (old inconsistent writes) is kept.
 * - Ids of users that no longer exist are skipped.
 * - Self-references are skipped.
 *
 *   npm run db:migrate                         (create tables first)
 *   node db/scripts/migrateGraphToPostgres.js --dry-run
 *   node db/scripts/migrateGraphToPostgres.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const { pool } = require('../../src/config/postgres');

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH = 5000;

const TABLES = {
  follows: ['follower_id', 'following_id'],
  blocks: ['blocker_id', 'blocked_id'],
  mutes: ['muter_id', 'muted_id'],
  close_friends: ['user_id', 'friend_id'],
};

const insertBatch = async (table, pairs) => {
  if (!pairs.length || DRY_RUN) return 0;
  const [a, b] = TABLES[table];
  const { rowCount } = await pool.query(
    `INSERT INTO ${table} (${a}, ${b})
     SELECT * FROM unnest($1::text[], $2::text[])
     ON CONFLICT DO NOTHING`,
    [pairs.map((p) => p[0]), pairs.map((p) => p[1])]
  );
  return rowCount;
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const users = mongoose.connection.db.collection('users');

  // Existing user ids, to drop dangling references.
  const existing = new Set();
  for await (const u of users.find({}, { projection: { _id: 1 } })) {
    existing.add(u._id.toString());
  }
  console.log(`Users in MongoDB: ${existing.size}`);

  const buffers = { follows: [], blocks: [], mutes: [], close_friends: [] };
  const stats = Object.fromEntries(
    Object.keys(TABLES).map((t) => [t, { seen: 0, inserted: 0 }])
  );
  let skipped = 0;

  const add = async (table, from, to) => {
    const a = from.toString();
    const b = to.toString();
    if (a === b || !existing.has(a) || !existing.has(b)) {
      skipped++;
      return;
    }
    stats[table].seen++;
    buffers[table].push([a, b]);
    if (buffers[table].length >= BATCH) {
      stats[table].inserted += await insertBatch(table, buffers[table]);
      buffers[table] = [];
    }
  };

  const cursor = users.find(
    {},
    {
      projection: {
        followers: 1,
        following: 1,
        blockedUsers: 1,
        mutedUsers: 1,
        closeFriends: 1,
      },
    }
  );

  for await (const u of cursor) {
    const me = u._id;
    for (const f of u.following || []) await add('follows', me, f);
    for (const f of u.followers || []) await add('follows', f, me);
    for (const b of u.blockedUsers || []) await add('blocks', me, b);
    for (const m of u.mutedUsers || []) await add('mutes', me, m);
    for (const c of u.closeFriends || []) await add('close_friends', me, c);
  }

  for (const table of Object.keys(buffers)) {
    stats[table].inserted += await insertBatch(table, buffers[table]);
  }

  console.log(DRY_RUN ? '\nDRY RUN — nothing written.' : '\nDone.');
  for (const [table, s] of Object.entries(stats)) {
    console.log(
      `  ${table.padEnd(14)} relationships found: ${s.seen}` +
        (DRY_RUN ? '' : `, newly inserted: ${s.inserted}`)
    );
  }
  console.log(`  skipped (self / deleted users): ${skipped}`);
  console.log('  (follows are counted from both sides, so "found" can be ~2x rows)');

  await mongoose.disconnect();
  await pool.end();
};

run().catch(async (err) => {
  console.error('❌ Migration failed:', err.message);
  await mongoose.disconnect().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
