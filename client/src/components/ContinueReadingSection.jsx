import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardActionArea, CardContent, LinearProgress, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { listMyProgressRequest } from '../api/progressApi';
import { useAuth } from '../context/AuthContext';

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
      <Grid container spacing={2}>
        {items.slice(0, 4).map((p) => (
          <Grid item xs={12} sm={6} md={3} key={p._id}>
            <Card variant="outlined">
              <CardActionArea component={RouterLink} to={`/reader/${p.bookId._id}`}>
                <CardContent>
                  <Typography variant="subtitle2" noWrap title={p.bookId.title}>
                    {p.bookId.title}
                  </Typography>
                  <Box mt={1}>
                    <LinearProgress variant="determinate" value={p.progressPercentage || 0} />
                    <Typography variant="caption" color="text.secondary">
                      {p.progressPercentage || 0}% complete
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
