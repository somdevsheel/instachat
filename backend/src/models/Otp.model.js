const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },

    otp: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["register", "forgot", "login-2fa", "change-email"],
      required: true,
    },

    // Set for "change-email": the account requesting the change (the
    // `email` field holds the NEW address the code was sent to).
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
    },

    // Wrong guesses against this code (see utils/otp.consumeOtp)
    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1 });

// Let MongoDB purge expired codes automatically.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
