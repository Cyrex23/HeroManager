import { useLocation, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
import SummonDetailPage from './pages/SummonDetailPage';
import AccountPage from './pages/AccountPage';
import LeaderboardPage from './pages/LeaderboardPage';
import InventoryPage from './pages/InventoryPage';
import NewsPage from './pages/NewsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import GameRulesPage from './pages/GameRulesPage';
import GuidePage from './pages/GuidePage';
import Footer from './components/Layout/Footer';
import ChatPanel from './components/chat/ChatPanel';

/** Animated aurora blobs — logged-in game background */
function GameBackground() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      background: 'linear-gradient(160deg, #07061a 0%, #0b0920 55%, #0f0a22 100%)',
    }}>
      <div className="game-bg-blob blob-1" />
      <div className="game-bg-blob blob-2" />
      <div className="game-bg-blob blob-3" />
      <div className="game-bg-grid" />
    </div>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.authWrapper}>
      {children}
    </div>
  );
}

/**
 * AppLayout renders ONCE and persists across all protected routes.
 * It uses <Outlet /> from React Router v6 so child pages swap in/out
 * without unmounting the layout — AnimatePresence works correctly.
 */
function AppLayout() {
  const location = useLocation();
  return (
    <div style={styles.appContainer}>
      <GameBackground />
      <Navbar />
      <div style={styles.body}>
        <Sidebar />
        <main className="app-main" style={styles.main}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Footer />
      <ChatPanel />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes — auth pages have their own internal motion */}
      <Route path="/login"    element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />
      <Route path="/confirm"  element={<AuthLayout><ConfirmPage /></AuthLayout>} />
      <Route path="/reset-password" element={<AuthLayout><ResetPasswordPage /></AuthLayout>} />
      <Route path="/about"    element={<AboutPage />} />
      <Route path="/privacy"  element={<PrivacyPage />} />
      <Route path="/terms"    element={<TermsPage />} />
      <Route path="/rules"    element={<GameRulesPage />} />

      {/* Protected layout — AppLayout renders once, only Outlet content changes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/team"        element={<TeamPage />} />
        <Route path="/shop"        element={<ShopPage />} />
        <Route path="/arena"       element={<ArenaPage />} />
        <Route path="/battle/:id"  element={<BattlePage />} />
        <Route path="/hero/:id"    element={<HeroDetailPage />} />
        <Route path="/summon/:id"  element={<SummonDetailPage />} />
        <Route path="/account"     element={<AccountPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/inventory"   element={<InventoryPage />} />
        <Route path="/news"        element={<NewsPage />} />
        <Route path="/guide"       element={<GuidePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    color: '#e0e0e0',
    position: 'relative',
    zIndex: 1,
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
    position: 'relative',
  },
  authWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    color: '#e0e0e0',
    position: 'relative',
    overflow: 'hidden',
  },
};
