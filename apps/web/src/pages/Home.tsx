import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../contexts/useAuth';

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography>{t('common.loading')}</Typography>
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
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <LanguageSwitcher />
        </Box>
        <Typography variant="h4">{t('home.guestHeading')}</Typography>
        <Typography color="text.secondary">{t('home.guestSubtext')}</Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button variant="contained" onClick={() => navigate('/signin')}>
            {t('common.signIn')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/signup')}>
            {t('common.signUp')}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5">
          {t('home.welcome', { name: user.full_name })}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <LanguageSwitcher />
          <Button variant="outlined" onClick={logout}>
            {t('common.signOut')}
          </Button>
        </Box>
      </Box>
      <Typography color="text.secondary">
        {t('home.signedInAs', { email: user.email, role: user.role })}
      </Typography>
      {user.role === 'admin' && (
        <Button
          variant="contained"
          color="secondary"
          sx={{ mt: 3 }}
          onClick={() => navigate('/admin')}
        >
          {t('admin.goToDashboard')}
        </Button>
      )}
    </Box>
  );
}
