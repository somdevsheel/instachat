const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      trim: true,
      default: 'Other',
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    image: {
      type: String,
      default: null,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    isSold: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

ListingSchema.index({ createdAt: -1 });
ListingSchema.index({ category: 1 });

module.exports = mongoose.model('Listing', ListingSchema);
