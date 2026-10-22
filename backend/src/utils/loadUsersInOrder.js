const User = require('../models/user.model');

/**
 * Fetch users from MongoDB by id, preserving the order of `ids`
 * (e.g. newest-first ordering coming from Postgres). Missing users
 * (deleted accounts) are skipped.
 */
const loadUsersInOrder = async (ids, select) => {
  if (!ids.length) return [];
  const docs = await User.find({ _id: { $in: ids } }).select(select);
  const byId = new Map(docs.map((d) => [d._id.toString(), d]));
  return ids.map((id) => byId.get(String(id))).filter(Boolean);
};

module.exports = loadUsersInOrder;
