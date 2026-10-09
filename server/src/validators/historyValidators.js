const { param } = require('express-validator');

const historyBookIdValidator = [param('bookId').isMongoId().withMessage('Invalid book id')];
const historyItemIdValidator = [param('id').isMongoId().withMessage('Invalid history item id')];

module.exports = { historyBookIdValidator, historyItemIdValidator };
