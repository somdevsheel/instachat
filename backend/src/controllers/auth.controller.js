// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");

// const User = require("../models/user.model");
// const Otp = require("../models/Otp.model");
// const Post = require("../models/Post");

// const { generateOtp, getOtpExpiry } = require("../utils/otp");
// const sendEmail = require("../utils/sendEmail");

// /* =========================
//    HELPERS
// ========================= */

// const signToken = (userId) => {
//   return jwt.sign(
//     { id: userId },
//     process.env.JWT_SECRET,
//     { expiresIn: "30d" }
//   );
// };

// /* =========================
//    REGISTER – REQUEST OTP
// ========================= */

// exports.requestRegisterOtp = async (req, res) => {
//   try {
//     const emailRaw = req.body.email;

//     if (!emailRaw || typeof emailRaw !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     const email = emailRaw.trim().toLowerCase();

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists",
//       });
//     }

//     await Otp.deleteMany({ email, purpose: "register" });

//     const otp = generateOtp();

//     await Otp.create({
//       email,
//       otp,
//       purpose: "register",
//       expiresAt: getOtpExpiry(),
//     });

//     await sendEmail({
//       to: email,
//       subject: "InstaChat - Email Verification",
//       text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent to email",
//     });
//   } catch (error) {
//     console.error("Request register OTP error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// /* =========================
//    REGISTER – VERIFY OTP
// ========================= */

// exports.verifyRegisterOtp = async (req, res) => {
//   try {
//     const { email, otp, password, username, fullName } = req.body;

//     if (!email || !otp || !password || !username || !fullName) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     const emailNormalized = email.trim().toLowerCase();

//     const existingUser = await User.findOne({ email: emailNormalized });
//     if (existingUser) {
//       return res.status(200).json({
//         success: true,
//         message: "Account already created. Please login.",
//       });
//     }

//     const otpRecord = await Otp.findOne({
//       email: emailNormalized,
//       otp: otp.trim(),
//       purpose: "register",
//       isUsed: false,
//       expiresAt: { $gt: new Date() },
//     });

//     if (!otpRecord) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or expired OTP",
//       });
//     }

//     otpRecord.isUsed = true;
//     await otpRecord.save();

//     const user = await User.create({
//       name: fullName.trim(),
//       username: username.trim().toLowerCase(),
//       email: emailNormalized,
//       password,
//       isVerified: true,
//     });

//     await Otp.deleteMany({ email: emailNormalized, purpose: "register" });

//     return res.status(201).json({
//       success: true,
//       message: "Account created successfully",
//       userId: user._id,
//     });
//   } catch (error) {
//     console.error("Verify register OTP error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// /* =========================
//    LOGIN
// ========================= */

// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email and password are required",
//       });
//     }

//     const user = await User.findOne({
//       email: email.trim().toLowerCase(),
//     }).select("+password");

//     if (!user || user.isVerified === false) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid credentials",
//       });
//     }

//     const token = signToken(user._id);
//     user.password = undefined;

//     return res.status(200).json({
//       success: true,
//       token,
//       user,
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// /* =========================
//    FORGOT PASSWORD – REQUEST OTP
// ========================= */

// exports.requestForgotPasswordOtp = async (req, res) => {
//   try {
//     const emailRaw = req.body.email;

//     if (!emailRaw || typeof emailRaw !== "string") {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     const email = emailRaw.trim().toLowerCase();

//     const user = await User.findOne({ email });

//     // Do NOT reveal existence
//     if (!user) {
//       return res.status(200).json({
//         success: true,
//         message:
//           "If an account with that email exists, an OTP has been sent.",
//       });
//     }

//     await Otp.deleteMany({ email, purpose: "forgot" });

//     const otp = generateOtp();

//     await Otp.create({
//       email,
//       otp,
//       purpose: "forgot",
//       expiresAt: getOtpExpiry(),
//     });

//     await sendEmail({
//       to: email,
//       subject: "InstaChat - Password Reset OTP",
//       text: `Your password reset OTP is ${otp}. It is valid for 5 minutes.`,
//     });

//     return res.status(200).json({
//       success: true,
//       message:
//         "If an account with that email exists, an OTP has been sent.",
//     });
//   } catch (error) {
//     console.error("Forgot OTP error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// /* =========================
//    FORGOT PASSWORD – VERIFY OTP (FIXED)
// ========================= */
// exports.verifyForgotPasswordOtp = async (req, res) => {
//   try {
//     const { email, otp, newPassword } = req.body;

