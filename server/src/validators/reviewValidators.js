const { body, param } = require('express-validator');

const reviewBookIdValidator = [param('bookId').isMongoId().withMessage('Invalid book id')];
const reviewIdValidator = [param('id').isMongoId().withMessage('Invalid review id')];

const upsertReviewValidator = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer from 1 to 5'),
  body('comment').optional().trim().isLength({ max: 3000 }).withMessage('Comment is too long'),
];

const updateReviewValidator = [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer from 1 to 5'),
  body('comment').optional().trim().isLength({ max: 3000 }).withMessage('Comment is too long'),
];

module.exports = { reviewBookIdValidator, reviewIdValidator, upsertReviewValidator, updateReviewValidator };
