import { useState, useRef } from 'react';
import type { BattleLogEntry, TeamResponse } from '../../types';
import { getOpponentTeam } from '../../api/arenaApi';
import TeamInspectBody, { INSPECT_CSS } from './TeamInspectBody';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  battles: BattleLogEntry[];
  onReturnChallenge: (opponentId: number) => void;
  onViewBattle: (battleId: number) => void;
  emptyMessage?: string;
}

export default function BattleLogList({ battles, onReturnChallenge, onViewBattle, emptyMessage }: Props) {
  const [teamCache, setTeamCache] = useState<Record<number, TeamResponse>>({});
  const [hoverEntry, setHoverEntry] = useState<{
    opponentId: number;
    username: string;
    pos: { top: number; left: number };
  } | null>(null);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleUsernameEnter(e: React.MouseEvent<HTMLElement>, opponentId: number, username: string) {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const popupW = 560;
    const left = rect.left >= popupW + 10
      ? rect.left - popupW - 10
      : Math.min(rect.right + 10, window.innerWidth - popupW - 8);
    const top = Math.max(8, Math.min(rect.top - 10, window.innerHeight - 430));
    setHoverEntry({ opponentId, username, pos: { top, left } });
    if (!teamCache[opponentId]) {
      getOpponentTeam(opponentId)
        .then((team) => setTeamCache((prev) => ({ ...prev, [opponentId]: team })))
        .catch(() => {});
    }
  }

  function handleUsernameLeave() {
    hoverCloseTimer.current = setTimeout(() => setHoverEntry(null), 150);
  }

  if (battles.length === 0) {
    return (
      <div style={{
        color: '#2e2e50', fontSize: 12, textAlign: 'center',
        padding: '18px 0', fontFamily: 'Inter, sans-serif', fontStyle: 'italic',
      }}>
        {emptyMessage ?? 'No battles yet.'}
      </div>
    );
  }

  return (
    <>
      <style>{INSPECT_CSS}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {battles.map((b) => {
          const isWin = b.result === 'WIN';
          const accent = isWin ? '#4ade80' : '#e94560';
          const accentRgb = isWin ? '74,222,128' : '233,69,96';

          return (
            <div
              key={b.battleId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '8px 11px',
                background: `linear-gradient(120deg, rgba(${accentRgb},0.07) 0%, rgba(10,10,24,0.55) 100%)`,
                border: `1px solid rgba(${accentRgb},0.16)`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: 8,
              }}
            >
              {/* WIN / LOSS pill */}
              <div style={{
                flexShrink: 0,
                background: `rgba(${accentRgb},0.14)`,
                border: `1px solid rgba(${accentRgb},0.32)`,
                borderRadius: 5,
                padding: '2px 6px',
                color: accent,
                fontWeight: 800,
                fontSize: 9.5,
                letterSpacing: '0.09em',
                fontFamily: 'Inter, sans-serif',
                filter: `drop-shadow(0 0 4px rgba(${accentRgb},0.45))`,
              }}>
                {b.result}
              </div>

              {/* vs + name + timestamp */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#2e2e50', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>vs</span>
                  <span
                    style={{
                      color: '#c0c0e0',
                      fontWeight: 700,
                      fontSize: 12.5,
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'default',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap' as const,
                    }}
                    onMouseEnter={(e) => handleUsernameEnter(e, b.opponentId, b.opponentUsername)}
                    onMouseLeave={handleUsernameLeave}
                  >
                    {b.opponentUsername}
                  </span>
                </div>
                <div style={{
                  color: '#2a2a4a', fontSize: 10, marginTop: 1,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {timeAgo(b.createdAt)}
                </div>
              </div>

              {/* Gold */}
              {b.goldEarned > 0 && (
                <div style={{
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 3,
                  color: '#fbbf24', fontSize: 11.5, fontWeight: 700,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" fill="#92400e" stroke="#fbbf24" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="6" fill="#fbbf24" opacity="0.25" />
                    <text x="12" y="16.5" textAnchor="middle" fill="#fef3c7" fontSize="10" fontWeight="900" fontFamily="sans-serif">G</text>
                  </svg>
                  +{b.goldEarned}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <button
                  onClick={() => onViewBattle(b.battleId)}
                  style={{
                    padding: '3px 9px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: '#555577',
                    borderRadius: 5,
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                >
                  View
                </button>
                {b.canReturnChallenge && (
                  <button
                    onClick={() => onReturnChallenge(b.opponentId)}
                    style={{
                      padding: '3px 9px',
                      background: 'rgba(233,69,96,0.12)',
                      border: '1px solid rgba(233,69,96,0.38)',
                      color: '#e94560',
                      borderRadius: 5,
                      fontSize: 10.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      filter: 'drop-shadow(0 0 5px rgba(233,69,96,0.28))',
                    }}
                  >
                    ↩ {b.returnEnergyCost ?? 4}AE
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover team inspect popup */}
      {hoverEntry && (
        <div
          style={{
            position: 'fixed',
            top: hoverEntry.pos.top,
            left: hoverEntry.pos.left,
            zIndex: 9998,
            width: 560,
            backgroundColor: '#0e0e22',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '14px 14px 12px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.88), 0 0 0 1px rgba(255,255,255,0.04)',
            pointerEvents: 'auto',
          }}
          onMouseEnter={() => { if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current); }}
          onMouseLeave={handleUsernameLeave}
        >
          {/* header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 12, paddingBottom: 10,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e1e3e, #2a2a5a)',
              border: '2px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#e0e0e0', flexShrink: 0,
            }}>
              {hoverEntry.username.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: '#e8e8f0', fontWeight: 700, fontSize: 15 }}>{hoverEntry.username}</span>
          </div>
          {teamCache[hoverEntry.opponentId] ? (
            <TeamInspectBody team={teamCache[hoverEntry.opponentId]} />
          ) : (
            <div style={{ color: '#555577', fontSize: 12, textAlign: 'center', padding: '10px 0' }}>Loading...</div>
          )}
        </div>
      )}
    </>
  );
}
