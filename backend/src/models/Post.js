const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    /* ==============================
       CORE POST INFO
    ============================== */
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
      default: '',
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    hashtags: [
      {
        type: String,
        trim: true,
        index: true,
      },
    ],

    /* ==============================
       MEDIA (S3 + CLOUDINARY/CDN)
    ============================== */
    media: {
      type: {
        type: String,
        enum: ['image', 'video'],
        required: true,
      },

      // Raw S3 key (private upload reference)
      originalKey: {
        type: String,
        required: true,
      },

      // Public CDN URLs
      variants: {
        original: {
          type: String,
          required: true,
        },

        // Optional (future use)
        thumbnail: {
          type: String,
          default: null,
        },
      },
    },

    /* ==============================
       ENGAGEMENT
    ============================== */
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

    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    commentsCount: {
      type: Number,
      default: 0,
    },

    shareCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* ==============================
   INDEXES (PERFORMANCE)
============================== */
PostSchema.index({ createdAt: -1 });
PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ hashtags: 1 });

module.exports = mongoose.model('Post', PostSchema);
