import { useLocation, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { LogIn, Clock } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { ProtectedRoute, useAuth } from './context/AuthContext';
import { useAFKTimeout } from './hooks/useAFKTimeout';
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
import LegalPage from './pages/LegalPage';
import GuidePage from './pages/GuidePage';
import BlacksmithPage from './pages/BlacksmithPage';
import HomePage from './pages/HomePage';
import Footer from './components/Layout/Footer';
import ChatPanel from './components/chat/ChatPanel';
import LevelUpNotification from './components/LevelUpNotification';

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
function SessionExpiredModal({ onLogin }: { onLogin: () => void }) {
  const { t } = useLanguage();
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalCard}>
        <Clock size={44} color="#fbbf24" style={{ marginBottom: 12 }} />
        <h2 style={styles.modalTitle}>{t('session_expired_title')}</h2>
        <p style={styles.modalText}>{t('session_expired_body')}</p>
        <button style={styles.modalBtn} onClick={onLogin}>
          <LogIn size={16} style={{ marginRight: 8 }} />
          {t('session_expired_btn')}
        </button>
      </div>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const [sessionExpired, setSessionExpired] = useState(false);

  useAFKTimeout(() => setSessionExpired(true));

  useEffect(() => {
    const handler = () => setSessionExpired(true);
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

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
      <LevelUpNotification />
      {sessionExpired && <SessionExpiredModal onLogin={logout} />}
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
      <Route path="/legal"    element={<LegalPage />} />

      {/* Protected layout — AppLayout renders once, only Outlet content changes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/home"        element={<HomePage />} />
        <Route path="/team"        element={<TeamPage />} />
        <Route path="/shop"        element={<ShopPage />} />
        <Route path="/blacksmith"  element={<BlacksmithPage />} />
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

      <Route path="/"   element={<Navigate to="/home" replace />} />
      <Route path="*"   element={<Navigate to="/login" replace />} />
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
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    background: 'linear-gradient(160deg, #12112a 0%, #1a1835 100%)',
    border: '1px solid rgba(251,191,36,0.35)',
    borderRadius: 16,
    padding: '40px 48px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 0,
    boxShadow: '0 0 40px rgba(251,191,36,0.15)',
    maxWidth: 380,
    width: '90%',
    textAlign: 'center' as const,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fbbf24',
    margin: '0 0 10px',
  },
  modalText: {
    fontSize: 14,
    color: '#a0a0b0',
    margin: '0 0 28px',
    lineHeight: 1.6,
  },
  modalBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#0d0d1a',
    fontWeight: 700,
    fontSize: 15,
    border: 'none',
    borderRadius: 8,
    padding: '11px 32px',
    cursor: 'pointer',
    letterSpacing: '0.03em',
  },
};
