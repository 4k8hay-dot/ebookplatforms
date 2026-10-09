const { query, param } = require('express-validator');

const listBooksValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
  query('format').optional().isIn(['pdf', 'epub']).withMessage('format must be "pdf" or "epub"'),
  query('sort')
    .optional()
    .isIn(['newest', 'oldest', 'title_asc', 'title_desc', 'rating'])
    .withMessage('invalid sort option'),
  query('fromYear').optional().isInt({ min: 1000, max: 9999 }).withMessage('fromYear must be a valid year'),
  query('toYear').optional().isInt({ min: 1000, max: 9999 }).withMessage('toYear must be a valid year'),
  query('category').optional().isMongoId().withMessage('category must be a valid id'),
  query('author').optional().isMongoId().withMessage('author must be a valid id'),
];

const bookIdValidator = [param('id').isMongoId().withMessage('Invalid book id')];

module.exports = { listBooksValidator, bookIdValidator };
