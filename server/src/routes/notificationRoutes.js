const express = require('express');
const { listMyNotifications, markNotificationRead } = require('../controllers/notificationController');
const { notificationIdValidator } = require('../validators/notificationValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listMyNotifications);
router.put('/:id/read', notificationIdValidator, validate, markNotificationRead);

module.exports = router;
