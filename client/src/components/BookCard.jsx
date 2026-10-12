import { Box, Typography, Chip, Stack, Rating } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { resolveFileUrl } from '../utils/fileUrl';

export default function BookCard({ book }) {
  return (
    <Box
      component={RouterLink}
      to={`/books/${book._id}`}
      sx={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        height: '100%',
        '&:hover .book-cover': { transform: 'scale(1.03)' },
      }}
    >
      {/* Cover: rounded image only, no card box */}
      <Box
        className="book-cover"
        sx={{
          aspectRatio: '2 / 3',
          borderRadius:3,
          overflow: 'hidden',
          bgcolor: 'action.hover',
          transition: 'transform 0.2s',
        }}
      >
        {book.coverUrl ? (
          <Box
            component="img"
            src={resolveFileUrl(book.coverUrl)}
            alt={`${book.title} cover`}
            sx={{ width: '100%', height: '100%', objectFill: 'contain', display: 'block' }}
          />
        ) : (
          
          <Box
            sx={{
              height: '100%',
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
      </Box>

      {/* Text sits directly under the cover, no box */}
      <Box sx={{ pt: 1.5 }}>
        <Typography variant="subtitle1" component="h3" fontWeight={700} noWrap title={book.title}>
          {book.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" fontWeight={600} noWrap>
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
      </Box>
    </Box>
  );
}