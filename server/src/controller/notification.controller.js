const notificationService = require('../services/notification.service');

exports.subscribeToPushNotifications = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const { subscription } = req.body;

    if (!user_id || !subscription) return res.status(400).json({ error: 'user_id and subscription are required' });
    if (!subscription.endpoint || !subscription.keys) return res.status(400).json({ error: 'Invalid subscription format' });

    const savedSubscription = await notificationService.savePushSubscription(user_id, subscription);

    res.status(201).json({ message: 'Successfully subscribed to push notifications', data: { user_id, subscribed_at: savedSubscription.created_at } });
  } catch (error) {
    console.error('[notification.subscribeToPushNotifications]', error);
    res.status(500).json({ error: 'Failed to subscribe to notifications' });
  }
};

exports.unsubscribeFromPushNotifications = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const result = await notificationService.removePushSubscription(user_id);
    if (!result) return res.status(404).json({ error: 'Push subscription not found' });

    res.status(200).json({ message: 'Successfully unsubscribed from push notifications' });
  } catch (error) {
    console.error('[notification.unsubscribeFromPushNotifications]', error);
    res.status(500).json({ error: 'Failed to unsubscribe from notifications' });
  }
};

exports.getVapidPublicKey = async (req, res) => {
  try {
    const publicKey = notificationService.getVapidPublicKey();
    if (!publicKey) return res.status(500).json({ error: 'VAPID public key not configured' });

    res.set({ 'Cache-Control': 'public, max-age=86400', 'Content-Type': 'application/json' });
    res.status(200).json({ vapidPublicKey: publicKey });
  } catch (error) {
    console.error('[notification.getVapidPublicKey]', error);
    res.status(500).json({ error: 'Failed to retrieve VAPID key' });
  }
};
