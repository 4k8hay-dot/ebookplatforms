const multer = require('multer');
const AppError = require('../utils/AppError');
const { maxAvatarSizeMb } = require('../config/env');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Memory storage: we validate then hand the buffer to storageService,
// which is the only place that knows about the underlying disk/cloud
// adapter (FR-FILE-03 file type validation, FR-FILE-04 size limits).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxAvatarSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new AppError('Only JPEG, PNG or WEBP images are allowed for avatars', 400));
    }
    cb(null, true);
  },
});

module.exports = upload.single('avatar');
