const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ✅ PHASE 1 – plain text
    text: {
      type: String,
      trim: true,
    },

    // 🔐 PHASE 2 – encrypted
    encryptedPayloads: {
      type: Array,
      default: undefined,
    },

    encryptionMode: {
      type: String,
      enum: ['plain', 'e2ee'],
      default: 'plain',
    },

    type: {
      type: String,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },

    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],

    deletedForEveryone: { type: Boolean, default: false },
    deletedAt: Date,
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
