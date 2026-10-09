const express = require('express');
const { getReadingAnalytics, getTopicAnalytics, getKnowledgeMap } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/reading', getReadingAnalytics);
router.get('/topics', getTopicAnalytics);
router.get('/knowledge', getKnowledgeMap);

module.exports = router;
