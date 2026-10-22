const Listing = require('../models/Listing');
const catchAsync = require('../utils/catchAsync');
const getPagination = require('../utils/pagination');
const { verifyUploadedMedia } = require('../utils/verifyUpload');
const str = require('../utils/str');

const CDN_BASE_URL =
  process.env.CDN_BASE_URL ||
  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/**
 * POST /api/v1/marketplace
 */
exports.createListing = catchAsync(async (req, res) => {
  const { title, description, price, category, location, imageKey } = req.body;
  const userId = req.user.id;

  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  if (price === undefined || price === null || isNaN(price) || price < 0 || price > 1e9) {
    return res.status(400).json({ success: false, message: 'A valid price is required' });
  }

  if (imageKey) {
    await verifyUploadedMedia(imageKey, userId, 'image');
  }

  const listing = await Listing.create({
    title: title.trim(),
    description: str(description) || '',
    price,
    category: str(category) || 'Other',
    location: str(location) || '',
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
  const { limit, skip } = getPagination(req.query);
  const listings = await Listing.find({ isSold: false })
    .populate('seller', 'username profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
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
