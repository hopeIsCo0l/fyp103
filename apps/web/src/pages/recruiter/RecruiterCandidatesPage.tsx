import {
  Alert,
  Box,
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
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  listAllRecruiterApplications,
  updateApplicationStage,
  type RecruiterApplication,
} from '../../api/recruiterApplications';
import type { ApplicationStage } from '../../api/applications';
import CandidateProfileSummary from '../../components/CandidateProfileSummary';

const STAGES: ApplicationStage[] = ['applied', 'screening', 'interview', 'offer', 'rejected'];

function fmt(iso: string | null): string {
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

export default function RecruiterCandidatesPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<RecruiterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAllRecruiterApplications();
      setRows(data);
    } catch {
      setError(t('recruit.recruiter.applicantsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onStageChange = async (id: string, stage: ApplicationStage) => {
    setUpdatingId(id);
    setError(null);
    try {
      const updated = await updateApplicationStage(id, stage);
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      setError(t('recruit.recruiter.stageUpdateError'));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        {t('recruit.pipeline.title')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('recruit.pipeline.subtitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography color="text.secondary">{t('common.loading')}</Typography>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary">{t('recruit.recruiter.applicantsEmpty')}</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('recruit.pipeline.colCandidate')}</TableCell>
                <TableCell>{t('recruit.pipeline.colRole')}</TableCell>
                <TableCell>{t('recruit.pipeline.colProfile')}</TableCell>
                <TableCell>{t('recruit.pipeline.colStage')}</TableCell>
                <TableCell align="right">{t('recruit.pipeline.colMatch')}</TableCell>
                <TableCell align="right">{t('recruit.pipeline.colUpdated')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant="body2">{row.candidate_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.candidate_email}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{row.job_title}</TableCell>
                  <TableCell sx={{ minWidth: 280 }}>
                    <CandidateProfileSummary profile={row.candidate_profile} />
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <FormControl size="small" fullWidth disabled={updatingId === row.id}>
                      <InputLabel id={`st-${row.id}`}>{t('recruit.recruiter.stageLabel')}</InputLabel>
                      <Select
                        labelId={`st-${row.id}`}
                        label={t('recruit.recruiter.stageLabel')}
                        value={row.stage}
                        onChange={(e) =>
                          void onStageChange(row.id, e.target.value as ApplicationStage)
                        }
                      >
                        {STAGES.map((s) => (
                          <MenuItem key={s} value={s}>
                            {t(`recruit.stage.${s}`)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="right">{fmtMatch(row.cv_similarity_score)}</TableCell>
                  <TableCell align="right">{fmt(row.updated_at || row.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        {t('recruit.pipeline.liveNotice')}
      </Typography>
    </Box>
  );
}
