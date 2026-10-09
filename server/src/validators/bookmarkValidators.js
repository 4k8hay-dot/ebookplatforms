const { body, param } = require('express-validator');

const bookmarkBookIdValidator = [param('bookId').isMongoId().withMessage('Invalid book id')];
const bookmarkIdValidator = [param('id').isMongoId().withMessage('Invalid bookmark id')];

const createBookmarkValidator = [
  body('position').notEmpty().withMessage('position is required').isString(),
  body('label').optional().trim().isLength({ max: 200 }),
];

module.exports = { bookmarkBookIdValidator, bookmarkIdValidator, createBookmarkValidator };
