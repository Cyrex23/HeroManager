import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ConfirmPage from './pages/ConfirmPage';
import TeamPage from './pages/TeamPage';
import ShopPage from './pages/ShopPage';
import ArenaPage from './pages/ArenaPage';
import BattlePage from './pages/BattlePage';
import HeroDetailPage from './pages/HeroDetailPage';
import AccountPage from './pages/AccountPage';

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.authWrapper}>
      {children}
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.appContainer}>
      <Navbar />
      <div style={styles.body}>
        <Sidebar />
        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
      <Route path="/confirm" element={<AuthLayout><ConfirmPage /></AuthLayout>} />

      {/* Protected routes */}
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <AppLayout><TeamPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop"
        element={
          <ProtectedRoute>
            <AppLayout><ShopPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/arena"
        element={
          <ProtectedRoute>
            <AppLayout><ArenaPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/battle/:id"
        element={
          <ProtectedRoute>
            <AppLayout><BattlePage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hero/:id"
        element={
          <ProtectedRoute>
            <AppLayout><HeroDetailPage /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <AppLayout><AccountPage /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#0f0f23',
    color: '#e0e0e0',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: 24,
  },
  authWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#0f0f23',
    color: '#e0e0e0',
  },
};
