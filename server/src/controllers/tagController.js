const Tag = require('../models/Tag');
const Note = require('../models/Note');
const Highlight = require('../models/Highlight');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/tags
 * Only ever returns the caller's own tags (FR-TAG-04: private tags are
 * not accessible to unauthorized users — enforced simply by always
 * scoping to req.user._id, never accepting another user's id).
 */
const listMyTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find({ userId: req.user._id }).sort({ name: 1 });
  res.status(200).json({ success: true, data: { tags } });
});

/**
 * POST /api/tags
 * FR-TAG-02 create custom tags. Returns the existing tag instead of
 * erroring if the name is reused — the frontend's tag picker treats
 * "type a new tag" and "reuse an existing one" as the same action.
 */
const createTag = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const existing = await Tag.findOne({ userId: req.user._id, name });
  if (existing) {
    return res.status(200).json({ success: true, data: { tag: existing } });
  }

  const tag = await Tag.create({ userId: req.user._id, name });
  res.status(201).json({ success: true, data: { tag } });
});

/**
 * DELETE /api/tags/:id
 * Removes the tag and pulls it out of every note/highlight that
 * referenced it, so nothing is left pointing at a deleted tag.
 */
const deleteTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);
  if (!tag) throw new AppError('Tag not found', 404);
  if (String(tag.userId) !== String(req.user._id)) {
    throw new AppError('You do not have permission to delete this tag', 403);
  }

  await Promise.all([
    Note.updateMany({ userId: req.user._id, tags: tag._id }, { $pull: { tags: tag._id } }),
    Highlight.updateMany({ userId: req.user._id, tags: tag._id }, { $pull: { tags: tag._id } }),
    tag.deleteOne(),
  ]);

  res.status(200).json({ success: true, message: 'Tag removed' });
});

module.exports = { listMyTags, createTag, deleteTag };
