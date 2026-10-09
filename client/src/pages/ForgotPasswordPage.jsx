import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Container, Link, Paper, TextField, Typography } from '@mui/material';
import { forgotPasswordRequest } from '../api/authApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevResetUrl('');
    setIsSubmitting(true);
    try {
      const res = await forgotPasswordRequest(email);
      setMessage(res.data.message);
      // Only present when the server has no email service configured AND
      // isn't running in production — see authController.forgotPassword.
      if (res.data.devResetUrl) setDevResetUrl(res.data.devResetUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper elevation={0} variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Forgot your password?
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Enter the email you registered with and we'll send you a link to reset it.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

        {devResetUrl && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Development mode: email sending isn't configured, so here's your reset link directly:
            <Box mt={1} sx={{ wordBreak: 'break-all' }}>
              <Link href={devResetUrl}>{devResetUrl}</Link>
            </Box>
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            required
            margin="normal"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button fullWidth type="submit" variant="contained" color="secondary" size="large" sx={{ mt: 2 }} disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </Box>

        <Typography variant="body2" mt={3}>
          Remembered it? <Link component={RouterLink} to="/login">Back to login</Link>
        </Typography>
      </Paper>
    </Container>
  );
}
