const Listing = require('../models/Listing');
const catchAsync = require('../utils/catchAsync');

const CDN_BASE_URL =
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/**
 * POST /api/v1/marketplace
 */
exports.createListing = catchAsync(async (req, res) => {
  const { title, description, price, category, location, imageKey } = req.body;
  const userId = req.user.id;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  if (price === undefined || isNaN(price) || price < 0) {
    return res.status(400).json({ success: false, message: 'A valid price is required' });
  }

  const listing = await Listing.create({
    title: title.trim(),
    description: description?.trim() || '',
    price,
    category: category?.trim() || 'Other',
    location: location?.trim() || '',
    image: imageKey ? `${CDN_BASE_URL}/${imageKey}` : null,
    seller: userId,
  });

  await listing.populate('seller', 'username profilePicture');

  res.status(201).json({ success: true, data: listing });
});

/**
 * GET /api/v1/marketplace
 */
exports.getListings = catchAsync(async (req, res) => {
  const listings = await Listing.find({ isSold: false })
    .populate('seller', 'username profilePicture')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: listings });
});

/**
 * GET /api/v1/marketplace/:listingId
 */
exports.getListingById = catchAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId)
    .populate('seller', 'username profilePicture')
    .lean();

  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }

  res.status(200).json({ success: true, data: listing });
});

/**
 * DELETE /api/v1/marketplace/:listingId
 */
exports.deleteListing = catchAsync(async (req, res) => {
  const listing = await Listing.findById(req.params.listingId);
  if (!listing) {
    return res.status(404).json({ success: false, message: 'Listing not found' });
  }
  if (listing.seller.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await Listing.findByIdAndDelete(req.params.listingId);
  res.status(200).json({ success: true, message: 'Listing deleted' });
});
