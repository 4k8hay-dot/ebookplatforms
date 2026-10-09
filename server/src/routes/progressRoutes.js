const express = require('express');
const { getProgress, listMyProgress, upsertProgress } = require('../controllers/progressController');
const { progressBookIdValidator, upsertProgressValidator } = require('../validators/progressValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Must come before "/:bookId" so it isn't swallowed by the param route.
router.get('/', listMyProgress);

router.get('/:bookId', progressBookIdValidator, validate, getProgress);
router.put('/:bookId', progressBookIdValidator, upsertProgressValidator, validate, upsertProgress);

module.exports = router;
