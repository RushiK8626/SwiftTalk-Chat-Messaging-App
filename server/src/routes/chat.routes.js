const express = require('express');
const router = express.Router();
const chatController = require('../controller/chat.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { upload } = require('../config/upload');

router.use(verifyToken);

router.get('/active', chatController.getActiveChats);
router.get('/:id/info', chatController.getChatInfo);
router.post('/', upload.single('group_image'), chatController.createChat);
router.get('/:id', chatController.getChatById);
router.put('/:id', upload.single('group_image'), chatController.updateChat);
router.get('/user/:userId/preview', chatController.getUserChatsPreview);

router.post('/:chatId/members', chatController.addChatMember);
router.delete('/:chatId/members/:userId', chatController.removeChatMember);
router.post('/:chatId/exit', chatController.exitGroupChat);

router.put('/:chatId/pin', chatController.pinChat);
router.put('/:chatId/unpin', chatController.unpinChat);
router.delete('/:chatId/delete', chatController.deleteChat);
router.post('/batch/pin', chatController.batchPinChats);
router.post('/batch/mark-read', chatController.batchMarkReadChats);
router.post('/batch/delete', chatController.batchDeleteChats);

module.exports = router;