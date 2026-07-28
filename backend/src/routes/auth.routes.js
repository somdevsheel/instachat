// const express = require("express");
// const router = express.Router();

// const {
//   login,
//   getMe,
//   requestRegisterOtp,
//   verifyRegisterOtp,
//   requestForgotPasswordOtp,
//   verifyForgotPasswordOtp,
// } = require("../controllers/auth.controller");

// const { protect } = require("../middlewares/auth.middleware");

// /* =========================
//    REGISTER WITH OTP
// ========================= */
// router.post("/register/request-otp", requestRegisterOtp);
// router.post("/register/verify-otp", verifyRegisterOtp);

// /* =========================
//    LOGIN
// ========================= */
// router.post("/login", login);

// /* =========================
//    FORGOT PASSWORD (OTP)
// ========================= */
// router.post("/forgot-password/request-otp", requestForgotPasswordOtp);
// router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp);

// /* =========================
//    CURRENT USER
// ========================= */
// router.get("/me", protect, getMe);

// module.exports = router;






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
} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth.middleware");
const { authLimiter } = require("../middlewares/rateLimiter");

/* =========================
   REGISTER WITH OTP
========================= */
router.post("/register/request-otp", authLimiter, requestRegisterOtp);
router.post("/register/verify-otp", authLimiter, verifyRegisterOtp);

/* =========================
   LOGIN
========================= */
router.post("/login", authLimiter, login);

/* =========================
   TWO-FACTOR AUTH
========================= */
router.post("/verify-2fa", authLimiter, verify2FA);
router.post("/resend-2fa", authLimiter, resend2FA);

/* =========================
   FORGOT PASSWORD (OTP)
========================= */
router.post("/forgot-password/request-otp", authLimiter, requestForgotPasswordOtp);
router.post("/forgot-password/verify-otp", authLimiter, verifyForgotPasswordOtp);

/* =========================
   CURRENT USER
========================= */
router.get("/me", protect, getMe);

module.exports = router;