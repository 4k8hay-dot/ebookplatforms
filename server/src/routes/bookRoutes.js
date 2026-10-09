const express = require('express');
const {
  listBooks,
  getBookById,
  listMyBooks,
  createBook,
  updateBook,
  deleteBook,
  streamBookFile,
} = require('../controllers/bookController');
const { listReviewsForBook, upsertReview } = require('../controllers/reviewController');
const { listBooksValidator, bookIdValidator } = require('../validators/bookValidators');
const { createBookValidator, updateBookValidator } = require('../validators/bookMutationValidators');
const { reviewBookIdValidator, upsertReviewValidator } = require('../validators/reviewValidators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const uploadBookFiles = require('../middleware/uploadBookFiles');

const router = express.Router();

// Public browsing — SRS §5.1 lets Guests browse/search/filter/view details
// without an account. optionalAuth lets a logged-in owner/admin also see
// their own non-approved books through the same endpoints.
router.get('/', listBooksValidator, validate, listBooks);

// Must come before "/:id" so it isn't swallowed by the :id param route.
router.get('/mine', protect, authorize('author', 'admin'), listMyBooks);

router.get('/:id', bookIdValidator, validate, optionalAuth, getBookById);
router.get('/:id/file', bookIdValidator, validate, protect, streamBookFile);

router.post('/', protect, authorize('author'), uploadBookFiles, createBookValidator, validate, createBook);
router.put('/:id', protect, authorize('author', 'admin'), uploadBookFiles, updateBookValidator, validate, updateBook);
router.delete('/:id', protect, authorize('author', 'admin'), bookIdValidator, validate, deleteBook);

// FR-REVIEW-01..03: reviews are scoped under their book for reading and
// creating; editing/deleting a specific review happens via its own id
// under /api/reviews (see reviewRoutes.js), matching the SRS's API list.
router.get('/:bookId/reviews', reviewBookIdValidator, validate, listReviewsForBook);
router.post('/:bookId/reviews', protect, reviewBookIdValidator, upsertReviewValidator, validate, upsertReview);

module.exports = router;
