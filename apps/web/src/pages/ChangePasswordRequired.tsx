import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { changePassword, setAuthTokens } from '../api/auth';
import { useAuth } from '../contexts/useAuth';

export default function ChangePasswordRequired() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setAuthTokens(tokens);
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setError(ax?.response?.data?.detail || t('changePasswordRequired.failedDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.100',
        py: 4,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 420, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <LanguageSwitcher />
        </Box>
        <Typography variant="h5" gutterBottom align="center">
          {t('changePasswordRequired.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          {t('changePasswordRequired.subtitle')}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('changePasswordRequired.currentPassword')}
            type={showCurrent ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowCurrent((v) => !v)} edge="end" aria-label="toggle password">
                    {showCurrent ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label={t('changePasswordRequired.newPassword')}
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            required
            helperText={t('changePasswordRequired.passwordHelp')}
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNew((v) => !v)} edge="end" aria-label="toggle password">
                    {showNew ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>
            {loading ? t('changePasswordRequired.saving') : t('changePasswordRequired.submit')}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
