const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// Runs after a route's validator chain; turns express-validator's error
// array into a single readable AppError so every endpoint reports
// validation problems the same way (NFR-Usability: meaningful errors).
module.exports = function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    throw new AppError(message, 400);
  }
  next();
};
