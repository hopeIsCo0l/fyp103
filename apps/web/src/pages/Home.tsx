import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from '@mui/material';
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
        bgcolor: 'background.default',
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(13, 92, 99, 0.16), transparent 55%)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 2, md: 5 },
          py: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t('common.appName')}
        </Typography>
        <LanguageSwitcher />
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 9 } }}>
        <Stack spacing={5}>
          <Stack spacing={2.5} sx={{ maxWidth: 720 }}>
            <Typography variant="overline" sx={{ letterSpacing: 1.2, color: 'primary.main', fontWeight: 700 }}>
              {t('home.eyebrow')}
            </Typography>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 900,
                lineHeight: 1.1,
                fontSize: { xs: '2rem', sm: '2.7rem', md: '3.2rem' },
              }}
            >
              {t('home.guestHeading')}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.1rem' }, maxWidth: 640 }}>
              {t('home.guestSubtext')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
              <Button variant="contained" size="large" onClick={() => navigate('/signup')}>
                {t('home.primaryCta')}
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/signin')}>
                {t('common.signIn')}
              </Button>
              <Button color="inherit" size="large" onClick={() => navigate('/forgot-password')}>
                {t('signin.forgotPassword')}
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('home.valueFast')}
                </Typography>
                <Typography color="text.secondary">{t('home.valueFastDesc')}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('home.valueTransparent')}
                </Typography>
                <Typography color="text.secondary">{t('home.valueTransparentDesc')}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  {t('home.valueCollaborative')}
                </Typography>
                <Typography color="text.secondary">{t('home.valueCollaborativeDesc')}</Typography>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
