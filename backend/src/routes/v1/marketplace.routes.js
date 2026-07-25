const express = require('express');
const router = express.Router();
const listingController = require('../../controllers/listing.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.get('/', protect, listingController.getListings);
router.post('/', protect, listingController.createListing);
router.get('/:listingId', protect, listingController.getListingById);
router.delete('/:listingId', protect, listingController.deleteListing);

module.exports = router;
