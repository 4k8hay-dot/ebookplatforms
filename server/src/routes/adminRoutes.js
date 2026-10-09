const express = require('express');
const { listPendingBooks, approveBook, rejectBook } = require('../controllers/adminBookController');
const { listUsers, updateUserStatus, getStats } = require('../controllers/adminController');
const { listReports, resolveReport } = require('../controllers/reportController');
const { bookIdValidator } = require('../validators/bookValidators');
const { listUsersValidator, userIdValidator, updateUserStatusValidator } = require('../validators/adminValidators');
const { listReportsValidator, reportIdValidator, resolveReportValidator } = require('../validators/reportValidators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

// Book approval workflow (FR-AUTHOR-09) — built in Phase 3.
router.get('/books/pending', listPendingBooks);
router.put('/books/:id/approve', bookIdValidator, validate, approveBook);
router.put('/books/:id/reject', bookIdValidator, validate, rejectBook);

// User management (FR-ADMIN-02/03).
router.get('/users', listUsersValidator, validate, listUsers);
router.put('/users/:id/status', userIdValidator, updateUserStatusValidator, validate, updateUserStatus);

// Dashboard statistics (FR-ADMIN-08).
router.get('/stats', getStats);

// Reporting & moderation (FR-REPORT-03/04, FR-ADMIN-07).
router.get('/reports', listReportsValidator, validate, listReports);
router.put('/reports/:id/resolve', reportIdValidator, resolveReportValidator, validate, resolveReport);

// Category management (FR-ADMIN-04) lives under /api/categories (see
// categoryRoutes.js) since it's a REST resource in its own right, not
// admin-specific — the same pattern already used for book approval vs.
// book CRUD.

module.exports = router;
