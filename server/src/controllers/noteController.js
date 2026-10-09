const Note = require('../models/Note');
const Book = require('../models/Book');
const Highlight = require('../models/Highlight');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

function buildOwnFilter(userId, { q, tag, bookId }) {
  const filter = { userId };
  if (bookId) filter.bookId = bookId;
  if (tag) filter.tags = tag;
  if (q) filter.$text = { $search: q };
  return filter;
}

/**
 * GET /api/notes
 * FR-SEARCH-01 search personal notes, FR-SEARCH-03 search by tag —
 * both handled by the same optional q/tag/bookId query params. With no
 * params, this is simply "list all my notes" (used by the reader's
 * side panel when scoped with ?bookId=, and by the My Notes page when
 * unscoped).
 */
const listMyNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find(buildOwnFilter(req.user._id, req.query))
    .populate('bookId', 'title')
    .populate('tags', 'name')
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, data: { notes } });
});

/**
 * POST /api/notes
 * FR-NOTE-01 create a note associated with a book, FR-NOTE-02 optionally
 * associate with a highlight, FR-NOTE-05 record location/context.
 */
const createNote = asyncHandler(async (req, res) => {
  const { bookId, highlightId, content, tags, location } = req.body;

  const book = await Book.findById(bookId);
  if (!book) throw new AppError('Book not found', 404);

  if (highlightId) {
    const highlight = await Highlight.findById(highlightId);
    if (!highlight || String(highlight.userId) !== String(req.user._id) || String(highlight.bookId) !== String(bookId)) {
      throw new AppError('Invalid highlight reference', 400);
    }
  }

  const note = await Note.create({
    userId: req.user._id,
    bookId,
    highlightId: highlightId || null,
    content,
    tags: tags || [],
    location: location || null,
  });

  const populated = await note.populate('tags', 'name');
  res.status(201).json({ success: true, data: { note: populated } });
});

/**
 * PUT /api/notes/:id
 * FR-NOTE-03 edit notes. BR-03: only the owner may edit.
 */
const updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new AppError('Note not found', 404);
  if (String(note.userId) !== String(req.user._id)) {
    throw new AppError('You do not have permission to edit this note', 403);
  }

  const { content, tags, location } = req.body;
  if (content !== undefined) note.content = content;
  if (tags !== undefined) note.tags = tags;
  if (location !== undefined) note.location = location;

  await note.save();
  const populated = await note.populate('tags', 'name');
  res.status(200).json({ success: true, data: { note: populated } });
});

/**
 * DELETE /api/notes/:id
 * FR-NOTE-04 delete notes. BR-03: only the owner may delete.
 */
const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new AppError('Note not found', 404);
  if (String(note.userId) !== String(req.user._id)) {
    throw new AppError('You do not have permission to delete this note', 403);
  }

  await note.deleteOne();
  res.status(200).json({ success: true, message: 'Note removed' });
});

module.exports = { listMyNotes, createNote, updateNote, deleteNote };
