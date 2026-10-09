const express = require('express');
const { recordAccessRoute, listHistory, removeHistoryItem } = require('../controllers/historyController');
const { historyBookIdValidator, historyItemIdValidator } = require('../validators/historyValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listHistory);
router.post('/:bookId', historyBookIdValidator, validate, recordAccessRoute);
router.delete('/:id', historyItemIdValidator, validate, removeHistoryItem);

module.exports = router;
