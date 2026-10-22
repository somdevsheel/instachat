const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = mongoose.Schema(
  {
    /* =========================
       BASIC INFO
    ========================= */

    name: {
      type: String,
      maxlength: [50, 'Name cannot exceed 50 characters'],
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    /* =========================
       ROLE & ADMIN
    ========================= */

    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },

    /* =========================
       ACCOUNT STATUS
    ========================= */

    isBanned: {
      type: Boolean,
      default: false,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    suspendedUntil: {
      type: Date,
      default: null,
    },

    banReason: {
      type: String,
      default: "",
    },

    /* =========================
       PUSH NOTIFICATIONS
    ========================= */

    pushTokens: {
      type: [String],
      default: [],
      select: false,
    },

    /* =========================
       PERSONAL INFO
    ========================= */

    phone: {
      type: String,
      maxlength: [20, 'Phone cannot exceed 20 characters'],
      default: "",
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say", ""],
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    /* =========================
       VERIFICATION
    ========================= */

    isVerified: {
      type: Boolean,
      default: false,
    },

    /* =========================
       PASSWORD SECURITY
    ========================= */

    // Consent record: when the user accepted the Terms + Privacy Policy
    // (and confirmed they're at least 13), and which version.
    termsAcceptedAt: {
      type: Date,
      default: null,
    },
    termsVersion: {
      type: String,
      default: null,
    },

    // Bumped by "log out of all devices": tokens carry the version they
    // were issued with (`tv` claim) and older ones are rejected.
    tokenVersion: {
      type: Number,
      default: 0,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
    },

    /* =========================
       PRIVACY SETTINGS
    ========================= */

    isPrivate: {
      type: Boolean,
      default: false,
    },

    activityStatusVisible: {
      type: Boolean,
      default: true,
    },

    showReadReceipts: {
      type: Boolean,
      default: true,
    },

    // LEGACY — blocks/mutes now live in PostgreSQL (graph.service).
    // Kept read-only until db/scripts/migrateGraphToPostgres.js has been
    // run and verified in production; nothing writes these any more.
    blockedUsers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      select: false,
    },

    mutedUsers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      select: false,
    },

    /* =========================
       SECURITY
    ========================= */

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    loginActivity: [
      {
        device: { type: String, default: "Unknown" },
        location: { type: String, default: "Unknown" },
        ip: { type: String, default: "" },
        loginAt: { type: Date, default: Date.now },
        isCurrent: { type: Boolean, default: false },
      },
    ],

    /* =========================
       PROFILE
    ========================= */

    profilePicture: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      maxlength: [150, 'Bio cannot exceed 150 characters'],
      default: "",
    },

    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      trim: true,
      default: "",
    },

    website: {
      type: String,
      maxlength: [200, 'Website cannot exceed 200 characters'],
      trim: true,
      default: "",
    },

    // LEGACY — follows/close friends now live in PostgreSQL
    // (graph.service). Read-only, see note on blockedUsers above.
    followers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      select: false,
    },
    following: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      select: false,
    },
    closeFriends: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      select: false,
    },
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    savedReels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reel" }],
    repostedReels: [
      {
        reel: { type: mongoose.Schema.Types.ObjectId, ref: "Reel" },
        repostedAt: { type: Date, default: Date.now },
      },
    ],

    lastSeen: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/* =========================
   INSTANCE METHODS
========================= */

userSchema.methods.isPasswordMatch = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min
  return resetToken;
};

/* =========================
   PRE-SAVE HOOK
========================= */

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);

  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }

  next();
});

// Content-visibility checks look up private accounts; most users are
// public, so only index those that aren't.
userSchema.index(
  { isPrivate: 1 },
  { partialFilterExpression: { isPrivate: true } }
);

module.exports = mongoose.model("User", userSchema);