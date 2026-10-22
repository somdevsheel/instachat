const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/user.model");
const Otp = require("../models/Otp.model");
const Post = require("../models/Post");
const graph = require("../services/graph.service");

const { generateOtp, getOtpExpiry, consumeOtp } = require("../utils/otp");
const sendEmail = require("../utils/sendEmail");
const logger = require('../utils/logger');

/* =========================
   HELPERS
========================= */

const { signToken, revokeToken } = require("../utils/authTokens");
const { recordLogin } = require("../utils/loginActivity");

// Bump when the Terms / Privacy Policy change materially (see
// frontend/web/src/pages/legal/). Stored with each user's consent.
const TERMS_VERSION = "2026-10-22";

// Social graph lives in Postgres. Clients still expect `followers` /
// `following` id arrays on the login user object.
const getFollowIdLists = async (userId) => {
  const [followers, following] = await Promise.all([
    graph.getFollowerIds(userId),
    graph.getFollowingIds(userId),
  ]);
  return { followers, following };
};

const LEGACY_GRAPH_FIELDS = [
  "followers",
  "following",
  "closeFriends",
  "blockedUsers",
  "mutedUsers",
];

const toAuthUser = async (user) => {
  const obj = user.toObject();
  delete obj.password;
  LEGACY_GRAPH_FIELDS.forEach((f) => delete obj[f]);
  return { ...obj, ...(await getFollowIdLists(user._id)) };
};

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

/* =========================
   REGISTER – REQUEST OTP
========================= */

