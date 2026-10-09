const express = require('express');
const { listMyNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');
const { listNotesValidator, createNoteValidator, updateNoteValidator, noteIdValidator } = require('../validators/noteValidators');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', listNotesValidator, validate, listMyNotes);
router.post('/', createNoteValidator, validate, createNote);
router.put('/:id', noteIdValidator, updateNoteValidator, validate, updateNote);
router.delete('/:id', noteIdValidator, validate, deleteNote);

module.exports = router;
