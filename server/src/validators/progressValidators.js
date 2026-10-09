const { body, param } = require('express-validator');

const progressBookIdValidator = [param('bookId').isMongoId().withMessage('Invalid book id')];

const upsertProgressValidator = [
  body('position').optional({ nullable: true }).isString().withMessage('position must be a string'),
  body('currentPage').optional({ nullable: true }).isInt({ min: 0 }).withMessage('currentPage must be a non-negative integer'),
  body('totalPages').optional({ nullable: true }).isInt({ min: 0 }).withMessage('totalPages must be a non-negative integer'),
  body('progressPercentage')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage('progressPercentage must be between 0 and 100'),
];

module.exports = { progressBookIdValidator, upsertProgressValidator };
