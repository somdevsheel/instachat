const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    // Participants (1–1 or group)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],

    // Last message preview (inbox)
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },

    // Chat type
    isGroup: {
      type: Boolean,
      default: false,
    },

    // Group name (only for groups)
    groupName: {
      type: String,
      trim: true,
    },

    // Group admins
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// 🔑 Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ isGroup: 1 });
chatSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
