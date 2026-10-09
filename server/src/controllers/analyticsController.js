const ReadingProgress = require('../models/ReadingProgress');
const Highlight = require('../models/Highlight');
const Note = require('../models/Note');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/analytics/reading
 * FR-ANALYTICS-01 total reading activity, FR-ANALYTICS-02 books started/
 * completed, FR-ANALYTICS-03 progress statistics, FR-ANALYTICS-04
 * activity over time.
 *
 * Honest limitation (documented in the phase report): ReadingProgress
 * stores only the *latest* position per user+book, not a full event log
 * of every reading session. "Activity over time" is therefore built from
 * each book's lastReadAt date — it shows which days had reading activity
 * on at least one book, not a count of every session. A true session log
 * isn't part of the SRS's data model (§10.3), so this is the most
 * accurate thing derivable from what's actually stored.
 */
const getReadingAnalytics = asyncHandler(async (req, res) => {
  const progressRecords = await ReadingProgress.find({ userId: req.user._id });

  const totalBooksStarted = progressRecords.length;
  const totalBooksCompleted = progressRecords.filter((p) => (p.progressPercentage || 0) >= 100).length;
  const booksInProgress = totalBooksStarted - totalBooksCompleted;
  const averageProgress = totalBooksStarted
    ? Math.round(progressRecords.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / totalBooksStarted)
    : 0;

  const days = [];
  const now = new Date();
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const countsByDay = Object.fromEntries(days.map((d) => [d, 0]));
  progressRecords.forEach((p) => {
    if (!p.lastReadAt) return;
    const key = p.lastReadAt.toISOString().slice(0, 10);
    if (countsByDay[key] !== undefined) countsByDay[key] += 1;
  });
  const activityOverTime = days.map((date) => ({ date, count: countsByDay[date] }));

  res.status(200).json({
    success: true,
    data: { totalBooksStarted, totalBooksCompleted, booksInProgress, averageProgress, activityOverTime },
  });
});

/**
 * GET /api/analytics/topics
 * FR-ANALYTICS-05: frequently explored categories, derived from the
 * categories of books the user has made reading progress in.
 */
const getTopicAnalytics = asyncHandler(async (req, res) => {
  const progressRecords = await ReadingProgress.find({ userId: req.user._id }).populate({
    path: 'bookId',
    select: 'category',
    populate: { path: 'category', select: 'name' },
  });

  const tally = new Map();
  progressRecords.forEach((p) => {
    const cat = p.bookId?.category;
    if (!cat) return;
    const key = String(cat._id);
    if (!tally.has(key)) tally.set(key, { categoryId: key, name: cat.name, count: 0 });
    tally.get(key).count += 1;
  });

  const topics = Array.from(tally.values()).sort((a, b) => b.count - a.count);
  res.status(200).json({ success: true, data: { topics } });
});

/**
 * GET /api/analytics/knowledge
 * FR-KNOW-01 relationships among books/highlights/notes/tags, FR-KNOW-04
 * data for a visual representation. FR-KNOW-05 (private by default) is
 * satisfied simply by this endpoint being `protect`-scoped to req.user._id
 * with no sharing mechanism — there is nothing here for anyone else to see.
 *
 * Returned as an aggregated tag<->book graph rather than one node per
 * individual highlight/note: with dozens of highlights this keeps the
 * visual readable. Clicking a tag on the frontend fetches the actual
 * notes/highlights for it via the existing filtered list endpoints
 * (FR-KNOW-02/03 — "view related items" / "selecting a topic displays
 * associated books, notes and highlights").
 */
const getKnowledgeMap = asyncHandler(async (req, res) => {
  const [highlights, notes] = await Promise.all([
    Highlight.find({ userId: req.user._id }).populate('bookId', 'title').populate('tags', 'name'),
    Note.find({ userId: req.user._id }).populate('bookId', 'title').populate('tags', 'name'),
  ]);

  const books = new Map();
  const tags = new Map();
  const linkKeys = new Set();
  const links = [];

  function addLinksFor(item) {
    if (!item.bookId || !item.tags?.length) return;
    books.set(String(item.bookId._id), { id: String(item.bookId._id), title: item.bookId.title });
    item.tags.forEach((tag) => {
      tags.set(String(tag._id), { id: String(tag._id), name: tag.name });
      const key = `${tag._id}::${item.bookId._id}`;
      if (!linkKeys.has(key)) {
        linkKeys.add(key);
        links.push({ tagId: String(tag._id), bookId: String(item.bookId._id) });
      }
    });
  }

  highlights.forEach(addLinksFor);
  notes.forEach(addLinksFor);

  res.status(200).json({
    success: true,
    data: { books: Array.from(books.values()), tags: Array.from(tags.values()), links },
  });
});

module.exports = { getReadingAnalytics, getTopicAnalytics, getKnowledgeMap };
