const { body, param, query } = require('express-validator');

const listUsersValidator = [
  query('role').optional().isIn(['reader', 'author', 'admin']).withMessage('Invalid role filter'),
  query('status').optional().isIn(['active', 'restricted', 'removed']).withMessage('Invalid status filter'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
];

const userIdValidator = [param('id').isMongoId().withMessage('Invalid user id')];

const updateUserStatusValidator = [
  body('status').isIn(['active', 'restricted', 'removed']).withMessage('status must be active, restricted, or removed'),
];

module.exports = { listUsersValidator, userIdValidator, updateUserStatusValidator };
