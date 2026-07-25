const Group = require('../models/Group');
const catchAsync = require('../utils/catchAsync');

/**
 * POST /api/v1/groups
 */
exports.createGroup = catchAsync(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Group name is required' });
  }

  const group = await Group.create({
    name: name.trim(),
    description: description?.trim() || '',
    creator: userId,
    members: [userId],
  });

  await group.populate('creator', 'username profilePicture');

  res.status(201).json({ success: true, data: group });
});

/**
 * GET /api/v1/groups
 */
exports.getGroups = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const groups = await Group.find()
    .populate('creator', 'username profilePicture')
    .sort({ createdAt: -1 })
    .lean();

  const withMembership = groups.map((g) => ({
    ...g,
    membersCount: g.members.length,
    isMember: g.members.some((m) => m.toString() === userId),
    members: undefined,
  }));

  res.status(200).json({ success: true, data: withMembership });
});

/**
 * GET /api/v1/groups/:groupId
 */
exports.getGroupById = catchAsync(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  const group = await Group.findById(groupId)
    .populate('creator', 'username profilePicture')
    .populate('members', 'username profilePicture')
    .lean();

  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  res.status(200).json({
    success: true,
    data: {
      ...group,
      membersCount: group.members.length,
      isMember: group.members.some((m) => m._id.toString() === userId),
    },
  });
});

/**
 * PUT /api/v1/groups/:groupId/membership (toggle join/leave)
 */
exports.toggleMembership = catchAsync(async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  const group = await Group.findById(groupId);
  if (!group) {
    return res.status(404).json({ success: false, message: 'Group not found' });
  }

  const isMember = group.members.some((m) => m.toString() === userId);

  if (isMember) {
    group.members.pull(userId);
  } else {
    group.members.push(userId);
  }
  await group.save();

  res.status(200).json({
    success: true,
    data: { isMember: !isMember, membersCount: group.members.length },
  });
});
