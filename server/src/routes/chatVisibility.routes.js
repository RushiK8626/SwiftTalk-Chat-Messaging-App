const express = require('express');
const router = express.Router();
const chatVisibilityController = require('../controller/chatVisibility.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/active/:userId', chatVisibilityController.getActiveChats);
router.put('/:chatId/archive', chatVisibilityController.archiveChat);
router.put('/:chatId/unarchive', chatVisibilityController.unarchiveChat);
router.put('/:chatId/pin', chatVisibilityController.pinChat);
router.put('/:chatId/unpin', chatVisibilityController.unpinChat);
router.post('/batch/delete', chatVisibilityController.batchDeleteChats);
router.post('/batch/pin', chatVisibilityController.batchPinChats);
router.post('/batch/mark-read', chatVisibilityController.batchMarkReadChats);
router.delete('/:chatId', chatVisibilityController.deleteChat);

module.exports = router;
