const express = require("express");
const router = express.Router();

const {
  login,
  getMe,
  requestRegisterOtp,
  verifyRegisterOtp,
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
  verify2FA,
  resend2FA,
  logout,
  logoutAll,
} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth.middleware");
const {
  authLimiter,
  loginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
} = require("../middlewares/rateLimiter");

/* =========================
   CURRENT USER (not rate limited: called on every app start)
========================= */
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);
router.post("/logout-all", protect, logoutAll);

// Per-IP ceiling for every auth endpoint; each route adds a tighter
// per-IP+email limit on top.
router.use(authLimiter);

/* =========================
   REGISTER WITH OTP
========================= */
router.post("/register/request-otp", otpSendLimiter, requestRegisterOtp);
router.post("/register/verify-otp", otpVerifyLimiter, verifyRegisterOtp);

/* =========================
   LOGIN
========================= */
router.post("/login", loginLimiter, login);

/* =========================
   TWO-FACTOR AUTH
========================= */
router.post("/verify-2fa", otpVerifyLimiter, verify2FA);
router.post("/resend-2fa", otpSendLimiter, resend2FA);

/* =========================
   FORGOT PASSWORD (OTP)
========================= */
router.post("/forgot-password/request-otp", otpSendLimiter, requestForgotPasswordOtp);
router.post("/forgot-password/verify-otp", otpVerifyLimiter, verifyForgotPasswordOtp);

module.exports = router;