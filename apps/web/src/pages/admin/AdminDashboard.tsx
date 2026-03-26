import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VerifiedIcon from '@mui/icons-material/Verified';
import DevicesIcon from '@mui/icons-material/Devices';
import TodayIcon from '@mui/icons-material/Today';
import type { StatsResponse } from '../../api/admin';
import { getStats } from '../../api/admin';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch(() => setError(t('admin.stats.loadError')));
  }, [t]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return <Box sx={{ textAlign: 'center', mt: 4 }}><CircularProgress /></Box>;

  const cards = [
    { label: t('admin.stats.totalUsers'), value: stats.total_users, icon: <PeopleIcon fontSize="large" color="primary" /> },
    { label: t('admin.stats.candidates'), value: stats.candidates, icon: <PersonIcon fontSize="large" color="info" /> },
    { label: t('admin.stats.recruiters'), value: stats.recruiters, icon: <WorkIcon fontSize="large" color="warning" /> },
    { label: t('admin.stats.admins'), value: stats.admins, icon: <AdminPanelSettingsIcon fontSize="large" color="error" /> },
    { label: t('admin.stats.verified'), value: stats.verified_users, icon: <VerifiedIcon fontSize="large" color="success" /> },
    { label: t('admin.stats.activeSessions'), value: stats.active_sessions, icon: <DevicesIcon fontSize="large" color="secondary" /> },
    { label: t('admin.stats.signupsToday'), value: stats.signups_today, icon: <TodayIcon fontSize="large" color="primary" /> },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>{t('admin.nav.dashboard')}</Typography>
      <Grid container spacing={3}>
        {cards.map((c) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={c.label}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {c.icon}
                <Box>
                  <Typography variant="h4">{c.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
