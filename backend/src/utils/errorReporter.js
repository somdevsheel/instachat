/**
 * ======================================================
 * ERROR REPORTING (Sentry, optional)
 * ======================================================
 * Enabled only when SENTRY_DSN is set; otherwise every function here
 * is a no-op, so local dev and tests need nothing.
 *
 *   SENTRY_DSN                  project DSN from sentry.io
 *   SENTRY_ENVIRONMENT          default NODE_ENV
 *   SENTRY_TRACES_SAMPLE_RATE   0..1 performance tracing (default 0)
 */
let Sentry = null;

const init = () => {
  if (!process.env.SENTRY_DSN || Sentry) return;
  Sentry = require('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0,
    // Never ship request bodies / cookies / auth headers.
    sendDefaultPii: false,
  });
};

/** Report an unexpected error with optional request context. */
const capture = (err, context = {}) => {
  if (!Sentry) return;
  Sentry.withScope((scope) => {
    if (context.requestId) scope.setTag('request_id', context.requestId);
    if (context.userId) scope.setUser({ id: String(context.userId) });
    if (context.route) scope.setTag('route', context.route);
    Sentry.captureException(err);
  });
};

/** Wait for queued events to send (call before process exit). */
const flush = async (timeoutMs = 2000) => {
  if (!Sentry) return;
  try {
    await Sentry.flush(timeoutMs);
  } catch {}
};

module.exports = { init, capture, flush };
