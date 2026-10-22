/**
 * Parse ?page=&limit= with safe bounds so no list endpoint can be asked
 * to return an entire collection in one response.
 */
const getPagination = (query, { defaultLimit = 50, maxLimit = 100 } = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

module.exports = getPagination;
