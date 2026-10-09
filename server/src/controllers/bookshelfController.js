const Bookshelf = require('../models/Bookshelf');
const ReadingProgress = require('../models/ReadingProgress');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/bookshelf
 * FR-SHELF-03 display saved books, FR-SHELF-04 identify books currently
 * being read. "Currently reading" is computed by joining against
 * ReadingProgress rather than stored redundantly (see Bookshelf model
 * comment) — each entry gets a `progress` field (null if never opened).
 */
const listBookshelf = asyncHandler(async (req, res) => {
  const entries = await Bookshelf.find({ userId: req.user._id }).populate({
    path: 'bookId',
    populate: [{ path: 'category', select: 'name' }, { path: 'authorId', select: 'name' }],
  });

  const bookIds = entries.map((e) => e.bookId?._id).filter(Boolean);
  const progressRecords = await ReadingProgress.find({ userId: req.user._id, bookId: { $in: bookIds } });
  const progressByBook = new Map(progressRecords.map((p) => [String(p.bookId), p]));

  const items = entries
    .filter((e) => e.bookId) // guard against a book that was hard-deleted (shouldn't normally happen, we soft-delete)
    .map((e) => ({
      _id: e._id,
      book: e.bookId,
      addedAt: e.addedAt,
      progress: progressByBook.get(String(e.bookId._id)) || null,
    }));

  res.status(200).json({ success: true, data: { items } });
});

/**
 * POST /api/bookshelf/:bookId
 * FR-SHELF-01 add a book to the personal bookshelf.
 */
const addToBookshelf = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.bookId);
  if (!book || book.status !== 'approved') {
    throw new AppError('Book not found', 404);
  }

  const existing = await Bookshelf.findOne({ userId: req.user._id, bookId: book._id });
  if (existing) {
    return res.status(200).json({ success: true, message: 'Already on your bookshelf' });
  }

  await Bookshelf.create({ userId: req.user._id, bookId: book._id });
  res.status(201).json({ success: true, message: 'Added to your bookshelf' });
});

/**
 * DELETE /api/bookshelf/:bookId
 * FR-SHELF-02 remove a book from the personal bookshelf.
 */
const removeFromBookshelf = asyncHandler(async (req, res) => {
  await Bookshelf.deleteOne({ userId: req.user._id, bookId: req.params.bookId });
  res.status(200).json({ success: true, message: 'Removed from your bookshelf' });
});

module.exports = { listBookshelf, addToBookshelf, removeFromBookshelf };
