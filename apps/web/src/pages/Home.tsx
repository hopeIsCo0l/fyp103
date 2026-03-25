import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          bgcolor: 'grey.100',
        }}
      >
        <Typography variant="h4">AI-Powered Recruitment System</Typography>
        <Typography color="text.secondary">
          Sign in or create an account to get started
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/signin')}>
            Sign in
          </Button>
          <Button variant="outlined" onClick={() => navigate('/signup')}>
            Sign up
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5">
          Welcome, {user.full_name}
        </Typography>
        <Button variant="outlined" onClick={logout}>
          Sign out
        </Button>
      </Box>
      <Typography color="text.secondary">
        Signed in as {user.email} ({user.role})
      </Typography>
    </Box>
  );
}
