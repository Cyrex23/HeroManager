import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpponents, challenge, getBattleLog } from '../api/arenaApi';
import { usePlayer } from '../context/PlayerContext';
import type { ArenaOpponentResponse, BattleLogEntry, ErrorResponse } from '../types';
import OpponentRow from '../components/Arena/OpponentRow';
import BattleLogList from '../components/Arena/BattleLogList';
import { AxiosError } from 'axios';

export default function ArenaPage() {
  const [opponents, setOpponents] = useState<ArenaOpponentResponse[]>([]);
  const [battles, setBattles] = useState<BattleLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fighting, setFighting] = useState(false);
  const { player, fetchPlayer } = usePlayer();
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const [opData, logData] = await Promise.all([
        getOpponents(),
        getBattleLog(),
      ]);
      setOpponents(opData.opponents);
      setBattles(logData.battles);
    } catch {
      setError('Failed to load arena data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleChallenge(defenderId: number) {
    setError('');
    setFighting(true);
    try {
      const result = await challenge({ defenderId });
      await fetchPlayer();
      navigate(`/battle/${result.battleId}`, { state: { battleResult: result } });
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Challenge failed.');
      setFighting(false);
    }
  }

  if (loading) return <div style={{ color: '#a0a0b0' }}>Loading arena...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Arena</h2>
        <div style={styles.energyBox}>
          <div style={styles.energyMain}>
            <span style={styles.energyIcon}>&#9889;</span>
            <span style={styles.energyValue}>{player?.arenaEnergy ?? 0}</span>
            <span style={styles.energyMax}>/ {player?.arenaEnergyMax ?? 120}</span>
          </div>
          {(player?.arenaEnergy ?? 120) < 5 && (
            <div style={styles.energyWarning}>
              Not enough energy to challenge (min 4 AE)
              {player?.nextEnergyTickSeconds != null && player.nextEnergyTickSeconds > 0 && (
                <span> &middot; Next +1 in {Math.floor(player.nextEnergyTickSeconds / 60)}:{(player.nextEnergyTickSeconds % 60).toString().padStart(2, '0')}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <h3 style={styles.subtitle}>Opponents</h3>
      {opponents.length === 0 ? (
        <p style={styles.muted}>No opponents available yet.</p>
      ) : (
        <div style={styles.opponentList}>
          {opponents.map((op) => (
            <OpponentRow
              key={op.playerId}
              opponent={op}
              onChallenge={() => handleChallenge(op.playerId)}
              disabled={fighting || (player?.arenaEnergy ?? 0) < op.energyCost}
              isSelf={op.playerId === player?.id}
            />
          ))}
        </div>
      )}

      <h3 style={styles.subtitle}>Battle Log</h3>
      <BattleLogList
        battles={battles}
        onReturnChallenge={(opponentId) => handleChallenge(opponentId)}
        onViewBattle={(battleId) => navigate(`/battle/${battleId}`)}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#e0e0e0',
    fontSize: 22,
    margin: 0,
  },
  energyBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  energyMain: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  energyIcon: {
    fontSize: 16,
  },
  energyValue: {
    color: '#4ade80',
    fontWeight: 700,
    fontSize: 20,
  },
  energyMax: {
    color: '#a0a0b0',
    fontSize: 14,
  },
  energyWarning: {
    color: '#fbbf24',
    fontSize: 11,
  },
  subtitle: {
    color: '#e0e0e0',
    marginTop: 28,
    marginBottom: 12,
    fontSize: 16,
  },
  error: {
    color: '#e94560',
    fontSize: 13,
    padding: '8px 12px',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderRadius: 4,
    marginBottom: 12,
  },
  muted: {
    color: '#666',
    fontSize: 13,
  },
  opponentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
};
