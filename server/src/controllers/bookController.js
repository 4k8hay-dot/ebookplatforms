const fs = require('fs');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildMeta } = require('../utils/pagination');
const { saveFile, deleteFile, savePrivateFile, getPrivateFilePath, deletePrivateFile } = require('../services/storageService');

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  title_asc: { title: 1 },
  title_desc: { title: -1 },
  rating: { avgRating: -1 },
};

const EBOOK_CONTENT_TYPES = { pdf: 'application/pdf', epub: 'application/epub+zip' };

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isOwnerOrAdmin(user, book) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return String(book.authorId._id || book.authorId) === String(user._id);
}

/**
 * GET /api/books
 * Public catalog browsing/search/filter/sort/pagination (unchanged from
 * Phase 2 — see phase-2 report for the FR-BOOK-01/03/04/05/06 mapping).
 */
const listBooks = asyncHandler(async (req, res) => {
  const { q, category, author, format, language, fromYear, toYear, sort } = req.query;

  const filter = { status: 'approved' };
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (author) filter.authorId = author;
  if (format) filter.format = format;
  if (language) filter.language = new RegExp(`^${escapeRegex(language)}$`, 'i');
  if (fromYear || toYear) {
    filter['publicationInfo.year'] = {};
    if (fromYear) filter['publicationInfo.year'].$gte = Number(fromYear);
    if (toYear) filter['publicationInfo.year'].$lte = Number(toYear);
  }

  const { page, limit, skip } = parsePagination(req.query);
  const sortSpec = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

  const [items, totalItems] = await Promise.all([
    Book.find(filter).populate('category', 'name').populate('authorId', 'name').sort(sortSpec).skip(skip).limit(limit),
    Book.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: { books: items, meta: buildMeta({ page, limit, totalItems }) } });
});

/**
 * GET /api/books/:id
 * FR-BOOK-07. Public by default, but a book's own author or an admin may
 * also view it while it's pending/rejected — everyone else gets a 404 for
 * anything not approved (BR-08, BR-12). Uses optionalAuth, so req.user
 * may or may not be set.
 */
const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id).populate('category', 'name').populate('authorId', 'name authorBio');

  if (!book) throw new AppError('Book not found', 404);

  if (book.status !== 'approved' && !isOwnerOrAdmin(req.user, book)) {
    throw new AppError('Book not found', 404);
  }

  res.status(200).json({ success: true, data: { book } });
});

/**
 * GET /api/books/mine
 * Not in the SRS's sample API list, but required to make FR-AUTHOR-06/07
 * (edit/delete own books) and the "view basic statistics" line in §5.3
 * usable — an author needs a way to see their own submissions regardless
 * of approval status. "Basic statistics" here means simple counts by
 * status; the SRS defines no view/download-tracking data to report on.
 */
