const express = require("express");
const router = express.Router();

const {
  login,
  getMe,
  requestRegisterOtp,
  verifyRegisterOtp,
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
} = require("../controllers/auth.controller");

const { protect } = require("../middlewares/auth.middleware");

/* =========================
   REGISTER WITH OTP
========================= */
router.post("/register/request-otp", requestRegisterOtp);
router.post("/register/verify-otp", verifyRegisterOtp);

/* =========================
   LOGIN
========================= */
router.post("/login", login);

/* =========================
   FORGOT PASSWORD (OTP)
========================= */
router.post("/forgot-password/request-otp", requestForgotPasswordOtp);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp);

/* =========================
   CURRENT USER
========================= */
router.get("/me", protect, getMe);

module.exports = router;
