const express = require('express');
const { createReport } = require('../controllers/reportController');
const { createReportValidator } = require('../validators/reportValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createReportValidator, validate, createReport);

module.exports = router;
