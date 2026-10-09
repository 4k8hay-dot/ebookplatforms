import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Typography, CircularProgress, Box, Alert } from '@mui/material';
import BookForm from '../components/BookForm';
import { getCategoriesRequest } from '../api/categoryApi';
import { getMyBooksRequest, createBookRequest, updateBookRequest } from '../api/authorBookApi';

export default function BookFormPage() {
  const { id } = useParams(); // present only when editing
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [initialValues, setInitialValues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getCategoriesRequest(), isEditing ? getMyBooksRequest() : Promise.resolve(null)])
      .then(([categoriesRes, myBooksRes]) => {
        setCategories(categoriesRes.data.data.categories);
        if (isEditing) {
          const found = myBooksRes.data.data.books.find((b) => b._id === id);
          if (!found) throw new Error('not-found');
          setInitialValues(found);
        }
      })
      .catch(() => setError('Could not load the data needed for this form.'))
      .finally(() => setIsLoading(false));
  }, [id, isEditing]);

  const handleSubmit = async (fields, files) => {
    if (isEditing) {
      await updateBookRequest(id, fields, files);
    } else {
      await createBookRequest(fields, files);
    }
    navigate('/author/dashboard');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 5, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        {isEditing ? 'Edit book' : 'Upload a new book'}
      </Typography>

      {!isEditing && (
        <Typography variant="body2" color="text.secondary" mb={3}>
          New books are reviewed by an administrator before they appear in the public catalog.
        </Typography>
      )}

      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <BookForm
          categories={categories}
          initialValues={initialValues}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          submitLabel={isEditing ? 'Save changes' : 'Upload book'}
        />
      )}
    </Container>
  );
}
