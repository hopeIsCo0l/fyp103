import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApplicationStage } from '../../api/applications';
import {
  createRecruiterJob,
  deleteRecruiterJob,
  listRecruiterJobs,
  updateRecruiterJob,
  type EmploymentType,
  type JobOut,
  type JobStatus,
} from '../../api/recruiterJobs';
import {
  listJobApplications,
  updateApplicationStage,
  type RecruiterApplication,
} from '../../api/recruiterApplications';

const APP_STAGES: ApplicationStage[] = ['applied', 'screening', 'interview', 'offer', 'rejected'];

function formatPostedAt(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

function fmtMatch(score: number | null | undefined): string {
  if (score == null) return '—';
  return `${(score * 100).toFixed(0)}%`;
}

function emptyForm() {
  return {
    title: '',
    description: '',
    companyName: '',
    location: '',
    employmentType: 'full_time' as EmploymentType,
    jobStatus: 'draft' as JobStatus,
  };
}

export default function RecruiterJobsPage() {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<JobOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time');
  const [jobStatus, setJobStatus] = useState<JobStatus>('draft');
  const [saving, setSaving] = useState(false);
  const [applicantsJob, setApplicantsJob] = useState<JobOut | null>(null);
  const [applicants, setApplicants] = useState<RecruiterApplication[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState<string | null>(null);
  const [stageUpdatingId, setStageUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRecruiterJobs();
      setJobs(res.items);
    } catch {
      setError(t('recruit.recruiter.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreateDialog = () => {
    const f = emptyForm();
    setDialogMode('create');
    setEditingId(null);
    setTitle(f.title);
    setDescription(f.description);
    setCompanyName(f.companyName);
    setLocation(f.location);
    setEmploymentType(f.employmentType);
    setJobStatus(f.jobStatus);
    setDialogOpen(true);
  };

  const openEditDialog = (job: JobOut) => {
    setDialogMode('edit');
    setEditingId(job.id);
    setTitle(job.title);
    setDescription(job.description || '');
    setCompanyName(job.company_name || '');
    setLocation(job.location || '');
    setEmploymentType(job.employment_type);
    setJobStatus(job.status);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (dialogMode === 'create') {
        await createRecruiterJob({
          title: title.trim(),
          description: description.trim(),
          company_name: companyName.trim() || undefined,
          location: location.trim() || undefined,
          employment_type: employmentType,
          status: jobStatus,
        });
      } else if (editingId) {
        await updateRecruiterJob(editingId, {
          title: title.trim(),
          description: description.trim(),
          company_name: companyName.trim() || null,
          location: location.trim() || null,
          employment_type: employmentType,
          status: jobStatus,
        });
      }
      const f = emptyForm();
      setTitle(f.title);
      setDescription(f.description);
      setCompanyName(f.companyName);
      setLocation(f.location);
      setEmploymentType(f.employmentType);
      setJobStatus(f.jobStatus);
      closeDialog();
      await load();
    } catch {
      setError(t('recruit.recruiter.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const openApplicantsDialog = async (job: JobOut) => {
    setApplicantsJob(job);
    setApplicants([]);
    setApplicantsError(null);
    setApplicantsLoading(true);
    try {
      const data = await listJobApplications(job.id);
      setApplicants(data);
    } catch {
      setApplicantsError(t('recruit.recruiter.applicantsLoadError'));
    } finally {
      setApplicantsLoading(false);
    }
  };

  const closeApplicantsDialog = () => {
    setApplicantsJob(null);
    setApplicants([]);
    setApplicantsError(null);
  };

  const handleApplicantStageChange = async (applicationId: string, stage: ApplicationStage) => {
    if (!applicantsJob) return;
    setStageUpdatingId(applicationId);
    setApplicantsError(null);
    try {
      const updated = await updateApplicationStage(applicationId, stage);
      setApplicants((prev) => prev.map((a) => (a.id === applicationId ? updated : a)));
      await load();
    } catch {
      setApplicantsError(t('recruit.recruiter.stageUpdateError'));
    } finally {
      setStageUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('recruit.recruiter.deleteConfirm'))) return;
    try {
      await deleteRecruiterJob(id);
      await load();
    } catch {
      setError(t('recruit.recruiter.deleteError'));
    }
  };

  const statusColor = (s: string) => {
    if (s === 'open') return 'success';
    if (s === 'paused') return 'warning';
    if (s === 'draft') return 'default';
    return 'default';
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {t('recruit.recruiter.jobsTitle')}
          </Typography>
          <Typography color="text.secondary">{t('recruit.recruiter.jobsSubtitle')}</Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          size="large"
          onClick={() => openCreateDialog()}
        >
          {t('recruit.recruiter.newPosting')}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography color="text.secondary">{t('common.loading')}</Typography>
      ) : jobs.length === 0 ? (
        <Typography color="text.secondary">{t('recruit.recruiter.emptyJobs')}</Typography>
      ) : (
        <Stack spacing={2}>
          {jobs.map((job) => (
            <Card key={job.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                  <Box>
                    <Typography variant="h6">{job.title}</Typography>
                    {job.company_name && (
                      <Typography variant="body2" color="text.secondary">
                        {job.company_name}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {t('recruit.recruiter.posted', { date: formatPostedAt(job.created_at) })}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        label={t(`recruit.jobStatus.${job.status}`)}
                        color={statusColor(job.status)}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={t(`recruit.jobType.${job.employment_type}`)}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${job.applicants_count} ${t('recruit.recruiter.applicants')}`}
                      />
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button size="small" onClick={() => openEditDialog(job)}>
                      {t('recruit.recruiter.edit')}
                    </Button>
                    <Button size="small" color="secondary" onClick={() => void openApplicantsDialog(job)}>
                      {t('recruit.recruiter.viewApplicants')}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutlineIcon />}
                      onClick={() => void handleDelete(job.id)}
                    >
                      {t('common.delete')}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        {t('recruit.recruiter.jobsLiveNotice')}
      </Typography>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (!saving) closeDialog();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogMode === 'create'
            ? t('recruit.recruiter.jobFormTitle')
            : t('recruit.recruiter.jobFormEditTitle')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('recruit.recruiter.jobTitleLabel')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label={t('recruit.recruiter.descriptionLabel')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
            <TextField
              label={t('recruit.recruiter.companyLabel')}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              fullWidth
            />
            <TextField
              label={t('recruit.recruiter.locationLabel')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="emp-type-label">{t('recruit.recruiter.employmentType')}</InputLabel>
              <Select
                labelId="emp-type-label"
                label={t('recruit.recruiter.employmentType')}
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              >
                <MenuItem value="full_time">{t('recruit.jobType.full_time')}</MenuItem>
                <MenuItem value="part_time">{t('recruit.jobType.part_time')}</MenuItem>
                <MenuItem value="contract">{t('recruit.jobType.contract')}</MenuItem>
                <MenuItem value="internship">{t('recruit.jobType.internship')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="status-label">{t('recruit.recruiter.statusLabel')}</InputLabel>
              <Select
                labelId="status-label"
                label={t('recruit.recruiter.statusLabel')}
                value={jobStatus}
                onChange={(e) => setJobStatus(e.target.value as JobStatus)}
              >
                <MenuItem value="draft">{t('recruit.jobStatus.draft')}</MenuItem>
                <MenuItem value="open">{t('recruit.jobStatus.open')}</MenuItem>
                <MenuItem value="paused">{t('recruit.jobStatus.paused')}</MenuItem>
                <MenuItem value="closed">{t('recruit.jobStatus.closed')}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            {t('recruit.recruiter.cancel')}
          </Button>
          <Button variant="contained" onClick={() => void handleSave()} disabled={saving || !title.trim()}>
            {dialogMode === 'create' ? t('recruit.recruiter.saveJob') : t('recruit.recruiter.saveJobChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={applicantsJob !== null}
        onClose={closeApplicantsDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {applicantsJob
            ? t('recruit.recruiter.applicantsDialogTitle', { title: applicantsJob.title })
            : ''}
        </DialogTitle>
        <DialogContent>
          {applicantsError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApplicantsError(null)}>
              {applicantsError}
            </Alert>
          )}
          {applicantsLoading ? (
            <Typography color="text.secondary">{t('common.loading')}</Typography>
          ) : applicants.length === 0 ? (
            <Typography color="text.secondary">{t('recruit.recruiter.applicantsEmpty')}</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('recruit.recruiter.applicantsColName')}</TableCell>
                    <TableCell>{t('recruit.recruiter.applicantsColEmail')}</TableCell>
                    <TableCell align="right">{t('recruit.recruiter.applicantsColMatch')}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{t('recruit.recruiter.stageLabel')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applicants.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell>{a.candidate_name}</TableCell>
                      <TableCell>{a.candidate_email}</TableCell>
                      <TableCell align="right">{fmtMatch(a.cv_similarity_score)}</TableCell>
                      <TableCell>
                        <FormControl
                          size="small"
                          fullWidth
                          disabled={stageUpdatingId === a.id}
                        >
                          <InputLabel id={`dlg-st-${a.id}`}>{t('recruit.recruiter.stageLabel')}</InputLabel>
                          <Select
                            labelId={`dlg-st-${a.id}`}
                            label={t('recruit.recruiter.stageLabel')}
                            value={a.stage}
                            onChange={(e) =>
                              void handleApplicantStageChange(
                                a.id,
                                e.target.value as ApplicationStage,
                              )
                            }
                          >
                            {APP_STAGES.map((s) => (
                              <MenuItem key={s} value={s}>
                                {t(`recruit.stage.${s}`)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeApplicantsDialog}>{t('recruit.recruiter.closeApplicants')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
