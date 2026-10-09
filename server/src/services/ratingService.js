const Review = require('../models/Review');
const Book = require('../models/Book');

/**
 * Recomputes Book.avgRating/ratingCount from the live Review collection.
 * Called after every create/update/delete so the catalog and details
 * page never show a stale average (FR-REVIEW-05).
 */
async function recalculateBookRating(bookId) {
  const [result] = await Review.aggregate([
    { $match: { bookId: new (require('mongoose').Types.ObjectId)(bookId) } },
    { $group: { _id: '$bookId', avgRating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } },
  ]);

  await Book.findByIdAndUpdate(bookId, {
    avgRating: result ? Math.round(result.avgRating * 10) / 10 : 0,
    ratingCount: result ? result.ratingCount : 0,
  });
}

module.exports = { recalculateBookRating };
