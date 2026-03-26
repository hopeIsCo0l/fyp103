import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import ResetPassword from './pages/ResetPassword';
import Signin from './pages/Signin';
import Signup from './pages/Signup';
import Unauthorized from './pages/Unauthorized';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
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
              path="/reset-password"
              element={
                <GuestOnly>
                  <ResetPassword />
                </GuestOnly>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
            <Route
              path="/recruiter"
              element={
                <RequireRole role="recruiter">
                  <Home />
                </RequireRole>
              }
            />
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

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Home />;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return children;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Home />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function RequireRole({ role, children }: { role: string; children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Home />;
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if ((user?.role || '').toLowerCase() !== role.toLowerCase() && user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}

export default App;