exports.requestRegisterOtp = async (req, res) => {
  try {
    const emailRaw = req.body.email;

    if (!emailRaw || typeof emailRaw !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const email = emailRaw.trim().toLowerCase();

    // Don't reveal whether an email is registered: respond exactly as for
    // a new address, and tell the real owner by email instead.
    const existingUser = await User.findOne({ email }).select("username");
    if (existingUser) {
      await sendEmail({
        to: email,
        subject: "InstaChat - Sign-up attempt",
        text: `Someone tried to create an InstaChat account with this email, but you already have one (@${existingUser.username}). You can log in, or use "Forgot password" if you need to. If this wasn't you, you can ignore this email.`,
      });
      return res.status(200).json({
        success: true,
        message: "OTP sent to email",
      });
    }

    await Otp.deleteMany({ email, purpose: "register" });

    const otp = generateOtp();

    await Otp.create({
      email,
      otp,
      purpose: "register",
      expiresAt: getOtpExpiry(),
    });

    await sendEmail({
      to: email,
      subject: "InstaChat - Email Verification",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (error) {
    logger.error("Request register OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   REGISTER – VERIFY OTP
========================= */

exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp, password, username, fullName, acceptedTerms } = req.body;

    if (![email, otp, password, username, fullName].every(isNonEmptyString)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailNormalized = email.trim().toLowerCase();

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Explicit consent: Terms + Privacy Policy, and minimum age (13).
    if (acceptedTerms !== true) {
      return res.status(400).json({
        success: false,
        code: "TERMS_REQUIRED",
        message:
          "Please confirm you're at least 13 and agree to the Terms and Privacy Policy",
      });
    }

    if (!/^[a-z0-9._]{3,30}$/i.test(String(username).trim())) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be 3-30 characters: letters, numbers, dots or underscores",
      });
    }

    // (No "email already registered" check here: existing addresses never
    // receive a register code, so they fail the OTP check below like any
    // wrong code — the response can't be used to probe for accounts.)

    const usernameTaken = await User.exists({
      username: String(username).trim().toLowerCase(),
    });
    if (usernameTaken) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken",
      });
    }

    const otpRecord = await consumeOtp(Otp, {
      email: emailNormalized,
      purpose: "register",
      otp,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const user = await User.create({
      name: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: emailNormalized,
      password,
      isVerified: true,
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    });

    await Otp.deleteMany({ email: emailNormalized, purpose: "register" });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      userId: user._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "That username or email was just taken. Please try another.",
      });
    }
    logger.error("Verify register OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   LOGIN (WITH 2FA SUPPORT)
========================= */

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || user.isVerified === false) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been banned",
      });
    }

    if (
      user.isSuspended &&
      (!user.suspendedUntil || user.suspendedUntil > new Date())
    ) {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended",
      });
    }

    /* ==============================
       2FA CHECK
    ============================== */
    if (user.twoFactorEnabled) {
      // Clean up old OTPs
      await Otp.deleteMany({
        email: user.email,
        purpose: "login-2fa",
      });

      const otp = generateOtp();

      await Otp.create({
        email: user.email,
        otp,
        purpose: "login-2fa",
        expiresAt: getOtpExpiry(),
      });

      await sendEmail({
        to: user.email,
        subject: "InstaChat - Login Verification Code",
        text: `Your login verification code is ${otp}. It is valid for 5 minutes. If you didn't try to log in, please change your password immediately.`,
      });

      // Return 2FA required — NO token yet
      return res.status(200).json({
        success: true,
        requires2FA: true,
        tempUserId: user._id,
        email: user.email,
        message: "Verification code sent to your email",
      });
    }

    /* ==============================
       NORMAL LOGIN (no 2FA)
    ============================== */
    const token = signToken(user);
    await recordLogin(user._id, req);

    return res.status(200).json({
      success: true,
      requires2FA: false,
      token,
      user: await toAuthUser(user),
    });
  } catch (error) {
    logger.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   VERIFY 2FA OTP
========================= */

exports.verify2FA = async (req, res) => {
  try {
    const { email, otp, tempUserId } = req.body;

    if (![email, otp, tempUserId].every(isNonEmptyString)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Verify the user matches
    const user = await User.findById(tempUserId);

    if (!user || user.email !== emailNormalized) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // Check OTP (counts wrong guesses, burns code after too many)
    const otpRecord = await consumeOtp(Otp, {
      email: emailNormalized,
      purpose: "login-2fa",
      otp,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Clean up
    await Otp.deleteMany({
      email: emailNormalized,
      purpose: "login-2fa",
    });

    // Now issue the real token
    const token = signToken(user);
    await recordLogin(user._id, req);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        isVerified: user.isVerified,
        ...(await getFollowIdLists(user._id)),
      },
    });
  } catch (error) {
    logger.error("Verify 2FA error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   RESEND 2FA OTP
========================= */

exports.resend2FA = async (req, res) => {
  try {
    const { email, tempUserId } = req.body;

    if (![email, tempUserId].every(isNonEmptyString)) {
      return res.status(400).json({
        success: false,
        message: "Email and user ID are required",
      });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Verify user exists and has 2FA enabled
    const user = await User.findById(tempUserId);

    if (!user || user.email !== emailNormalized || !user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // Clean old & create new
    await Otp.deleteMany({
      email: emailNormalized,
      purpose: "login-2fa",
    });

    const otp = generateOtp();

    await Otp.create({
      email: emailNormalized,
      otp,
      purpose: "login-2fa",
      expiresAt: getOtpExpiry(),
    });

    await sendEmail({
      to: emailNormalized,
      subject: "InstaChat - Login Verification Code",
      text: `Your login verification code is ${otp}. It is valid for 5 minutes.`,
    });

    return res.status(200).json({
      success: true,
      message: "New verification code sent",
    });
  } catch (error) {
    logger.error("Resend 2FA error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   FORGOT PASSWORD – REQUEST OTP
========================= */

exports.requestForgotPasswordOtp = async (req, res) => {
  try {
    const emailRaw = req.body.email;

    if (!emailRaw || typeof emailRaw !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const email = emailRaw.trim().toLowerCase();

    const user = await User.findOne({ email });

    // Do NOT reveal existence
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, an OTP has been sent.",
      });
    }

    await Otp.deleteMany({ email, purpose: "forgot" });

    const otp = generateOtp();

    await Otp.create({
      email,
      otp,
      purpose: "forgot",
      expiresAt: getOtpExpiry(),
    });

    await sendEmail({
      to: email,
      subject: "InstaChat - Password Reset OTP",
      text: `Your password reset OTP is ${otp}. It is valid for 5 minutes.`,
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, an OTP has been sent.",
    });
  } catch (error) {
    logger.error("Forgot OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   FORGOT PASSWORD – VERIFY OTP (FIXED)
========================= */
exports.verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (![email, otp, newPassword].every(isNonEmptyString)) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const emailNormalized = email.trim().toLowerCase();

    const otpRecord = await consumeOtp(Otp, {
      email: emailNormalized,
      purpose: "forgot",
      otp,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const user = await User.findOne({ email: emailNormalized }).select(
      "+password"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    user.password = newPassword;
    user.isVerified = true; // 🔥 THIS WAS MISSING
    await user.save({ validateBeforeSave: false });

    await Otp.deleteMany({ email: emailNormalized, purpose: "forgot" });

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login.",
    });
  } catch (error) {
    logger.error("Verify forgot OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* =========================
   GET CURRENT USER
========================= */

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select("_id media caption createdAt repostOf repostOfModel")
      .populate({
        path: "repostOf",
        populate: { path: "user", select: "username name profilePicture" },
      });

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location || '',
        website: user.website || '',
        isVerified: user.isVerified || false,
        createdAt: user.createdAt,
        ...(await graph.getCounts(user._id)),
        postsCount: posts.length,
        posts,
      },
    });
  } catch (error) {
    logger.error("GetMe error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   LOGOUT (this device)
========================= */

exports.logout = async (req, res) => {
  try {
    await revokeToken(req.user.$locals.token);
  } catch (error) {
    // Redis down: the client still discards its token.
    logger.error("Logout revoke error:", error);
  }
  return res.status(200).json({ success: true, message: "Logged out" });
};

/* =========================
   LOGOUT ALL DEVICES
========================= */

exports.logoutAll = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    // Also end any open realtime connections for this account.
    try {
      require("../services/socket.service").getIO().in(req.user._id.toString()).disconnectSockets(true);
    } catch {}
    return res.status(200).json({
      success: true,
      message: "Logged out of all devices",
    });
  } catch (error) {
    logger.error("Logout all error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
