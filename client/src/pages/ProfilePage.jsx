import { useRef, useState } from 'react';
import { Avatar, Box, Button, Container, Paper, TextField, Typography, Alert, Stack } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { updateMyAvatarRequest, updateMyProfileRequest } from '../api/userApi';
import { resolveFileUrl } from '../utils/fileUrl';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ name: user?.name || '', authorBio: user?.authorBio || '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsSaving(true);
    try {
      const res = await updateMyProfileRequest(form);
      setUser(res.data.data.user);
      setMessage({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await updateMyAvatarRequest(file);
      setUser(res.data.data.user);
      setMessage({ type: 'success', text: 'Profile image updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Image upload failed.' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  if (!user) return null;

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={0} variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Your profile
        </Typography>

        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
          <Avatar
            src={resolveFileUrl(user.profileImage)}
            sx={{ width: 72, height: 72 }}
          >
            {user.name?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Button variant="outlined" size="small" onClick={handleAvatarClick} disabled={isUploading}>
              {isUploading ? 'Uploading…' : 'Change photo'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleAvatarChange}
            />
            <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
              JPEG, PNG or WEBP, up to 2MB
            </Typography>
          </Box>
        </Stack>

        <Box component="form" onSubmit={handleSave}>
          <TextField fullWidth margin="normal" label="Full name" name="name" value={form.name} onChange={handleChange} />
          <TextField fullWidth margin="normal" label="Email" value={user.email} disabled helperText="Email cannot be changed" />

          {user.role === 'author' && (
            <TextField
              fullWidth
              margin="normal"
              label="Author bio"
              name="authorBio"
              multiline
              minRows={3}
              value={form.authorBio}
              onChange={handleChange}
            />
          )}

          <Button type="submit" variant="contained" color="secondary" sx={{ mt: 2 }} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
