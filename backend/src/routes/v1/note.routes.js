const express = require('express');
const router = express.Router();

const noteController = require('../../controllers/note.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.get('/me', protect, noteController.getMyNote);
router.post('/', protect, noteController.setNote);
router.delete('/', protect, noteController.deleteNote);

module.exports = router;
