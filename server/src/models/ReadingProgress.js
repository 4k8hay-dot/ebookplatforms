const mongoose = require('mongoose');

/**
 * Fields follow SRS §10.3 (userId, bookId, currentPage, progressPercentage,
 * lastReadAt), plus a `position` string to hold format-specific location
 * data that a bare page number can't express:
 *   - PDF: position mirrors currentPage (stringified) for simplicity
 *   - EPUB: position holds the epub.js CFI (Canonical Fragment Identifier),
 *     since reflowable EPUB content has no fixed page numbers
 *
 * This document is written by the Phase 3 reader purely so a user can
 * resume where they left off (FR-READ-04/05). progressPercentage is not
 * computed yet — that calculation, plus the "Continue Reading" catalog
 * surface, is FR-PROGRESS-02/03/04 and is built in Phase 4 on top of this
 * same collection.
 */
const readingProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    position: { type: String, default: null }, // page number (PDF) or CFI (EPUB), as a string
    currentPage: { type: Number, default: null },
    totalPages: { type: Number, default: null },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// BR-10: reading progress shall be associated with the corresponding user
// and book — enforced here as a uniqueness constraint (one progress
// record per user per book, upserted on every save).
readingProgressSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('ReadingProgress', readingProgressSchema);
