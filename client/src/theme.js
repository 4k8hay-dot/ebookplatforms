import { createTheme } from '@mui/material/styles';

// A quiet, paper-and-ink palette suited to a reading/knowledge app rather
// than a generic SaaS dashboard: deep ink-navy for structure and text,
// a muted brass accent for actions, warm (not stark-white) page background.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1B2A3C', // ink navy
      light: '#33455C',
      dark: '#0F1826',
      contrastText: '#F7F4EE',
    },
    secondary: {
      main: '#A9812F', // muted brass — used sparingly for key actions
      contrastText: '#1B2A3C',
    },
    background: {
      default: '#F7F4EE', // warm paper
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1B2430',
      secondary: '#5B6472',
    },
  },
  typography: {
    fontFamily: '"Source Sans Pro", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Source Serif Pro", Georgia, serif', fontWeight: 600 },
    h2: { fontFamily: '"Source Serif Pro", Georgia, serif', fontWeight: 600 },
    h3: { fontFamily: '"Source Serif Pro", Georgia, serif', fontWeight: 600 },
    h4: { fontFamily: '"Source Serif Pro", Georgia, serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 6 },
});

export default theme;
