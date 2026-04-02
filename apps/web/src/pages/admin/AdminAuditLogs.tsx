import { useCallback, useEffect, useRef, useState } from 'react';
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
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { AuditLogOut } from '../../api/admin';
import {
  downloadBlob,
  exportAuditLogsCsv,
  getAuditLogs,
} from '../../api/admin';
import { useAuth } from '../../contexts/useAuth';

const PAGE_SIZE = 20;

/** Column keys for resizable audit log table (px widths, min 80). */
type AuditColKey = 'time' | 'action' | 'actor' | 'target' | 'ip' | 'meta';

const DEFAULT_COL_WIDTHS: Record<AuditColKey, number> = {
  time: 168,
  action: 168,
  actor: 200,
  target: 220,
  ip: 128,
  meta: 280,
};

function formatMetadataDisplay(raw: string | null): string {
  if (!raw || raw === '{}') return '—';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function ResizableTh({
  width,
  minWidth = 80,
  onResizeStart,
  children,
}: {
  width: number;
  minWidth?: number;
  onResizeStart: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <TableCell
      sx={{
        width,
        minWidth,
        maxWidth: width,
        position: 'relative',
        verticalAlign: 'middle',
        userSelect: 'none',
        borderRight: '1px solid',
        borderColor: 'divider',
        pr: 0,
      }}
    >
      <Box sx={{ pr: 1.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</Box>
      <Box
        onMouseDown={onResizeStart}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 6,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
        aria-hidden
      />
    </TableCell>
  );
}

const ACTION_OPTIONS = [
  '',
  'auth.signup',
  'auth.verify_email',
  'auth.login_success',
  'auth.login_failed',
  'auth.locked',
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
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'admin' && !!user?.is_super_admin;
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
  const [colWidths, setColWidths] = useState<Record<AuditColKey, number>>(DEFAULT_COL_WIDTHS);
  const resizeRef = useRef<{ key: AuditColKey; startX: number; startW: number } | null>(null);

  const handleResizeStart = (key: AuditColKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { key, startX: e.clientX, startW: colWidths[key] };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const { key: k, startX: sx, startW: sw } = resizeRef.current;
      const next = Math.max(80, sw + (ev.clientX - sx));
      setColWidths((w) => ({ ...w, [k]: next }));
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

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
        {isSuperAdmin && (
          <Button variant="outlined" onClick={handleExport} disabled={exporting}>
            {exporting ? t('admin.audit.exporting') : t('admin.audit.exportCsv')}
          </Button>
        )}
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

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {t('admin.audit.resizeHint')}
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          overflow: 'auto',
          maxWidth: '100%',
        }}
      >
        <Table
          size="small"
          sx={{
            tableLayout: 'fixed',
            width: Object.values(colWidths).reduce((a, b) => a + b, 0),
            minWidth: '100%',
          }}
        >
          <TableHead>
            <TableRow>
              <ResizableTh width={colWidths.time} onResizeStart={handleResizeStart('time')}>
                {t('admin.audit.colTime')}
              </ResizableTh>
              <ResizableTh width={colWidths.action} onResizeStart={handleResizeStart('action')}>
                {t('admin.audit.colAction')}
              </ResizableTh>
              <ResizableTh width={colWidths.actor} onResizeStart={handleResizeStart('actor')}>
                {t('admin.audit.colActor')}
              </ResizableTh>
              <ResizableTh width={colWidths.target} onResizeStart={handleResizeStart('target')}>
                {t('admin.audit.colTarget')}
              </ResizableTh>
              <ResizableTh width={colWidths.ip} onResizeStart={handleResizeStart('ip')}>
                {t('admin.audit.colIp')}
              </ResizableTh>
              <ResizableTh width={colWidths.meta} onResizeStart={handleResizeStart('meta')}>
                {t('admin.audit.colMeta')}
              </ResizableTh>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => {
              const actorLabel = log.actor_email || log.actor_id || '—';
              const targetLabel =
                log.target_id && log.target_type
                  ? `${log.target_type}:${log.target_id}`
                  : log.target_id
                    ? log.target_id
                    : '—';
              const metaFormatted = formatMetadataDisplay(log.metadata_json);
              const metaForTooltip =
                metaFormatted !== '—' ? metaFormatted : '';

              return (
                <TableRow key={log.id} hover>
                  <TableCell
                    sx={{
                      width: colWidths.time,
                      maxWidth: colWidths.time,
                      whiteSpace: 'nowrap',
                      verticalAlign: 'top',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {fmtDate(log.created_at)}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: colWidths.action,
                      maxWidth: colWidths.action,
                      verticalAlign: 'top',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {log.action}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: colWidths.actor,
                      maxWidth: colWidths.actor,
                      fontSize: '0.8rem',
                      verticalAlign: 'top',
                      wordBreak: 'break-word',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Tooltip title={actorLabel} placement="top-start" enterDelay={400}>
                      <span>{actorLabel}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: colWidths.target,
                      maxWidth: colWidths.target,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      verticalAlign: 'top',
                      wordBreak: 'break-all',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Tooltip title={targetLabel} placement="top-start" enterDelay={400}>
                      <span>{targetLabel}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: colWidths.ip,
                      maxWidth: colWidths.ip,
                      verticalAlign: 'top',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    {log.ip_address || '—'}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: colWidths.meta,
                      maxWidth: colWidths.meta,
                      verticalAlign: 'top',
                      borderRight: '1px solid',
                      borderColor: 'divider',
                      p: 1,
                    }}
                  >
                    {metaFormatted === '—' ? (
                      '—'
                    ) : (
                      <Tooltip
                        title={<Box sx={{ whiteSpace: 'pre-wrap', maxWidth: 520 }}>{metaForTooltip}</Box>}
                        placement="top-start"
                        enterDelay={300}
                      >
                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            maxHeight: 160,
                            overflow: 'auto',
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            lineHeight: 1.4,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {metaFormatted}
                        </Box>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
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
