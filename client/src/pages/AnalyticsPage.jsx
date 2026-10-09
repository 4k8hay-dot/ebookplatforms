import { useEffect, useState } from 'react';
import { Container, Typography, Grid, Paper, Box, CircularProgress, Alert, Chip, Stack } from '@mui/material';
import { getReadingAnalyticsRequest, getTopicAnalyticsRequest } from '../api/analyticsApi';
import SimpleBarChart from '../components/SimpleBarChart';

function StatCard({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h4">{value}</Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

export default function AnalyticsPage() {
  const [reading, setReading] = useState(null);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getReadingAnalyticsRequest(), getTopicAnalyticsRequest()])
      .then(([readingRes, topicsRes]) => {
        setReading(readingRes.data.data);
        setTopics(topicsRes.data.data.topics);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load analytics.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        Reading analytics
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {reading && (
        <>
          <Grid container spacing={2} mb={4}>
            <Grid item xs={6} sm={3}>
              <StatCard label="Books started" value={reading.totalBooksStarted} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label="Books completed" value={reading.totalBooksCompleted} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label="In progress" value={reading.booksInProgress} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard label="Avg. progress" value={`${reading.averageProgress}%`} />
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              Activity over the last 14 days
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              Number of books with reading activity on each day.
            </Typography>
            <SimpleBarChart
              data={reading.activityOverTime.map((d) => ({ label: d.date.slice(5), value: d.count }))}
            />
          </Paper>
        </>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Frequently explored categories
        </Typography>
        {topics.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Start reading a few books to see your top categories here.
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {topics.map((t) => (
              <Chip key={t.categoryId} label={`${t.name} (${t.count})`} />
            ))}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
