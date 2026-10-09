const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createNotification } = require('../services/notificationService');

/**
 * Book-approval workflow (FR-AUTHOR-09). Originally built minimally in
 * Phase 3 to unblock testing before the rest of Administration existed;
 * now that Phase 7 builds out the full admin module, this file gains
 * notification hooks so authors actually hear about the decision
 * (FR-NOTIFY-01) instead of having to keep checking their dashboard.
 */

const listPendingBooks = asyncHandler(async (_req, res) => {
  const books = await Book.find({ status: 'pending' })
    .populate('category', 'name')
    .populate('authorId', 'name email')
    .sort({ createdAt: 1 });

  res.status(200).json({ success: true, data: { books } });
});

const approveBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);

  book.status = 'approved';
  await book.save();

  await createNotification(book.authorId, 'book_approved', `Your book "${book.title}" has been approved and is now live.`, book._id);

  res.status(200).json({ success: true, data: { book } });
});

const rejectBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);

  book.status = 'rejected';
  await book.save();

  await createNotification(book.authorId, 'book_rejected', `Your book "${book.title}" was not approved.`, book._id);

  res.status(200).json({ success: true, data: { book } });
});

module.exports = { listPendingBooks, approveBook, rejectBook };
