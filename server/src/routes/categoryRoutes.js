const express = require('express');
const { listCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { createCategoryValidator, updateCategoryValidator, categoryIdValidator } = require('../validators/categoryMutationValidators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', listCategories);

router.post('/', protect, authorize('admin'), createCategoryValidator, validate, createCategory);
router.put('/:id', protect, authorize('admin'), categoryIdValidator, updateCategoryValidator, validate, updateCategory);
router.delete('/:id', protect, authorize('admin'), categoryIdValidator, validate, deleteCategory);

module.exports = router;
