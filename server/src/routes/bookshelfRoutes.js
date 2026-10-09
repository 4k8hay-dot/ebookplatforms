const express = require('express');
const { listBookshelf, addToBookshelf, removeFromBookshelf } = require('../controllers/bookshelfController');
const { bookIdParamValidator } = require('../validators/bookshelfValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // FR-AUTH-07 — bookshelf is a private reading feature (BR-01)

router.get('/', listBookshelf);
router.post('/:bookId', bookIdParamValidator, validate, addToBookshelf);
router.delete('/:bookId', bookIdParamValidator, validate, removeFromBookshelf);

module.exports = router;
