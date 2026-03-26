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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { resendOtp, setAuthTokens, signup, verifyEmail } from '../api/auth';

export default function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('candidate');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup({ email, password, full_name: fullName, role });
      setStep('otp');
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('signup.failedDefault')));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokens = await verifyEmail(email, otp);
      setAuthTokens(tokens);
      navigate('/', { replace: true });
      window.location.reload();
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('signup.failedOtpVerify')));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
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
          <Typography variant="h5" gutterBottom align="center">
            {t('signup.verifyTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            {t('signup.otpSentTo', { email })}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleVerifyOtp}>
            <TextField
              fullWidth
              label={t('signup.enterOtp')}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputProps={{ maxLength: 6, inputMode: 'numeric' }}
              required
              margin="normal"
              autoFocus
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading || otp.length < 4}
            >
              {loading ? t('signup.verifying') : t('signup.verify')}
            </Button>
          </form>
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexDirection: 'column' }}>
            <ResendOtpButton email={email} />
            <Button fullWidth onClick={() => setStep('form')} size="small">
              {t('signup.backToSignUp')}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

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
          {t('signup.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          {t('common.appName')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSignup}>
          <TextField
            fullWidth
            label={t('signup.fullName')}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            margin="normal"
            autoComplete="name"
          />
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
            helperText={t('signup.passwordHelp')}
            autoComplete="new-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('signup.roleLabel')}</InputLabel>
            <Select
              value={role}
              label={t('signup.roleLabel')}
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="candidate">{t('signup.roleCandidate')}</MenuItem>
              <MenuItem value="recruiter">{t('signup.roleRecruiter')}</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? t('signup.sendingOtp') : t('common.signUp')}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          {t('signup.hasAccount')} <Link to="/signin">{t('common.signIn')}</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

function ResendOtpButton({ email }: { email: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      await resendOtp(email);
      setCooldown(60);
      const i = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) clearInterval(i);
          return c - 1;
        });
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button fullWidth onClick={handleResend} size="small" disabled={loading || cooldown > 0}>
      {cooldown > 0
        ? t('signup.resendIn', { seconds: cooldown })
        : loading
          ? t('signup.sending')
          : t('signup.resendOtp')}
    </Button>
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
