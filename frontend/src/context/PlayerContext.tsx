import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getMe } from '../api/playerApi';
import { useAuth } from './AuthContext';
import type { PlayerResponse } from '../types';

interface PlayerContextType {
  player: PlayerResponse | null;
  loading: boolean;
  fetchPlayer: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [player, setPlayer] = useState<PlayerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPlayer = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await getMe();
      setPlayer(data);
    } catch {
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlayer();
    } else {
      setPlayer(null);
    }
  }, [isAuthenticated, fetchPlayer]);

  return (
    <PlayerContext.Provider value={{ player, loading, fetchPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
