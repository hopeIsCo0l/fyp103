import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MOCK_RECRUITER_JOBS } from '../../data/mockRecruit';

export default function RecruiterJobsPage() {
  const { t } = useTranslation();

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {t('recruit.recruiter.jobsTitle')}
          </Typography>
          <Typography color="text.secondary">{t('recruit.recruiter.jobsSubtitle')}</Typography>
        </Box>
        <Button variant="contained" color="secondary" startIcon={<AddIcon />} size="large">
          {t('recruit.recruiter.newPosting')}
        </Button>
      </Stack>

      <Stack spacing={2}>
        {MOCK_RECRUITER_JOBS.map((job) => (
          <Card key={job.id} variant="outlined">
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                <Box>
                  <Typography variant="h6">{job.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {t('recruit.recruiter.posted', { date: job.postedAt })}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Chip
                      size="small"
                      label={t(`recruit.jobStatus.${job.status}`)}
                      color={job.status === 'open' ? 'success' : job.status === 'paused' ? 'warning' : 'default'}
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`${job.applicants} ${t('recruit.recruiter.applicants')}`}
                    />
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button size="small">{t('recruit.recruiter.edit')}</Button>
                  <Button size="small" color="secondary">
                    {t('recruit.recruiter.viewApplicants')}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {t('recruit.mockNotice')}
      </Typography>
    </Box>
  );
}
