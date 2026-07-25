const express = require('express');
const router = express.Router();
const groupController = require('../../controllers/group.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.get('/', protect, groupController.getGroups);
router.post('/', protect, groupController.createGroup);
router.get('/:groupId', protect, groupController.getGroupById);
router.put('/:groupId/membership', protect, groupController.toggleMembership);

module.exports = router;
