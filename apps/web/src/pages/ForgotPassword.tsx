import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import LanguageSwitcher from '../components/LanguageSwitcher';

import { forgotPassword } from '../api/auth';
import { getApiErrorMessage } from '../utils/apiError';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, t('forgotPassword.failedDefault'), t('common.networkError')));
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
          {t('forgotPassword.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          {t('forgotPassword.subtitle')}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('common.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
            {loading ? t('forgotPassword.submitting') : t('forgotPassword.sendResetToken')}
          </Button>
        </form>
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          {t('common.backToSignIn').split('Sign in')[0]}
          <Link to="/signin">{t('common.signIn')}</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
