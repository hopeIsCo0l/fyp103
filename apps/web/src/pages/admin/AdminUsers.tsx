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
} from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import type { CreateUserPayload, UserOut } from '../../api/admin';
import {
  createUser,
  deleteUser,
  downloadBlob,
  exportUsersCsv,
  resetUserPassword,
  revokeUserSessions,
  updateUser,
  getUsers,
} from '../../api/admin';
import { useAuth } from '../../contexts/useAuth';

const PAGE_SIZE = 15;

type ConfirmKind = 'deactivate' | 'reactivate' | 'revokeSessions' | null;

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
  const [editRole, setEditRole] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editVerified, setEditVerified] = useState(false);

  const [detailUser, setDetailUser] = useState<UserOut | null>(null);

  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; user: UserOut | null }>({
    kind: null,
    user: null,
  });

  const [resetTarget, setResetTarget] = useState<UserOut | null>(null);
  const [resetPass, setResetPass] = useState('');
  const [resetPass2, setResetPass2] = useState('');
  const [resetError, setResetError] = useState('');

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

  const isSelf = (u: UserOut) => currentUser?.id === u.id;

  const runConfirm = async () => {
    const u = confirm.user;
    if (!u || !confirm.kind) return;
    try {
      if (confirm.kind === 'deactivate') {
        await deleteUser(u.id);
        setSnack(t('admin.users.successDeactivated'));
      }
      if (confirm.kind === 'reactivate') {
        await updateUser(u.id, { is_active: true });
        setSnack(t('admin.users.successReactivated'));
      }
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

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (resetPass.length < 8) {
      setResetError(t('admin.users.resetPasswordTooShort'));
      return;
    }
    if (resetPass !== resetPass2) {
      setResetError(t('admin.users.resetPasswordMismatch'));
      return;
    }
    if (!resetTarget) return;
    try {
      await resetUserPassword(resetTarget.id, resetPass);
      setResetPass('');
      setResetPass2('');
      setResetTarget(null);
      setSnack(t('admin.users.successPasswordReset'));
      load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setResetError(ax?.response?.data?.detail || t('admin.users.resetPasswordError'));
    }
  };

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString();
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
                  <Tooltip title={t('admin.users.viewDetails')}>
                    <IconButton size="small" onClick={() => setDetailUser(u)}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('admin.users.editUser')}>
                    <IconButton size="small" onClick={() => openEdit(u)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('admin.users.resetPassword')}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setResetTarget(u);
                        setResetPass('');
                        setResetPass2('');
                        setResetError('');
                      }}
                    >
                      <VpnKeyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('admin.users.revokeSessions')}>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => setConfirm({ kind: 'revokeSessions', user: u })}
                    >
                      <LogoutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {u.is_active ? (
                    <Tooltip
                      title={
                        isSelf(u)
                          ? t('admin.users.cannotDeactivateSelf')
                          : t('admin.users.deactivate')
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={isSelf(u)}
                          onClick={() =>
                            !isSelf(u) && setConfirm({ kind: 'deactivate', user: u })
                          }
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip title={t('admin.users.reactivate')}>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => setConfirm({ kind: 'reactivate', user: u })}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.users.editUser')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
            {editUser?.email}
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('signup.fullName')}
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              size="small"
              fullWidth
            />
            <FormControl fullWidth size="small">
              <InputLabel>{t('admin.users.colRole')}</InputLabel>
              <Select
                value={editRole}
                label={t('admin.users.colRole')}
                disabled={editUser ? isSelf(editUser) : false}
                onChange={(e) => setEditRole(e.target.value)}
              >
                <MenuItem value="candidate">{t('admin.users.candidate')}</MenuItem>
                <MenuItem value="recruiter">{t('admin.users.recruiter')}</MenuItem>
                <MenuItem value="admin">{t('admin.users.admin')}</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={editActive}
                  onChange={(_, v) => setEditActive(v)}
                  disabled={editUser ? isSelf(editUser) : false}
                />
              }
              label={t('admin.users.colStatus')}
            />
            <FormControlLabel
              control={
                <Switch checked={editVerified} onChange={(_, v) => setEditVerified(v)} />
              }
              label={t('admin.users.colVerified')}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('admin.users.cancel')}</Button>
          <Button variant="contained" onClick={handleEditSave}>
            {t('admin.users.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detailUser} onClose={() => setDetailUser(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.users.userDetails')}</DialogTitle>
        <DialogContent>
          {detailUser && (
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>{t('admin.users.detailId')}</strong> {detailUser.id}
              </Typography>
              <Typography variant="body2">
                <strong>{t('common.email')}</strong> {detailUser.email}
              </Typography>
              <Typography variant="body2">
                <strong>{t('signup.fullName')}</strong> {detailUser.full_name}
              </Typography>
              <Typography variant="body2">
                <strong>{t('admin.users.colRole')}</strong> {detailUser.role}
              </Typography>
              <Typography variant="body2">
                <strong>{t('admin.users.detailCreated')}</strong>{' '}
                {fmtDate(detailUser.created_at)}
              </Typography>
              <Typography variant="body2">
                <strong>{t('admin.users.detailLastLogin')}</strong>{' '}
                {fmtDate(detailUser.last_login_at)}
              </Typography>
              <Typography variant="body2">
                <strong>{t('admin.users.detailFailedAttempts')}</strong>{' '}
                {detailUser.failed_login_attempts ?? 0}
              </Typography>
              <Typography variant="body2">
                <strong>{t('admin.users.detailLockedUntil')}</strong>{' '}
                {fmtDate(detailUser.locked_until)}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailUser(null)}>{t('admin.users.close')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirm.kind} onClose={() => setConfirm({ kind: null, user: null })}>
        <DialogTitle>
          {confirm.kind === 'deactivate' && t('admin.users.confirmDeactivateTitle')}
          {confirm.kind === 'reactivate' && t('admin.users.confirmReactivateTitle')}
          {confirm.kind === 'revokeSessions' && t('admin.users.confirmRevokeSessionsTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {confirm.kind === 'deactivate' &&
              t('admin.users.confirmDeactivateBody', { email: confirm.user?.email ?? '' })}
            {confirm.kind === 'reactivate' &&
              t('admin.users.confirmReactivateBody', { email: confirm.user?.email ?? '' })}
            {confirm.kind === 'revokeSessions' &&
              t('admin.users.confirmRevokeSessionsBody', { email: confirm.user?.email ?? '' })}
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

      <Dialog
        open={!!resetTarget}
        onClose={() => {
          setResetTarget(null);
          setResetPass('');
          setResetPass2('');
          setResetError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleResetSubmit}>
          <DialogTitle>{t('admin.users.resetPasswordTitle')}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {resetTarget?.email}
            </Typography>
            {resetError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {resetError}
              </Alert>
            )}
            <Stack spacing={2}>
              <TextField
                label={t('admin.users.newPassword')}
                type="password"
                value={resetPass}
                onChange={(e) => setResetPass(e.target.value)}
                size="small"
                fullWidth
                required
                helperText={t('signup.passwordHelp')}
              />
              <TextField
                label={t('admin.users.confirmNewPassword')}
                type="password"
                value={resetPass2}
                onChange={(e) => setResetPass2(e.target.value)}
                size="small"
                fullWidth
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setResetTarget(null);
                setResetPass('');
                setResetPass2('');
                setResetError('');
              }}
            >
              {t('admin.users.cancel')}
            </Button>
            <Button type="submit" variant="contained">
              {t('admin.users.resetPasswordSubmit')}
            </Button>
          </DialogActions>
        </form>
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
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createUser(form);
      setForm({ email: '', password: '', full_name: '', role: 'recruiter' });
      onClose();
      onCreated();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setError(ax?.response?.data?.detail || t('admin.users.createError'));
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
                setForm({ ...form, role: e.target.value as 'recruiter' | 'admin' })
              }
            >
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