const listMyBooks = asyncHandler(async (req, res) => {
  const books = await Book.find({ authorId: req.user._id }).populate('category', 'name').sort({ createdAt: -1 });

  const stats = books.reduce(
    (acc, b) => {
      acc.total += 1;
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );

  res.status(200).json({ success: true, data: { books, stats } });
});

/**
 * POST /api/books
 * FR-AUTHOR-01 upload eBooks, FR-AUTHOR-02 metadata, FR-AUTHOR-03 cover,
 * FR-AUTHOR-04 file type validation (done in uploadBookFiles middleware),
 * FR-AUTHOR-05 size limits (done in uploadBookFiles middleware),
 * BR-08 (new books start unapproved).
 */
const createBook = asyncHandler(async (req, res) => {
  const ebookFile = req.files?.ebookFile?.[0];
  if (!ebookFile) {
    throw new AppError('An eBook file is required', 400);
  }

  const { title, description, category, format, language, publisher, year } = req.body;

  const fileUrl = savePrivateFile({ buffer: ebookFile.buffer, originalName: ebookFile.originalname, subFolder: 'ebooks' });

  let coverUrl = null;
  const coverFile = req.files?.cover?.[0];
  if (coverFile) {
    coverUrl = saveFile({ buffer: coverFile.buffer, originalName: coverFile.originalname, subFolder: 'covers' });
  }

  const book = await Book.create({
    title,
    description,
    authorId: req.user._id,
    category,
    format,
    language: language || 'English',
    publicationInfo: { publisher: publisher || '', year: year ? Number(year) : undefined },
    coverUrl,
    fileUrl,
    status: 'pending',
  });

  res.status(201).json({ success: true, data: { book } });
});

/**
 * PUT /api/books/:id
 * FR-AUTHOR-06 edit own book info. FR-AUTHOR-08 authors shall not modify
 * books owned by others (BR-04) — enforced below. Admins may also edit,
 * per BR-05 (higher privileges). Editing metadata does not require
 * re-approval per this SRS (no requirement says it must), but replacing
 * the eBook file resets status to 'pending' since the file content is a
 * material change (smallest reasonable reading of BR-08's spirit).
 */
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);

  if (!isOwnerOrAdmin(req.user, book)) {
    throw new AppError('You do not have permission to modify this book', 403);
  }

  const { title, description, category, language, publisher, year } = req.body;
  if (title !== undefined) book.title = title;
  if (description !== undefined) book.description = description;
  if (category !== undefined) book.category = category;
  if (language !== undefined) book.language = language;
  if (publisher !== undefined) book.publicationInfo.publisher = publisher;
  if (year !== undefined) book.publicationInfo.year = Number(year);

  const coverFile = req.files?.cover?.[0];
  if (coverFile) {
    const previousCover = book.coverUrl;
    book.coverUrl = saveFile({ buffer: coverFile.buffer, originalName: coverFile.originalname, subFolder: 'covers' });
    if (previousCover) deleteFile(previousCover);
  }

  const ebookFile = req.files?.ebookFile?.[0];
  if (ebookFile) {
    const previousFile = book.fileUrl;
    book.fileUrl = savePrivateFile({ buffer: ebookFile.buffer, originalName: ebookFile.originalname, subFolder: 'ebooks' });
    if (previousFile) deletePrivateFile(previousFile);
    book.status = 'pending'; // material change — needs re-approval
  }

  await book.save();
  res.status(200).json({ success: true, data: { book } });
});

/**
 * DELETE /api/books/:id
 * FR-AUTHOR-07 delete own books "subject to policy" — the policy chosen
 * here is a soft delete (status: 'removed') rather than a hard delete, so
 * existing references (bookmarks/notes/reviews added in later phases)
 * don't dangle. BR-12: removed books never appear in normal browsing —
 * already enforced since listBooks/getBookById only ever show 'approved'.
 */
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw new AppError('Book not found', 404);

  if (!isOwnerOrAdmin(req.user, book)) {
    throw new AppError('You do not have permission to delete this book', 403);
  }

  book.status = 'removed';
  await book.save();

  res.status(200).json({ success: true, message: 'Book removed' });
});

/**
 * GET /api/books/:id/file
 * FR-READ-01 (authenticated users may open available eBooks) and
 * FR-FILE-05 (prevent unauthorized access to restricted files): this is
 * the ONLY way to retrieve eBook file bytes — there is no static/public
 * URL for them. Requires authentication; a non-approved book is only
 * readable by its own author or an admin (consistent with getBookById).
 */
const streamBookFile = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book || !book.fileUrl) throw new AppError('Book file not found', 404);

  if (book.status !== 'approved' && !isOwnerOrAdmin(req.user, book)) {
    throw new AppError('Book not found', 404);
  }

  const fullPath = getPrivateFilePath(book.fileUrl);
  if (!fs.existsSync(fullPath)) {
    throw new AppError('The eBook file is currently unavailable', 404);
  }

  res.setHeader('Content-Type', EBOOK_CONTENT_TYPES[book.format] || 'application/octet-stream');
  res.setHeader('Content-Disposition', 'inline');
  fs.createReadStream(fullPath).pipe(res);
});

module.exports = {
  listBooks,
  getBookById,
  listMyBooks,
  createBook,
  updateBook,
  deleteBook,
  streamBookFile,
};
