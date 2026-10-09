const mongoose = require('mongoose');

/**
 * A join collection rather than an embedded array on User — keeps the
 * User document small and lets bookshelf size scale independently
 * (NFR-Scalability), consistent with Assumption #1 from the Phase 0
 * analysis document.
 *
 * "Currently reading" (FR-SHELF-04) is intentionally NOT a stored flag
 * here — it's derived at read time from whether a ReadingProgress record
 * exists for the same user+book. Storing it separately would just be a
 * second source of truth that could drift out of sync with actual
 * reading activity.
 */
const bookshelfSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

bookshelfSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('Bookshelf', bookshelfSchema);
