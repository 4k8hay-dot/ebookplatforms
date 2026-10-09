/**
 * A predictable, "operational" error we throw intentionally from
 * controllers/services (bad input, not found, unauthorized, etc).
 * The central error handler treats these differently from unexpected bugs.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
