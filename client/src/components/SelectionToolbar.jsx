import { useState } from 'react';
import { Paper, Typography, Button, Stack, ButtonBase } from '@mui/material';
import HighlightIcon from '@mui/icons-material/Highlight';

const COLORS = ['#FFF176', '#AED581', '#81D4FA', '#F48FB1'];

export default function SelectionToolbar({ selection, onSave, onDismiss }) {
  const [color, setColor] = useState(COLORS[0]);

  if (!selection?.text) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
      <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
        Selected: "{selection.text.slice(0, 120)}
        {selection.text.length > 120 ? '…' : ''}"
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        {COLORS.map((c) => (
          <ButtonBase
            key={c}
            onClick={() => setColor(c)}
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              bgcolor: c,
              border: color === c ? '2px solid black' : '2px solid transparent',
            }}
          />
        ))}
        <Button size="small" variant="contained" color="secondary" startIcon={<HighlightIcon />} onClick={() => onSave(color)}>
          Save highlight
        </Button>
        <Button size="small" onClick={onDismiss}>
          Dismiss
        </Button>
      </Stack>
    </Paper>
  );
}
