import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VerifiedIcon from '@mui/icons-material/Verified';
import DevicesIcon from '@mui/icons-material/Devices';
import TodayIcon from '@mui/icons-material/Today';
import type { StatsResponse } from '../../api/admin';
import { getStats } from '../../api/admin';

type CardDef = {
  label: string;
  value: number;
  icon: ReactNode;
  navigateTo: string;
};

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError(t('admin.stats.loadError')));
  }, [t]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const cards: CardDef[] = [
    {
      label: t('admin.stats.totalUsers'),
      value: stats.total_users,
      icon: <PeopleIcon fontSize="large" color="primary" />,
      navigateTo: '/admin/users',
    },
    {
      label: t('admin.stats.candidates'),
      value: stats.candidates,
      icon: <PersonIcon fontSize="large" color="info" />,
      navigateTo: '/admin/users?role=candidate',
    },
    {
      label: t('admin.stats.recruiters'),
      value: stats.recruiters,
      icon: <WorkIcon fontSize="large" color="warning" />,
      navigateTo: '/admin/users?role=recruiter',
    },
    {
      label: t('admin.stats.admins'),
      value: stats.admins,
      icon: <AdminPanelSettingsIcon fontSize="large" color="error" />,
      navigateTo: '/admin/users?role=admin',
    },
    {
      label: t('admin.stats.verified'),
      value: stats.verified_users,
      icon: <VerifiedIcon fontSize="large" color="success" />,
      navigateTo: '/admin/users?verified=true',
    },
    {
      label: t('admin.stats.activeSessions'),
      value: stats.active_sessions,
      icon: <DevicesIcon fontSize="large" color="secondary" />,
      navigateTo: '/admin/audit-logs',
    },
    {
      label: t('admin.stats.signupsToday'),
      value: stats.signups_today,
      icon: <TodayIcon fontSize="large" color="primary" />,
      navigateTo: '/admin/users',
    },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {t('admin.nav.dashboard')}
      </Typography>
      <Grid container spacing={3}>
        {cards.map((c) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={c.label}>
            <Card variant="outlined">
              <CardActionArea onClick={() => navigate(c.navigateTo)}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {c.icon}
                  <Box>
                    <Typography variant="h4">{c.value}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {c.label}
                    </Typography>
                    <Typography variant="caption" color="primary">
                      {t('admin.stats.clickToView')}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
