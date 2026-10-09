import { Grid, MenuItem, TextField, Paper } from '@mui/material';

const FORMATS = [
  { value: '', label: 'All formats' },
  { value: 'pdf', label: 'PDF' },
  { value: 'epub', label: 'EPUB' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title_asc', label: 'Title (A–Z)' },
  { value: 'title_desc', label: 'Title (Z–A)' },
  { value: 'rating', label: 'Highest rated' },
];

export default function FilterPanel({ categories, filters, onChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2}>
          <TextField select fullWidth size="small" label="Category" value={filters.category} onChange={set('category')}>
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField select fullWidth size="small" label="Format" value={filters.format} onChange={set('format')}>
            {FORMATS.map((f) => (
              <MenuItem key={f.value} value={f.value}>
                {f.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField fullWidth size="small" label="Language" value={filters.language} onChange={set('language')} placeholder="e.g. English" />
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="From year"
            value={filters.fromYear}
            onChange={set('fromYear')}
          />
        </Grid>

        <Grid item xs={6} sm={3} md={2}>
          <TextField fullWidth size="small" type="number" label="To year" value={filters.toYear} onChange={set('toYear')} />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField select fullWidth size="small" label="Sort by" value={filters.sort} onChange={set('sort')}>
            {SORT_OPTIONS.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Paper>
  );
}
