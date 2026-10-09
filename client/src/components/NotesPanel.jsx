import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Stack,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { getMyNotesRequest, createNoteRequest, updateNoteRequest, deleteNoteRequest } from '../api/noteApi';
import TagSelector from './TagSelector';

export default function NotesPanel({ bookId, highlights, currentPosition }) {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [linkedHighlightId, setLinkedHighlightId] = useState('');
  const [tags, setTags] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    getMyNotesRequest({ bookId })
      .then((res) => setNotes(res.data.data.notes))
      .catch(() => setError('Could not load notes.'));
  };

  useEffect(load, [bookId]);

  const resetForm = () => {
    setContent('');
    setLinkedHighlightId('');
    setTags([]);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      if (editingId) {
        await updateNoteRequest(editingId, { content, tags: tags.map((t) => t._id) });
      } else {
        await createNoteRequest({
          bookId,
          highlightId: linkedHighlightId || undefined,
          content,
          tags: tags.map((t) => t._id),
          location: currentPosition,
        });
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save note.');
    }
  };

  const handleEdit = (note) => {
    setEditingId(note._id);
    setContent(note.content);
    setTags(note.tags || []);
  };

  const handleDelete = async (id) => {
    try {
      await deleteNoteRequest(id);
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove note.');
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Notes
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      <Stack spacing={1} mb={2}>
        <TextField
          size="small"
          multiline
          minRows={2}
          placeholder="Write a note about what you're reading…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        {!editingId && highlights?.length > 0 && (
          <TextField
            select
            size="small"
            label="Link to a highlight (optional)"
            value={linkedHighlightId}
            onChange={(e) => setLinkedHighlightId(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {highlights.map((h) => (
              <MenuItem key={h._id} value={h._id}>
                {h.text.slice(0, 40)}…
              </MenuItem>
            ))}
          </TextField>
        )}
        <TagSelector value={tags} onChange={setTags} />
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="contained" color="secondary" onClick={handleSave}>
            {editingId ? 'Save changes' : 'Add note'}
          </Button>
          {editingId && (
            <Button size="small" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>

      {notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No notes for this book yet.
        </Typography>
      ) : (
        <List dense disablePadding>
          {notes.map((n) => (
            <ListItem
              key={n._id}
              alignItems="flex-start"
              disablePadding
              secondaryAction={
                <Stack direction="row">
                  <IconButton edge="end" size="small" onClick={() => handleEdit(n)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton edge="end" size="small" onClick={() => handleDelete(n._id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemText
                primary={n.content}
                secondary={
                  n.tags?.length > 0 && (
                    <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                      {n.tags.map((t) => (
                        <Chip key={t._id} size="small" label={t.name} />
                      ))}
                    </Stack>
                  )
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
