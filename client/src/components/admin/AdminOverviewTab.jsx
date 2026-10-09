import { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { getAdminStatsRequest } from '../../api/adminApi';

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

export default function AdminOverviewTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getAdminStatsRequest()
      .then((res) => setStats(res.data.data))
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={6} sm={3}>
        <StatCard label="Total users" value={stats.totalUsers} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard label="Readers" value={stats.usersByRole.reader || 0} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard label="Authors" value={stats.usersByRole.author || 0} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard label="Admins" value={stats.usersByRole.admin || 0} />
      </Grid>

      <Grid item xs={6} sm={3}>
        <StatCard label="Total books" value={stats.totalBooks} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard label="Approved" value={stats.booksByStatus.approved || 0} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard label="Pending" value={stats.booksByStatus.pending || 0} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard label="Categories" value={stats.totalCategories} />
      </Grid>

      <Grid item xs={6} sm={3}>
        <StatCard label="Open reports" value={stats.openReports} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard label="Resolved reports" value={stats.resolvedReports} />
      </Grid>
    </Grid>
  );
}
