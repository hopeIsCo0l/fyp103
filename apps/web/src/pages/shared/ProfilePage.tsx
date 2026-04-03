import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import ShieldIcon from '@mui/icons-material/Shield';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateMe } from '../../api/auth';
import { getApiErrorMessage } from '../../utils/apiError';
import { useAuth } from '../../contexts/useAuth';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name);
    setPhone(user.phone ?? '');
  }, [user]);

  if (!user) return null;

  const onSave = async () => {
    const payload = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
    };
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateMe(payload);
      await refreshUser();
      setSuccessMessage(t('recruit.profile.updateSuccess'));
    } catch (err) {
      setErrorMessage(
        getApiErrorMessage(err, t('recruit.profile.updateError'), t('common.networkError'))
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        {t('recruit.profile.title')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('recruit.profile.subtitle')}
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <PersonIcon color="primary" sx={{ mt: 0.25 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('signup.fullName')}
                </Typography>
                <Typography fontWeight={600}>{user.full_name}</Typography>
              </Box>
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <EmailIcon color="primary" sx={{ mt: 0.25 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('common.email')}
                </Typography>
                <Typography>{user.email}</Typography>
              </Box>
            </Stack>
            {user.phone && (
              <>
                <Divider />
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <PhoneIcon color="primary" sx={{ mt: 0.25 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('signup.phone')}
                    </Typography>
                    <Typography>{user.phone}</Typography>
                  </Box>
                </Stack>
              </>
            )}
            <Divider />
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <ShieldIcon color="primary" sx={{ mt: 0.25 }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('recruit.profile.role')}
                </Typography>
                <Typography sx={{ textTransform: 'capitalize' }}>{user.role}</Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('recruit.profile.editTitle')}
          </Typography>
          <Stack spacing={2}>
            {successMessage && <Alert severity="success">{successMessage}</Alert>}
            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            <TextField
              label={t('signup.fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <TextField
              label={t('signup.phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              helperText={t('signup.phoneHelp')}
            />
            <Box>
              <Button onClick={onSave} variant="contained" disabled={isSaving}>
                {isSaving ? t('recruit.profile.saving') : t('recruit.profile.save')}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
