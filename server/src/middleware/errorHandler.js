const { nodeEnv } = require('../config/env');

/**
 * Single place where every error in the app ends up (NFR-Reliability:
 * invalid input / failures shall not crash the app, and shall produce
 * meaningful messages per NFR-Usability).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';

  // Translate common Mongoose/Mongo errors into meaningful, safe messages
  // instead of leaking internal driver error text to the client.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use.`;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier supplied.';
  }

  if (statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(err); // log full detail server-side, never send it to the client
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(nodeEnv === 'development' && statusCode === 500 ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
