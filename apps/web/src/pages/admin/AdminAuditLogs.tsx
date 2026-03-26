import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
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
} from '@mui/material';
import type { AuditLogOut } from '../../api/admin';
import { getAuditLogs } from '../../api/admin';

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
];

export default function AdminAuditLogs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogOut[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [actorId, setActorId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await getAuditLogs({ action, actor_id: actorId, page, size: PAGE_SIZE });
      setLogs(res.items);
      setTotal(res.total);
    } catch {
      setError(t('admin.audit.loadError'));
    }
  }, [action, actorId, page, t]);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString();
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>{t('admin.nav.auditLogs')}</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{t('admin.audit.actionFilter')}</InputLabel>
          <Select
            value={action}
            label={t('admin.audit.actionFilter')}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
          >
            {ACTION_OPTIONS.map((a) => (
              <MenuItem key={a} value={a}>{a || t('admin.audit.allActions')}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder={t('admin.audit.actorIdPlaceholder')}
          value={actorId}
          onChange={(e) => { setActorId(e.target.value); setPage(1); }}
          sx={{ minWidth: 250 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {log.actor_id ? log.actor_id.slice(0, 8) + '...' : '—'}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {log.target_id ? `${log.target_type || ''}:${log.target_id.slice(0, 8)}...` : '—'}
                </TableCell>
                <TableCell>{log.ip_address || '—'}</TableCell>
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.metadata_json && log.metadata_json !== '{}' ? log.metadata_json : '—'}
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">{t('admin.audit.noLogs')}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {total > PAGE_SIZE && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={Math.ceil(total / PAGE_SIZE)} page={page} onChange={(_, p) => setPage(p)} />
        </Box>
      )}
    </Box>
  );
}
