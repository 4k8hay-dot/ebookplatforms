const { body, param, query } = require('express-validator');

const listAllHighlightsValidator = [
  query('bookId').optional().isMongoId().withMessage('bookId must be a valid id'),
  query('tag').optional().isMongoId().withMessage('tag must be a valid id'),
];

const highlightBookIdValidator = [param('bookId').isMongoId().withMessage('Invalid book id')];
const highlightIdValidator = [param('id').isMongoId().withMessage('Invalid highlight id')];

const createHighlightValidator = [
  body('text').trim().isLength({ min: 1, max: 5000 }).withMessage('Highlighted text is required'),
  body('location').notEmpty().withMessage('location is required').isString(),
  body('color').optional().isString(),
  body('tags').optional().isArray().withMessage('tags must be an array of tag ids'),
  body('tags.*').optional().isMongoId().withMessage('Each tag must be a valid id'),
];

module.exports = { listAllHighlightsValidator, highlightBookIdValidator, highlightIdValidator, createHighlightValidator };
