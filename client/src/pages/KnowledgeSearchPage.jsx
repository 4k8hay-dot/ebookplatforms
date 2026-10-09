import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Stack,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Link,
  Box,
  CircularProgress,
} from '@mui/material';
import { getMyNotesRequest } from '../api/noteApi';
import { getAllMyHighlightsRequest } from '../api/highlightApi';
import { getMyTagsRequest } from '../api/tagApi';
import useDebouncedValue from '../hooks/useDebouncedValue';

/**
 * This page is deliberately separate from the book catalog's search
 * (HomePage.jsx / GET /api/books) — it queries only the caller's own
 * notes and highlights, via /api/notes and /api/highlights, never the
 * public Book collection. That separation is what satisfies FR-SEARCH-04
 * ("the system shall distinguish book search from personal knowledge
 * search"): different page, different endpoints, different data.
 */
export default function KnowledgeSearchPage() {
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState(null);
  const [tags, setTags] = useState([]);
  const [notes, setNotes] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebouncedValue(query, 400);

  useEffect(() => {
    getMyTagsRequest()
      .then((res) => setTags(res.data.data.tags))
      .catch(() => setTags([]));
  }, []);

  useEffect(() => {
    if (!debouncedQuery && !tagFilter) {
      setNotes([]);
      setHighlights([]);
      return;
    }
    setIsLoading(true);
    const params = { q: debouncedQuery || undefined, tag: tagFilter || undefined };
    Promise.all([getMyNotesRequest(params), getAllMyHighlightsRequest(params)])
      .then(([notesRes, highlightsRes]) => {
        setNotes(notesRes.data.data.notes.filter((n) => n.bookId));
        setHighlights(highlightsRes.data.data.highlights.filter((h) => h.bookId));
      })
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, tagFilter]);

  const matchingTags = tagFilter ? [] : tags.filter((t) => query && t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Knowledge search
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Search across your own notes and highlights — separate from searching the book catalog.
      </Typography>

      <TextField
        fullWidth
        label="Search your notes and highlights"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setTagFilter(null);
        }}
        sx={{ mb: 2 }}
      />

      {tagFilter && (
        <Chip label={`Filtering by tag`} onDelete={() => setTagFilter(null)} sx={{ mb: 2 }} color="secondary" />
      )}

      {matchingTags.length > 0 && (
        <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" useFlexGap>
          {matchingTags.map((t) => (
            <Chip key={t._id} label={t.name} onClick={() => setTagFilter(t._id)} variant="outlined" />
          ))}
        </Stack>
      )}

      {isLoading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && (notes.length > 0 || highlights.length > 0) && (
        <Stack spacing={3}>
          {notes.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Notes ({notes.length})
              </Typography>
              <List dense disablePadding>
                {notes.map((n) => (
                  <ListItem key={n._id} disablePadding sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={n.content}
                      secondary={
                        <Link component={RouterLink} to={`/reader/${n.bookId._id}`} underline="hover">
                          {n.bookId.title}
                        </Link>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {highlights.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Highlights ({highlights.length})
              </Typography>
              <List dense disablePadding>
                {highlights.map((h) => (
                  <ListItem key={h._id} disablePadding sx={{ py: 0.5, borderLeft: `4px solid ${h.color}`, pl: 1 }}>
                    <ListItemText
                      primary={h.text}
                      secondary={
                        <Link component={RouterLink} to={`/reader/${h.bookId._id}`} underline="hover">
                          {h.bookId.title}
                        </Link>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Stack>
      )}

      {!isLoading && debouncedQuery && notes.length === 0 && highlights.length === 0 && (
        <Typography color="text.secondary">No notes or highlights match "{debouncedQuery}".</Typography>
      )}
    </Container>
  );
}
