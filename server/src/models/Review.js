const mongoose = require('mongoose');

/**
 * Fields follow SRS §10.6 exactly. BR-11 / FR-REVIEW-06 (no duplicate
 * active ratings for the same user+book) is enforced by the unique
 * compound index below, backed up by the controller using an upsert
 * rather than a plain insert.
 */
const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 3000, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
