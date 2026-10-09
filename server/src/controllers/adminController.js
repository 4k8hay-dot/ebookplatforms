const User = require('../models/User');
const Book = require('../models/Book');
const Category = require('../models/Category');
const Report = require('../models/Report');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildMeta } = require('../utils/pagination');

/**
 * GET /api/admin/users
 * FR-ADMIN-02 view registered users.
 */
const listUsers = asyncHandler(async (req, res) => {
  const { q, role, status } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;
  if (q) {
    filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  }

  const { page, limit, skip } = parsePagination(req.query);
  const [users, totalItems] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: { users, meta: buildMeta({ page, limit, totalItems }) } });
});

/**
 * PUT /api/admin/users/:id/status
 * FR-ADMIN-03 activate, restrict, or remove accounts. An admin can't
 * change their own status through this endpoint — a safeguard against
 * accidentally locking out the only admin account.
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    throw new AppError('You cannot change your own account status', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  user.status = req.body.status;
  await user.save();

  res.status(200).json({ success: true, data: { user } });
});

/**
 * GET /api/admin/stats
 * FR-ADMIN-08 the dashboard shall display basic system statistics.
 */
const getStats = asyncHandler(async (_req, res) => {
  const [userCounts, bookCounts, totalCategories, openReports, resolvedReports] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Book.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Category.countDocuments(),
    Report.countDocuments({ status: 'open' }),
    Report.countDocuments({ status: 'resolved' }),
  ]);

  const usersByRole = Object.fromEntries(userCounts.map((r) => [r._id, r.count]));
  const booksByStatus = Object.fromEntries(bookCounts.map((r) => [r._id, r.count]));

  res.status(200).json({
    success: true,
    data: {
      totalUsers: userCounts.reduce((sum, r) => sum + r.count, 0),
      usersByRole,
      totalBooks: bookCounts.reduce((sum, r) => sum + r.count, 0),
      booksByStatus,
      totalCategories,
      openReports,
      resolvedReports,
    },
  });
});

module.exports = { listUsers, updateUserStatus, getStats };
