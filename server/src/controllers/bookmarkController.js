const Bookmark = require('../models/Bookmark');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/bookmarks/:bookId
 * FR-BOOKMARK-02 view saved bookmarks (for one book, scoped to the caller).
 */
const listBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ userId: req.user._id, bookId: req.params.bookId }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { bookmarks } });
});

/**
 * POST /api/bookmarks/:bookId
 * FR-BOOKMARK-01 bookmark a page/reading position.
 */
const createBookmark = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.bookId);
  if (!book) throw new AppError('Book not found', 404);

  const { position, label } = req.body;
  const bookmark = await Bookmark.create({ userId: req.user._id, bookId: book._id, position, label: label || '' });

  res.status(201).json({ success: true, data: { bookmark } });
});

/**
 * DELETE /api/bookmarks/:id
 * FR-BOOKMARK-03 remove bookmarks. BR-03: users may only modify their own.
 */
const deleteBookmark = asyncHandler(async (req, res) => {
  const bookmark = await Bookmark.findById(req.params.id);
  if (!bookmark) throw new AppError('Bookmark not found', 404);

  if (String(bookmark.userId) !== String(req.user._id)) {
    throw new AppError('You do not have permission to delete this bookmark', 403);
  }

  await bookmark.deleteOne();
  res.status(200).json({ success: true, message: 'Bookmark removed' });
});

module.exports = { listBookmarks, createBookmark, deleteBookmark };
