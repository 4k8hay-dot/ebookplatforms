const ReadingHistory = require('../models/ReadingHistory');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Upserts a history entry for userId+bookId. Called both from the
 * dedicated POST /api/history/:bookId route (fired when the reader opens
 * a book — FR-HISTORY-01, "record books accessed") and from
 * progressController.upsertProgress (keeps FR-HISTORY-02, "record the
 * latest reading position", current without a second network round trip
 * from the client on every page turn).
 */
async function recordAccess(userId, bookId, position) {
  return ReadingHistory.findOneAndUpdate(
    { userId, bookId },
    { $set: { lastAccessedAt: new Date(), ...(position !== undefined ? { lastPosition: position } : {}) } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

/**
 * POST /api/history/:bookId
 * Records that the caller opened this book. Called once when the reader
 * page loads.
 */
const recordAccessRoute = asyncHandler(async (req, res) => {
  const history = await recordAccess(req.user._id, req.params.bookId);
  res.status(200).json({ success: true, data: { history } });
});

/**
 * GET /api/history
 * FR-HISTORY-03 display recently read books.
 */
const listHistory = asyncHandler(async (req, res) => {
  const history = await ReadingHistory.find({ userId: req.user._id })
    .populate({ path: 'bookId', populate: [{ path: 'category', select: 'name' }, { path: 'authorId', select: 'name' }] })
    .sort({ lastAccessedAt: -1 });

  res.status(200).json({ success: true, data: { history } });
});

/**
 * DELETE /api/history/:id
 * FR-HISTORY-04 remove history items where supported.
 */
const removeHistoryItem = asyncHandler(async (req, res) => {
  const item = await ReadingHistory.findById(req.params.id);
  if (!item) throw new AppError('History item not found', 404);

  if (String(item.userId) !== String(req.user._id)) {
    throw new AppError('You do not have permission to remove this item', 403);
  }

  await item.deleteOne();
  res.status(200).json({ success: true, message: 'Removed from history' });
});

module.exports = { recordAccess, recordAccessRoute, listHistory, removeHistoryItem };
