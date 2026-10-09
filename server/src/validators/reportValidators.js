const { body, param, query } = require('express-validator');

const createReportValidator = [
  body('targetType').isIn(['book', 'review']).withMessage('targetType must be "book" or "review"'),
  body('targetId').isMongoId().withMessage('A valid targetId is required'),
  body('reason').trim().isLength({ min: 1, max: 1000 }).withMessage('A reason is required'),
];

const listReportsValidator = [query('status').optional().isIn(['open', 'resolved']).withMessage('Invalid status filter')];

const reportIdValidator = [param('id').isMongoId().withMessage('Invalid report id')];

const resolveReportValidator = [body('removeContent').optional().isBoolean().withMessage('removeContent must be true or false')];

module.exports = { createReportValidator, listReportsValidator, reportIdValidator, resolveReportValidator };
