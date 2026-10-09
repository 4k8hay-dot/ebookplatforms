const express = require('express');
const { updateReview, deleteReview } = require('../controllers/reviewController');
const { reviewIdValidator, updateReviewValidator } = require('../validators/reviewValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.put('/:id', reviewIdValidator, updateReviewValidator, validate, updateReview);
router.delete('/:id', reviewIdValidator, validate, deleteReview);

module.exports = router;
