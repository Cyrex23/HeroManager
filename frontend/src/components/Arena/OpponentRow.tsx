import { useState } from 'react';
import type { ArenaOpponentResponse, TeamResponse } from '../../types';
import { getOpponentTeam } from '../../api/arenaApi';
import HeroPortrait from '../Hero/HeroPortrait';

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '💧', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const SLOT_LABEL: Record<number, string> = {
  1: 'C1', 2: 'C2', 3: 'C3', 4: 'E1', 5: 'E2', 6: 'L', 7: 'S',
};

const PORTRAIT = 60;

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

  return (
    <div style={{ ...styles.row, ...(isSelf ? styles.selfRow : {}) }}>
      <div style={styles.info}>
        <span style={styles.name}>
          {opponent.username}
          {isSelf && <span style={styles.youBadge}> (You)</span>}
        </span>
        <span style={{
          ...styles.statusBadge,
          backgroundColor: opponent.isOnline ? 'rgba(74, 222, 128, 0.15)' : 'rgba(102, 102, 102, 0.15)',
          color: opponent.isOnline ? '#4ade80' : '#888',
          borderColor: opponent.isOnline ? '#4ade80' : '#555',
        }}>
          <span style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            backgroundColor: opponent.isOnline ? '#4ade80' : '#666', marginRight: 4,
          }} />
          {opponent.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      <div style={styles.stats}>
        <span style={styles.power}>Power: {opponent.teamPower.toFixed(0)}</span>
        <span style={styles.heroes}>{opponent.heroCount} heroes</span>
      </div>

      <div style={styles.action}>
        {/* Inspect icon */}
        <div
          style={styles.inspectWrapper}
          onMouseEnter={handleInspectEnter}
          onMouseLeave={() => setShowInspect(false)}
        >
          <button style={styles.inspectBtn} title="Inspect team">🔍</button>

          {showInspect && (
            <div style={styles.popup}>
              <div style={styles.popupHeader}>
                <div style={styles.popupTitleRow}>
                  {opponent.profileImagePath ? (
                    <HeroPortrait imagePath={opponent.profileImagePath} name={opponent.username} size={32} />
                  ) : (
                    <div style={styles.popupAvatar}>{opponent.username.charAt(0).toUpperCase()}</div>
                  )}
                  <div style={styles.popupTitleBlock}>
                    <span style={styles.popupTitle}>{opponent.username}</span>
                    {opponent.teamName && opponent.teamName !== opponent.username && (
                      <span style={styles.popupTeamName}>{opponent.teamName}</span>
                    )}
                  </div>
                </div>
                {inspectTeam && (
                  <span style={styles.popupPower}>⚔ {inspectTeam.teamPower.toFixed(0)}</span>
                )}
              </div>

              {inspectLoading ? (
                <div style={styles.popupLoading}>Loading...</div>
              ) : inspectTeam ? (
                <>
                  <div style={styles.heroGrid}>
                    {inspectTeam.slots.filter((s) => s.type === 'hero').map((slot) => {
                      const h = slot.hero;
                      if (!h) {
                        return (
                          <div key={slot.slotNumber} style={styles.heroSlot}>
                            <div style={styles.slotLabel}>{SLOT_LABEL[slot.slotNumber]}</div>
                            <div style={styles.emptyPortrait} />
                          </div>
                        );
                      }
                      const elemColor = h.element ? (ELEMENT_COLOR[h.element] ?? '#a0a0b0') : null;
                      const elemSymbol = h.element ? (ELEMENT_SYMBOL[h.element] ?? '') : null;
                      return (
                        <div key={slot.slotNumber} style={styles.heroSlot}>
                          <div style={styles.slotLabel}>{SLOT_LABEL[slot.slotNumber]}</div>
                          <div style={styles.portraitWrap}>
                            <HeroPortrait imagePath={h.imagePath} name={h.name} size={PORTRAIT} tier={h.tier} />
                            <div style={styles.lvlBadge}>{h.level}</div>
                            {elemSymbol && (
                              <div style={{ ...styles.elemBadge, color: elemColor ?? '#fff' }}>{elemSymbol}</div>
                            )}
                            {h.xpToNextLevel > 0 && (
                              <div style={styles.xpBarOnPortrait}>
                                <div style={{ ...styles.xpBarFill, width: `${Math.min((h.currentXp / h.xpToNextLevel) * 100, 100)}%` }} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summon row — always shown */}
                  <div style={styles.summonRow}>
                    <div style={styles.slotLabel}>{SLOT_LABEL[7]}</div>
                    {(() => {
                      const summonSlot = inspectTeam.slots.find((s) => s.type === 'summon');
                      const s = summonSlot?.summon;
                      if (!s) return <div style={styles.emptySummon}>No summon</div>;
                      return (
                        <>
                          <HeroPortrait imagePath={s.imagePath} name={s.name} size={32} />
                          <div style={styles.summonName}>
                            {s.name} <span style={styles.summonLv}>Lv{s.level}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div style={styles.popupLoading}>No team data</div>
              )}
            </div>
          )}
        </div>

        {!isSelf && (
          <>
            <span style={{
              ...styles.cost,
              color: opponent.hasPendingReturn ? '#fbbf24' : opponent.isOnline ? '#4ade80' : '#a0a0b0',
            }}>
              {opponent.energyCost} AE
              {opponent.hasPendingReturn && <span style={styles.returnBadge}> Return</span>}
              {!opponent.hasPendingReturn && (
                <span style={{ fontSize: 10, color: '#888', marginLeft: 4 }}>
                  ({opponent.isOnline ? 'online' : 'offline'})
                </span>
              )}
            </span>
            <button
              onClick={onChallenge}
              disabled={disabled}
              style={{ ...styles.fightBtn, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              Fight
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    border: '1px solid #16213e',
    gap: 16,
  },
  selfRow: {
    border: '1px solid #4ade8040',
    backgroundColor: 'rgba(74, 222, 128, 0.04)',
  },
  youBadge: { color: '#4ade80', fontSize: 11, fontWeight: 400 },
  info: { display: 'flex', alignItems: 'center', minWidth: 140 },
  name: { color: '#e0e0e0', fontWeight: 600, fontSize: 14 },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 10,
    border: '1px solid',
    marginLeft: 8,
  },
  stats: { display: 'flex', gap: 16, flex: 1 },
  power: { color: '#e94560', fontSize: 13, fontWeight: 500 },
  heroes: { color: '#a0a0b0', fontSize: 13 },
  action: { display: 'flex', alignItems: 'center', gap: 12 },
  cost: { color: '#4ade80', fontSize: 13, fontWeight: 500 },
  returnBadge: { color: '#fbbf24', fontSize: 11 },
  fightBtn: {
    padding: '6px 16px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
  },

  // Inspect
  inspectWrapper: { position: 'relative' },
  inspectBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
    padding: '2px 4px',
    lineHeight: 1,
    color: '#a0a0b0',
  },
  popup: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: 440,
    backgroundColor: '#12122a',
    border: '1px solid #2a2a4a',
    borderRadius: 8,
    padding: 12,
    zIndex: 1000,
    boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
  },
  popupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1px solid #1a1a3e',
  },
  popupTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  popupTitleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  popupTeamName: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: 500,
  },
  popupAvatar: {
    width: 32, height: 32, borderRadius: '50%',
    backgroundColor: '#16213e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, color: '#e0e0e0', flexShrink: 0,
  },
  popupTitle: {
    color: '#e0e0e0',
    fontSize: 12,
    fontWeight: 700,
  },
  popupPower: {
    color: '#e94560',
    fontSize: 11,
    fontWeight: 600,
  },
  popupLoading: { color: '#666', fontSize: 12, textAlign: 'center', padding: '8px 0' },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 8,
  },
  heroSlot: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  slotLabel: {
    fontSize: 9,
    color: '#555',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  portraitWrap: { position: 'relative' },
  lvlBadge: {
    position: 'absolute',
    bottom: 5,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 800,
    padding: '1px 4px',
    borderRadius: 3,
    lineHeight: 1,
    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
    pointerEvents: 'none',
  },
  xpBarOnPortrait: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: '0 0 2px 2px',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
  },
  elemBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontSize: 10,
    lineHeight: 1,
  },
  emptyPortrait: {
    width: PORTRAIT,
    height: Math.round(PORTRAIT * (200 / 180)),
    backgroundColor: '#0d0d20',
    border: '1px dashed #2a2a4a',
    borderRadius: 4,
  },
  heroName: {
    color: '#a0a0b0',
    fontSize: 9,
    textAlign: 'center' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    width: PORTRAIT,
    maxWidth: PORTRAIT,
  },
  summonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTop: '1px solid #1a1a3e',
  },
  summonName: { color: '#a78bfa', fontSize: 12, fontWeight: 500 },
  summonLv: { color: '#666', fontSize: 10 },
  emptySummon: { color: '#444', fontSize: 11, fontStyle: 'italic' as const },
};
