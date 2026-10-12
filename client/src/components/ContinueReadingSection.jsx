import { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { listMyProgressRequest } from '../api/progressApi';
import { useAuth } from '../context/AuthContext';
import { resolveFileUrl } from '../utils/fileUrl';

export default function ContinueReadingSection() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    listMyProgressRequest()
      .then((res) => setItems(res.data.data.progress.filter((p) => p.bookId)))
      .catch(() => setItems([]));
  }, [user]);

  if (!user || items.length === 0) return null;

  return (
    <Box mb={4}>
      <Typography variant="h5" gutterBottom>
        Continue reading
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 180px)',   // cover width, change to resize
          gap: 3,
        }}
      >
        {items.slice(0, 6).map((p) => (
          <Box
            key={p._id}
            component={RouterLink}
            to={`/reader/${p.bookId._id}`}
            sx={{
              display: 'block',
              textDecoration: 'none',
              color: 'inherit',
              '&:hover .book-cover': { transform: 'scale(1.03)' },
            }}
          >
            {/* Whole cover */}
            <Box
              className="book-cover"
              sx={{
                aspectRatio: '2 / 3',
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'action.hover',
                transition: 'transform 0.2s',
              }}
            >
              {p.bookId.coverUrl ? (
                <Box
                  component="img"
                  src={resolveFileUrl(p.bookId.coverUrl)}
                  alt={`${p.bookId.title} cover`}
                  sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
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

            {/* Title and progress under the cover */}
            <Box sx={{ pt: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap title={p.bookId.title}>
                {p.bookId.title}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={p.progressPercentage || 0}
                sx={{ mt: 0.5, borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {p.progressPercentage || 0}% complete
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}