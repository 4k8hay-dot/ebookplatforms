import { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, IconButton, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getHighlightsForBookRequest, deleteHighlightRequest } from '../api/highlightApi';

export default function HighlightsPanel({ bookId, onSelectHighlight, refreshSignal }) {
  const [highlights, setHighlights] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    getHighlightsForBookRequest(bookId)
      .then((res) => setHighlights(res.data.data.highlights))
      .catch(() => setError('Could not load highlights.'));
  };

  useEffect(load, [bookId, refreshSignal]);

  const handleDelete = async (id) => {
    try {
      await deleteHighlightRequest(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove highlight.');
    }
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Highlights
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

      {highlights.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Select text in the book to highlight it.
        </Typography>
      ) : (
        <List dense disablePadding>
          {highlights.map((h) => (
            <ListItem
              key={h._id}
              disablePadding
              secondaryAction={
                <IconButton edge="end" size="small" onClick={() => handleDelete(h._id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton onClick={() => onSelectHighlight(h.location)} sx={{ borderLeft: `4px solid ${h.color}` }}>
                <ListItemText
                  primary={h.text.slice(0, 80) + (h.text.length > 80 ? '…' : '')}
                  secondary={h.tags?.map((t) => t.name).join(', ')}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
