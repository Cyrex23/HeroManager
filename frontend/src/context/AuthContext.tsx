import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { SESSION_EXPIRED_KEY } from '../hooks/useAFKTimeout';

interface AuthState {
  token: string | null;
  playerId: number | null;
  username: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  playerId: number | null;
  username: string | null;
  login: (token: string, playerId: number, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadAuthState(): AuthState {
  // If the session expired flag was set (e.g. user refreshed instead of clicking logout),
  // clear credentials immediately so the user is not still logged in after a refresh.
  if (localStorage.getItem(SESSION_EXPIRED_KEY)) {
    localStorage.removeItem(SESSION_EXPIRED_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('playerId');
    localStorage.removeItem('username');
    return { token: null, playerId: null, username: null };
  }
  return {
    token: localStorage.getItem('token'),
    playerId: localStorage.getItem('playerId')
      ? Number(localStorage.getItem('playerId'))
      : null,
    username: localStorage.getItem('username'),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuthState);

  const login = useCallback((token: string, playerId: number, username: string) => {
    localStorage.removeItem(SESSION_EXPIRED_KEY);
    localStorage.setItem('token', token);
    localStorage.setItem('playerId', String(playerId));
    localStorage.setItem('username', username);
    setAuth({ token, playerId, username });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_EXPIRED_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('playerId');
    localStorage.removeItem('username');
    setAuth({ token: null, playerId: null, username: null });
  }, []);

  const value: AuthContextType = {
    isAuthenticated: !!auth.token,
    token: auth.token,
    playerId: auth.playerId,
    username: auth.username,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
