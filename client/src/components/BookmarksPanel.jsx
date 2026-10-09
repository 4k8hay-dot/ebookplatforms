import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Stack,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import { getBookmarksRequest, createBookmarkRequest, deleteBookmarkRequest } from '../api/bookmarkApi';

/**
 * currentPosition: the reader's live position (kept in sync by ReaderPage
 * from the viewer's onPositionChange callback) — used as the value saved
 * when the user clicks "Add bookmark here".
 * onSelectBookmark: called with a bookmark's position when clicked, so
 * ReaderPage can command the active viewer to jump there (FR-BOOKMARK-04).
 */
export default function BookmarksPanel({ bookId, currentPosition, onSelectBookmark }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    getBookmarksRequest(bookId)
      .then((res) => setBookmarks(res.data.data.bookmarks))
      .catch(() => setError('Could not load bookmarks.'));
  };

  useEffect(load, [bookId]);

  const handleAdd = async () => {
    if (!currentPosition) return;
    try {
      await createBookmarkRequest(bookId, { position: currentPosition, label });
      setLabel('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save bookmark.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBookmarkRequest(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove bookmark.');
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Bookmarks
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      <Stack direction="row" spacing={1} mb={2}>
        <TextField
          size="small"
          placeholder="Optional label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          fullWidth
        />
        <Button variant="outlined" size="small" startIcon={<BookmarkAddIcon />} onClick={handleAdd} disabled={!currentPosition}>
          Add
        </Button>
      </Stack>

      {bookmarks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No bookmarks yet.
        </Typography>
      ) : (
        <List dense disablePadding>
          {bookmarks.map((b) => (
            <ListItem
              key={b._id}
              disablePadding
              secondaryAction={
                <IconButton edge="end" size="small" onClick={() => handleDelete(b._id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton onClick={() => onSelectBookmark(b.position)}>
                <ListItemText
                  primary={b.label || `Position ${b.position}`}
                  secondary={new Date(b.createdAt).toLocaleString()}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
