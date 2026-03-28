import { createTheme } from '@mui/material/styles';

/** Recruitment-focused palette: deep ocean + warm accent (distinct from default MUI blue). */
export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0d5c63',
      light: '#3d858c',
      dark: '#084046',
      contrastText: '#f8fafb',
    },
    secondary: {
      main: '#c45c26',
      light: '#e07a45',
      dark: '#8f3f18',
      contrastText: '#fff8f5',
    },
    background: {
      default: '#f0f4f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a2e33',
      secondary: '#4a6670',
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(13, 92, 99, 0.08), 0 4px 12px rgba(13, 92, 99, 0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, #0d5c63 0%, #127a84 100%)',
        },
      },
    },
  },
});
