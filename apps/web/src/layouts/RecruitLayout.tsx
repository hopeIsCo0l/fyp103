import {
  AppBar,
  Box,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../contexts/useAuth';

const DRAWER_WIDTH = 268;

export type RecruitVariant = 'candidate' | 'recruiter';

type NavItem = { labelKey: string; path: string; icon: ReactNode };

export default function RecruitLayout({ variant }: { variant: RecruitVariant }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const base = variant === 'candidate' ? '/candidate' : '/recruiter';

  const candidateNav: NavItem[] = [
    { labelKey: 'recruit.nav.dashboard', path: `${base}/dashboard`, icon: <DashboardIcon /> },
    { labelKey: 'recruit.nav.jobs', path: `${base}/jobs`, icon: <WorkIcon /> },
    { labelKey: 'recruit.nav.applications', path: `${base}/applications`, icon: <AssignmentIcon /> },
    { labelKey: 'recruit.nav.profile', path: `${base}/profile`, icon: <PersonIcon /> },
  ];

  const recruiterNav: NavItem[] = [
    { labelKey: 'recruit.nav.dashboard', path: `${base}/dashboard`, icon: <DashboardIcon /> },
    { labelKey: 'recruit.nav.jobPostings', path: `${base}/jobs`, icon: <WorkIcon /> },
    { labelKey: 'recruit.nav.candidates', path: `${base}/candidates`, icon: <GroupIcon /> },
    { labelKey: 'recruit.nav.profile', path: `${base}/profile`, icon: <PersonIcon /> },
  ];

  const navItems = variant === 'candidate' ? candidateNav : recruiterNav;

  const drawer = (
    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
      <Box sx={{ px: 2.5, pb: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.12em' }}>
          {t('recruit.workspace')}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>
          {variant === 'candidate' ? t('recruit.candidateHub') : t('recruit.recruiterHub')}
        </Typography>
      </Box>
      <List sx={{ px: 1, flex: '1 1 auto' }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'inherit' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={t(item.labelKey)} />
          </ListItemButton>
        ))}
      </List>
      {user?.role === 'admin' && (
        <Box sx={{ px: 2, pt: 2, pb: 2, mt: 'auto' }}>
          <ListItemButton
            onClick={() => {
              navigate('/admin');
              setMobileOpen(false);
            }}
            sx={{ borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}
          >
            <ListItemText primary={t('recruit.adminPanel')} />
          </ListItemButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isSmUp && (
              <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} aria-label="menu">
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap component="span" sx={{ fontWeight: 700 }}>
              {t('common.appName')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <Chip
              size="small"
              label={(user?.role || '').toLowerCase()}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'inherit',
                fontWeight: 600,
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />
            <Typography variant="body2" noWrap sx={{ maxWidth: 140, display: { xs: 'none', md: 'block' } }}>
              {user?.full_name}
            </Typography>
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
            <Typography
              component="button"
              type="button"
              onClick={() => logout()}
              sx={{
                ml: 0.5,
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                font: 'inherit',
                fontWeight: 600,
              }}
            >
              {t('common.signOut')}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            },
          }}
          open
        >
          <Toolbar />
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          pt: { xs: 10, sm: 11 },
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          maxWidth: 1200,
          mx: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
