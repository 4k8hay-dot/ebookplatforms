const express = require('express');
const { listMyTags, createTag, deleteTag } = require('../controllers/tagController');
const { createTagValidator, tagIdValidator } = require('../validators/tagValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listMyTags);
router.post('/', createTagValidator, validate, createTag);
router.delete('/:id', tagIdValidator, validate, deleteTag);

module.exports = router;
