const mongoose = require('mongoose');

/**
 * Fields follow SRS §10.5 exactly: userId, bookId, highlightId (optional
 * — FR-NOTE-02: "Notes shall be associable with highlighted text where
 * supported"), content, tags, location, timestamps.
 */
const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    highlightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Highlight', default: null },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    location: { type: String, default: null }, // FR-NOTE-05: record the location/context of a note
  },
  { timestamps: true }
);

// Supports FR-SEARCH-01 (search personal notes).
noteSchema.index({ content: 'text' });
noteSchema.index({ userId: 1, bookId: 1 });

module.exports = mongoose.model('Note', noteSchema);
