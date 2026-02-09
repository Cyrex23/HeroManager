import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  token: string | null;
  playerId: number | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (token: string, playerId: number, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [playerId, setPlayerId] = useState<number | null>(
    localStorage.getItem('playerId') ? Number(localStorage.getItem('playerId')) : null
  );
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));

  const isAuthenticated = !!token;

  const login = (newToken: string, newPlayerId: number, newUsername: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('playerId', String(newPlayerId));
    localStorage.setItem('username', newUsername);
    setToken(newToken);
    setPlayerId(newPlayerId);
    setUsername(newUsername);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('playerId');
    localStorage.removeItem('username');
    setToken(null);
    setPlayerId(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, playerId, username, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
