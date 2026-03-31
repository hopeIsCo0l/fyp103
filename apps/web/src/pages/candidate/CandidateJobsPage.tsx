import LocationOnIcon from '@mui/icons-material/LocationOn';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listOpenJobs, type PublicJob } from '../../api/publicJobs';

function postedDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

export default function CandidateJobsPage() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listOpenJobs({ page: 1, size: 50 });
      setJobs(res.items);
    } catch {
      setError(t('recruit.jobs.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        {t('recruit.jobs.browseTitle')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('recruit.jobs.browseSubtitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography color="text.secondary">{t('common.loading')}</Typography>
      ) : jobs.length === 0 ? (
        <Typography color="text.secondary">{t('recruit.jobs.empty')}</Typography>
      ) : (
        <Stack spacing={2}>
          {jobs.map((job) => (
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
                    <Typography color="text.secondary">
                      {job.company_name || t('recruit.jobs.companyTbd')}
                    </Typography>
                    {job.location && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <LocationOnIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {job.location}
                        </Typography>
                      </Stack>
                    )}
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                      <Chip size="small" label={t(`recruit.jobType.${job.employment_type}`)} />
                      <Chip size="small" label={postedDate(job.created_at)} variant="outlined" />
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Button variant="contained" size="small" disabled>
                  {t('recruit.jobs.apply')}
                </Button>
                <Button size="small" disabled>
                  {t('recruit.jobs.save')}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {t('recruit.jobs.browseNotice')}
      </Typography>
    </Box>
  );
}
