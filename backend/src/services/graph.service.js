const { query, withTransaction } = require('../config/postgres');

/**
 * ======================================================
 * SOCIAL GRAPH SERVICE (PostgreSQL)
 * ======================================================
 * Follows, blocks, mutes and close friends. All ids are MongoDB
 * ObjectId strings. Callers validate that users exist in MongoDB.
 */

const id = (v) => String(v).toLowerCase();

const graphError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/* =========================
   FOLLOWS
========================= */

/**
 * Follow if not following, unfollow if following.
 * Returns { following: boolean }.
 */
const toggleFollow = (followerId, followingId) =>
  withTransaction(async (client) => {
    const removed = await client.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [id(followerId), id(followingId)]
    );
    if (removed.rowCount > 0) return { following: false };

    const blocked = await client.query(
      `SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = $2)
           OR (blocker_id = $2 AND blocked_id = $1)
        LIMIT 1`,
      [id(followerId), id(followingId)]
    );
    if (blocked.rowCount > 0) {
      throw graphError('You cannot follow this user', 403);
    }

    await client.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id(followerId), id(followingId)]
    );
    return { following: true };
  });

const isFollowing = async (followerId, followingId) => {
  const { rowCount } = await query(
    'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
    [id(followerId), id(followingId)]
  );
  return rowCount > 0;
};

/** Ids `userId` follows, newest first. */
const getFollowingIds = async (userId, { limit = null, offset = 0 } = {}) => {
  const { rows } = await query(
    `SELECT following_id AS id FROM follows
      WHERE follower_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [id(userId), limit, offset]
  );
  return rows.map((r) => r.id);
};

/** Ids following `userId`, newest first. */
const getFollowerIds = async (userId, { limit = null, offset = 0 } = {}) => {
  const { rows } = await query(
    `SELECT follower_id AS id FROM follows
      WHERE following_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [id(userId), limit, offset]
  );
  return rows.map((r) => r.id);
};

const getCounts = async (userId) => {
  const { rows } = await query(
    `SELECT
       (SELECT count(*) FROM follows WHERE following_id = $1)::int AS followers,
       (SELECT count(*) FROM follows WHERE follower_id = $1)::int AS following`,
    [id(userId)]
  );
  return { followersCount: rows[0].followers, followingCount: rows[0].following };
};

/** { userId: { followersCount, followingCount } } for many users at once. */
const getCountsMany = async (userIds) => {
  const ids = userIds.map(id);
  const result = Object.fromEntries(
    ids.map((u) => [u, { followersCount: 0, followingCount: 0 }])
  );
  if (!ids.length) return result;

  const { rows } = await query(
    `SELECT u AS id,
            (SELECT count(*) FROM follows WHERE following_id = u)::int AS followers,
            (SELECT count(*) FROM follows WHERE follower_id = u)::int AS following
       FROM unnest($1::text[]) AS u`,
    [ids]
  );
  rows.forEach((r) => {
    result[r.id] = { followersCount: r.followers, followingCount: r.following };
  });
  return result;
};

/**
 * Viewer -> target relationship flags in one round trip.
 */
const getRelationship = async (viewerId, targetId) => {
  const { rows } = await query(
    `SELECT
       EXISTS (SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2) AS "isFollowing",
       EXISTS (SELECT 1 FROM follows WHERE follower_id = $2 AND following_id = $1) AS "followsMe",
       EXISTS (SELECT 1 FROM blocks  WHERE blocker_id = $1 AND blocked_id = $2)   AS "iBlocked",
       EXISTS (SELECT 1 FROM blocks  WHERE blocker_id = $2 AND blocked_id = $1)   AS "blockedMe"`,
    [id(viewerId), id(targetId)]
  );
  return rows[0];
};

/**
 * People the viewer follows who also follow the target
 * ("followed by alice, bob and 3 others").
 */
const getMutualFollowersOf = async (viewerId, targetId, { limit = 6 } = {}) => {
  const { rows } = await query(
    `SELECT f.follower_id AS id, count(*) OVER ()::int AS total
       FROM follows f
       JOIN follows mine
         ON mine.following_id = f.follower_id AND mine.follower_id = $1
      WHERE f.following_id = $2 AND f.follower_id <> $1
      ORDER BY f.created_at DESC
      LIMIT $3`,
    [id(viewerId), id(targetId), limit]
  );
  return { ids: rows.map((r) => r.id), total: rows[0]?.total || 0 };
};

/** Users who follow `userId` and whom `userId` follows back. */
const getMutualIds = async (userId) => {
  const { rows } = await query(
    `SELECT f.follower_id AS id
       FROM follows f
       JOIN follows back
         ON back.follower_id = $1 AND back.following_id = f.follower_id
      WHERE f.following_id = $1
      ORDER BY f.created_at DESC`,
    [id(userId)]
  );
  return rows.map((r) => r.id);
};

