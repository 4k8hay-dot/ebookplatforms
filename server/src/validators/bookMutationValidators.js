const { body } = require('express-validator');

const createBookValidator = [
  body('title').trim().isLength({ min: 1, max: 300 }).withMessage('Title is required (max 300 characters)'),
  body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description is too long'),
  body('category').isMongoId().withMessage('A valid category must be selected'),
  body('format').isIn(['pdf', 'epub']).withMessage('Format must be "pdf" or "epub"'),
  body('language').optional().trim().isLength({ max: 60 }),
  body('publisher').optional().trim().isLength({ max: 200 }),
  body('year').optional().isInt({ min: 1000, max: 9999 }).withMessage('Year must be a valid 4-digit year'),
];

const updateBookValidator = [
  body('title').optional().trim().isLength({ min: 1, max: 300 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('category').optional().isMongoId().withMessage('A valid category must be selected'),
  body('language').optional().trim().isLength({ max: 60 }),
  body('publisher').optional().trim().isLength({ max: 200 }),
  body('year').optional().isInt({ min: 1000, max: 9999 }),
  // format is intentionally NOT editable after creation: changing it would
  // orphan the already-uploaded file's validated mime type. To change
  // format, the smallest reasonable solution is to submit a new book.
];

module.exports = { createBookValidator, updateBookValidator };
