import { Card, CardActionArea, CardContent, CardMedia, Typography, Chip, Stack, Box, Rating } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { resolveFileUrl } from '../utils/fileUrl';

export default function BookCard({ book }) {
  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea component={RouterLink} to={`/books/${book._id}`} sx={{ flexGrow: 1, alignItems: 'stretch' }}>
        {book.coverUrl ? (
          <CardMedia component="img" height="220" image={resolveFileUrl(book.coverUrl)} alt={`${book.title} cover`} />
        ) : (
          <Box
            sx={{
              height: 220,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MenuBookIcon sx={{ fontSize: 48, opacity: 0.7 }} />
          </Box>
        )}
        <CardContent>
          <Typography variant="subtitle1" component="h3" noWrap title={book.title}>
            {book.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {book.authorId?.name || 'Unknown author'}
          </Typography>
          {book.ratingCount > 0 && (
            <Stack direction="row" spacing={0.5} alignItems="center" mt={0.25}>
              <Rating value={book.avgRating} precision={0.1} readOnly size="small" />
              <Typography variant="caption" color="text.secondary">
                ({book.ratingCount})
              </Typography>
            </Stack>
          )}
          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" useFlexGap>
            {book.category?.name && <Chip size="small" label={book.category.name} />}
            <Chip size="small" variant="outlined" label={book.format?.toUpperCase()} />
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
