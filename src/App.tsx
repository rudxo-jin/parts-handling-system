import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NewPartRequest from './pages/NewPartRequest';
import MultiPartRequest from './pages/MultiPartRequest';
import UserManagement from './pages/UserManagement';
import BranchManagement from './pages/BranchManagement';
import PurchaseRequests from './pages/PurchaseRequests';
import SimpleNotificationSettings from './components/SimpleNotificationSettings';
import AdminSettings from './pages/AdminSettings';
import SystemTest from './components/SystemTest';
import PerformanceDashboard from './components/PerformanceDashboard';
import BundleAnalyzer from './components/BundleAnalyzer';
import SecurityChecker from './components/SecurityChecker';
import { GlobalLoadingOverlay } from './components/LoadingOverlay';
import ToastContainer from './components/ToastContainer';
import ConfirmDialog from './components/ConfirmDialog';
import PWAInstall from './components/PWAInstall';

// Service Worker 등록
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[SW] Service Worker 등록 성공:', registration.scope);
        
        // 업데이트 확인
        registration.addEventListener('updatefound', () => {
          console.log('[SW] 새 Service Worker 발견');
        });
      })
      .catch(error => {
        console.log('[SW] Service Worker 등록 실패:', error);
      });
  });
}

// Material-UI 테마 설정
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/new-part-request" element={
          <ProtectedRoute>
            <NewPartRequest />
          </ProtectedRoute>
        } />
        <Route path="/multi-part-request" element={
          <ProtectedRoute>
            <MultiPartRequest />
          </ProtectedRoute>
        } />
        <Route path="/purchase-requests" element={
          <ProtectedRoute>
            <PurchaseRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/branches" element={
          <ProtectedRoute>
            <BranchManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>
        } />
        <Route path="/admin/system-test" element={
          <ProtectedRoute>
            <SystemTest />
          </ProtectedRoute>
        } />
        <Route path="/settings/notifications" element={
          <ProtectedRoute>
            <SimpleNotificationSettings />
          </ProtectedRoute>
        } />
        <Route path="/admin/performance" element={
          <ProtectedRoute>
            <PerformanceDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/bundle-analyzer" element={
          <ProtectedRoute>
            <BundleAnalyzer />
          </ProtectedRoute>
        } />
        <Route path="/admin/security" element={
          <ProtectedRoute>
            <SecurityChecker />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppRoutes />
            
            {/* 전역 UI 컴포넌트들 */}
            <GlobalLoadingOverlay />
            <ToastContainer />
            <ConfirmDialog />
            <PWAInstall />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
