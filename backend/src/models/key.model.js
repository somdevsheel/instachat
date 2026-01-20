const mongoose = require('mongoose');

const keySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // ❌ NOT unique anymore
    },

    deviceId: {
      type: String,
      required: true,
    },

    identityPublicKey: {
      type: String,
      required: true,
    },

    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ✅ CRITICAL: compound unique index
keySchema.index({ user: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.model('Key', keySchema);
