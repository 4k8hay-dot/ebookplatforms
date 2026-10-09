const mongoose = require('mongoose');

/**
 * Fields follow SRS §10.4 (userId, bookId, text, location, color,
 * createdAt), extended with an optional `tags` array. FR-TAG-01 says
 * "Users shall be able to assign tags to notes AND highlights" — the
 * §10.4 sample fields don't list a tags column, but the functional
 * requirement is explicit, so this is the smallest addition that
 * satisfies it (documented as an assumption in the phase report).
 */
const highlightSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
    location: { type: String, required: true }, // page number (PDF) or CFI (EPUB), as a string — same convention as ReadingProgress/Bookmark
    color: { type: String, default: '#FFF176' }, // soft yellow default
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  },
  { timestamps: true }
);

// Supports FR-SEARCH-02 (search saved highlights).
highlightSchema.index({ text: 'text' });
highlightSchema.index({ userId: 1, bookId: 1 });

module.exports = mongoose.model('Highlight', highlightSchema);
