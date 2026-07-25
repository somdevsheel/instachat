const Event = require('../models/Event');
const catchAsync = require('../utils/catchAsync');

/**
 * POST /api/v1/events
 */
exports.createEvent = catchAsync(async (req, res) => {
  const { name, description, date, location } = req.body;
  const userId = req.user.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Event name is required' });
  }
  if (!date || isNaN(new Date(date).getTime())) {
    return res.status(400).json({ success: false, message: 'A valid date is required' });
  }

  const event = await Event.create({
    name: name.trim(),
    description: description?.trim() || '',
    date: new Date(date),
    location: location?.trim() || '',
    host: userId,
    attendees: [userId],
  });

  await event.populate('host', 'username profilePicture');

  res.status(201).json({ success: true, data: event });
});

/**
 * GET /api/v1/events
 */
exports.getEvents = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const events = await Event.find()
    .populate('host', 'username profilePicture')
    .sort({ date: 1 })
    .lean();

  const withRsvp = events.map((e) => ({
    ...e,
    attendeesCount: e.attendees.length,
    isGoing: e.attendees.some((a) => a.toString() === userId),
    attendees: undefined,
  }));

  res.status(200).json({ success: true, data: withRsvp });
});

/**
 * GET /api/v1/events/:eventId
 */
exports.getEventById = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  const event = await Event.findById(eventId)
    .populate('host', 'username profilePicture')
    .populate('attendees', 'username profilePicture')
    .lean();

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  res.status(200).json({
    success: true,
    data: {
      ...event,
      attendeesCount: event.attendees.length,
      isGoing: event.attendees.some((a) => a._id.toString() === userId),
    },
  });
});

/**
 * PUT /api/v1/events/:eventId/rsvp (toggle going/not going)
 */
exports.toggleRsvp = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  const isGoing = event.attendees.some((a) => a.toString() === userId);

  if (isGoing) {
    event.attendees.pull(userId);
  } else {
    event.attendees.push(userId);
  }
  await event.save();

  res.status(200).json({
    success: true,
    data: { isGoing: !isGoing, attendeesCount: event.attendees.length },
  });
});
