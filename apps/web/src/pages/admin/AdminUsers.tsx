import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { CreateUserPayload, UserOut } from '../../api/admin';
import { createUser, deleteUser, getUsers, resetUserPassword, updateUser } from '../../api/admin';
import { useAuth } from '../../contexts/useAuth';

const PAGE_SIZE = 15;

export default function AdminUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserOut[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserOut | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editVerified, setEditVerified] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState<null | { type: 'deactivate' | 'reactivate'; user: UserOut }>(null);
  const [resetConfirm, setResetConfirm] = useState<UserOut | null>(null);
  const [resetResult, setResetResult] = useState<{ email: string; temporary_password: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getUsers({ search, role: roleFilter, page, size: PAGE_SIZE });
      setUsers(res.items);
      setTotal(res.total);
    } catch {
      setError(t('admin.users.loadError'));
    }
  }, [search, roleFilter, page, t]);

  useEffect(() => { load(); }, [load]);

  const handleDeactivate = async (id: string) => {
    await deleteUser(id);
    setConfirmOpen(null);
    load();
  };

  const handleReactivate = async (id: string) => {
    await updateUser(id, { is_active: true });
    setConfirmOpen(null);
    load();
  };

  const openEdit = (u: UserOut) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditFullName(u.full_name);
    setEditActive(u.is_active);
    setEditVerified(u.is_email_verified);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    await updateUser(editUser.id, {
      role: editRole,
      full_name: editFullName,
      is_active: editActive,
      is_email_verified: editVerified,
    });
    setEditOpen(false);
    load();
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
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          {t('admin.users.createBtn')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder={t('admin.users.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('admin.users.roleFilter')}</InputLabel>
          <Select
            value={roleFilter}
            label={t('admin.users.roleFilter')}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value="">{t('admin.users.allRoles')}</MenuItem>
            <MenuItem value="candidate">{t('admin.users.candidate')}</MenuItem>
            <MenuItem value="recruiter">{t('admin.users.recruiter')}</MenuItem>
            <MenuItem value="admin">{t('admin.users.admin')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

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
                    color={u.role === 'admin' ? 'error' : u.role === 'recruiter' ? 'warning' : 'default'}
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
                  <Tooltip title={t('admin.users.editUser')}>
                    <IconButton size="small" onClick={() => openEdit(u)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={u.id === currentUser?.id ? t('admin.users.cannotResetOwn') : t('admin.users.resetPassword')}>
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={u.id === currentUser?.id}
                        onClick={() => setResetConfirm(u)}
                      >
                        <VpnKeyIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {u.is_active ? (
                    <Tooltip title={u.id === currentUser?.id ? t('admin.users.cannotDeactivateSelf') : t('admin.users.deactivate')}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={u.id === currentUser?.id}
                          onClick={() => setConfirmOpen({ type: 'deactivate', user: u })}
                        >
                          <BlockIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip title={t('admin.users.reactivate')}>
                      <IconButton size="small" color="success" onClick={() => setConfirmOpen({ type: 'reactivate', user: u })}>
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">{t('admin.users.noUsers')}</TableCell>
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

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={load} />

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.users.editUser')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">{editUser?.email}</Typography>
          <TextField
            label={t('signup.fullName')}
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
            required
            size="small"
            fullWidth
          />
          <FormControl fullWidth size="small">
            <InputLabel>{t('admin.users.colRole')}</InputLabel>
            <Select value={editRole} label={t('admin.users.colRole')} onChange={(e) => setEditRole(e.target.value)}>
              <MenuItem value="candidate">{t('admin.users.candidate')}</MenuItem>
              <MenuItem value="recruiter">{t('admin.users.recruiter')}</MenuItem>
              <MenuItem value="admin">{t('admin.users.admin')}</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={(
              <Switch
                checked={editActive}
                onChange={(_, v) => setEditActive(v)}
                disabled={editUser?.id === currentUser?.id}
              />
            )}
            label={t('admin.users.statusActive')}
          />
          {editUser?.id === currentUser?.id && (
            <Typography variant="caption" color="text.secondary">
              {t('admin.users.cannotDeactivateSelfHint')}
            </Typography>
          )}
          <FormControlLabel
            control={<Switch checked={editVerified} onChange={(_, v) => setEditVerified(v)} />}
            label={t('admin.users.emailVerified')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('admin.users.cancel')}</Button>
          <Button variant="contained" onClick={handleEditSave}>{t('admin.users.save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmOpen} onClose={() => setConfirmOpen(null)}>
        <DialogTitle>
          {confirmOpen?.type === 'deactivate' ? t('admin.users.confirmDeactivateTitle') : t('admin.users.confirmReactivateTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmOpen?.type === 'deactivate'
              ? t('admin.users.confirmDeactivateBody', { email: confirmOpen.user.email })
              : t('admin.users.confirmReactivateBody', { email: confirmOpen?.user.email ?? '' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(null)}>{t('admin.users.cancel')}</Button>
          <Button
            variant="contained"
            color={confirmOpen?.type === 'deactivate' ? 'error' : 'success'}
            onClick={() => {
              if (!confirmOpen) return;
              if (confirmOpen.type === 'deactivate') void handleDeactivate(confirmOpen.user.id);
              else void handleReactivate(confirmOpen.user.id);
            }}
          >
            {confirmOpen?.type === 'deactivate' ? t('admin.users.deactivate') : t('admin.users.reactivate')}
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
          <Alert severity="warning" sx={{ mb: 2 }}>{t('admin.users.newPasswordWarning')}</Alert>
          <Typography variant="body2" sx={{ mb: 1 }}>{resetResult?.email}</Typography>
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
          <Button variant="contained" onClick={() => setResetResult(null)}>{t('admin.users.done')}</Button>
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
              onChange={(e) => setForm({ ...form, role: e.target.value as 'recruiter' | 'admin' })}
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
