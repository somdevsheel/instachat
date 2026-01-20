const express = require('express');
const { protect } = require('../../middlewares/auth.middleware');
const keyController = require('../../controllers/key.controller');

const router = express.Router();

/**
 * ===============================
 * GET MY DEVICE KEYS (⚠️ MUST BE FIRST)
 * GET /api/v1/keys/me
 * ===============================
 */
router.get('/me', protect, keyController.getMyKey);

/**
 * ===============================
 * GET USER DEVICE KEYS
 * GET /api/v1/keys/:userId
 * ===============================
 */
router.get('/:userId', protect, keyController.getUserKeys);

/**
 * ===============================
 * UPSERT DEVICE KEY
 * POST /api/v1/keys
 * ===============================
 */
router.post('/', protect, keyController.upsertKeys);

module.exports = router;
