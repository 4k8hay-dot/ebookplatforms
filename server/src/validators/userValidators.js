const { body } = require('express-validator');

const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('authorBio').optional().trim().isLength({ max: 1000 }).withMessage('Bio must be under 1000 characters'),
  // Email intentionally NOT editable here to avoid re-triggering uniqueness/
  // verification concerns the SRS doesn't specify a flow for; smallest
  // reasonable solution per your Rule 11. Flagged in the phase report.
];

module.exports = { updateProfileValidator };
