import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  AppBar,
  Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useAuth } from '../../contexts/useAuth';

const DRAWER_WIDTH = 240;

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: t('admin.nav.dashboard'), icon: <DashboardIcon />, path: '/admin' },
    { label: t('admin.nav.users'), icon: <PeopleIcon />, path: '/admin/users' },
    { label: t('admin.nav.auditLogs'), icon: <HistoryIcon />, path: '/admin/audit-logs' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap>
            {t('admin.title')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">{user?.full_name}</Typography>
            <LanguageSwitcher
              sx={{
                '& .MuiToggleButton-root': {
                  color: 'inherit',
                  borderColor: 'rgba(255,255,255,0.35)',
                  py: 0.25,
                },
                '& .Mui-selected': { bgcolor: 'rgba(255,255,255,0.2) !important', color: '#fff !important' },
              }}
            />
            <Button color="inherit" onClick={logout} size="small">
              {t('common.signOut')}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ my: 1 }} />
        <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', letterSpacing: '0.08em' }}>
          {t('admin.nav.previewWorkspaces')}
        </Typography>
        <List>
          <ListItemButton onClick={() => navigate('/candidate/dashboard')}>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary={t('admin.nav.candidateHub')} />
          </ListItemButton>
          <ListItemButton onClick={() => navigate('/recruiter/dashboard')}>
            <ListItemIcon>
              <WorkIcon />
            </ListItemIcon>
            <ListItemText primary={t('admin.nav.recruiterHub')} />
          </ListItemButton>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