//     if (!email || !otp || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     if (newPassword.length < 8) {
//       return res.status(400).json({
//         success: false,
//         message: "Password must be at least 8 characters",
//       });
//     }

//     const emailNormalized = email.trim().toLowerCase();

//     const otpRecord = await Otp.findOne({
//       email: emailNormalized,
//       otp: otp.trim(),
//       purpose: "forgot",
//       isUsed: false,
//       expiresAt: { $gt: new Date() },
//     });

//     if (!otpRecord) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid or expired OTP",
//       });
//     }

//     const user = await User.findOne({ email: emailNormalized }).select(
//       "+password"
//     );

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid request",
//       });
//     }

//     otpRecord.isUsed = true;
//     await otpRecord.save();

//     // ✅ FINAL FIX
//     user.password = newPassword;
//     user.isVerified = true; // 🔥 THIS WAS MISSING
//     await user.save({ validateBeforeSave: false });

//     await Otp.deleteMany({ email: emailNormalized, purpose: "forgot" });

//     return res.status(200).json({
//       success: true,
//       message: "Password reset successful. Please login.",
//     });
//   } catch (error) {
//     console.error("Verify forgot OTP error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };


// /* =========================
//    GET CURRENT USER
// ========================= */

// exports.getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id)
//       .select("-password")
//       .populate("followers", "_id")
//       .populate("following", "_id");

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     const posts = await Post.find({ user: user._id })
//       .sort({ createdAt: -1 })
//       .select("_id media createdAt");

//     return res.status(200).json({
//       success: true,
//       data: {
//         _id: user._id,
//         name: user.name,
//         username: user.username,
//         email: user.email,
//         profilePicture: user.profilePicture,
//         bio: user.bio,
//         followersCount: user.followers.length,
//         followingCount: user.following.length,
//         postsCount: posts.length,
//         posts,
//       },
//     });
//   } catch (error) {
//     console.error("GetMe error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };







const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/user.model");
const Otp = require("../models/Otp.model");
const Post = require("../models/Post");

const { generateOtp, getOtpExpiry } = require("../utils/otp");
const sendEmail = require("../utils/sendEmail");

/* =========================
   HELPERS
========================= */

const signToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
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
    console.error("Request register OTP error:", error);
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
    const { email, otp, password, username, fullName } = req.body;

    if (!email || !otp || !password || !username || !fullName) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailNormalized = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "Account already created. Please login.",
      });
    }

    const otpRecord = await Otp.findOne({
      email: emailNormalized,
      otp: otp.trim(),
      purpose: "register",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await User.create({
      name: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: emailNormalized,
      password,
      isVerified: true,
    });

    await Otp.deleteMany({ email: emailNormalized, purpose: "register" });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      userId: user._id,
    });
  } catch (error) {
    console.error("Verify register OTP error:", error);
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

    if (!email || !password) {
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
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
    const token = signToken(user._id);
    user.password = undefined;

    return res.status(200).json({
      success: true,
      requires2FA: false,
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
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

    if (!email || !otp || !tempUserId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailNormalized = email.trim().toLowerCase();

    // Find valid OTP
    const otpRecord = await Otp.findOne({
      email: emailNormalized,
      otp: otp.trim(),
      purpose: "login-2fa",
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Verify the user matches
    const user = await User.findById(tempUserId);

    if (!user || user.email !== emailNormalized) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Clean up
    await Otp.deleteMany({
      email: emailNormalized,
      purpose: "login-2fa",
    });

    // Now issue the real token
    const token = signToken(user._id);

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
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (error) {
    console.error("Verify 2FA error:", error);
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

    if (!email || !tempUserId) {
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
    console.error("Resend 2FA error:", error);
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
    console.error("Forgot OTP error:", error);
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

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const emailNormalized = email.trim().toLowerCase();

    const otpRecord = await Otp.findOne({
      email: emailNormalized,
      otp: otp.trim(),
      purpose: "forgot",
      isUsed: false,
      expiresAt: { $gt: new Date() },
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

    otpRecord.isUsed = true;
    await otpRecord.save();

    // ✅ FINAL FIX
    user.password = newPassword;
    user.isVerified = true; // 🔥 THIS WAS MISSING
    await user.save({ validateBeforeSave: false });

    await Otp.deleteMany({ email: emailNormalized, purpose: "forgot" });

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login.",
    });
  } catch (error) {
    console.error("Verify forgot OTP error:", error);
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
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("followers", "_id")
      .populate("following", "_id");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select("_id media createdAt");

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        postsCount: posts.length,
        posts,
      },
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};