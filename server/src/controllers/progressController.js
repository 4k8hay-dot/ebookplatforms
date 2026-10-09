const ReadingProgress = require('../models/ReadingProgress');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { recordAccess } = require('./historyController');

/**
 * GET /api/progress/:bookId
 * Returns the caller's saved position for a book, if any, so the reader
 * can resume where they left off (FR-READ-05) and the details page can
 * show a percentage (FR-PROGRESS-03).
 */
const getProgress = asyncHandler(async (req, res) => {
  const progress = await ReadingProgress.findOne({ userId: req.user._id, bookId: req.params.bookId });
  res.status(200).json({ success: true, data: { progress: progress || null } });
});

/**
 * GET /api/progress
 * FR-PROGRESS-04: "Continue Reading" — every book the caller has made
 * progress in, most recently read first. Books already at 100% are
 * excluded, since there's nothing left to "continue".
 */
const listMyProgress = asyncHandler(async (req, res) => {
  const progress = await ReadingProgress.find({
    userId: req.user._id,
    $or: [{ progressPercentage: { $lt: 100 } }, { progressPercentage: null }],
  })
    .populate({ path: 'bookId', populate: [{ path: 'category', select: 'name' }] })
    .sort({ lastReadAt: -1 })
    .limit(20);

  res.status(200).json({ success: true, data: { progress } });
});

/**
 * PUT /api/progress/:bookId
 * FR-PROGRESS-01 record progress, FR-PROGRESS-02 calculate percentage.
 *
 * Percentage calculation differs by format, since the SRS's own
 * `currentPage`/`progressPercentage` fields don't map cleanly onto both:
 *   - PDF: currentPage/totalPages are real page numbers, so the server
 *     computes the percentage itself (harder for a client to fake, and
 *     it's simple arithmetic).
 *   - EPUB: reflowable content has no fixed page count. epub.js can
 *     compute a percentage client-side once it has generated a
 *     locations index for the book, so for EPUB we accept the
 *     client-computed `progressPercentage` directly. This is stated as
 *     an assumption in the phase report.
 *
 * Also upserts a ReadingHistory entry (FR-HISTORY-02: keep the latest
 * position current) so the client doesn't need a second request for that
 * on every position change — see historyController.recordAccess.
 */
const upsertProgress = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.bookId);
  if (!book) throw new AppError('Book not found', 404);

  const { position, currentPage, totalPages, progressPercentage } = req.body;

  let computedPercentage = 0;
  if (currentPage != null && totalPages) {
    computedPercentage = Math.min(100, Math.max(0, Math.round((currentPage / totalPages) * 100)));
  } else if (progressPercentage != null) {
    computedPercentage = Math.min(100, Math.max(0, Math.round(progressPercentage)));
  }

  const progress = await ReadingProgress.findOneAndUpdate(
    { userId: req.user._id, bookId: req.params.bookId },
    {
      $set: {
        position: position ?? null,
        currentPage: currentPage ?? null,
        totalPages: totalPages ?? null,
        progressPercentage: computedPercentage,
        lastReadAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await recordAccess(req.user._id, req.params.bookId, position);

  res.status(200).json({ success: true, data: { progress } });
});

module.exports = { getProgress, listMyProgress, upsertProgress };
