import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { AppBar, Avatar, Box, Button, Toolbar, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: alpha('#ffffff', 0.85),
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #edf0f7',
      }}
    >
      <Toolbar sx={{ maxWidth: 640, width: '100%', mx: 'auto', py: 0.5 }}>
        <Typography
          component={RouterLink}
          to="/"
          variant="h6"
          sx={{
            flexGrow: 1,
            fontFamily: 'Outfit, Inter, sans-serif',
            fontWeight: 700,
            fontSize: '1.3rem',
            textDecoration: 'none',
            color: '#ec4899',
            letterSpacing: '-0.02em',
          }}
        >
          SocialPage
        </Typography>
        {user && (
          <Box
            component={RouterLink}
            to="/profile"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: 13,
                bgcolor: '#fce7f3',
                color: '#ec4899',
              }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </Avatar>
            <Typography
              variant="body2"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontWeight: 500,
                color: '#475569',
                fontSize: '0.85rem',
              }}
            >
              {user.username}
            </Typography>
          </Box>
        )}
        {user && (
          <Button
            size="small"
            onClick={logout}
            startIcon={<LogoutRoundedIcon sx={{ fontSize: '16px !important' }} />}
            sx={{
              ml: 1.5,
              color: '#94a3b8',
              fontSize: '0.8rem',
              '&:hover': {
                color: '#ef4444',
                backgroundColor: '#fef2f2',
              },
            }}
          >
            Logout
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
