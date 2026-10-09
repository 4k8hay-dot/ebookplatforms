const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/notifications
 * FR-NOTIFY-02 users shall be able to view their notifications.
 */
const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
  res.status(200).json({ success: true, data: { notifications, unreadCount } });
});

/**
 * PUT /api/notifications/:id/read
 * Marks a single notification as read. Not explicitly named in the SRS's
 * two FR-NOTIFY lines, but "view their notifications" implies some way
 * to acknowledge them — the smallest reasonable addition (Rule 11).
 */
const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new AppError('Notification not found', 404);
  if (String(notification.userId) !== String(req.user._id)) {
    throw new AppError('You do not have permission to modify this notification', 403);
  }

  notification.isRead = true;
  await notification.save();
  res.status(200).json({ success: true, data: { notification } });
});

module.exports = { listMyNotifications, markNotificationRead };
