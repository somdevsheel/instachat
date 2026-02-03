function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiry() {
  return new Date(Date.now() + 5 * 60 * 1000);
}

module.exports = { generateOtp, getOtpExpiry };
