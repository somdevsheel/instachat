const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    media: {
      type: {
        type: String,
        enum: ['image', 'video'],
        required: true,
      },
      key: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },

    // ✅ NEW: Track who viewed this story
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],

    reactions: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    emoji: {
      type: String, // ❤️ 😂 🔥
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
],


    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

StorySchema.pre('validate', function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

StorySchema.index({ user: 1, createdAt: -1 });
StorySchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Story', StorySchema);
