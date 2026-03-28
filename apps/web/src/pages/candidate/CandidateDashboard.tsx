import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MOCK_APPLICATIONS, MOCK_JOBS } from '../../data/mockRecruit';

export default function CandidateDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const activeApps = MOCK_APPLICATIONS.filter((a) => a.stage !== 'rejected').length;
  const topJob = MOCK_JOBS[0];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        {t('recruit.candidate.dashboardTitle')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('recruit.candidate.dashboardSubtitle')}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ height: '100%', borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <AssignmentIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('recruit.stats.activeApplications')}
                </Typography>
              </Stack>
              <Typography variant="h3">{activeApps}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ height: '100%', borderLeft: 4, borderColor: 'secondary.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <SearchIcon color="secondary" />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('recruit.stats.jobsMatched')}
                </Typography>
              </Stack>
              <Typography variant="h3">{MOCK_JOBS.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ height: '100%', borderLeft: 4, borderColor: 'success.main' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <TrendingUpIcon color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('recruit.stats.profileStrength')}
                </Typography>
              </Stack>
              <Typography variant="h3">78%</Typography>
              <LinearProgress variant="determinate" value={78} sx={{ mt: 1, height: 6, borderRadius: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">{t('recruit.candidate.topMatch')}</Typography>
                <Button endIcon={<ArrowForwardIcon />} onClick={() => navigate('/candidate/jobs')}>
                  {t('recruit.candidate.browseJobs')}
                </Button>
              </Stack>
              <Typography variant="subtitle1" fontWeight={700}>
                {topJob.title}
              </Typography>
              <Typography color="text.secondary">{topJob.company}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                <Chip size="small" label={topJob.location} />
                <Chip size="small" label={t(`recruit.jobType.${topJob.type}`)} variant="outlined" />
                <Chip size="small" color="primary" label={`${topJob.matchPct}% ${t('recruit.match')}`} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('recruit.candidate.pipelinePreview')}
              </Typography>
              <Stack spacing={1.5}>
                {MOCK_APPLICATIONS.map((a) => (
                  <Box
                    key={a.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {a.jobTitle}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {a.company}
                      </Typography>
                    </Box>
                    <Chip size="small" label={t(`recruit.stage.${a.stage}`)} color="primary" variant="outlined" />
                  </Box>
                ))}
              </Stack>
              <Button fullWidth sx={{ mt: 2 }} onClick={() => navigate('/candidate/applications')}>
                {t('recruit.candidate.viewApplications')}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
