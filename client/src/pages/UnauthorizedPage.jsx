import { Container, Typography } from '@mui/material';

export default function UnauthorizedPage() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Not authorized
      </Typography>
      <Typography variant="body1" color="text.secondary">
        You don't have permission to view this page.
      </Typography>
    </Container>
  );
}
