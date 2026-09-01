import { alpha, createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#ec4899', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#6366f1', light: '#f472b6', dark: '#db2777' },
    background: {
      default: '#f8f9fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: '#e8ecf4',
    error: { main: '#ef4444' },
    success: { main: '#10b981' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: { fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 700, color: '#1e293b' },
    h5: { fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 700, color: '#1e293b' },
    h6: { fontFamily: 'Outfit, Inter, sans-serif', fontWeight: 600, color: '#1e293b' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: '0.01em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f8f9fc',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 3 },
        },
        '*': { scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #edf0f7',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(99,102,241,0.06), 0 1px 3px rgba(0,0,0,0.04)',
            borderColor: '#e0e4ef',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 11,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 20px',
          transition: 'all 0.2s ease',
        },
        contained: {
          backgroundColor: '#ec4899',
          color: '#ffffff',
          boxShadow: '0 1px 3px rgba(99,102,241,0.3)',
          '&:hover': {
            backgroundColor: '#4f46e5',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          },
        },
        outlined: {
          borderColor: '#e2e8f0',
          color: '#475569',
          '&:hover': {
            borderColor: '#ec4899',
            color: '#ec4899',
            backgroundColor: alpha('#ec4899', 0.04),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 11,
            backgroundColor: '#ffffff',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
            '&:hover fieldset': {
              borderColor: '#c7d2e0',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ec4899',
              borderWidth: 1.5,
              boxShadow: `0 0 0 3px ${alpha('#ec4899', 0.1)}`,
            },
          },
          '& .MuiInputLabel-root': {
            color: '#94a3b8',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#ec4899',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.85rem',
          minHeight: 44,
          color: '#94a3b8',
          '&.Mui-selected': {
            color: '#ec4899',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 2.5,
          backgroundColor: '#ec4899',
          borderRadius: 2,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontFamily: 'Outfit, Inter, sans-serif',
          fontWeight: 700,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#edf0f7',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 11,
        },
        standardError: {
          backgroundColor: '#fef2f2',
          border: '1px solid #fee2e2',
          color: '#b91c1c',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.15s ease',
        },
      },
    },
  },
});
