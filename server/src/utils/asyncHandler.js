// Wraps an async route handler so any rejected promise / thrown error is
// forwarded to Express's error-handling middleware instead of crashing
// the process or requiring try/catch in every single controller
// (NFR-Reliability: invalid input / failures shall not crash the app).
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
