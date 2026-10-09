const jwt = require('jsonwebtoken');
const { jwtSecret, cookieName } = require('../config/env');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Unlike `protect`, this never throws when there's no/invalid token — it
 * just leaves req.user undefined. Used on routes that are public by
 * default but behave slightly differently for a logged-in owner/admin
 * (e.g. GET /api/books/:id showing a pending book to its own author).
 */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  let token = req.cookies?.[cookieName];
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.sub);
    if (user && user.status === 'active') {
      req.user = user;
    }
  } catch {
    // invalid/expired token on a public route — just proceed as a guest
  }

  next();
});

module.exports = optionalAuth;
