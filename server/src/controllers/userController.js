const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { saveFile, deleteFile } = require('../services/storageService');

/**
 * GET /api/users/me
 * FR-PROFILE-01 view own profile.
 * Note: there is intentionally no GET /api/users/:id public endpoint —
 * FR-PROFILE-04 requires that users cannot access another user's private
 * information, and the SRS defines no public author/profile page, so the
 * smallest safe solution is to only ever expose "me".
 */
const getMyProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});

/**
 * PUT /api/users/me
 * FR-PROFILE-02 update profile information.
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, authorBio } = req.body;

  if (name !== undefined) req.user.name = name;
  if (authorBio !== undefined) req.user.authorBio = authorBio;

  await req.user.save();

  res.status(200).json({ success: true, data: { user: req.user } });
});

/**
 * PUT /api/users/me/avatar
 * FR-PROFILE-03 upload/change profile image.
 */
const updateMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file was provided' });
  }

  const previousImage = req.user.profileImage;

  const publicUrl = saveFile({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    subFolder: 'avatars',
  });

  req.user.profileImage = publicUrl;
  await req.user.save();

  if (previousImage) {
    deleteFile(previousImage);
  }

  res.status(200).json({ success: true, data: { user: req.user } });
});

module.exports = { getMyProfile, updateMyProfile, updateMyAvatar };
