import { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Alert,
} from '@mui/material';

const FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'epub', label: 'EPUB' },
];

/**
 * Shared by BookFormPage for both create and edit. On create, an eBook
 * file is required and format is selectable; on edit, format is fixed
 * (see updateBookValidator comment on the server for why) and the file
 * inputs are optional "replace" actions.
 */
export default function BookForm({ categories, initialValues, isEditing, onSubmit, submitLabel }) {
  const [fields, setFields] = useState({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    category: initialValues?.category?._id || initialValues?.category || '',
    format: initialValues?.format || 'pdf',
    language: initialValues?.language || 'English',
    publisher: initialValues?.publicationInfo?.publisher || '',
    year: initialValues?.publicationInfo?.year || '',
  });
  const [cover, setCover] = useState(null);
  const [ebookFile, setEbookFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => setFields({ ...fields, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isEditing && !ebookFile) {
      setError('Please attach the eBook file.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(fields, { cover, ebookFile });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth required label="Title" name="title" value={fields.title} onChange={handleChange} />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Description"
            name="description"
            value={fields.description}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField select fullWidth required label="Category" name="category" value={fields.category} onChange={handleChange}>
            {categories.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            required
            label="Format"
            name="format"
            value={fields.format}
            onChange={handleChange}
            disabled={isEditing}
            helperText={isEditing ? 'Format cannot be changed after upload' : undefined}
          >
            {FORMATS.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Language" name="language" value={fields.language} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={5}>
          <TextField fullWidth label="Publisher" name="publisher" value={fields.publisher} onChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth type="number" label="Year" name="year" value={fields.year} onChange={handleChange} />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="body2" mb={0.5}>
            Cover image {isEditing && '(leave empty to keep current)'}
          </Typography>
          <Button variant="outlined" component="label" fullWidth>
            {cover ? cover.name : 'Choose cover image'}
            <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => setCover(e.target.files?.[0] || null)} />
          </Button>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography variant="body2" mb={0.5}>
            eBook file {isEditing ? '(leave empty to keep current)' : '*'}
          </Typography>
          <Button variant="outlined" component="label" fullWidth>
            {ebookFile ? ebookFile.name : 'Choose eBook file'}
            <input
              type="file"
              hidden
              accept="application/pdf,application/epub+zip"
              onChange={(e) => setEbookFile(e.target.files?.[0] || null)}
            />
          </Button>
        </Grid>
      </Grid>

      <Button type="submit" variant="contained" color="secondary" size="large" sx={{ mt: 3 }} disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </Box>
  );
}
