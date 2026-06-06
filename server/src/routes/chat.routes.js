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

router.post('/:chatId/members', (req, res) => chatController.addChatMember(req, res, req.io));
router.delete('/:chatId/members/:userId', (req, res) => chatController.removeChatMember(req, res, req.io));
router.post('/:chatId/exit', (req, res) => chatController.exitGroupChat(req, res, req.io));

router.put('/:chatId/pin', chatController.pinChat);
router.put('/:chatId/unpin', chatController.unpinChat);
router.delete('/:chatId/delete', chatController.deleteChat);
router.post('/batch/pin', chatController.batchPinChats);
router.post('/batch/mark-read', chatController.batchMarkReadChats);
router.post('/batch/delete', chatController.batchDeleteChats);

module.exports = router;