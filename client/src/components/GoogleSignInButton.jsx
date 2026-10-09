import { useEffect, useRef, useState } from 'react';
import { Box, Alert } from '@mui/material';
import { googleLoginRequest } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Renders Google's own "Sign in with Google" button via the Google
 * Identity Services script tag (loaded in index.html). On success it
 * sends the resulting ID token to our backend, which verifies it and
 * returns our own session — from that point on this account behaves
 * exactly like any other in the app.
 */
export default function GoogleSignInButton({ onSuccess }) {
  const { setUser } = useAuth();
  const buttonRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return; // silently no-op if not configured — see the Alert below
    if (!window.google?.accounts?.id) return; // script hasn't loaded yet

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setError('');
        try {
          const res = await googleLoginRequest(response.credential);
          setUser(res.data.data.user);
          onSuccess?.(res.data.data.user);
        } catch (err) {
          setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320,
    });
  }, [setUser, onSuccess]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Google Sign-In isn't configured yet. Set VITE_GOOGLE_CLIENT_ID in client/.env and GOOGLE_CLIENT_ID in
        server/.env to enable it.
      </Alert>
    );
  }

  return (
    <Box mb={2}>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <div ref={buttonRef} />
    </Box>
  );
}
