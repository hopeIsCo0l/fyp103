import { Box, Button, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', py: 4 }}>
      <Paper elevation={2} sx={{ p: 4, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          {t('unauthorized.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t('unauthorized.message')}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          {t('common.backToHome')}
        </Button>
      </Paper>
    </Box>
  );
}
