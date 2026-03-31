import GroupIcon from '@mui/icons-material/Group';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import WorkIcon from '@mui/icons-material/Work';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { listAllRecruiterApplications, type RecruiterApplication } from '../../api/recruiterApplications';
import { listRecruiterJobs, type JobOut } from '../../api/recruiterJobs';

function postedDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

export default function RecruiterDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobOut[]>([]);
  const [pipelinePreview, setPipelinePreview] = useState<RecruiterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, apps] = await Promise.all([listRecruiterJobs(), listAllRecruiterApplications()]);
      setJobs(res.items);
      setPipelinePreview(apps.slice(0, 6));
    } catch {
      setError(t('recruit.recruiter.dashboardLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openRoles = jobs.filter((j) => j.status === 'open').length;
  const totalApplicants = jobs.reduce((s, j) => s + (j.applicants_count || 0), 0);
  const postingPreview = jobs.slice(0, 8);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        {t('recruit.recruiter.dashboardTitle')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('recruit.recruiter.dashboardSubtitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
              <Typography variant="h3">{loading ? '—' : openRoles}</Typography>
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
              <Typography variant="h3">{loading ? '—' : totalApplicants}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {t('recruit.recruiter.statsApplicantsHint')}
              </Typography>
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
              <Typography variant="h3">0</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {t('recruit.recruiter.statsNewHint')}
              </Typography>
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
              {loading ? (
                <Typography color="text.secondary">{t('common.loading')}</Typography>
              ) : postingPreview.length === 0 ? (
                <Typography color="text.secondary">{t('recruit.recruiter.emptyJobs')}</Typography>
              ) : (
                postingPreview.map((j) => (
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
                        {t('recruit.recruiter.posted', { date: postedDate(j.created_at) })}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="primary" fontWeight={700}>
                      {j.applicants_count} {t('recruit.recruiter.applicants')}
                    </Typography>
                  </Stack>
                ))
              )}
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
              {loading ? (
                <Typography color="text.secondary">{t('common.loading')}</Typography>
              ) : pipelinePreview.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('recruit.recruiter.pipelineEmpty')}
                </Typography>
              ) : (
                pipelinePreview.map((a) => (
                  <Stack
                    key={a.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <Box>
                      <Typography fontWeight={600}>{a.candidate_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {a.job_title}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="primary" fontWeight={600}>
                      {t(`recruit.stage.${a.stage}`)}
                    </Typography>
                  </Stack>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
