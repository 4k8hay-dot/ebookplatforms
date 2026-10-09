import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert } from '@mui/material';
import { createReportRequest } from '../api/reportApi';

export default function ReportDialog({ open, targetType, targetId, onClose }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleClose = () => {
    setReason('');
    setError('');
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please describe the issue.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await createReportRequest({ targetType, targetId, reason });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit the report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Report {targetType === 'book' ? 'this book' : 'this review'}</DialogTitle>
      <DialogContent>
        {submitted ? (
          <Alert severity="success">Thanks — an administrator will review this.</Alert>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={3}
              label="What's the issue?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{submitted ? 'Close' : 'Cancel'}</Button>
        {!submitted && (
          <Button variant="contained" color="secondary" onClick={handleSubmit} disabled={isSubmitting}>
            Submit report
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
