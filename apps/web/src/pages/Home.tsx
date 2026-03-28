import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../contexts/useAuth';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 2,
        bgcolor: 'background.default',
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(13, 92, 99, 0.12), transparent 55%)',
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <LanguageSwitcher />
      </Box>
      <Typography variant="h3" component="h1" align="center" sx={{ fontWeight: 800, maxWidth: 520 }}>
        {t('home.guestHeading')}
      </Typography>
      <Typography color="text.secondary" align="center" sx={{ maxWidth: 440 }}>
        {t('home.guestSubtext')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="contained" size="large" onClick={() => navigate('/signin')}>
          {t('common.signIn')}
        </Button>
        <Button variant="outlined" size="large" onClick={() => navigate('/signup')}>
          {t('common.signUp')}
        </Button>
      </Box>
      <Button color="inherit" size="small" sx={{ mt: 4 }} onClick={() => navigate('/forgot-password')}>
        {t('signin.forgotPassword')}
      </Button>
    </Box>
  );
}
