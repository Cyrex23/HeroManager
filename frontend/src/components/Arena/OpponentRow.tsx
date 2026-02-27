import { useState, useRef } from 'react';
import type { ArenaOpponentResponse, TeamResponse } from '../../types';
import { getOpponentTeam } from '../../api/arenaApi';
import HeroPortrait from '../Hero/HeroPortrait';
import TeamInspectBody, { INSPECT_CSS } from './TeamInspectBody';

const ROW_CSS = `
  @keyframes fightGlow {
    0%, 100% { box-shadow: 0 2px 14px rgba(233,69,96,0.35), inset 0 1px 0 rgba(255,255,255,0.08); }
    50%       { box-shadow: 0 3px 24px rgba(233,69,96,0.65), 0 0 36px rgba(233,69,96,0.18), inset 0 1px 0 rgba(255,255,255,0.10); }
  }
  @keyframes returnGlow {
    0%, 100% { box-shadow: 0 2px 10px rgba(251,191,36,0.25); }
    50%       { box-shadow: 0 3px 20px rgba(251,191,36,0.55), 0 0 30px rgba(251,191,36,0.15); }
  }
  .fight-btn-glow { animation: fightGlow 2.2s ease-in-out infinite; }
  .fight-btn-glow:hover { filter: brightness(1.1); }
  .fight-btn-glow:disabled { animation: none !important; box-shadow: none !important; }
  .return-btn-glow { animation: returnGlow 2.2s ease-in-out infinite; }
  .fight-btn-popup {
    background: linear-gradient(135deg, #b91c3a, #e94560) !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 14px rgba(233,69,96,0.4) !important;
    cursor: pointer;
    transition: filter 0.15s;
  }
  .fight-btn-popup:hover { filter: brightness(1.12); }
  .fight-btn-popup:disabled { opacity: 0.5 !important; cursor: not-allowed !important; animation: none !important; }
  .op-row {
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .op-row:hover {
    border-color: rgba(255,255,255,0.12) !important;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4) !important;
  }
`;

interface Props {
  opponent: ArenaOpponentResponse;
  onChallenge: () => void;
  disabled?: boolean;
  isSelf?: boolean;
}

