const Review = require('../models/Review');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { recalculateBookRating } = require('../services/ratingService');

/**
 * GET /api/books/:bookId/reviews
 * Public — anyone can read reviews for an approved book.
 */
const listReviewsForBook = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ bookId: req.params.bookId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, data: { reviews } });
});

/**
 * POST /api/books/:bookId/reviews
 * FR-REVIEW-01 rate books, FR-REVIEW-02 1-5 scale, FR-REVIEW-03 submit
 * text reviews, FR-REVIEW-06 prevent duplicates "unless updated" — this
 * is implemented as an upsert: submitting again simply updates the
 * caller's existing review for this book rather than erroring.
 */
const upsertReview = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.bookId);
  if (!book || book.status !== 'approved') throw new AppError('Book not found', 404);

  const { rating, comment } = req.body;

  const review = await Review.findOneAndUpdate(
    { userId: req.user._id, bookId: book._id },
    { $set: { rating, comment: comment || '' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await recalculateBookRating(book._id);

  res.status(201).json({ success: true, data: { review } });
});

/**
 * PUT /api/reviews/:id
 * FR-REVIEW-04 edit own review. BR-03: only the owner may edit.
 */
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  if (String(review.userId) !== String(req.user._id)) {
    throw new AppError('You do not have permission to edit this review', 403);
  }

  const { rating, comment } = req.body;
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  await review.save();

  await recalculateBookRating(review.bookId);

  res.status(200).json({ success: true, data: { review } });
});

/**
 * DELETE /api/reviews/:id
 * FR-REVIEW-04 delete own review. BR-03: only the owner may delete.
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  if (String(review.userId) !== String(req.user._id)) {
    throw new AppError('You do not have permission to delete this review', 403);
  }

  const bookId = review.bookId;
  await review.deleteOne();
  await recalculateBookRating(bookId);

  res.status(200).json({ success: true, message: 'Review removed' });
});

module.exports = { listReviewsForBook, upsertReview, updateReview, deleteReview };
