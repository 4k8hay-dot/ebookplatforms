const Category = require('../models/Category');
const Book = require('../models/Book');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/categories
 * Public. Supports FR-BOOK-04 (filter books by category).
 */
const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: { categories } });
});

/**
 * POST /api/categories
 * FR-ADMIN-04 administrators manage categories.
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const existing = await Category.findOne({ name });
  if (existing) throw new AppError('A category with this name already exists', 409);

  const category = await Category.create({ name, description: description || '' });
  res.status(201).json({ success: true, data: { category } });
});

/**
 * PUT /api/categories/:id
 */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const { name, description } = req.body;
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  await category.save();

  res.status(200).json({ success: true, data: { category } });
});

/**
 * DELETE /api/categories/:id
 * Blocked while any book still references the category, rather than
 * silently orphaning those books' category field — the smallest safe
 * policy given the SRS doesn't specify reassignment behavior.
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  const bookCount = await Book.countDocuments({ category: category._id, status: { $ne: 'removed' } });
  if (bookCount > 0) {
    throw new AppError(`Cannot delete: ${bookCount} book(s) still use this category`, 409);
  }

  await category.deleteOne();
  res.status(200).json({ success: true, message: 'Category removed' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
