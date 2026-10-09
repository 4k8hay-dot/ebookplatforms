const Notification = require('../models/Notification');

async function createNotification(userId, type, message, relatedBookId = null) {
  return Notification.create({ userId, type, message, relatedBookId });
}

module.exports = { createNotification };
