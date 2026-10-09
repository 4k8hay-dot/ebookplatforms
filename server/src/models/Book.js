const mongoose = require('mongoose');

/**
 * Fields follow SRS §10.2 (title, description, author, category, coverUrl,
 * fileUrl, format, language, status, timestamps), extended with:
 *  - publicationInfo: needed to satisfy FR-BOOK-02 ("publication
 *    information") and the "publication period" filter in FR-BOOK-05.
 *  - avgRating / ratingCount: denormalized fields so FR-REVIEW-05 (average
 *    rating display) doesn't require aggregating the Review collection on
 *    every catalog request. They are written to in Phase 6 when Reviews
 *    are built; they simply sit at their defaults until then.
 *
 * "Availability" (FR-BOOK-05) is interpreted as the book's approval
 * status: the public catalog only ever shows status === 'approved' books.
 * The SRS defines no lending/checkout mechanism, so there is no separate
 * "copies available" concept in scope.
 */
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    coverUrl: {
      type: String,
      default: null,
    },
    fileUrl: {
      type: String,
      default: null, // populated by the Phase 3 upload workflow
    },
    format: {
      type: String,
      enum: ['pdf', 'epub'],
      required: true,
    },
    language: {
      type: String,
      trim: true,
      default: 'English',
    },
    publicationInfo: {
      publisher: { type: String, trim: true, default: '' },
      year: { type: Number, min: 1000, max: 9999 },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'removed'],
      default: 'pending',
    },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Supports FR-BOOK-03 keyword search across title/description/language.
bookSchema.index({ title: 'text', description: 'text', language: 'text' });
// Supports fast filtering (NFR-Performance: minimize unnecessary queries).
bookSchema.index({ category: 1, status: 1 });
bookSchema.index({ authorId: 1, status: 1 });
bookSchema.index({ format: 1 });
bookSchema.index({ 'publicationInfo.year': 1 });

module.exports = mongoose.model('Book', bookSchema);
