import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ConfirmPage from './pages/ConfirmPage';
import TeamPage from './pages/TeamPage';
import ShopPage from './pages/ShopPage';
import ArenaPage from './pages/ArenaPage';
import BattlePage from './pages/BattlePage';
import HeroDetailPage from './pages/HeroDetailPage';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import { useAuth } from './context/AuthContext';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '20px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/confirm" element={<ConfirmPage />} />
      <Route path="/team" element={
        <ProtectedRoute>
          <AppLayout><TeamPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/shop" element={
        <ProtectedRoute>
          <AppLayout><ShopPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/arena" element={
        <ProtectedRoute>
          <AppLayout><ArenaPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/battle/:id" element={
        <ProtectedRoute>
          <AppLayout><BattlePage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/hero/:id" element={
        <ProtectedRoute>
          <AppLayout><HeroDetailPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to={isAuthenticated ? "/team" : "/login"} replace />} />
    </Routes>
  );
}
