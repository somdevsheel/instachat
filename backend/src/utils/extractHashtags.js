/**
 * Pulls #hashtags out of caption/post text. Used both at post-creation
 * time (to populate Post.hashtags) and could be reused anywhere else
 * that needs the same parsing (comments, bios, etc.) later.
 */
function extractHashtags(text) {
  if (!text) return [];
  const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
  const unique = new Set(matches.map((tag) => tag.slice(1).toLowerCase()));
  return [...unique];
}

module.exports = extractHashtags;
