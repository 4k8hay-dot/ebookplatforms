import { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  MenuItem,
  Select,
  CircularProgress,
  Alert,
} from '@mui/material';
import { getUsersRequest, updateUserStatusRequest } from '../../api/adminApi';
import { useAuth } from '../../context/AuthContext';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const STATUS_COLOR = { active: 'success', restricted: 'warning', removed: 'default' };

export default function AdminUsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const debouncedSearch = useDebouncedValue(search, 400);

  const load = () => {
    setIsLoading(true);
    getUsersRequest({ q: debouncedSearch || undefined })
      .then((res) => setUsers(res.data.data.users))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [debouncedSearch]);

  const handleStatusChange = async (userId, status) => {
    try {
      await updateUserStatusRequest(userId, status);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status.');
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        label="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 400 }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u._id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip size="small" label={u.role} />
                </TableCell>
                <TableCell>
                  {u._id === currentUser._id ? (
                    <Chip size="small" label={u.status} color={STATUS_COLOR[u.status]} />
                  ) : (
                    <Select
                      size="small"
                      value={u.status}
                      onChange={(e) => handleStatusChange(u._id, e.target.value)}
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="restricted">Restricted</MenuItem>
                      <MenuItem value="removed">Removed</MenuItem>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
