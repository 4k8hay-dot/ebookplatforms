import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  Link,
  Divider,
  Button,
  LinearProgress,
  Rating,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import { getBookByIdRequest } from '../api/bookApi';
import { getBookshelfRequest, addToBookshelfRequest, removeFromBookshelfRequest } from '../api/bookshelfApi';
import { getProgressRequest } from '../api/progressApi';
import { getReviewsForBookRequest, deleteReviewRequest } from '../api/reviewApi';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import ReportDialog from '../components/ReportDialog';
import { useAuth } from '../context/AuthContext';
import { resolveFileUrl } from '../utils/fileUrl';

export default function BookDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOnShelf, setIsOnShelf] = useState(false);
  const [progress, setProgress] = useState(null);
  const [isShelfBusy, setIsShelfBusy] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const loadReviews = () => {
    getReviewsForBookRequest(id)
      .then((res) => setReviews(res.data.data.reviews))
      .catch(() => {});
  };

  useEffect(() => {
    setIsLoading(true);
    setError('');
    getBookByIdRequest(id)
      .then((res) => setBook(res.data.data.book))
      .catch((err) => setError(err.response?.data?.message || 'Book not found.'))
      .finally(() => setIsLoading(false));
    loadReviews();
  }, [id]);

  useEffect(() => {
    if (!user) return;
    getBookshelfRequest()
      .then((res) => setIsOnShelf(res.data.data.items.some((item) => item.book._id === id)))
      .catch(() => {});
    getProgressRequest(id)
      .then((res) => setProgress(res.data.data.progress))
      .catch(() => {});
  }, [id, user]);

  const handleToggleShelf = async () => {
    setIsShelfBusy(true);
    try {
      if (isOnShelf) {
        await removeFromBookshelfRequest(id);
        setIsOnShelf(false);
      } else {
        await addToBookshelfRequest(id);
        setIsOnShelf(true);
      }
    } catch {
      /* surface nothing disruptive here — the button simply won't toggle */
    } finally {
      setIsShelfBusy(false);
    }
  };

  const handleReviewSaved = () => {
    loadReviews();
    // The average shown at the top of the page is denormalized on the
    // Book document, so refresh it too.
    getBookByIdRequest(id).then((res) => setBook(res.data.data.book));
  };

  const handleReviewDelete = async (reviewId) => {
    try {
      await deleteReviewRequest(reviewId);
      handleReviewSaved();
    } catch {
      /* the list simply won't update if this fails */
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">{error}</Alert>
        <Link component={RouterLink} to="/" sx={{ mt: 2, display: 'inline-block' }}>
          ← Back to catalog
        </Link>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 8 }}>
      <Link component={RouterLink} to="/" underline="hover">
        ← Back to catalog
      </Link>

      <Paper variant="outlined" sx={{ p: 4, mt: 2 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            {book.coverUrl ? (
              <Box component="img" src={resolveFileUrl(book.coverUrl)} alt={`${book.title} cover`} sx={{ width: '100%', borderRadius: 1 }} />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '2/3',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                }}
              >
                <MenuBookIcon sx={{ fontSize: 64, opacity: 0.7 }} />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} sm={8}>
            <Typography variant="h4" gutterBottom>
              {book.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              by {book.authorId?.name || 'Unknown author'}
            </Typography>

            {book.ratingCount > 0 && (
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Rating value={book.avgRating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  {book.avgRating.toFixed(1)} ({book.ratingCount} review{book.ratingCount === 1 ? '' : 's'})
                </Typography>
              </Stack>
            )}

            <Stack direction="row" spacing={1} my={2} flexWrap="wrap" useFlexGap>
              {book.category?.name && <Chip label={book.category.name} />}
              <Chip variant="outlined" label={book.format?.toUpperCase()} />
              {book.language && <Chip variant="outlined" label={book.language} />}
              {book.publicationInfo?.year && <Chip variant="outlined" label={book.publicationInfo.year} />}
            </Stack>

            <Typography variant="body1" paragraph>
              {book.description || 'No description provided.'}
            </Typography>

            {book.publicationInfo?.publisher && (
              <Typography variant="body2" color="text.secondary">
                Publisher: {book.publicationInfo.publisher}
              </Typography>
            )}

            <Box mt={3}>
              {user ? (
                <Stack spacing={2} alignItems="flex-start">
                  {progress && (
                    <Box sx={{ width: '100%', maxWidth: 300 }}>
                      <LinearProgress variant="determinate" value={progress.progressPercentage || 0} />
                      <Typography variant="caption" color="text.secondary">
                        {progress.progressPercentage || 0}% complete
                      </Typography>
                    </Box>
                  )}
                  <Stack direction="row" spacing={1.5}>
                    <Button component={RouterLink} to={`/reader/${book._id}`} variant="contained" color="secondary" size="large">
                      {progress ? 'Continue reading' : 'Read this book'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handleToggleShelf}
                      disabled={isShelfBusy}
                      startIcon={isOnShelf ? <BookmarkAddedIcon /> : <BookmarkAddOutlinedIcon />}
                    >
                      {isOnShelf ? 'On your bookshelf' : 'Add to bookshelf'}
                    </Button>
                  </Stack>
                  <Button size="small" color="inherit" onClick={() => setIsReportOpen(true)} sx={{ color: 'text.secondary' }}>
                    Report this book
                  </Button>
                </Stack>
              ) : (
                <Alert severity="info">
                  <Link component={RouterLink} to="/login">Log in</Link> to read this book or save it to your bookshelf.
                </Alert>
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Reviews
        </Typography>

        {user ? (
          <Box mb={3}>
            <ReviewForm
              bookId={id}
              existingReview={reviews.find((r) => r.userId?._id === user._id)}
              onSaved={handleReviewSaved}
            />
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Link component={RouterLink} to="/login">Log in</Link> to leave a review.
          </Alert>
        )}

        <ReviewList reviews={reviews} onDelete={handleReviewDelete} />
      </Paper>

      <ReportDialog open={isReportOpen} targetType="book" targetId={id} onClose={() => setIsReportOpen(false)} />
    </Container>
  );
}
