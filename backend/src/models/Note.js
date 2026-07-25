const mongoose = require('mongoose');

/**
 * ======================================================
 * NOTE MODEL
 * ======================================================
 * Short-lived text status shown above a user's avatar in the chat
 * list (Instagram-style "notes"). One active note per user — posting
 * a new one replaces the old one. Auto-deleted by Mongo's TTL index
 * once expiresAt passes.
 */
const NoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

NoteSchema.pre('validate', function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Note', NoteSchema);
