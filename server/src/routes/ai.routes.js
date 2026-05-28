const express = require('express');
const router = express.Router();
const aiController = require('../controller/ai.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/smart-replies', aiController.generateSmartReplies);
router.post('/translate', aiController.translateMessage);
router.post('/summarize', aiController.summarizeConversation);
router.post('/detect-language', aiController.detectLanguage);
router.post('/conversation-starters', aiController.generateConversationStarters);
router.get('/status', aiController.checkStatus);
router.post('/chat-stream', aiController.streamChatController);
router.post('/sessions', aiController.createSession);
router.get('/sessions', aiController.getUserSessions);
router.get('/sessions/:session_id', aiController.getSession);
router.delete('/sessions/:session_id', aiController.deleteSession);
module.exports = router;
