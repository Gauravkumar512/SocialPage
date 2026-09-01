import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Alert, Box, Button, Container, Link, Paper, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { Navigate, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login({ email, password });
    setSubmitting(false);
    if (result.ok) {
      navigate('/', { replace: true });
    } else {
      setError(result.message ?? 'Login failed');
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          className="animate-fade-in-up"
          sx={{
            p: 4,
            backgroundColor: '#ffffff',
            border: '1px solid #edf0f7',
            borderRadius: 4,
            boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          {/* Icon */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fce7f3',
              }}
            >
              <LockOutlinedIcon sx={{ color: '#ec4899', fontSize: 24 }} />
            </Box>
          </Box>

          <Typography variant="h5" sx={{ textAlign: 'center', mb: 0.5, color: '#1e293b', fontWeight: 700 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: '#94a3b8' }}>
            Log in to see what everyone's posting.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ mt: 1, py: 1.3 }}>
              {submitting ? 'Logging in…' : 'Log in'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: '#94a3b8' }}>
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/register"
              sx={{
                color: '#ec4899',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Sign up
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
