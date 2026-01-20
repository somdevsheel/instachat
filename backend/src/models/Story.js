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

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete after 24 hours
StorySchema.pre('save', function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Story', StorySchema);
