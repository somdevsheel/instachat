const crypto = require('crypto');

// Cryptographically secure 6-digit code (Math.random is predictable).
function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function getOtpExpiry() {
  return new Date(Date.now() + 5 * 60 * 1000);
}

// Wrong guesses allowed per issued OTP before it is burned.
const MAX_OTP_ATTEMPTS = 5;

/**
 * Look up the active OTP for (email, purpose) and check `otp` against
 * it. Every wrong guess counts against the record, and after
 * MAX_OTP_ATTEMPTS it is invalidated — so a 6-digit code can't be
 * brute-forced from many IPs within its 5-minute lifetime.
 *
 * Returns the matching record or null.
 */
async function consumeOtp(Otp, { email, purpose, otp, user }) {
  const record = await Otp.findOne({
    email,
    purpose,
    ...(user ? { user } : {}),
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record) return null;

  const supplied = Buffer.from(String(otp || '').trim());
  const expected = Buffer.from(record.otp);
  const matches =
    supplied.length === expected.length &&
    crypto.timingSafeEqual(supplied, expected);

  if (!matches) {
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts >= MAX_OTP_ATTEMPTS) record.isUsed = true;
    await record.save();
    return null;
  }

  record.isUsed = true;
  await record.save();
  return record;
}

module.exports = { generateOtp, getOtpExpiry, consumeOtp, MAX_OTP_ATTEMPTS };
