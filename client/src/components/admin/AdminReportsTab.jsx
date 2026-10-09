import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { getReportsRequest, resolveReportRequest } from '../../api/adminApi';

export default function AdminReportsTab() {
  const [statusFilter, setStatusFilter] = useState('open');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setIsLoading(true);
    getReportsRequest({ status: statusFilter })
      .then((res) => setReports(res.data.data.reports))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load reports.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleResolve = async (id, removeContent) => {
    try {
      await resolveReportRequest(id, removeContent);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resolve report.');
    }
  };

  return (
    <Box>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={statusFilter}
        onChange={(_e, v) => v && setStatusFilter(v)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="open">Open</ToggleButton>
        <ToggleButton value="resolved">Resolved</ToggleButton>
      </ToggleButtonGroup>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : reports.length === 0 ? (
        <Typography color="text.secondary">No {statusFilter} reports.</Typography>
      ) : (
        <List>
          {reports.map((r) => (
            <ListItem key={r._id} divider alignItems="flex-start">
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={r.targetType} />
                    <Typography variant="body2" fontWeight={600}>
                      {r.targetType === 'book' ? r.target?.title : `Review: "${r.target?.comment?.slice(0, 40) || ''}"`}
                    </Typography>
                  </Stack>
                }
                secondary={
                  <>
                    <Typography variant="body2">{r.reason}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reported by {r.reporterId?.name} on {new Date(r.createdAt).toLocaleDateString()}
                    </Typography>
                  </>
                }
              />
              {statusFilter === 'open' && (
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => handleResolve(r._id, false)}>
                    Dismiss
                  </Button>
                  <Button size="small" color="error" variant="contained" onClick={() => handleResolve(r._id, true)}>
                    Remove content
                  </Button>
                </Stack>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