/**
 * Friends-of-friends ranked by how many people I follow already
 * follow them. Excludes me, people I follow, and blocks either way.
 * Returns [{ id, mutualCount }].
 */
const getSuggestions = async (userId, { limit = 20 } = {}) => {
  const { rows } = await query(
    `SELECT f2.following_id AS id, count(*)::int AS "mutualCount"
       FROM follows f1
       JOIN follows f2 ON f2.follower_id = f1.following_id
      WHERE f1.follower_id = $1
        AND f2.following_id <> $1
        AND NOT EXISTS (SELECT 1 FROM follows x
                         WHERE x.follower_id = $1 AND x.following_id = f2.following_id)
        AND NOT EXISTS (SELECT 1 FROM blocks b
                         WHERE (b.blocker_id = $1 AND b.blocked_id = f2.following_id)
                            OR (b.blocker_id = f2.following_id AND b.blocked_id = $1))
      GROUP BY f2.following_id
      ORDER BY "mutualCount" DESC, max(f2.created_at) DESC
      LIMIT $2`,
    [id(userId), limit]
  );
  return rows;
};

/* =========================
   FOLLOW REQUESTS (private accounts)
========================= */

/**
 * Request to follow a private account, or cancel a pending request.
 * Returns { requested: boolean }.
 */
