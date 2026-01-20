const mongoose = require('mongoose');

const userKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    identityPublicKey: {
      type: String,
      required: true,
    },

    signingPublicKey: {
      type: String,
      required: true,
    },

    fingerprint: {
      type: String,
      required: true,
    },

    revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('UserKey', userKeySchema);
