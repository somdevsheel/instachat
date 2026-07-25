const express = require('express');
const router = express.Router();
const eventController = require('../../controllers/event.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.get('/', protect, eventController.getEvents);
router.post('/', protect, eventController.createEvent);
router.get('/:eventId', protect, eventController.getEventById);
router.put('/:eventId/rsvp', protect, eventController.toggleRsvp);

module.exports = router;
