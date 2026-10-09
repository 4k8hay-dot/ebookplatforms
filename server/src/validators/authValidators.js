const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('role')
    .optional()
    .isIn(['reader', 'author'])
    .withMessage('Role must be either "reader" or "author"'),
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email address is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Added on request, outside the original SRS's FR-AUTH scope.
const googleLoginValidator = [body('idToken').notEmpty().withMessage('idToken is required').isString()];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('A valid email address is required').normalizeEmail(),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('token is required').isString(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

module.exports = {
  registerValidator,
  loginValidator,
  googleLoginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