export default function OpponentRow({ opponent, onChallenge, disabled, isSelf }: Props) {
  const [showInspect, setShowInspect] = useState(false);
  const [inspectTeam, setInspectTeam] = useState<TeamResponse | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const inspectCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleInspectEnter() {
    setShowInspect(true);
    if (!inspectTeam && !inspectLoading) {
      setInspectLoading(true);
      try {
        const team = await getOpponentTeam(opponent.playerId);
        setInspectTeam(team);
      } catch {
        // non-fatal
      } finally {
        setInspectLoading(false);
      }
    }
  }

  const isOnline = opponent.isOnline;
  const hasReturn = opponent.hasPendingReturn;

  return (
    <div
      className="op-row"
      style={{
        ...styles.row,
        ...(isSelf ? styles.selfRow : {}),
        ...(hasReturn && !isSelf ? styles.returnRow : {}),
      }}
    >
      <style>{ROW_CSS}</style>

      {/* Online indicator strip */}
      <div style={{
        width: 3, alignSelf: 'stretch', borderRadius: 2, flexShrink: 0,
        background: isOnline
          ? 'linear-gradient(180deg, #4ade80, rgba(74,222,128,0.3))'
          : 'rgba(255,255,255,0.06)',
        boxShadow: isOnline ? '0 0 8px rgba(74,222,128,0.6)' : 'none',
      }} />

      {/* Info block */}
      <div style={styles.info}>
        <div style={styles.nameRow}>
          <span style={styles.name}>
            {opponent.username}
            {isSelf && <span style={styles.youBadge}> (You)</span>}
          </span>
          {opponent.teamName && opponent.teamName !== opponent.username && (
            <span style={styles.teamName}>{opponent.teamName}</span>
          )}
        </div>
        <div style={styles.meta}>
          <span style={styles.statusDot}>
            <span style={{
              display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
              background: isOnline ? '#4ade80' : '#444466',
              boxShadow: isOnline ? '0 0 5px rgba(74,222,128,0.8)' : 'none',
              flexShrink: 0,
            }} />
            <span style={{ color: isOnline ? '#4ade80' : '#444466', fontSize: 10, fontFamily: 'Inter, sans-serif' }}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </span>
          <span style={styles.separator}>·</span>
          <span style={styles.heroCount}>{opponent.heroCount} heroes</span>
        </div>
      </div>

      {/* Power */}
      <div style={styles.powerBlock}>
        <span style={styles.powerLabel}>Power</span>
        <span style={styles.powerValue}>{opponent.teamPower.toFixed(0)}</span>
      </div>

      {/* W/L record */}
      <div style={styles.recordBlock}>
        <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{opponent.wins}W</span>
        <span style={{ color: '#333355', fontSize: 11 }}>/</span>
        <span style={{ color: '#e94560', fontWeight: 700, fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{opponent.losses}L</span>
      </div>

      {/* Actions */}
      <div style={styles.action}>
        {/* Inspect icon */}
        <div
          style={styles.inspectWrapper}
          onMouseEnter={() => {
            if (inspectCloseTimer.current) clearTimeout(inspectCloseTimer.current);
            handleInspectEnter();
          }}
          onMouseLeave={() => {
            inspectCloseTimer.current = setTimeout(() => setShowInspect(false), 150);
          }}
        >
          <button style={styles.inspectBtn} title="Inspect team">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {showInspect && (
            <div
              style={styles.popup}
              onMouseEnter={() => { if (inspectCloseTimer.current) clearTimeout(inspectCloseTimer.current); }}
              onMouseLeave={() => { inspectCloseTimer.current = setTimeout(() => setShowInspect(false), 150); }}
            >
              <style>{INSPECT_CSS}</style>

              {/* Header */}
              <div style={styles.popupHeader}>
                {opponent.profileImagePath ? (
                  <HeroPortrait imagePath={opponent.profileImagePath} name={opponent.username} size={50} />
                ) : (
                  <div style={styles.popupAvatar}>{opponent.username.charAt(0).toUpperCase()}</div>
                )}
                <div style={styles.popupInfo}>
                  <div style={styles.popupTitle}>
                    {opponent.username}
                    {isSelf && <span style={styles.youBadge}> (You)</span>}
                  </div>
                  {opponent.teamName && opponent.teamName !== opponent.username && (
                    <div style={styles.popupTeamName}>{opponent.teamName}</div>
                  )}
                  <div style={styles.popupRecord}>
                    <span style={{ color: '#4ade80' }}>{opponent.wins}W</span>
                    {' / '}
                    <span style={{ color: '#e94560' }}>{opponent.losses}L</span>
                    {(opponent.wins + opponent.losses) > 0 && (
                      <span style={{ color: '#444466', marginLeft: 5 }}>
                        ({Math.round((opponent.wins / (opponent.wins + opponent.losses)) * 100)}%)
                      </span>
                    )}
                  </div>
                  {inspectTeam && (
                    <div style={styles.popupPower}>⚔ {inspectTeam.teamPower.toFixed(0)}</div>
                  )}
                </div>
                <div style={styles.popupActions}>
                  {!isSelf && (
                    <button
                      className="fight-btn-popup"
                      onClick={onChallenge}
                      disabled={disabled}
                      style={{
                        ...styles.fightBtnPopup,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                      }}
                    >
                      {hasReturn ? '↩ Return' : '⚔ Fight'}
                      <span style={{ fontSize: 11, marginLeft: 5, opacity: 0.85 }}>{opponent.energyCost} AE</span>
                    </button>
                  )}
                </div>
              </div>

              {inspectLoading ? (
                <div style={styles.popupLoading}>Loading...</div>
              ) : inspectTeam ? (
                <TeamInspectBody team={inspectTeam} />
              ) : (
                <div style={styles.popupLoading}>No team data</div>
              )}
            </div>
          )}
        </div>

        {/* Energy cost */}
        {!isSelf && (
          <div style={styles.energyCostWrap}>
            <span style={{
              color: hasReturn ? '#fbbf24' : isOnline ? '#4ade80' : '#555577',
              fontWeight: 700, fontSize: 12, fontFamily: 'Inter, sans-serif',
            }}>
              {opponent.energyCost} AE
            </span>
            {hasReturn && (
              <span style={{
                fontSize: 9, color: '#fbbf24', fontWeight: 700,
                fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em',
              }}>RETURN</span>
            )}
          </div>
        )}

        {/* Fight button */}
        {!isSelf && (
          <button
            onClick={onChallenge}
            disabled={disabled}
            className={disabled ? '' : (hasReturn ? 'return-btn-glow' : 'fight-btn-glow')}
            style={{
              ...styles.fightBtn,
              background: hasReturn
                ? 'linear-gradient(135deg, #a16207, #d97706)'
                : 'linear-gradient(135deg, #b91c3a, #e94560)',
              opacity: disabled ? 0.45 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            {hasReturn ? '↩ Return' : 'Fight'}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '11px 14px 11px 10px',
    background: 'linear-gradient(135deg, rgba(20,20,44,0.9) 0%, rgba(10,10,24,0.75) 100%)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.07)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
  },
  selfRow: {
    border: '1px solid rgba(74,222,128,0.18)',
    background: 'linear-gradient(135deg, rgba(74,222,128,0.06) 0%, rgba(10,10,24,0.75) 100%)',
  },
  returnRow: {
    border: '1px solid rgba(251,191,36,0.18)',
    background: 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(10,10,24,0.75) 100%)',
  },
  youBadge: { color: '#4ade80', fontSize: 11, fontWeight: 500 },

  info: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 },
  nameRow: { display: 'flex', alignItems: 'center', gap: 8 },
  name: { color: '#e0e0f0', fontWeight: 700, fontSize: 14, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' },
  teamName: { color: '#a78bfa', fontSize: 11, fontWeight: 500, fontFamily: 'Inter, sans-serif' },
  meta: { display: 'flex', alignItems: 'center', gap: 6 },
  statusDot: { display: 'flex', alignItems: 'center', gap: 4 },
  separator: { color: '#22224a', fontSize: 10 },
  heroCount: { color: '#3a3a5a', fontSize: 10, fontFamily: 'Inter, sans-serif' },

  powerBlock: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0,
  },
  powerLabel: { color: '#444466', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' },
  powerValue: { color: '#e94560', fontWeight: 800, fontSize: 16, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em', lineHeight: 1, filter: 'drop-shadow(0 0 6px rgba(233,69,96,0.5))' },

  recordBlock: {
    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 7, padding: '4px 8px',
  },

  action: { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  inspectWrapper: { position: 'relative' },
  inspectBtn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 7,
    cursor: 'pointer',
    padding: '5px 7px',
    color: '#555577',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'color 0.15s, border-color 0.15s',
  },

  energyCostWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
  },

  fightBtn: {
    padding: '7px 18px',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: '0.03em',
    fontFamily: 'Inter, sans-serif',
  },

  // ── Inspect popup ────────────────────────────────────────────────────────────
  popup: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 560,
    backgroundColor: '#0e0e22',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '14px 14px 12px',
    zIndex: 1000,
    boxShadow: '0 8px 48px rgba(0,0,0,0.88), 0 0 0 1px rgba(255,255,255,0.04)',
  },
  popupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  popupAvatar: {
    width: 50, height: 50, borderRadius: '50%',
    background: 'linear-gradient(135deg, #1a1a3e, #2a2a5a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 700, color: '#e0e0e0', flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.08)',
  },
  popupInfo: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 },
  popupTitle: { color: '#e8e8f0', fontSize: 16, fontWeight: 800, fontFamily: 'Inter, sans-serif' },
  popupTeamName: { color: '#a78bfa', fontSize: 12, fontWeight: 500 },
  popupRecord: { fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif' },
  popupPower: { color: '#e94560', fontSize: 15, fontWeight: 700 },
  popupActions: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  fightBtnPopup: {
    padding: '9px 20px',
    color: '#fff',
    border: 'none',
    fontSize: 13,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.04em',
  },
  popupLoading: { color: '#333355', fontSize: 12, textAlign: 'center', padding: '8px 0' },
};
