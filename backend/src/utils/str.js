/**
 * Trimmed string from untrusted input; anything that isn't a string
 * (number, object, array, null) becomes ''. Avoids `x?.trim()` throwing
 * a 500 when a client sends the wrong type.
 */
const str = (value) => (typeof value === 'string' ? value.trim() : '');

module.exports = str;
