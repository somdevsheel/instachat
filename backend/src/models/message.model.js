const mongoose = require('mongoose');

const encryptedPayloadSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },

    cipherText: {
      type: String,
      required: true,
    },

    nonce: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    /* =========================
       CHAT REFERENCE
    ========================= */
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },

    /* =========================
       SENDER & RECEIVER
    ========================= */
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    /* =========================
       🔐 MULTI-DEVICE E2EE PAYLOADS
    ========================= */
    encryptedPayloads: {
      type: [encryptedPayloadSchema],
      required: true,
      validate: v => Array.isArray(v) && v.length > 0,
    },

    /* =========================
       MESSAGE TYPE
    ========================= */
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'post_share', 'reel_share'],
      default: 'text',
    },

    /* =========================
       READ RECEIPTS
    ========================= */
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /* =========================
       DELETE LOGIC
    ========================= */
    deletedForEveryone: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
    },

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

/* =========================
   INDEXES
========================= */
messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ deletedForEveryone: 1 });

module.exports = mongoose.model('Message', messageSchema);
