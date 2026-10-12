const Notification = require('../models/notificationModel');

exports.list = (req, res) => {
  try {
    const notifications = Notification.findByUser(req.user.id);
    const unreadCount = Notification.countUnread(req.user.id);
    res.json({ unreadCount, notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markRead = (req, res) => {
  try {
    const notification = Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updated = Notification.markAsRead(notification.id, req.user.id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAllRead = (req, res) => {
  try {
    Notification.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};