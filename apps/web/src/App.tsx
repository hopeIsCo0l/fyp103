import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import AdminSignin from './pages/AdminSignin';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import ResetPassword from './pages/ResetPassword';
import ChangePasswordRequired from './pages/ChangePasswordRequired';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Unauthorized from './pages/Unauthorized';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import RecruitLayout from './layouts/RecruitLayout';
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import CandidateJobsPage from './pages/candidate/CandidateJobsPage';
import CandidateApplicationsPage from './pages/candidate/CandidateApplicationsPage';
import CandidateProfileCompletePage from './pages/candidate/CandidateProfileCompletePage';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import RecruiterJobsPage from './pages/recruiter/RecruiterJobsPage';
import RecruiterCandidatesPage from './pages/recruiter/RecruiterCandidatesPage';
import ProfilePage from './pages/shared/ProfilePage';
import { appTheme } from './theme';

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/change-password" element={<ChangePasswordRoute />} />
            <Route
              path="/signin"
              element={
                <GuestOnly>
                  <Signin />
                </GuestOnly>
              }
            />
            <Route
              path="/signup"
              element={
                <GuestOnly>
                  <Signup />
                </GuestOnly>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestOnly>
                  <ForgotPassword />
                </GuestOnly>
              }
            />
            <Route
              path="/admin/signin"
              element={
                <GuestOnly>
                  <AdminSignin />
                </GuestOnly>
              }
            />
            <Route
              path="/reset-password"
              element={
                <GuestOnly>
                  <ResetPassword />
                </GuestOnly>
              }
            />
            <Route
              path="/candidate"
              element={
                <RequireRole role="candidate">
                  <RecruitLayout variant="candidate" />
                </RequireRole>
              }
            >
              <Route path="profile/complete" element={<CandidateProfileCompletePage />} />
              <Route element={<CandidateProfileGate />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<CandidateDashboard />} />
                <Route path="jobs" element={<CandidateJobsPage />} />
                <Route path="applications" element={<CandidateApplicationsPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route
              path="/recruiter"
              element={
                <RequireRole role="recruiter">
                  <RecruitLayout variant="recruiter" />
                </RequireRole>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<RecruiterDashboard />} />
              <Route path="jobs" element={<RecruiterJobsPage />} />
              <Route path="candidates" element={<RecruiterCandidatesPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route
              path="/admin"
              element={
                <RequireRole role="admin">
                  <AdminLayout />
                </RequireRole>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

/** Sends signed-in users to the right hub: admin → /admin, recruiter → /recruiter/dashboard, everyone else → /candidate/dashboard. */
function DashboardRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (user?.must_change_password) return <Navigate to="/change-password" replace />;
  const r = (user?.role || '').toLowerCase();
  if (r === 'admin') return <Navigate to="/admin" replace />;
  if (r === 'recruiter') return <Navigate to="/recruiter/dashboard" replace />;
  if (!user?.profile_completed && !user?.profile_completion_skipped) {
    return <Navigate to="/candidate/profile/complete" replace />;
  }
  return <Navigate to="/candidate/dashboard" replace />;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) {
    if (user?.must_change_password) return <Navigate to="/change-password" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function ChangePasswordRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!user?.must_change_password) return <Navigate to="/dashboard" replace />;
  return <ChangePasswordRequired />;
}

function RequireRole({ role, children }: { role: string; children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (user?.must_change_password) return <Navigate to="/change-password" replace />;
  const r = (user?.role || '').toLowerCase();
  const need = role.toLowerCase();
  if (r !== need && r !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

function CandidateProfileGate() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user && !user.profile_completed && !user.profile_completion_skipped) {
    return <Navigate to="/candidate/profile/complete" replace />;
  }
  return <Outlet />;
}

export default App;
