import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import ShieldIcon from '@mui/icons-material/Shield';
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/useAuth';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

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

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        {t('recruit.profile.editHint')}
      </Typography>
    </Box>
  );
}
