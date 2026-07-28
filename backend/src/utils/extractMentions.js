/**
 * Pulls @username mentions out of comment/caption text. Returns the raw
 * lowercase usernames found — resolving them to actual User docs (and
 * dropping ones that don't exist) is the caller's job, since that needs
 * a DB round-trip this util shouldn't own.
 */
function extractMentions(text) {
  if (!text) return [];
  const matches = text.match(/@[a-zA-Z0-9_.]+/g) || [];
  const unique = new Set(matches.map((m) => m.slice(1).toLowerCase()));
  return [...unique];
}

module.exports = extractMentions;
