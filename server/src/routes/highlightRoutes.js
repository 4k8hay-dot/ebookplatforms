const express = require('express');
const {
  listAllMyHighlights,
  listHighlightsForBook,
  createHighlight,
  deleteHighlight,
} = require('../controllers/highlightController');
const {
  listAllHighlightsValidator,
  highlightBookIdValidator,
  highlightIdValidator,
  createHighlightValidator,
} = require('../validators/highlightValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Must come before "/:bookId" so it isn't swallowed by the param route.
router.get('/', listAllHighlightsValidator, validate, listAllMyHighlights);

router.get('/:bookId', highlightBookIdValidator, validate, listHighlightsForBook);
router.post('/:bookId', highlightBookIdValidator, createHighlightValidator, validate, createHighlight);
router.delete('/:id', highlightIdValidator, validate, deleteHighlight);

module.exports = router;
