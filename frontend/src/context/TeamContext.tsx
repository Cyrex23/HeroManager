import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { getTeam } from '../api/teamApi';
import { useAuth } from './AuthContext';
import type { TeamResponse } from '../types';

interface TeamContextType {
  team: TeamResponse | null;
  refreshTeam: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [team, setTeam] = useState<TeamResponse | null>(null);

  const refreshTeam = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await getTeam();
      setTeam(data);
    } catch {
      /* non-fatal */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshTeam();
    } else {
      setTeam(null);
    }
  }, [isAuthenticated, refreshTeam]);

  return (
    <TeamContext.Provider value={{ team, refreshTeam }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam(): TeamContextType {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
