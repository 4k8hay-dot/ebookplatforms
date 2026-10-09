const multer = require('multer');
const AppError = require('../utils/AppError');
const { maxCoverSizeMb, maxEbookSizeMb } = require('../config/env');

const COVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EBOOK_MIME_TYPES = {
  pdf: ['application/pdf'],
  epub: ['application/epub+zip'],
};

// A single multer instance handling both fields at once. Per-field size
// limits aren't natively supported by multer, so we set the limit to the
// larger of the two (the eBook limit) and double-check each file's own
// size in the controller/fileFilter where we know which field it is.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Math.max(maxCoverSizeMb, maxEbookSizeMb) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'cover') {
      if (!COVER_MIME_TYPES.includes(file.mimetype)) {
        return cb(new AppError('Cover image must be JPEG, PNG or WEBP', 400));
      }
      return cb(null, true);
    }

    if (file.fieldname === 'ebookFile') {
      // FR-AUTHOR-04 / FR-FILE-03: validate the file actually matches the
      // format the author declared, don't just trust the file extension.
      const declaredFormat = req.body.format;
      const allowed = EBOOK_MIME_TYPES[declaredFormat];
      if (!allowed) {
        return cb(new AppError('A valid format ("pdf" or "epub") must be provided', 400));
      }
      if (!allowed.includes(file.mimetype)) {
        return cb(new AppError(`The uploaded file does not match the declared format "${declaredFormat}"`, 400));
      }
      return cb(null, true);
    }

    cb(new AppError(`Unexpected file field: ${file.fieldname}`, 400));
  },
});

// Enforces the distinct per-field size limits (FR-AUTHOR-05 / FR-FILE-04)
// after multer's shared limit above has already provided a hard ceiling.
function enforcePerFieldSizeLimits(req, _res, next) {
  const cover = req.files?.cover?.[0];
  const ebookFile = req.files?.ebookFile?.[0];

  if (cover && cover.size > maxCoverSizeMb * 1024 * 1024) {
    return next(new AppError(`Cover image must be under ${maxCoverSizeMb}MB`, 400));
  }
  if (ebookFile && ebookFile.size > maxEbookSizeMb * 1024 * 1024) {
    return next(new AppError(`eBook file must be under ${maxEbookSizeMb}MB`, 400));
  }
  next();
}

const uploadBookFiles = [
  upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'ebookFile', maxCount: 1 },
  ]),
  enforcePerFieldSizeLimits,
];

module.exports = uploadBookFiles;
