const express = require('express');
const { listBookmarks, createBookmark, deleteBookmark } = require('../controllers/bookmarkController');
const {
  bookmarkBookIdValidator,
  bookmarkIdValidator,
  createBookmarkValidator,
} = require('../validators/bookmarkValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/:bookId', bookmarkBookIdValidator, validate, listBookmarks);
router.post('/:bookId', bookmarkBookIdValidator, createBookmarkValidator, validate, createBookmark);
router.delete('/:id', bookmarkIdValidator, validate, deleteBookmark);

module.exports = router;
