import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Link,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getHistoryRequest, removeHistoryItemRequest } from '../api/historyApi';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setIsLoading(true);
    getHistoryRequest()
      .then((res) => setHistory(res.data.data.history.filter((h) => h.bookId)))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load history.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (id) => {
    try {
      await removeHistoryItemRequest(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove item.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Reading history
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : history.length === 0 ? (
        <Typography color="text.secondary">You haven't opened any books yet.</Typography>
      ) : (
        <List>
          {history.map((h) => (
            <ListItem
              key={h._id}
              divider
              secondaryAction={
                <IconButton edge="end" onClick={() => handleRemove(h._id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <Link component={RouterLink} to={`/reader/${h.bookId._id}`} underline="hover">
                    {h.bookId.title}
                  </Link>
                }
                secondary={`Last opened ${new Date(h.lastAccessedAt).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}
