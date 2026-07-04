const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');

/**
 * ======================================================
 * REPORT ROUTES (For regular users)
 * Mount at: /api/v1/reports
 * ======================================================
 */

// Create a report (any authenticated user)
router.post('/', protect, adminController.createReport);

module.exports = router;
