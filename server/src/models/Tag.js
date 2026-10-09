const mongoose = require('mongoose');

/**
 * Tags are scoped to the user who created them (FR-TAG-04: private tags
 * shall not be accessible to unauthorized users) — this was flagged as
 * an assumption in the Phase 0 analysis doc, since the SRS never
 * describes a shared/global tag concept.
 */
const tagSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
  },
  { timestamps: true }
);

tagSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tag', tagSchema);
