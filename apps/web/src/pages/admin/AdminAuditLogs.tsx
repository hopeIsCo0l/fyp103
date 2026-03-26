import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Snackbar,
} from '@mui/material';
import type { AuditLogOut } from '../../api/admin';
import {
  downloadBlob,
  exportAuditLogsCsv,
  getAuditLogs,
} from '../../api/admin';

const PAGE_SIZE = 20;

const ACTION_OPTIONS = [
  '',
  'auth.signup',
  'auth.verify_email',
  'auth.signin_success',
  'auth.signin_failed',
  'auth.refresh',
  'auth.forgot_password',
  'auth.reset_password',
  'auth.resend_otp',
  'auth.request_login_otp',
  'auth.verify_login_otp',
  'admin.create_user',
  'admin.update_user',
  'admin.deactivate_user',
  'admin.reset_password',
  'admin.revoke_sessions',
];

export default function AdminAuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogOut[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [actorId, setActorId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await getAuditLogs({
        action,
        actor_id: actorId,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        size: PAGE_SIZE,
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch {
      setError(t('admin.audit.loadError'));
    }
  }, [action, actorId, dateFrom, dateTo, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportAuditLogsCsv({
        action,
        actor_id: actorId,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      downloadBlob(blob, 'audit-logs.csv');
      setSnack(t('admin.audit.exportSuccess'));
    } catch {
      setError(t('admin.audit.exportError'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{t('admin.nav.auditLogs')}</Typography>
        <Button variant="outlined" onClick={handleExport} disabled={exporting}>
          {exporting ? t('admin.audit.exporting') : t('admin.audit.exportCsv')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t('admin.audit.actionFilter')}</InputLabel>
          <Select
            value={action}
            label={t('admin.audit.actionFilter')}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            {ACTION_OPTIONS.map((a) => (
              <MenuItem key={a} value={a}>
                {a || t('admin.audit.allActions')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder={t('admin.audit.actorIdPlaceholder')}
          value={actorId}
          onChange={(e) => {
            setActorId(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 220 }}
        />
        <TextField
          size="small"
          type="date"
          label={t('admin.audit.dateFrom')}
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
        <TextField
          size="small"
          type="date"
          label={t('admin.audit.dateTo')}
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('admin.audit.colTime')}</TableCell>
              <TableCell>{t('admin.audit.colAction')}</TableCell>
              <TableCell>{t('admin.audit.colActor')}</TableCell>
              <TableCell>{t('admin.audit.colTarget')}</TableCell>
              <TableCell>{t('admin.audit.colIp')}</TableCell>
              <TableCell>{t('admin.audit.colMeta')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(log.created_at)}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  {log.actor_email ||
                    (log.actor_id ? `${log.actor_id.slice(0, 8)}…` : '—')}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {log.target_id ? `${log.target_type || ''}:${log.target_id.slice(0, 8)}…` : '—'}
                </TableCell>
                <TableCell>{log.ip_address || '—'}</TableCell>
                <TableCell
                  sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {log.metadata_json && log.metadata_json !== '{}' ? log.metadata_json : '—'}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  {t('admin.audit.noLogs')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {total > PAGE_SIZE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={Math.ceil(total / PAGE_SIZE)}
            page={page}
            onChange={(_, p) => setPage(p)}
          />
        </Box>
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack('')}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
