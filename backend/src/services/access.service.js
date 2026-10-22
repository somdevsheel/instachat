const mongoose = require('mongoose');
const User = require('../models/user.model');
const graph = require('./graph.service');

/**
 * ======================================================
 * CONTENT ACCESS RULES
 * ======================================================
 * One place that decides whether a viewer may see a user's content
 * (posts, reels, stories, comments, follower lists) or interact with
 * them (like, comment, repost, message):
 *
 * - you can always see your own content
 * - a block in EITHER direction hides everything (404, so a blocked
 *   user can't even confirm the account exists)
 * - a private account's content is only visible to its followers
 *   (403 PRIVATE_ACCOUNT, so clients can show the "locked" profile)
 */

const accessError = (message, statusCode, code) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
};

const str = (v) => (v && v._id ? v._id.toString() : String(v));

/**
 * Returns { allowed, reason } where reason is 'blocked' | 'private' | null.
 * `owner` may be a user doc (with isPrivate) or an id.
 */
const checkAccess = async (viewerId, owner) => {
  const ownerId = str(owner);
  if (!ownerId || ownerId === str(viewerId)) return { allowed: true, reason: null };

  const isPrivate =
    owner && typeof owner === 'object' && 'isPrivate' in owner
      ? owner.isPrivate
      : (await User.findById(ownerId).select('isPrivate').lean())?.isPrivate;

  const rel = await graph.getRelationship(viewerId, ownerId);
  if (rel.iBlocked || rel.blockedMe) return { allowed: false, reason: 'blocked' };
  if (isPrivate && !rel.isFollowing) return { allowed: false, reason: 'private' };
  return { allowed: true, reason: null };
};

/** Throws a 404 (blocked) or 403 (private) error if access is denied. */
const assertCanView = async (viewerId, owner) => {
  const { allowed, reason } = await checkAccess(viewerId, owner);
  if (allowed) return;
  if (reason === 'blocked') throw accessError('Not found', 404);
  throw accessError('This account is private', 403, 'PRIVATE_ACCOUNT');
};

/**
 * Load a content doc (Post / Reel / Story / Comment) and check the
 * viewer may see its author's content. For comments the check is on
 * the parent post/reel's author. Throws 404 if missing or hidden.
 * Returns the lean doc with `user` populated ({ _id, isPrivate }).
 */
const loadViewable = async (Model, contentId, viewerId) => {
  if (!mongoose.isValidObjectId(contentId)) throw accessError('Not found', 404);

  const doc = await Model.findById(contentId)
    .select('user post reel')
    .populate('user', 'isPrivate')
    .lean();
  if (!doc || !doc.user) throw accessError('Not found', 404);

  if (Model.modelName === 'Comment') {
    const ParentModel = mongoose.model(doc.post ? 'Post' : 'Reel');
    await loadViewable(ParentModel, doc.post || doc.reel, viewerId);
    return doc;
  }

  await assertCanView(viewerId, doc.user);
  return doc;
};

/**
 * Reposting puts content in front of the reposter's audience, so
 * content from a private account can't be reposted (except by its
 * owner). Follows a repost chain back to the original.
 */
const assertRepostable = async (Model, contentId, viewerId) => {
  const source = await Model.findById(contentId).select('user repostOf repostOfModel').lean();
  if (!source) throw accessError('Not found', 404);

  const OriginalModel = source.repostOf
    ? mongoose.model(source.repostOfModel === 'Reel' ? 'Reel' : 'Post')
    : Model;
  const original = await OriginalModel.findById(source.repostOf || source._id)
    .select('user')
    .populate('user', 'isPrivate')
    .lean();
  if (!original || !original.user) throw accessError('Not found', 404);

  if (original.user.isPrivate && str(original.user) !== str(viewerId)) {
    throw accessError("Posts from private accounts can't be reposted", 403);
  }
  await assertCanView(viewerId, original.user);
};

/**
 * Who should receive a realtime broadcast about `owner`'s content:
 * everyone for public accounts, only the owner for private ones.
 */
const emitForOwner = (io, owner, event, payload) => {
  if (!io) return;
  if (owner && owner.isPrivate) {
    io.to(str(owner)).emit(event, payload);
  } else {
    io.emit(event, payload);
  }
};

/** Throws 403 if either user has blocked the other (for messaging). */
const assertNotBlocked = async (a, b) => {
  if (await graph.isBlockedEitherWay(str(a), str(b))) {
    throw accessError('You cannot interact with this user', 403);
  }
};

/**
 * Authors whose content must be left out of lists (feeds, explore,
 * search) for this viewer: blocks either way + private accounts the
 * viewer doesn't follow. Returns a string[] for `$nin` queries.
 */
const getHiddenAuthorIds = async (viewerId) => {
  const viewer = str(viewerId);
  const [blocked, following, privateUsers] = await Promise.all([
    graph.getBlockedEitherWayIds(viewer),
    graph.getFollowingIds(viewer),
    User.find({ isPrivate: true }).select('_id').lean(),
  ]);
  const followingSet = new Set(following);
  const hidden = new Set(blocked);
  privateUsers.forEach((u) => {
    const uid = u._id.toString();
    if (uid !== viewer && !followingSet.has(uid)) hidden.add(uid);
  });
  return [...hidden];
};

/**
 * For FEEDS (home, reels, stories): everything getHiddenAuthorIds hides,
 * plus people the viewer has muted. Muting only declutters feeds — a
 * muted user's profile and content stay reachable directly, and they
 * aren't told.
 */
const getFeedExcludedAuthorIds = async (viewerId) => {
  const [hidden, muted] = await Promise.all([
    getHiddenAuthorIds(viewerId),
    graph.getMutedIds(str(viewerId)),
  ]);
  return [...new Set([...hidden, ...muted])];
};

/**
 * Feed items can embed someone else's content via `repostOf`. If that
 * original author is hidden from the viewer, drop the embedded content
 * (the repost itself stays, shown as unavailable).
 */
const redactHiddenReposts = (items, hiddenIds) => {
  const hidden = new Set(hiddenIds);
  return items.map((item) => {
    const originalOwner = item.repostOf?.user?._id || item.repostOf?.user;
    if (originalOwner && hidden.has(originalOwner.toString())) {
      return { ...item, repostOf: null, repostUnavailable: true };
    }
    return item;
  });
};

module.exports = {
  checkAccess,
  assertCanView,
  loadViewable,
  assertRepostable,
  emitForOwner,
  assertNotBlocked,
  getHiddenAuthorIds,
  getFeedExcludedAuthorIds,
  redactHiddenReposts,
};
