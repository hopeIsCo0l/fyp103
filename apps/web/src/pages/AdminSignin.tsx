import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { clearAuthTokens, getMe, requestLoginOtp, setAuthTokens, signin, verifyLoginOtp } from '../api/auth';

type LoginTab = 'password' | 'otp';

export default function AdminSignin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState<LoginTab>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ensureAdminThenGo = async () => {
    const me = await getMe();
    if (me.must_change_password) {
      navigate('/change-password', { replace: true });
      window.location.reload();
      return;
    }
    if (me.role !== 'admin') {
      clearAuthTokens();
      setError(t('admin.signin.notAdmin'));
      return;
    }
    navigate('/admin', { replace: true });
    window.location.reload();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await signin({ email, password });
      setAuthTokens(tokens);
      await ensureAdminThenGo();
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('signin.failedDefault')));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestLoginOtp(email);
      setOtpSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('signin.failedOtpSend')));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await verifyLoginOtp(email, otp);
      setAuthTokens(tokens);
      await ensureAdminThenGo();
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('signin.failedOtpVerify')));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, v: LoginTab) => {
    setTab(v);
    setError('');
    setOtpSent(false);
    setOtp('');
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
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <LanguageSwitcher />
        </Box>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {t('admin.signin.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          {t('admin.signin.subtitle')}
        </Typography>

        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label={t('signin.passwordTab')} value="password" />
          <Tab label={t('signin.otpTab')} value="otp" />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit}>
            <TextField
              fullWidth
              label={t('common.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              autoComplete="email"
            />
            <TextField
              fullWidth
              label={t('common.password')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={loading}>
              {loading ? t('signin.signingIn') : t('admin.signin.submit')}
            </Button>
          </form>
        )}

        {tab === 'otp' && !otpSent && (
          <form onSubmit={handleRequestOtp}>
            <TextField
              fullWidth
              label={t('common.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              autoComplete="email"
            />
            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={loading}>
              {loading ? t('signin.sendingOtp') : t('signin.sendOtp')}
            </Button>
          </form>
        )}

        {tab === 'otp' && otpSent && (
          <form onSubmit={handleVerifyOtp}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('signin.codeSentTo', { email })}
            </Typography>
            <TextField
              fullWidth
              label={t('signin.enterOtp')}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputProps={{ maxLength: 6, inputMode: 'numeric' }}
              required
              margin="normal"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
              disabled={loading || otp.length < 4}
            >
              {loading ? t('signin.verifying') : t('signin.verifyAndSignIn')}
            </Button>
            <Button fullWidth sx={{ mt: 1 }} onClick={() => setOtpSent(false)} size="small">
              {t('signin.useDifferentEmail')}
            </Button>
          </form>
        )}

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          <Link to="/signin">{t('admin.signin.backToSignIn')}</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

function getErrorMessage(err: unknown, fallback: string): string {
  const ax = err as {
    response?: { data?: { detail?: string | string[] } };
    code?: string;
    message?: string;
  };
  if (ax?.response?.data?.detail) {
    const d = ax.response.data.detail;
    return Array.isArray(d)
      ? (d as { msg?: string }[]).map((x) => x.msg || x).join(', ')
      : String(d);
  }
  if (ax?.code === 'ERR_NETWORK' || ax?.message?.includes('Network Error')) {
    return fallback;
  }
  return fallback;
}
