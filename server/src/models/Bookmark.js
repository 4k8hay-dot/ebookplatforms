const mongoose = require('mongoose');

/**
 * position mirrors the same format used by ReadingProgress: a page
 * number (as a string) for PDF, or an epub.js CFI string for EPUB.
 * label is optional free text the user can attach (not required by the
 * SRS, but a bare position number is meaningless in a list of several
 * bookmarks — smallest reasonable addition per Rule 11).
 */
const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    position: { type: String, required: true },
    label: { type: String, trim: true, maxlength: 200, default: '' },
  },
  { timestamps: true }
);

bookmarkSchema.index({ userId: 1, bookId: 1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
