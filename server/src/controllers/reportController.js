const Report = require('../models/Report');
const Book = require('../models/Book');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { recalculateBookRating } = require('../services/ratingService');

/**
 * POST /api/reports
 * FR-REPORT-01 authenticated users report inappropriate content,
 * FR-REPORT-02 record the report reason.
 */
const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason } = req.body;

  if (targetType === 'book') {
    const book = await Book.findById(targetId);
    if (!book) throw new AppError('Book not found', 404);
  } else if (targetType === 'review') {
    const review = await Review.findById(targetId);
    if (!review) throw new AppError('Review not found', 404);
  }

  const report = await Report.create({ reporterId: req.user._id, targetType, targetId, reason });
  res.status(201).json({ success: true, data: { report } });
});

/**
 * GET /api/admin/reports
 * FR-REPORT-03 administrators view reports.
 */
const listReports = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const reports = await Report.find(filter).populate('reporterId', 'name email').sort({ createdAt: -1 });

  // Attach a light-weight preview of the reported content itself, since
  // targetId is a polymorphic reference and can't be populate()'d
  // directly across two different collections.
  const enriched = await Promise.all(
    reports.map(async (r) => {
      let target = null;
      if (r.targetType === 'book') {
        target = await Book.findById(r.targetId).select('title status');
      } else if (r.targetType === 'review') {
        target = await Review.findById(r.targetId).select('rating comment');
      }
      return { ...r.toObject(), target };
    })
  );

  res.status(200).json({ success: true, data: { reports: enriched } });
});

/**
 * PUT /api/admin/reports/:id/resolve
 * FR-REPORT-04 administrators resolve reports. Optionally also takes
 * down the reported content in the same action (FR-ADMIN-07: remove
 * inappropriate or reported content) — a soft-delete for books, an
 * outright delete for reviews (reviews have no "removed" status of
 * their own in the SRS's data model, so deletion is the only sensible
 * take-down action for them).
 */
const resolveReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new AppError('Report not found', 404);

  const { removeContent } = req.body;

  if (removeContent) {
    if (report.targetType === 'book') {
      await Book.findByIdAndUpdate(report.targetId, { status: 'removed' });
    } else if (report.targetType === 'review') {
      const review = await Review.findById(report.targetId);
      if (review) {
        const bookId = review.bookId;
        await review.deleteOne();
        await recalculateBookRating(bookId);
      }
    }
  }

  report.status = 'resolved';
  report.resolvedBy = req.user._id;
  report.resolvedAt = new Date();
  await report.save();

  res.status(200).json({ success: true, data: { report } });
});

module.exports = { createReport, listReports, resolveReport };
