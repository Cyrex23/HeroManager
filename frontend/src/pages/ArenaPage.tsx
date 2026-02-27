import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOpponents, challenge, getBattleLog } from '../api/arenaApi';
import { usePlayer } from '../context/PlayerContext';
import type { ArenaOpponentResponse, BattleLogEntry, ErrorResponse } from '../types';
import OpponentRow from '../components/Arena/OpponentRow';
import BattleLogList from '../components/Arena/BattleLogList';
import { AxiosError } from 'axios';

const ARENA_CSS = `
@keyframes aeGlow {
  0%, 100% { text-shadow: 0 0 8px rgba(74,222,128,0.5); }
  50%       { text-shadow: 0 0 18px rgba(74,222,128,0.95), 0 0 40px rgba(74,222,128,0.4); }
}
@keyframes aeBadgeGlow {
  0%, 100% { box-shadow: 0 0 10px rgba(74,222,128,0.12), inset 0 0 10px rgba(74,222,128,0.03); }
  50%       { box-shadow: 0 0 24px rgba(74,222,128,0.4),  inset 0 0 16px rgba(74,222,128,0.07); }
}
.ae-badge-anim { animation: aeBadgeGlow 2.5s ease-in-out infinite; }
.ae-value-anim { animation: aeGlow      2.5s ease-in-out infinite; }
`;

function SectionHeader({ label, count, color = '#e94560' }: { label: string; count?: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{
        color,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.16em',
        fontFamily: 'Inter, sans-serif',
        whiteSpace: 'nowrap',
        filter: `drop-shadow(0 0 5px ${color}60)`,
      }}>
        ◆ {label}
      </span>
      {count != null && count > 0 && (
        <span style={{
          background: `rgba(${color === '#e94560' ? '233,69,96' : '251,191,36'},0.15)`,
          border: `1px solid rgba(${color === '#e94560' ? '233,69,96' : '251,191,36'},0.3)`,
          color,
          borderRadius: 8,
          fontSize: 9,
          fontWeight: 700,
          padding: '1px 6px',
          fontFamily: 'Inter, sans-serif',
        }}>
          {count}
        </span>
      )}
      <div style={{
        flex: 1,
        height: 1,
        background: `linear-gradient(90deg, rgba(${color === '#e94560' ? '233,69,96' : '251,191,36'},0.35), transparent)`,
      }} />
    </div>
  );
}

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

  useEffect(() => { refresh(); }, [refresh]);

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

  if (loading) return (
    <div style={{ color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="spinner" style={{ width: 18, height: 18 }} />
      Loading arena...
    </div>
  );

  const received = battles.filter((b) => !b.wasChallenger);
  const sent = battles.filter((b) => b.wasChallenger);

  return (
    <div>
      <style>{ARENA_CSS}</style>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title} className="gradient-title">Arena</h2>
          <p style={styles.subtitle}>Challenge opponents and climb the ranks.</p>
        </div>
        <div style={styles.energyBox}>
          <div style={styles.energyBadge} className="ae-badge-anim">
            <span style={styles.energyIcon}>⚡</span>
            <div style={styles.energyInner}>
              <span style={styles.energyLabel}>Arena Energy</span>
              <div style={styles.energyMain}>
                <span style={styles.energyValue} className="ae-value-anim">{player?.arenaEnergy ?? 0}</span>
                <span style={styles.energySlash}>/</span>
                <span style={styles.energyMax}>{player?.arenaEnergyMax ?? 120}</span>
              </div>
            </div>
          </div>
          {(player?.arenaEnergy ?? 120) < 5 && (
            <div style={styles.energyWarning}>
              Not enough energy to challenge (min 4 AE)
              {player?.nextEnergyTickSeconds != null && player.nextEnergyTickSeconds > 0 && (
                <span> · Next +1 in {Math.floor(player.nextEnergyTickSeconds / 60)}:{(player.nextEnergyTickSeconds % 60).toString().padStart(2, '0')}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* ── Two-column layout ─────────────────────────────────── */}
      <div style={styles.twoCol}>

        {/* Left — Opponents */}
        <div style={styles.leftCol}>
          <SectionHeader label="OPPONENTS" />
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
        </div>

        {/* Right — Challenge log panel */}
        <div style={styles.rightPanel}>

          {/* Received */}
          <SectionHeader label="CHALLENGES RECEIVED" count={received.length} />
          <BattleLogList
            battles={received}
            onReturnChallenge={(id) => handleChallenge(id)}
            onViewBattle={(id) => navigate(`/battle/${id}`)}
            emptyMessage="No challenges received yet."
          />

          {/* Divider */}
          <div style={styles.panelDivider} />

          {/* Sent */}
          <SectionHeader label="CHALLENGES SENT" />
          <BattleLogList
            battles={sent}
            onReturnChallenge={(id) => handleChallenge(id)}
            onViewBattle={(id) => navigate(`/battle/${id}`)}
            emptyMessage="No challenges sent yet."
          />
        </div>

      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  title: {
    color: '#e0e0e0',
    fontSize: 24,
    margin: '0 0 4px',
  },
  subtitle: {
    color: '#2e2e50',
    fontSize: 12,
    margin: 0,
    fontFamily: 'Inter, sans-serif',
  },

  energyBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  energyBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 18px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(74,222,128,0.09) 0%, rgba(74,222,128,0.03) 100%)',
    border: '1px solid rgba(74,222,128,0.25)',
  },
  energyIcon: {
    fontSize: 24,
    filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.9))',
    lineHeight: 1,
    flexShrink: 0,
  },
  energyInner: { display: 'flex', flexDirection: 'column', gap: 1 },
  energyLabel: {
    color: '#9090c0',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  energyMain: { display: 'flex', alignItems: 'baseline', gap: 4 },
  energyValue: {
    color: '#4ade80',
    fontWeight: 900,
    fontSize: 26,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  },
  energySlash: { color: '#555577', fontWeight: 800, fontSize: 16 },
  energyMax: {
    color: '#8888aa',
    fontWeight: 800,
    fontSize: 16,
    fontVariantNumeric: 'tabular-nums',
  },
  energyWarning: {
    color: '#fbbf24',
    fontSize: 11,
    fontFamily: 'Inter, sans-serif',
  },

  error: {
    color: '#e94560',
    fontSize: 13,
    padding: '8px 14px',
    backgroundColor: 'rgba(233,69,96,0.08)',
    border: '1px solid rgba(233,69,96,0.2)',
    borderRadius: 8,
    marginBottom: 14,
    fontFamily: 'Inter, sans-serif',
  },
  muted: {
    color: '#2e2e50',
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    fontStyle: 'italic',
  },

  twoCol: {
    display: 'flex',
    gap: 18,
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: '1 1 0',
    minWidth: 0,
  },
  opponentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },

  // ── Right challenge log panel ─────────────────────────────────────────────
  rightPanel: {
    flex: '0 0 310px',
    background: 'rgba(7,6,26,0.82)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderTop: '2px solid rgba(233,69,96,0.35)',
    borderRadius: 12,
    padding: '18px 16px',
    alignSelf: 'flex-start',
    position: 'relative',
    overflow: 'visible',
  },

  panelDivider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
    margin: '18px 0',
  },
};
