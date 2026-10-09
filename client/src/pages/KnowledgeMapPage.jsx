import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Paper, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';
import { getKnowledgeMapRequest } from '../api/analyticsApi';
import { getMyNotesRequest } from '../api/noteApi';
import { getAllMyHighlightsRequest } from '../api/highlightApi';
import KnowledgeGraphSvg from '../components/KnowledgeGraphSvg';

export default function KnowledgeMapPage() {
  const navigate = useNavigate();
  const [graph, setGraph] = useState({ tags: [], books: [], links: [] });
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [relatedNotes, setRelatedNotes] = useState([]);
  const [relatedHighlights, setRelatedHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getKnowledgeMapRequest()
      .then((res) => setGraph(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your knowledge map.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelectTag = (tagId) => {
    setSelectedTagId(tagId);
    Promise.all([getMyNotesRequest({ tag: tagId }), getAllMyHighlightsRequest({ tag: tagId })]).then(
      ([notesRes, highlightsRes]) => {
        setRelatedNotes(notesRes.data.data.notes);
        setRelatedHighlights(highlightsRes.data.data.highlights);
      }
    );
  };

  const selectedTag = graph.tags.find((t) => t.id === selectedTagId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Your knowledge map
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        A private view of how your tags connect your books, highlights and notes. Click a tag to see what's behind it.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!error && graph.tags.length === 0 ? (
        <Typography color="text.secondary">
          Tag some highlights or notes while reading to start building your knowledge map.
        </Typography>
      ) : (
        <>
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <KnowledgeGraphSvg
              tags={graph.tags}
              books={graph.books}
              links={graph.links}
              selectedTagId={selectedTagId}
              onSelectTag={handleSelectTag}
              onSelectBook={(bookId) => navigate(`/books/${bookId}`)}
            />
          </Paper>

          {selectedTag && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tagged "{selectedTag.name}"
              </Typography>

              {relatedHighlights.length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Highlights
                  </Typography>
                  <List dense disablePadding sx={{ mb: 1 }}>
                    {relatedHighlights.map((h) => (
                      <ListItem key={h._id} disablePadding sx={{ borderLeft: `4px solid ${h.color}`, pl: 1 }}>
                        <ListItemText primary={h.text} secondary={h.bookId?.title} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {relatedNotes.length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <List dense disablePadding>
                    {relatedNotes.map((n) => (
                      <ListItem key={n._id} disablePadding>
                        <ListItemText primary={n.content} secondary={n.bookId?.title} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {relatedHighlights.length === 0 && relatedNotes.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Nothing found for this tag.
                </Typography>
              )}
            </Paper>
          )}
        </>
      )}
    </Container>
  );
}
