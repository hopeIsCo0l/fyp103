import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { CreateUserPayload, UserOut } from '../../api/admin';
import {
  createUser,
  downloadBlob,
  exportUsersCsv,
  getUsers,
  resetUserPassword,
  revokeUserSessions,
  updateUser,
} from '../../api/admin';
import { useAuth } from '../../contexts/useAuth';
import { getApiErrorMessage } from '../../utils/apiError';

const PAGE_SIZE = 15;

type ConfirmKind = 'revokeSessions' | null;

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const urlInitDone = useRef(false);

  const [users, setUsers] = useState<UserOut[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [error, setError] = useState('');
  const [snack, setSnack] = useState('');
  const [exporting, setExporting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserOut | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editVerified, setEditVerified] = useState(false);

  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; user: UserOut | null }>({
    kind: null,
    user: null,
  });

  const [resetConfirm, setResetConfirm] = useState<UserOut | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; temporary_password: string } | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (urlInitDone.current) return;
    const r = searchParams.get('role');
    const v = searchParams.get('verified');
    if (r) setRoleFilter(r);
    if (v === 'true') setVerifiedFilter('yes');
    if (v === 'false') setVerifiedFilter('no');
    urlInitDone.current = true;
  }, [searchParams]);

  const verifiedParam =
    verifiedFilter === 'yes' ? true : verifiedFilter === 'no' ? false : undefined;

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await getUsers({
        search,
        role: roleFilter,
        verified: verifiedParam,
        page,
        size: PAGE_SIZE,
      });
      setUsers(res.items);
      setTotal(res.total);
    } catch {
      setError(t('admin.users.loadError'));
    }
  }, [search, roleFilter, verifiedParam, page, t]);

  useEffect(() => {
    load();
  }, [load]);

  const isSelf = (u: UserOut) => currentUser?.id === u.id;

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString();
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await exportUsersCsv({
        search,
        role: roleFilter,
        verified: verifiedParam,
      });
      downloadBlob(blob, 'users.csv');
      setSnack(t('admin.users.exportSuccess'));
    } catch {
      setError(t('admin.users.exportError'));
    } finally {
      setExporting(false);
    }
  };

  const runConfirm = async () => {
    const u = confirm.user;
    if (!u || !confirm.kind) return;
    try {
      if (confirm.kind === 'revokeSessions') {
        await revokeUserSessions(u.id);
        setSnack(t('admin.users.successRevokeSessions'));
      }
      setConfirm({ kind: null, user: null });
      load();
    } catch {
      setError(t('admin.users.actionError'));
      setConfirm({ kind: null, user: null });
    }
  };

  const openEdit = (u: UserOut) => {
    setEditUser(u);
    setEditFullName(u.full_name);
    setEditPhone(u.phone ?? '');
    setEditRole(u.role);
    setEditActive(u.is_active);
    setEditVerified(u.is_email_verified);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    try {
      await updateUser(editUser.id, {
        full_name: editFullName,
        phone: editPhone.trim() || null,
        role: editRole,
        is_active: editActive,
        is_email_verified: editVerified,
      });
      setEditOpen(false);
      setSnack(t('admin.users.successUpdated'));
      load();
    } catch {
      setError(t('admin.users.actionError'));
    }
  };

  const handleResetPassword = async () => {
    if (!resetConfirm) return;
    try {
      const res = await resetUserPassword(resetConfirm.id);
      setResetConfirm(null);
      setResetResult(res);
    } catch {
      setError(t('admin.users.resetPasswordError'));
      setResetConfirm(null);
    }
  };

  const copyPassword = () => {
    if (resetResult?.temporary_password) {
      void navigator.clipboard.writeText(resetResult.temporary_password);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{t('admin.nav.users')}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={handleExportCsv} disabled={exporting}>
            {exporting ? t('admin.users.exporting') : t('admin.users.exportCsv')}
          </Button>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            {t('admin.users.createBtn')}
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('admin.users.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('admin.users.roleFilter')}</InputLabel>
          <Select
            value={roleFilter}
            label={t('admin.users.roleFilter')}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">{t('admin.users.allRoles')}</MenuItem>
            <MenuItem value="candidate">{t('admin.users.candidate')}</MenuItem>
            <MenuItem value="recruiter">{t('admin.users.recruiter')}</MenuItem>
            <MenuItem value="admin">{t('admin.users.admin')}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('admin.users.verifiedFilter')}</InputLabel>
          <Select
            value={verifiedFilter}
            label={t('admin.users.verifiedFilter')}
            onChange={(e) => {
              setVerifiedFilter(e.target.value as 'all' | 'yes' | 'no');
              setPage(1);
            }}
          >
            <MenuItem value="all">{t('admin.users.allVerified')}</MenuItem>
            <MenuItem value="yes">{t('admin.users.verifiedOnly')}</MenuItem>
            <MenuItem value="no">{t('admin.users.unverifiedOnly')}</MenuItem>
          </Select>
        </FormControl>
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
              <TableCell>{t('admin.users.colName')}</TableCell>
              <TableCell>{t('common.email')}</TableCell>
              <TableCell>{t('signup.phone')}</TableCell>
              <TableCell>{t('admin.users.colRole')}</TableCell>
              <TableCell>{t('admin.users.colStatus')}</TableCell>
              <TableCell>{t('admin.users.colVerified')}</TableCell>
              <TableCell align="right">{t('admin.users.colActions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.full_name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phone || '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={u.role}
                    size="small"
                    color={
                      u.role === 'admin' ? 'error' : u.role === 'recruiter' ? 'warning' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.is_active ? t('admin.users.active') : t('admin.users.inactive')}
                    size="small"
                    color={u.is_active ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>{u.is_email_verified ? t('admin.users.yes') : t('admin.users.no')}</TableCell>
                <TableCell align="right">
                  <Tooltip title={t('admin.users.editUserFull')}>
                    <IconButton size="small" color="primary" onClick={() => openEdit(u)} aria-label={t('admin.users.editUser')}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {t('admin.users.noUsers')}
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

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          load();
          setSnack(t('admin.users.successCreated'));
        }}
      />

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle>{t('admin.users.editUser')}</DialogTitle>
        <DialogContent dividers>
          {editUser && (
            <>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t('admin.users.editSectionMetadata')}
              </Typography>
              <Stack spacing={0.75} sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                  <strong>{t('admin.users.detailId')}</strong> {editUser.id}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('common.email')}</strong> {editUser.email}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('admin.users.detailCreated')}</strong> {fmtDate(editUser.created_at)}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('admin.users.detailLastLogin')}</strong> {fmtDate(editUser.last_login_at)}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('admin.users.detailFailedAttempts')}</strong>{' '}
                  {editUser.failed_login_attempts ?? 0}
                </Typography>
                <Typography variant="body2">
                  <strong>{t('admin.users.detailLockedUntil')}</strong> {fmtDate(editUser.locked_until)}
                </Typography>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t('admin.users.editSectionProfile')}
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label={t('signup.fullName')}
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label={t('signup.phone')}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  size="small"
                  fullWidth
                  helperText={t('signup.phoneHelp')}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>{t('admin.users.colRole')}</InputLabel>
                  <Select
                    value={editRole}
                    label={t('admin.users.colRole')}
                    disabled={isSelf(editUser)}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <MenuItem value="candidate">{t('admin.users.candidate')}</MenuItem>
                    <MenuItem value="recruiter">{t('admin.users.recruiter')}</MenuItem>
                    <MenuItem value="admin">{t('admin.users.admin')}</MenuItem>
                  </Select>
                </FormControl>
                {isSelf(editUser) && (
                  <Typography variant="caption" color="text.secondary">
                    {t('admin.users.cannotChangeOwnRoleHint')}
                  </Typography>
                )}
                <FormControlLabel
                  control={
                    <Switch
                      checked={editActive}
                      onChange={(_, v) => setEditActive(v)}
                      disabled={isSelf(editUser)}
                    />
                  }
                  label={t('admin.users.statusActive')}
                />
                {isSelf(editUser) && (
                  <Typography variant="caption" color="text.secondary">
                    {t('admin.users.cannotDeactivateSelfHint')}
                  </Typography>
                )}
                <FormControlLabel
                  control={
                    <Switch checked={editVerified} onChange={(_, v) => setEditVerified(v)} />
                  }
                  label={t('admin.users.emailVerified')}
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t('admin.users.editSectionSecurity')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Tooltip
                  title={
                    isSelf(editUser) ? t('admin.users.cannotResetOwn') : t('admin.users.resetPassword')
                  }
                >
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<VpnKeyIcon />}
                      disabled={isSelf(editUser)}
                      onClick={() => setResetConfirm(editUser)}
                    >
                      {t('admin.users.resetPassword')}
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<LogoutIcon />}
                  onClick={() => setConfirm({ kind: 'revokeSessions', user: editUser })}
                >
                  {t('admin.users.revokeSessions')}
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                {t('admin.users.editSecurityHint')}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('admin.users.cancel')}</Button>
          <Button variant="contained" onClick={handleEditSave}>
            {t('admin.users.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirm.kind} onClose={() => setConfirm({ kind: null, user: null })}>
        <DialogTitle>{t('admin.users.confirmRevokeSessionsTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('admin.users.confirmRevokeSessionsBody', { email: confirm.user?.email ?? '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ kind: null, user: null })}>
            {t('admin.users.cancel')}
          </Button>
          <Button variant="contained" color="primary" onClick={runConfirm}>
            {t('admin.users.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!resetConfirm} onClose={() => setResetConfirm(null)}>
        <DialogTitle>{t('admin.users.resetPasswordConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('admin.users.resetPasswordConfirmBody', { email: resetConfirm?.email ?? '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetConfirm(null)}>{t('admin.users.cancel')}</Button>
          <Button variant="contained" color="warning" onClick={handleResetPassword}>
            {t('admin.users.resetPasswordConfirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!resetResult} onClose={() => setResetResult(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.users.newPasswordTitle')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('admin.users.newPasswordWarning')}
          </Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {resetResult?.email}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              label={t('admin.users.temporaryPassword')}
              value={resetResult?.temporary_password ?? ''}
              InputProps={{ readOnly: true }}
            />
            <IconButton onClick={copyPassword} aria-label="copy">
              <ContentCopyIcon />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setResetResult(null)}>
            {t('admin.users.done')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateUserPayload>({
    email: '',
    password: '',
    full_name: '',
    role: 'recruiter',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createUser({
        ...form,
        phone: form.phone?.trim() || undefined,
      });
      setForm({ email: '', password: '', full_name: '', role: 'recruiter', phone: '' });
      onClose();
      onCreated();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, t('admin.users.createError'), t('common.networkError')),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t('admin.users.createTitle')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t('signup.fullName')}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
            size="small"
          />
          <TextField
            label={t('common.email')}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            size="small"
          />
          <TextField
            label={t('signup.phone')}
            value={form.phone ?? ''}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            size="small"
            helperText={t('signup.phoneHelp')}
          />
          <TextField
            label={t('common.password')}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            size="small"
            helperText={t('signup.passwordHelp')}
          />
          <FormControl size="small">
            <InputLabel>{t('admin.users.colRole')}</InputLabel>
            <Select
              value={form.role}
              label={t('admin.users.colRole')}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value as 'candidate' | 'recruiter' | 'admin',
                })
              }
            >
              <MenuItem value="candidate">{t('admin.users.candidate')}</MenuItem>
              <MenuItem value="recruiter">{t('admin.users.recruiter')}</MenuItem>
              <MenuItem value="admin">{t('admin.users.admin')}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('admin.users.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? t('admin.users.creating') : t('admin.users.createBtn')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
