import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Link,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getMyNotesRequest, deleteNoteRequest } from '../api/noteApi';
import { getMyTagsRequest } from '../api/tagApi';
import useDebouncedValue from '../hooks/useDebouncedValue';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    getMyTagsRequest()
      .then((res) => setTags(res.data.data.tags))
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getMyNotesRequest({ q: debouncedSearch || undefined, tag: tagFilter || undefined })
      .then((res) => setNotes(res.data.data.notes.filter((n) => n.bookId)))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load notes.'))
      .finally(() => setIsLoading(false));
  }, [debouncedSearch, tagFilter]);

  const handleDelete = async (id) => {
    try {
      await deleteNoteRequest(id);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove note.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Your notes
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <TextField fullWidth label="Search notes" value={search} onChange={(e) => setSearch(e.target.value)} />
        <TextField
          select
          fullWidth
          sx={{ minWidth: 200 }}
          label="Filter by tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
        >
          <MenuItem value="">All tags</MenuItem>
          {tags.map((t) => (
            <MenuItem key={t._id} value={t._id}>
              {t.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : notes.length === 0 ? (
        <Typography color="text.secondary">No notes match yet.</Typography>
      ) : (
        <List>
          {notes.map((n) => (
            <ListItem
              key={n._id}
              divider
              alignItems="flex-start"
              secondaryAction={
                <IconButton edge="end" onClick={() => handleDelete(n._id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={n.content}
                secondary={
                  <>
                    <Link component={RouterLink} to={`/reader/${n.bookId._id}`} underline="hover">
                      {n.bookId.title}
                    </Link>
                    {n.tags?.length > 0 && (
                      <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                        {n.tags.map((t) => (
                          <Chip key={t._id} size="small" label={t.name} onClick={() => setTagFilter(t._id)} />
                        ))}
                      </Stack>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}
