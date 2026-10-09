import { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCategoriesRequest } from '../../api/categoryApi';
import { createCategoryRequest, deleteCategoryRequest } from '../../api/adminApi';

export default function AdminCategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setIsLoading(true);
    getCategoriesRequest()
      .then((res) => setCategories(res.data.data.categories))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load categories.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createCategoryRequest({ name });
      setName('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create category.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategoryRequest(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete category.');
    }
  };

  return (
    <Box>
      <Box component="form" onSubmit={handleCreate} mb={2}>
        <Stack direction="row" spacing={1}>
          <TextField size="small" label="New category name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" variant="contained" color="secondary" size="small">
            Add
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <List dense>
          {categories.map((c) => (
            <ListItem
              key={c._id}
              divider
              secondaryAction={
                <IconButton edge="end" size="small" onClick={() => handleDelete(c._id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText primary={c.name} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
