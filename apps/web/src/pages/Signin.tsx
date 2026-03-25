import { useState } from 'react';
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
import { signin, requestLoginOtp, verifyLoginOtp } from '../api/auth';

type LoginTab = 'password' | 'otp';

export default function Signin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<LoginTab>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { access_token } = await signin({ email, password });
      localStorage.setItem('token', access_token);
      navigate('/', { replace: true });
      window.location.reload();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Sign in failed'));
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
      setError(getErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { access_token } = await verifyLoginOtp(email, otp);
      localStorage.setItem('token', access_token);
      navigate('/', { replace: true });
      window.location.reload();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid or expired OTP'));
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
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          AI-Powered Recruitment System
        </Typography>

        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Password" value="password" />
          <Tab label="OTP by email" value="otp" />
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
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="current-password"
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        )}

        {tab === 'otp' && !otpSent && (
          <form onSubmit={handleRequestOtp}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              autoComplete="email"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        )}

        {tab === 'otp' && otpSent && (
          <form onSubmit={handleVerifyOtp}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Code sent to {email}
            </Typography>
            <TextField
              fullWidth
              label="Enter OTP"
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
              {loading ? 'Verifying...' : 'Verify & Sign in'}
            </Button>
            <Button fullWidth sx={{ mt: 1 }} onClick={() => setOtpSent(false)} size="small">
              Use different email
            </Button>
          </form>
        )}

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
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
    return 'Cannot connect to server. Is the backend running on port 8000?';
  }
  return fallback;
}
