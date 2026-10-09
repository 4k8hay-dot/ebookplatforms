const Highlight = require('../models/Highlight');
const Book = require('../models/Book');
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
 * GET /api/highlights
 * All of the caller's highlights across every book, optionally filtered
 * by keyword (FR-SEARCH-02), tag (FR-SEARCH-03), or book. This is the
 * endpoint the Knowledge Search page uses — distinct from catalog/book
 * search (FR-SEARCH-04), since it only ever touches the caller's own
 * highlights, never the public book catalog.
 */
const listAllMyHighlights = asyncHandler(async (req, res) => {
  const highlights = await Highlight.find(buildOwnFilter(req.user._id, req.query))
    .populate('bookId', 'title')
    .populate('tags', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { highlights } });
});

/**
 * GET /api/highlights/:bookId
 * FR-HIGHLIGHT-03 view highlights for one specific book (used by the
 * reader's side panel).
 */
const listHighlightsForBook = asyncHandler(async (req, res) => {
  const highlights = await Highlight.find({ userId: req.user._id, bookId: req.params.bookId })
    .populate('tags', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { highlights } });
});

/**
 * POST /api/highlights/:bookId
 * FR-HIGHLIGHT-01 highlight supported text, FR-HIGHLIGHT-02 store the
 * highlighted content and its location.
 */
const createHighlight = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.bookId);
  if (!book) throw new AppError('Book not found', 404);

  const { text, location, color, tags } = req.body;
  const highlight = await Highlight.create({
    userId: req.user._id,
    bookId: book._id,
    text,
    location,
    color: color || undefined,
    tags: tags || [],
  });

  res.status(201).json({ success: true, data: { highlight } });
});

/**
 * DELETE /api/highlights/:id
 * FR-HIGHLIGHT-04 delete highlights. BR-03: only the owner may delete.
 */
const deleteHighlight = asyncHandler(async (req, res) => {
  const highlight = await Highlight.findById(req.params.id);
  if (!highlight) throw new AppError('Highlight not found', 404);

  if (String(highlight.userId) !== String(req.user._id)) {
    throw new AppError('You do not have permission to delete this highlight', 403);
  }

  await highlight.deleteOne();
  res.status(200).json({ success: true, message: 'Highlight removed' });
});

module.exports = { listAllMyHighlights, listHighlightsForBook, createHighlight, deleteHighlight };
