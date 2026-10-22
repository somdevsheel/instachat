/**
 * ======================================================
 * LEGAL DETAILS — FILL THESE IN BEFORE LAUNCH
 * ======================================================
 * Used by the Terms and Privacy Policy pages. Any value still in
 * [brackets] shows a visible "draft" banner on both pages, so they
 * can't go live half-finished.
 *
 * Also have the final text reviewed by a lawyer for the countries you
 * operate in — this is a starting point written from what the app
 * actually does, not legal advice.
 */
export const LEGAL = {
  appName: 'InstaChat',
  company: '[Company legal name]',
  address: '[Registered address]',
  contactEmail: '[privacy@yourdomain.com]',
  supportEmail: '[support@yourdomain.com]',
  governingLaw: '[Country / state whose law governs these terms]',
  // Where your databases / media are hosted (e.g. "AWS ap-south-1 (Mumbai)").
  hostingRegion: '[Hosting region(s)]',
  // How long server request logs and database backups are kept.
  logRetentionDays: '[30]',
  backupRetentionDays: '[30]',
  // Bump together with TERMS_VERSION in backend/src/controllers/auth.controller.js
  effectiveDate: '22 October 2026',
  version: '2026-10-22',
};

export const hasPlaceholders = () =>
  Object.values(LEGAL).some((v) => typeof v === 'string' && v.startsWith('['));
