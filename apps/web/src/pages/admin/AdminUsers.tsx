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
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
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
import type { CreateUserPayload, UserOut } from '../../api/admin';
import { createUser, deleteUser, getUsers, updateUser } from '../../api/admin';

const PAGE_SIZE = 15;

export default function AdminUsers() {
  const { t } = useTranslation();
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
    load();
  };

  const handleReactivate = async (id: string) => {
    await updateUser(id, { is_active: true });
    load();
  };

  const openEdit = (u: UserOut) => {
    setEditUser(u);
    setEditRole(u.role);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    await updateUser(editUser.id, { role: editRole });
    setEditOpen(false);
    load();
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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('admin.users.colName')}</TableCell>
              <TableCell>{t('common.email')}</TableCell>
              <TableCell>{t('admin.users.colPhone')}</TableCell>
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
                <TableCell sx={{ fontSize: '0.85rem' }}>{u.phone || '—'}</TableCell>
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
                  <Tooltip title={t('admin.users.editRole')}>
                    <IconButton size="small" onClick={() => openEdit(u)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {u.is_active ? (
                    <Tooltip title={t('admin.users.deactivate')}>
                      <IconButton size="small" color="error" onClick={() => handleDeactivate(u.id)}>
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title={t('admin.users.reactivate')}>
                      <IconButton size="small" color="success" onClick={() => handleReactivate(u.id)}>
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">{t('admin.users.noUsers')}</TableCell>
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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>{t('admin.users.editRole')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>{editUser?.email}</Typography>
          <FormControl fullWidth size="small">
            <InputLabel>{t('admin.users.colRole')}</InputLabel>
            <Select value={editRole} label={t('admin.users.colRole')} onChange={(e) => setEditRole(e.target.value)}>
              <MenuItem value="candidate">{t('admin.users.candidate')}</MenuItem>
              <MenuItem value="recruiter">{t('admin.users.recruiter')}</MenuItem>
              <MenuItem value="admin">{t('admin.users.admin')}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('admin.users.cancel')}</Button>
          <Button variant="contained" onClick={handleEditSave}>{t('admin.users.save')}</Button>
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
