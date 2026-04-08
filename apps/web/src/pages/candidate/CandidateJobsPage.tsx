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
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  applyToJob,
  extractCvText,
  listCandidateApplications,
  scoreCvForJob,
  type CandidateApplication,
  type CvScorePreview,
} from '../../api/applications';
import { getApiErrorMessage } from '../../utils/apiError';
import { listOpenJobs, type PublicJob } from '../../api/publicJobs';

function postedDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

function isConflict(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { status?: number } }).response?.status === 'number' &&
    (err as { response: { status: number } }).response.status === 409
  );
}

function isUnprocessable(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { status?: number } }).response?.status === 'number' &&
    (err as { response: { status: number } }).response.status === 422
  );
}

export default function CandidateJobsPage() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [scoringAll, setScoringAll] = useState(false);
  const [optionalCvText, setOptionalCvText] = useState('');
  const [extractingResume, setExtractingResume] = useState(false);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const [fitPreviewByJob, setFitPreviewByJob] = useState<Record<string, CvScorePreview>>({});

  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => a.job_id)),
    [applications],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const jobsRes = await listOpenJobs({ page: 1, size: 50 });
      setJobs(jobsRes.items);
      try {
        const apps = await listCandidateApplications();
        setApplications(apps);
      } catch {
        setApplications([]);
      }
    } catch {
      setError(t('recruit.jobs.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setFitPreviewByJob({});
  }, [optionalCvText]);

  const handleResumeFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setSuccess(null);
    setExtractingResume(true);
    try {
      const { cv_text: extracted } = await extractCvText(file);
      setOptionalCvText(extracted);
      setSuccess(t('recruit.jobs.resumeExtractSuccess'));
    } catch (err) {
      setError(
        getApiErrorMessage(err, t('recruit.jobs.resumeExtractError'), t('common.networkError')),
      );
    } finally {
      setExtractingResume(false);
    }
  };

  const handlePreviewFit = async (jobId: string) => {
    setError(null);
    setSuccess(null);
    const cvText = optionalCvText.trim();
    if (cvText.length < 20) {
      setError(t('recruit.jobs.cvTooShort'));
      return;
    }
    setScoringId(jobId);
    try {
      const score = await scoreCvForJob(jobId, cvText);
      setFitPreviewByJob((prev) => ({ ...prev, [jobId]: score }));
    } catch (e) {
      if (isUnprocessable(e)) {
        setError(t('recruit.jobs.cvTooShort'));
      } else {
        setError(t('recruit.jobs.previewError'));
      }
    } finally {
      setScoringId(null);
    }
  };

  const handlePreviewAllFits = async () => {
    setError(null);
    setSuccess(null);
    const cvText = optionalCvText.trim();
    if (cvText.length < 20) {
      setError(t('recruit.jobs.cvTooShort'));
      return;
    }
    setScoringAll(true);
    try {
      const results = await Promise.all(
        jobs.map(async (job) => {
          const score = await scoreCvForJob(job.id, cvText);
          return { jobId: job.id, score };
        }),
      );
      setFitPreviewByJob((prev) => {
        const next = { ...prev };
        results.forEach(({ jobId, score }) => {
          next[jobId] = score;
        });
        return next;
      });
    } catch (e) {
      if (isUnprocessable(e)) {
        setError(t('recruit.jobs.cvTooShort'));
      } else {
        setError(t('recruit.jobs.previewError'));
      }
    } finally {
      setScoringAll(false);
    }
  };

  const handleApply = async (jobId: string) => {
    setSuccess(null);
    setError(null);
    setApplyingId(jobId);
    try {
      await applyToJob(jobId, {
        cvText: optionalCvText.trim() || undefined,
      });
      const apps = await listCandidateApplications();
      setApplications(apps);
      setSuccess(t('recruit.jobs.applySuccess'));
    } catch (e) {
      if (isConflict(e)) {
        setError(t('recruit.jobs.alreadyApplied'));
        const apps = await listCandidateApplications().catch(() => []);
        setApplications(apps);
      } else {
        setError(t('recruit.jobs.applyError'));
      }
    } finally {
      setApplyingId(null);
    }
  };

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
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <input
        ref={resumeFileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        style={{ display: 'none' }}
        onChange={(e) => void handleResumeFileSelected(e)}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }} alignItems={{ sm: 'center' }}>
        <Button
          variant="outlined"
          size="small"
          disabled={extractingResume}
          onClick={() => resumeFileInputRef.current?.click()}
        >
          {extractingResume ? t('recruit.jobs.resumeExtracting') : t('recruit.jobs.resumeUpload')}
        </Button>
        <Typography variant="body2" color="text.secondary">
          {t('recruit.jobs.resumeUploadHint')}
        </Typography>
      </Stack>
      <TextField
        label={t('recruit.jobs.optionalCvLabel')}
        placeholder={t('recruit.jobs.optionalCvPlaceholder')}
        value={optionalCvText}
        onChange={(e) => setOptionalCvText(e.target.value)}
        multiline
        minRows={2}
        fullWidth
        sx={{ mb: 3 }}
      />
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Button
          size="small"
          variant="outlined"
          disabled={
            scoringAll ||
            optionalCvText.trim().length === 0 ||
            jobs.length === 0 ||
            extractingResume
          }
          onClick={() => void handlePreviewAllFits()}
        >
          {scoringAll ? t('recruit.jobs.previewingAll') : t('recruit.jobs.previewAll')}
        </Button>
      </Stack>

      {loading ? (
        <Typography color="text.secondary">{t('common.loading')}</Typography>
      ) : jobs.length === 0 ? (
        <Typography color="text.secondary">{t('recruit.jobs.empty')}</Typography>
      ) : (
        <Stack spacing={2}>
          {jobs.map((job) => {
            const applied = appliedJobIds.has(job.id);
            const preview = fitPreviewByJob[job.id];
            return (
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
                        {applied && (
                          <Chip size="small" color="success" label={t('recruit.jobs.appliedBadge')} />
                        )}
                      </Stack>
                      {preview && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                          <Chip
                            size="small"
                            color={
                              preview.predicted_fit === 'good'
                                ? 'success'
                                : preview.predicted_fit === 'medium'
                                  ? 'warning'
                                  : 'default'
                            }
                            label={t(`recruit.jobs.fitLabel.${preview.predicted_fit}`)}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={t('recruit.jobs.fitScore', {
                              value: Math.round(preview.ranking_score * 100),
                            })}
                          />
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Button
                    size="small"
                    disabled={
                      scoringAll ||
                      scoringId === job.id ||
                      optionalCvText.trim().length === 0 ||
                      extractingResume
                    }
                    onClick={() => void handlePreviewFit(job.id)}
                  >
                    {scoringId === job.id ? t('recruit.jobs.previewing') : t('recruit.jobs.previewFit')}
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={applied || applyingId === job.id || extractingResume}
                    onClick={() => void handleApply(job.id)}
                  >
                    {applied ? t('recruit.jobs.appliedBadge') : t('recruit.jobs.apply')}
                  </Button>
                  <Button size="small" disabled>
                    {t('recruit.jobs.save')}
                  </Button>
                </CardActions>
              </Card>
            );
          })}
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {t('recruit.jobs.browseNotice')}
      </Typography>
    </Box>
  );
}
