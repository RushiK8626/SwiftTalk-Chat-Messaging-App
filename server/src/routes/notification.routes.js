const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/vapid-public-key', notificationController.getVapidPublicKey);
router.post('/subscribe', verifyToken, notificationController.subscribeToPushNotifications);
router.post('/unsubscribe', verifyToken, notificationController.unsubscribeFromPushNotifications);

module.exports = router;
