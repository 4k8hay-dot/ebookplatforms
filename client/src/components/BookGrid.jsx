import { Grid, Typography, Box } from '@mui/material';
import BookCard from './BookCard';

export default function BookGrid({ books, emptyMessage = 'No books found.' }) {
  if (!books || books.length === 0) {
    return (
      <Box textAlign="center" mt={6}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {books.map((book) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={book._id}>
          <BookCard book={book} />
        </Grid>
      ))}
    </Grid>
  );
}
