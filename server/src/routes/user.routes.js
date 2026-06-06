const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/public/search', userController.searchUsersPublic);
router.get('/public/id/:id', userController.getPublicUserProfile);

router.use(verifyToken);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.post('/:id/block', userController.blockUser);
router.delete('/:id/unblock/:blockedUserId', userController.unblockUser);
router.get('/:id/blocked', userController.getBlockedUsers);
router.get('/:id/block-status/:otherUserId', userController.checkBlockStatus);

module.exports = router;