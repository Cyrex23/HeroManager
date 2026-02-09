import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { PlayerInfo } from '../types';
import client from '../api/client';

interface PlayerContextType {
  player: PlayerInfo | null;
  refreshPlayer: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [player, setPlayer] = useState<PlayerInfo | null>(null);

  const refreshPlayer = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await client.get('/player/me');
      setPlayer(res.data);
    } catch {
      // handled by interceptor
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshPlayer();
  }, [refreshPlayer]);

  return (
    <PlayerContext.Provider value={{ player, refreshPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}
