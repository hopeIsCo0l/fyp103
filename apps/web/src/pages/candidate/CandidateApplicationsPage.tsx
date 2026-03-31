import {
  Alert,
  Box,
  Chip,
  Paper,
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
import { listCandidateApplications, type CandidateApplication } from '../../api/applications';

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

export default function CandidateApplicationsPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<CandidateApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCandidateApplications();
      setRows(data);
    } catch {
      setError(t('recruit.applications.loadError'));
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
        {t('recruit.applications.title')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('recruit.applications.subtitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Typography color="text.secondary">{t('common.loading')}</Typography>
      ) : rows.length === 0 ? (
        <Typography color="text.secondary">{t('recruit.applications.empty')}</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('recruit.applications.colRole')}</TableCell>
                <TableCell>{t('recruit.applications.colCompany')}</TableCell>
                <TableCell>{t('recruit.applications.colStage')}</TableCell>
                <TableCell align="right">{t('recruit.applications.colMatch')}</TableCell>
                <TableCell align="right">{t('recruit.applications.colUpdated')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.job_title}</TableCell>
                  <TableCell>{row.company_name || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={t(`recruit.stage.${row.stage}`)} />
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
        {t('recruit.applications.liveNotice')}
      </Typography>
    </Box>
  );
}
