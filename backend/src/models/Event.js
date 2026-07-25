const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },

    coverImage: {
      type: String,
      default: null,
    },

    date: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

EventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', EventSchema);
