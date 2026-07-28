/**
 * ======================================================
 * CORS ORIGIN POLICY
 * ======================================================
 * Shared between the REST API (app.js) and Socket.IO
 * (socket.service.js) so both layers enforce the same rule.
 *
 * - Development: permissive (matches the old `origin: '*'` behavior)
 *   so local dev against the mobile app / admin panel / web app on
 *   whatever port never breaks.
 * - Production: only origins listed in ALLOWED_ORIGINS (comma-
 *   separated) are allowed. If that env var is unset in production,
 *   this fails CLOSED (nothing allowed) rather than silently falling
 *   back to wide-open — a misconfigured deploy should be loud, not a
 *   silent security hole.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

// Used by the `cors` npm package (Express) and by Socket.IO, both of
// which accept `origin` as (origin, callback) => void.
const corsOriginValidator = (origin, callback) => {
  // No Origin header — same-origin requests, curl, server-to-server,
  // mobile app (native HTTP clients don't send Origin either).
  if (!origin) return callback(null, true);

  if (!isProduction) return callback(null, true);

  if (allowedOrigins.includes(origin)) return callback(null, true);

  return callback(new Error(`Origin ${origin} not allowed by CORS`));
};

module.exports = { corsOriginValidator, allowedOrigins, isProduction };
