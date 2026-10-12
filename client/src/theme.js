import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#121212', paper: '#1e1e1e' },
    primary: { main: '#e0481f' },        // the orange accent
    text: { primary: '#ffffff', secondary: '#b0b0b0' },
  },
  shape: { borderRadius: 16 },           // rounded everything
  typography: { fontFamily: '"Inter", "Roboto", sans-serif', button: { textTransform: 'none', fontWeight: 700 } },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 999 } } },   // pill buttons
    MuiChip:   { styleOverrides: { root: { borderRadius: 999, fontWeight: 700 } } },
  },
});
export default theme;