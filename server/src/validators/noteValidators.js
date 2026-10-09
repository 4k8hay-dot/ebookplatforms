const { body, param, query } = require('express-validator');

const listNotesValidator = [
  query('bookId').optional().isMongoId().withMessage('bookId must be a valid id'),
  query('tag').optional().isMongoId().withMessage('tag must be a valid id'),
];

const createNoteValidator = [
  body('bookId').isMongoId().withMessage('A valid book id is required'),
  body('highlightId').optional({ nullable: true }).isMongoId().withMessage('highlightId must be a valid id'),
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Note content is required'),
  body('tags').optional().isArray().withMessage('tags must be an array of tag ids'),
  body('tags.*').optional().isMongoId().withMessage('Each tag must be a valid id'),
  body('location').optional({ nullable: true }).isString(),
];

const updateNoteValidator = [
  body('content').optional().trim().isLength({ min: 1, max: 5000 }),
  body('tags').optional().isArray().withMessage('tags must be an array of tag ids'),
  body('tags.*').optional().isMongoId().withMessage('Each tag must be a valid id'),
  body('location').optional({ nullable: true }).isString(),
];

const noteIdValidator = [param('id').isMongoId().withMessage('Invalid note id')];

module.exports = { listNotesValidator, createNoteValidator, updateNoteValidator, noteIdValidator };
