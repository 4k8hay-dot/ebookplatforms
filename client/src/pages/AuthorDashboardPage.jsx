import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { getMyBooksRequest, deleteBookRequest } from '../api/authorBookApi';

const STATUS_COLOR = { approved: 'success', pending: 'warning', rejected: 'error', removed: 'default' };

export default function AuthorDashboardPage() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState({ total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setIsLoading(true);
    getMyBooksRequest()
      .then((res) => {
        setBooks(res.data.data.books);
        setStats(res.data.data.stats);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your books.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this book? It will no longer be visible in the catalog.')) return;
    try {
      await deleteBookRequest(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove book.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 5, mb: 8 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Your books</Typography>
        <Button component={RouterLink} to="/author/books/new" variant="contained" color="secondary" startIcon={<AddIcon />}>
          Upload a book
        </Button>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={3}>
        {stats.total || 0} total — {stats.approved || 0} approved, {stats.pending || 0} pending, {stats.rejected || 0} rejected,{' '}
        {stats.removed || 0} removed
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : books.length === 0 ? (
        <Typography color="text.secondary">You haven't uploaded any books yet.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Format</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((b) => (
              <TableRow key={b._id}>
                <TableCell>{b.title}</TableCell>
                <TableCell>{b.category?.name}</TableCell>
                <TableCell>{b.format?.toUpperCase()}</TableCell>
                <TableCell>
                  <Chip size="small" label={b.status} color={STATUS_COLOR[b.status] || 'default'} />
                </TableCell>
                <TableCell align="right">
                  <IconButton component={RouterLink} to={`/author/books/${b._id}/edit`} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(b._id)} disabled={b.status === 'removed'}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  );
}
