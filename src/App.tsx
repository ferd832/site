import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DataProvider, useData } from './context/DataContext';
import { I18nProvider } from './context/I18nContext';
import Login from './components/auth/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ReleasesPage from './pages/ReleasesPage';
import ArtistsPage from './pages/ArtistsPage';
import LyricsPage from './pages/LyricsPage';
import TasksPage from './pages/TasksPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useData();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="releases" element={<ReleasesPage />} />
        <Route path="artists" element={<ArtistsPage />} />
        <Route path="lyrics" element={<LyricsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <DataProvider>
        <BrowserRouter>
          <div className="cosmic-bg" />
          <div className="stars" />
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(10, 10, 31, 0.95)',
                color: '#e2e8f0',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                backdropFilter: 'blur(20px)',
                borderRadius: '1rem',
              },
            }}
          />
        </BrowserRouter>
      </DataProvider>
    </I18nProvider>
  );
}
