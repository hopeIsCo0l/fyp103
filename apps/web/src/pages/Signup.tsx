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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { signup, verifyEmail, resendOtp } from '../api/auth';

export default function Signup() {
  const navigate = useNavigate();
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
      setError(getErrorMessage(err, 'Sign up failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { access_token } = await verifyEmail(email, otp);
      localStorage.setItem('token', access_token);
      navigate('/', { replace: true });
      window.location.reload();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid or expired OTP'));
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
            Verify your email
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            We sent a 6-digit code to {email}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleVerifyOtp}>
            <TextField
              fullWidth
              label="Enter OTP"
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
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexDirection: 'column' }}>
            <ResendOtpButton email={email} />
            <Button fullWidth onClick={() => setStep('form')} size="small">
              Back to sign up
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
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Sign up
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          AI-Powered Recruitment System
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSignup}>
          <TextField
            fullWidth
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            margin="normal"
            autoComplete="name"
          />
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
            helperText="At least 8 characters"
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
            <InputLabel>I am a</InputLabel>
            <Select
              value={role}
              label="I am a"
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="candidate">Candidate</MenuItem>
              <MenuItem value="recruiter">Recruiter</MenuItem>
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
            {loading ? 'Sending OTP...' : 'Sign up'}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Already have an account? <Link to="/signin">Sign in</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

function ResendOtpButton({ email }: { email: string }) {
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
      {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? 'Sending...' : 'Resend OTP'}
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
    return 'Cannot connect to server. Is the backend running on port 8000?';
  }
  return fallback;
}
