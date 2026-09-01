import { Box } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FeedPage } from './pages/FeedPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';

export default function App() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #f8f9fc 0%, #fce7f3 50%, #eef2ff 100%)',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Soft decorative shapes — global now */}
      <Box
        sx={{
          position: 'fixed',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)',
          top: '5%',
          right: '10%',
          animation: 'float 11s ease-in-out infinite',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          bottom: '10%',
          left: '5%',
          animation: 'float 13s ease-in-out infinite reverse',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
