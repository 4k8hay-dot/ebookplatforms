const jwt = require('jsonwebtoken');
const { jwtSecret, cookieName } = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

/**
 * protect: verifies the JWT (from the httpOnly cookie, or a Bearer header
 * as a fallback for API testing tools like Postman) and attaches the
 * authenticated user to req.user. Implements FR-AUTH-07 (protected
 * functionality restricted to authenticated users).
 */
const protect = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.[cookieName];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('You must be logged in to access this resource', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch (err) {
    throw new AppError('Invalid or expired session, please log in again', 401);
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new AppError('The user for this session no longer exists', 401);
  }
  if (user.status !== 'active') {
    throw new AppError('This account is not active. Contact an administrator.', 403);
  }

  req.user = user;
  next();
});

/**
 * authorize(...roles): restricts a route to specific roles.
 * Implements role-based authorization (BR-05, FR-ADMIN-*, FR-AUTHOR-*).
 * Usage: router.post('/books', protect, authorize('author'), ...)
 */
function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action', 403);
    }
    next();
  };
}

module.exports = { protect, authorize };
