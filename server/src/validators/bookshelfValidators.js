const { param } = require('express-validator');

const bookIdParamValidator = [param('bookId').isMongoId().withMessage('Invalid book id')];

module.exports = { bookIdParamValidator };
