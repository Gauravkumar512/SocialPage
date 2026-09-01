import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

const styles = {
  '@keyframes fadeInUp': {
    from: { opacity: 0, transform: 'translateY(14px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
    '50%': { transform: 'translateY(-12px) rotate(2deg)' },
  },
  '.animate-fade-in-up': {
    animation: 'fadeInUp 0.4s cubic-bezier(.4,0,.2,1) forwards',
    opacity: 0,
  },
  '.animate-fade-in': {
    animation: 'fadeIn 0.3s ease forwards',
    opacity: 0,
  },
} as const;

export function GlobalStyles() {
  return <MuiGlobalStyles styles={styles} />;
}
