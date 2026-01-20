const mongoose = require('mongoose');

const ReelSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 2200,
    },

    videoKey: {
      type: String,
      required: true,
    },

    videoUrl: {
      type: String,
      required: true,
    },

    thumbnailUrl: {
      type: String,
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ReelSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Reel', ReelSchema);
