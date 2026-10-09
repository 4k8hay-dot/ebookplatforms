import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Button,
  Stack,
  LinearProgress,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { getBookshelfRequest, removeFromBookshelfRequest } from '../api/bookshelfApi';

export default function BookshelfPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setIsLoading(true);
    getBookshelfRequest()
      .then((res) => setItems(res.data.data.items))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your bookshelf.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (bookId) => {
    try {
      await removeFromBookshelfRequest(bookId);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove book.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Your bookshelf
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Typography color="text.secondary">
          Your bookshelf is empty. Find something to read from the{' '}
          <RouterLink to="/">catalog</RouterLink>.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
              <Card variant="outlined">
                <CardActionArea component={RouterLink} to={`/books/${item.book._id}`}>
                  <CardContent>
                    <Typography variant="subtitle1" noWrap title={item.book.title}>
                      {item.book.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {item.book.authorId?.name}
                    </Typography>
                    {item.progress ? (
                      <Box mt={1}>
                        <Chip size="small" color="info" label="Currently reading" sx={{ mb: 0.5 }} />
                        <LinearProgress variant="determinate" value={item.progress.progressPercentage || 0} />
                        <Typography variant="caption" color="text.secondary">
                          {item.progress.progressPercentage || 0}% complete
                        </Typography>
                      </Box>
                    ) : (
                      <Chip size="small" label="Not started" sx={{ mt: 1 }} />
                    )}
                  </CardContent>
                </CardActionArea>
                <Stack direction="row" spacing={1} p={1.5} pt={0}>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    component={RouterLink}
                    to={`/reader/${item.book._id}`}
                    fullWidth
                  >
                    {item.progress ? 'Continue' : 'Start reading'}
                  </Button>
                  <Button size="small" color="error" onClick={() => handleRemove(item.book._id)}>
                    Remove
                  </Button>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
