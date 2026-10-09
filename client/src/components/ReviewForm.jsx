import { useState } from 'react';
import { Box, Rating, TextField, Button, Typography, Alert } from '@mui/material';
import { upsertReviewRequest } from '../api/reviewApi';

export default function ReviewForm({ bookId, existingReview, onSaved }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please choose a star rating.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const res = await upsertReviewRequest(bookId, { rating, comment });
      onSaved(res.data.data.review);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your review.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="subtitle2" gutterBottom>
        {existingReview ? 'Update your review' : 'Leave a review'}
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Rating value={rating} onChange={(_e, v) => setRating(v)} />
      <TextField
        fullWidth
        multiline
        minRows={2}
        placeholder="Optional comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ mt: 1, mb: 1 }}
      />
      <Button type="submit" variant="contained" color="secondary" size="small" disabled={isSaving}>
        {isSaving ? 'Saving…' : existingReview ? 'Update review' : 'Submit review'}
      </Button>
    </Box>
  );
}
