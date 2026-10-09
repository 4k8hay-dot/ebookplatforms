const express = require('express');
const { getMyProfile, updateMyProfile, updateMyAvatar } = require('../controllers/userController');
const { updateProfileValidator } = require('../validators/userValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const uploadAvatar = require('../middleware/uploadAvatar');

const router = express.Router();

router.use(protect); // every route below requires authentication (FR-AUTH-07)

router.get('/me', getMyProfile);
router.put('/me', updateProfileValidator, validate, updateMyProfile);
router.put('/me/avatar', uploadAvatar, updateMyAvatar);

module.exports = router;
