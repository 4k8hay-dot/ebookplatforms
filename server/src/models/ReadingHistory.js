const mongoose = require('mongoose');

const readingHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    lastAccessedAt: { type: Date, default: Date.now },
    lastPosition: { type: String, default: null },
  },
  { timestamps: true }
);

// One history entry per user+book — "accessing" a book again just
// refreshes lastAccessedAt/lastPosition rather than creating duplicates,
// which is what lets FR-HISTORY-03 ("recently read books") produce a
// clean, non-repeating list.
readingHistorySchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('ReadingHistory', readingHistorySchema);
