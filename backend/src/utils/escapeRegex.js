// Escape user input before embedding it in a RegExp / $regex, so search
// text is matched literally (no ReDoS or invalid-pattern 500s).
const escapeRegex = (value) =>
  String(value ?? '').slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = escapeRegex;
