const mongoose = require('mongoose');

/**
 * type is a plain string rather than a rigid enum, since the SRS's own
 * wording ("such as book approval, rejection or system announcements")
 * treats the event list as illustrative, not exhaustive.
 */
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    relatedBookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
