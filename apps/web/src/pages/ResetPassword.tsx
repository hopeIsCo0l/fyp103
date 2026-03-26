import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import LanguageSwitcher from '../components/LanguageSwitcher';

import { resetPassword } from '../api/auth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      setMessage(res.message);
      setTimeout(() => navigate('/signin'), 1200);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setError(ax?.response?.data?.detail || t('resetPassword.failedDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 420, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <LanguageSwitcher />
        </Box>
        <Typography variant="h5" gutterBottom align="center">
          {t('resetPassword.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          {t('resetPassword.subtitle')}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('resetPassword.resetToken')}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label={t('resetPassword.newPassword')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            helperText={t('resetPassword.passwordHelp')}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
            {loading ? t('resetPassword.updating') : t('resetPassword.updatePassword')}
          </Button>
        </form>
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          <Link to="/signin">{t('common.backToSignIn')}</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
