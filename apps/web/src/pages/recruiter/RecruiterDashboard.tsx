import GroupIcon from '@mui/icons-material/Group';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import WorkIcon from '@mui/icons-material/Work';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MOCK_PIPELINE, MOCK_RECRUITER_JOBS } from '../../data/mockRecruit';

export default function RecruiterDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const openRoles = MOCK_RECRUITER_JOBS.filter((j) => j.status === 'open').length;
  const totalApplicants = MOCK_RECRUITER_JOBS.reduce((s, j) => s + j.applicants, 0);
  const newLeads = MOCK_PIPELINE.filter((p) => p.stage === 'new').length;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        {t('recruit.recruiter.dashboardTitle')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('recruit.recruiter.dashboardSubtitle')}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ borderLeft: 4, borderColor: 'primary.main', height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <WorkIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('recruit.stats.openRoles')}
                </Typography>
              </Stack>
              <Typography variant="h3">{openRoles}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ borderLeft: 4, borderColor: 'secondary.main', height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <GroupIcon color="secondary" />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('recruit.stats.totalApplicants')}
                </Typography>
              </Stack>
              <Typography variant="h3">{totalApplicants}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ borderLeft: 4, borderColor: 'info.main', height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <PersonSearchIcon color="info" />
                <Typography variant="subtitle2" color="text.secondary">
                  {t('recruit.stats.newThisWeek')}
                </Typography>
              </Stack>
              <Typography variant="h3">{newLeads}</Typography>
              <LinearProgress value={65} variant="determinate" sx={{ mt: 1, height: 6, borderRadius: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">{t('recruit.recruiter.yourPostings')}</Typography>
                <Button size="small" onClick={() => navigate('/recruiter/jobs')}>
                  {t('recruit.recruiter.manageJobs')}
                </Button>
              </Stack>
              {MOCK_RECRUITER_JOBS.map((j) => (
                <Stack
                  key={j.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <Box>
                    <Typography fontWeight={600}>{j.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('recruit.recruiter.posted', { date: j.postedAt })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="primary" fontWeight={700}>
                    {j.applicants} {t('recruit.recruiter.applicants')}
                  </Typography>
                </Stack>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">{t('recruit.recruiter.pipelinePreview')}</Typography>
                <Button size="small" onClick={() => navigate('/recruiter/candidates')}>
                  {t('recruit.recruiter.openPipeline')}
                </Button>
              </Stack>
              {MOCK_PIPELINE.slice(0, 4).map((p) => (
                <Stack
                  key={p.id}
                  direction="row"
                  justifyContent="space-between"
                  sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <Box>
                    <Typography fontWeight={600}>{p.candidateName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.jobTitle}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                    {t(`recruit.pipelineStage.${p.stage}`)}
                  </Typography>
                </Stack>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
