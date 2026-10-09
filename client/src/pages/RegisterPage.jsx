import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
  Alert,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'reader' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleRoleChange = (_e, value) => {
    if (value) setForm({ ...form, role: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 6 }}>
      <Paper elevation={0} variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create your account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <GoogleSignInButton onSuccess={() => navigate('/', { replace: true })} />
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          Signing up with Google creates a Reader account. Want to join as an Author instead? Use the form below.
        </Typography>
        <Divider sx={{ my: 2 }}>or</Divider>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField fullWidth required margin="normal" label="Full name" name="name" value={form.name} onChange={handleChange} />
          <TextField
            fullWidth
            required
            margin="normal"
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            required
            margin="normal"
            label="Password"
            name="password"
            type="password"
            helperText="At least 8 characters, including a number"
            value={form.password}
            onChange={handleChange}
          />

          <Typography variant="body2" color="text.secondary" mt={2} mb={1}>
            I want to join as a:
          </Typography>
          <ToggleButtonGroup exclusive fullWidth value={form.role} onChange={handleRoleChange}>
            <ToggleButton value="reader">Reader</ToggleButton>
            <ToggleButton value="author">Author</ToggleButton>
          </ToggleButtonGroup>

          <Button fullWidth type="submit" variant="contained" color="secondary" size="large" sx={{ mt: 3 }} disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </Box>

        <Typography variant="body2" mt={3}>
          Already have an account? <Link component={RouterLink} to="/login">Log in</Link>
        </Typography>
      </Paper>
    </Container>
  );
}
