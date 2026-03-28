import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MOCK_JOBS } from '../../data/mockRecruit';

export default function CandidateJobsPage() {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        {t('recruit.jobs.browseTitle')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('recruit.jobs.browseSubtitle')}
      </Typography>

      <Stack spacing={2}>
        {MOCK_JOBS.map((job) => (
          <Card key={job.id} variant="outlined">
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
                spacing={2}
              >
                <Box>
                  <Typography variant="h6">{job.title}</Typography>
                  <Typography color="text.secondary">{job.company}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {job.location}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Chip size="small" label={t(`recruit.jobType.${job.type}`)} />
                    <Chip size="small" label={job.postedAt} variant="outlined" />
                    <Chip size="small" color="primary" label={`${job.matchPct}% ${t('recruit.match')}`} />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
              <Button variant="contained" size="small">
                {t('recruit.jobs.apply')}
              </Button>
              <Button size="small">{t('recruit.jobs.save')}</Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {t('recruit.mockNotice')}
      </Typography>
    </Box>
  );
}
