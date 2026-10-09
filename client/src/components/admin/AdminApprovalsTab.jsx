import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Box,
  Link,
} from '@mui/material';
import { getPendingBooksRequest, approveBookRequest, rejectBookRequest } from '../../api/adminApi';

export default function AdminApprovalsTab() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const load = () => {
    setIsLoading(true);
    getPendingBooksRequest()
      .then((res) => setBooks(res.data.data.books))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load pending books.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleDecision = async (id, action) => {
    setActioningId(id);
    try {
      if (action === 'approve') await approveBookRequest(id);
      else await rejectBookRequest(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActioningId(null);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {books.length === 0 ? (
        <Typography color="text.secondary">Nothing pending review.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {books.map((b) => (
              <TableRow key={b._id}>
                <TableCell>
                  <Link component={RouterLink} to={`/books/${b._id}`}>
                    {b.title}
                  </Link>
                </TableCell>
                <TableCell>{b.authorId?.name}</TableCell>
                <TableCell>{b.category?.name}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      disabled={actioningId === b._id}
                      onClick={() => handleDecision(b._id, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={actioningId === b._id}
                      onClick={() => handleDecision(b._id, 'reject')}
                    >
                      Reject
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