const toggleFollowRequest = (requesterId, targetId) =>
  withTransaction(async (client) => {
    const removed = await client.query(
      'DELETE FROM follow_requests WHERE requester_id = $1 AND target_id = $2',
      [id(requesterId), id(targetId)]
    );
    if (removed.rowCount > 0) return { requested: false };

    const blocked = await client.query(
      `SELECT 1 FROM blocks
        WHERE (blocker_id = $1 AND blocked_id = $2)
           OR (blocker_id = $2 AND blocked_id = $1)
        LIMIT 1`,
      [id(requesterId), id(targetId)]
    );
    if (blocked.rowCount > 0) {
      throw graphError('You cannot follow this user', 403);
    }

    await client.query(
      `INSERT INTO follow_requests (requester_id, target_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id(requesterId), id(targetId)]
    );
    return { requested: true };
  });

const hasRequested = async (requesterId, targetId) => {
  const { rowCount } = await query(
    'SELECT 1 FROM follow_requests WHERE requester_id = $1 AND target_id = $2',
    [id(requesterId), id(targetId)]
  );
  return rowCount > 0;
};

/** Pending requesters for `targetId`, newest first. */
const getFollowRequestIds = async (targetId) => {
  const { rows } = await query(
    `SELECT requester_id AS id FROM follow_requests
      WHERE target_id = $1 ORDER BY created_at DESC`,
    [id(targetId)]
  );
  return rows.map((r) => r.id);
};

/**
 * Accept: turn the request into a follow. Returns false if there was
 * no pending request.
 */
const acceptFollowRequest = (targetId, requesterId) =>
  withTransaction(async (client) => {
    const removed = await client.query(
      'DELETE FROM follow_requests WHERE requester_id = $1 AND target_id = $2',
      [id(requesterId), id(targetId)]
    );
    if (removed.rowCount === 0) return false;
    await client.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [id(requesterId), id(targetId)]
    );
    return true;
  });

const declineFollowRequest = async (targetId, requesterId) => {
  const { rowCount } = await query(
    'DELETE FROM follow_requests WHERE requester_id = $1 AND target_id = $2',
    [id(requesterId), id(targetId)]
  );
  return rowCount > 0;
};

/** When an account goes public, all pending requests become follows. */
const acceptAllFollowRequests = (targetId) =>
  withTransaction(async (client) => {
    const { rows } = await client.query(
      'DELETE FROM follow_requests WHERE target_id = $1 RETURNING requester_id',
      [id(targetId)]
    );
    if (rows.length) {
      await client.query(
        `INSERT INTO follows (follower_id, following_id)
         SELECT unnest($1::text[]), $2 ON CONFLICT DO NOTHING`,
        [rows.map((r) => r.requester_id), id(targetId)]
      );
    }
    return rows.map((r) => r.requester_id);
  });

/* =========================
   BLOCKS
========================= */

/**
 * Block if not blocked, unblock if blocked. Blocking also removes
 * follows and close-friend entries in both directions.
 * Returns { blocked: boolean }.
 */
const toggleBlock = (blockerId, blockedId) =>
  withTransaction(async (client) => {
    const a = id(blockerId);
    const b = id(blockedId);

    const removed = await client.query(
      'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [a, b]
    );
    if (removed.rowCount > 0) return { blocked: false };

    await client.query(
      'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [a, b]
    );
    await client.query(
      `DELETE FROM follows
        WHERE (follower_id = $1 AND following_id = $2)
           OR (follower_id = $2 AND following_id = $1)`,
      [a, b]
    );
    await client.query(
      `DELETE FROM close_friends
        WHERE (user_id = $1 AND friend_id = $2)
           OR (user_id = $2 AND friend_id = $1)`,
      [a, b]
    );
    await client.query(
      `DELETE FROM follow_requests
        WHERE (requester_id = $1 AND target_id = $2)
           OR (requester_id = $2 AND target_id = $1)`,
      [a, b]
    );
    return { blocked: true };
  });

/** Everyone I blocked plus everyone who blocked me. */
const getBlockedEitherWayIds = async (userId) => {
  const { rows } = await query(
    `SELECT blocked_id AS id FROM blocks WHERE blocker_id = $1
     UNION
     SELECT blocker_id AS id FROM blocks WHERE blocked_id = $1`,
    [id(userId)]
  );
  return rows.map((r) => r.id);
};

const getBlockedIds = async (userId) => {
  const { rows } = await query(
    'SELECT blocked_id AS id FROM blocks WHERE blocker_id = $1 ORDER BY created_at DESC',
    [id(userId)]
  );
  return rows.map((r) => r.id);
};

const isBlockedEitherWay = async (a, b) => {
  const { rowCount } = await query(
    `SELECT 1 FROM blocks
      WHERE (blocker_id = $1 AND blocked_id = $2)
         OR (blocker_id = $2 AND blocked_id = $1)
      LIMIT 1`,
    [id(a), id(b)]
  );
  return rowCount > 0;
};

/* =========================
   MUTES
========================= */

const toggleMute = (muterId, mutedId) =>
  withTransaction(async (client) => {
    const removed = await client.query(
      'DELETE FROM mutes WHERE muter_id = $1 AND muted_id = $2',
      [id(muterId), id(mutedId)]
    );
    if (removed.rowCount > 0) return { muted: false };

    await client.query(
      'INSERT INTO mutes (muter_id, muted_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id(muterId), id(mutedId)]
    );
    return { muted: true };
  });

const getMutedIds = async (userId) => {
  const { rows } = await query(
    'SELECT muted_id AS id FROM mutes WHERE muter_id = $1 ORDER BY created_at DESC',
    [id(userId)]
  );
  return rows.map((r) => r.id);
};

/* =========================
   CLOSE FRIENDS
========================= */

const toggleCloseFriend = (userId, friendId) =>
  withTransaction(async (client) => {
    const removed = await client.query(
      'DELETE FROM close_friends WHERE user_id = $1 AND friend_id = $2',
      [id(userId), id(friendId)]
    );
    if (removed.rowCount > 0) return { isCloseFriend: false };

    await client.query(
      'INSERT INTO close_friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id(userId), id(friendId)]
    );
    return { isCloseFriend: true };
  });

const getCloseFriendIds = async (userId) => {
  const { rows } = await query(
    'SELECT friend_id AS id FROM close_friends WHERE user_id = $1',
    [id(userId)]
  );
  return rows.map((r) => r.id);
};

/* =========================
   ACCOUNT DELETION
========================= */

const deleteUserGraph = (userId) =>
  withTransaction(async (client) => {
    const u = id(userId);
    await client.query('DELETE FROM follows WHERE follower_id = $1 OR following_id = $1', [u]);
    await client.query('DELETE FROM blocks WHERE blocker_id = $1 OR blocked_id = $1', [u]);
    await client.query('DELETE FROM mutes WHERE muter_id = $1 OR muted_id = $1', [u]);
    await client.query('DELETE FROM close_friends WHERE user_id = $1 OR friend_id = $1', [u]);
    await client.query('DELETE FROM follow_requests WHERE requester_id = $1 OR target_id = $1', [u]);
  });

module.exports = {
  toggleFollow,
  isFollowing,
  getFollowingIds,
  getFollowerIds,
  getCounts,
  getCountsMany,
  getRelationship,
  getMutualFollowersOf,
  getMutualIds,
  getSuggestions,
  toggleFollowRequest,
  hasRequested,
  getFollowRequestIds,
  acceptFollowRequest,
  declineFollowRequest,
  acceptAllFollowRequests,
  toggleBlock,
  getBlockedIds,
  getBlockedEitherWayIds,
  isBlockedEitherWay,
  toggleMute,
  getMutedIds,
  toggleCloseFriend,
  getCloseFriendIds,
  deleteUserGraph,
};
