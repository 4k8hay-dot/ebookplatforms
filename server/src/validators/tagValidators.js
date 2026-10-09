const { body, param } = require('express-validator');

const createTagValidator = [body('name').trim().isLength({ min: 1, max: 60 }).withMessage('Tag name is required (max 60 characters)')];
const tagIdValidator = [param('id').isMongoId().withMessage('Invalid tag id')];

module.exports = { createTagValidator, tagIdValidator };
