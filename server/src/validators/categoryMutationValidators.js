const { body, param } = require('express-validator');

const createCategoryValidator = [
  body('name').trim().isLength({ min: 1, max: 80 }).withMessage('Category name is required (max 80 characters)'),
  body('description').optional().trim().isLength({ max: 500 }),
];

const updateCategoryValidator = [
  body('name').optional().trim().isLength({ min: 1, max: 80 }),
  body('description').optional().trim().isLength({ max: 500 }),
];

const categoryIdValidator = [param('id').isMongoId().withMessage('Invalid category id')];

module.exports = { createCategoryValidator, updateCategoryValidator, categoryIdValidator };
