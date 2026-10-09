import { useState } from 'react';
import { Box, Rating, Typography, IconButton, Stack, Divider } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useAuth } from '../context/AuthContext';
import ReportDialog from './ReportDialog';

export default function ReviewList({ reviews, onDelete }) {
  const { user } = useAuth();
  const [reportingReviewId, setReportingReviewId] = useState(null);

  if (reviews.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No reviews yet — be the first to share your thoughts.
      </Typography>
    );
  }

  return (
    <>
      <Stack spacing={2} divider={<Divider />}>
        {reviews.map((r) => {
          const isOwn = user && r.userId?._id === user._id;
          return (
            <Box key={r._id}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="subtitle2">{r.userId?.name || 'A reader'}</Typography>
                  <Rating value={r.rating} readOnly size="small" />
                </Box>
                {isOwn ? (
                  <IconButton size="small" onClick={() => onDelete(r._id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                ) : (
                  user && (
                    <IconButton size="small" onClick={() => setReportingReviewId(r._id)} title="Report this review">
                      <FlagOutlinedIcon fontSize="small" />
                    </IconButton>
                  )
                )}
              </Stack>
              {r.comment && (
                <Typography variant="body2" mt={0.5}>
                  {r.comment}
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>

      <ReportDialog
        open={Boolean(reportingReviewId)}
        targetType="review"
        targetId={reportingReviewId}
        onClose={() => setReportingReviewId(null)}
      />
    </>
  );
}
