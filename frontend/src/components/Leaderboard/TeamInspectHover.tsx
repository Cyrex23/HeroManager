import { useState, useRef } from 'react';
import type { TeamResponse } from '../../types';
import { getOpponentTeam } from '../../api/arenaApi';
import HeroPortrait from '../Hero/HeroPortrait';
import EquipmentTooltip from '../Equipment/EquipmentTooltip';

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '💧', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const TIER_CARD_BORDER: Record<string, string> = {
  COMMONER: '#374151',
  ELITE: '#5b3fa8',
  LEGENDARY: '#c2410c',
};

// Inject XP shimmer keyframe once (shared with OpponentRow if already present)
if (typeof document !== 'undefined') {
  const id = 'inspect-popup-css';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @keyframes xpShimmer {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
    `;
    document.head.appendChild(el);
  }
}

const PORTRAIT = 52;
const POPUP_WIDTH = 560;

interface Props {
  playerId: number;
  username: string;
  teamName: string;
  profileImagePath?: string | null;
  children: React.ReactNode;
}

export default function TeamInspectHover({
  playerId, username, teamName, profileImagePath, children,
}: Props) {
  const [show, setShow] = useState(false);
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setShow(false), 150);
  }

  async function handleEnter() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - POPUP_WIDTH - 8));
      setPopupStyle({ top: rect.bottom + 8, left, width: POPUP_WIDTH });
    }
    setShow(true);
    if (!team && !loading) {
      setLoading(true);
      try {
        const data = await getOpponentTeam(playerId);
        setTeam(data);
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div
      ref={triggerRef}
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => { cancelClose(); handleEnter(); }}
      onMouseLeave={scheduleClose}
    >
      {children}

      {show && (
        <div
          style={{ ...styles.popup, ...popupStyle }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {/* Header */}
          <div style={styles.header}>
            {profileImagePath ? (
              <HeroPortrait imagePath={profileImagePath} name={username} size={44} />
            ) : (
              <div style={styles.avatar}>{username.charAt(0).toUpperCase()}</div>
            )}
            <div style={styles.infoBlock}>
              <div style={styles.playerName}>{username}</div>
              {teamName !== username && <div style={styles.teamNameText}>{teamName}</div>}
              {team && <div style={styles.power}>⚔ {team.teamPower.toFixed(0)}</div>}
            </div>
          </div>

          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : team ? (
            <>
              {/* Hero grid */}
              <div style={styles.heroGrid}>
                {team.slots.filter((s) => s.type === 'hero').map((slot) => {
                  const h = slot.hero;
                  if (!h) {
                    return (
                      <div key={slot.slotNumber} style={styles.heroCard}>
                        <div style={styles.emptyPortrait} />
                      </div>
                    );
                  }
                  const elemColor = h.element ? (ELEMENT_COLOR[h.element] ?? '#a0a0b0') : null;
                  const elemSymbol = h.element ? (ELEMENT_SYMBOL[h.element] ?? '') : null;
                  const xpPct = h.xpToNextLevel > 0 ? Math.min((h.currentXp / h.xpToNextLevel) * 100, 100) : 100;
                  const cardBorder = h.tier ? (TIER_CARD_BORDER[h.tier] ?? '#1e1e3a') : '#1e1e3a';

                  // Build fixed 6-slot array so layout is always consistent
                  const gearSlots = Array.from({ length: 6 }, (_, i) => {
                    const sn = i + 1;
                    return (
                      h.equippedSlots?.find((g) => g.slotNumber === sn) ??
                      { slotNumber: sn, type: null, name: null, bonuses: undefined, tier: null, copies: null }
                    );
                  });

                  return (
                    <div key={slot.slotNumber} style={{ ...styles.heroCard, borderColor: cardBorder }}>
                      {/* Portrait */}
                      <div style={styles.portraitWrap}>
                        <HeroPortrait imagePath={h.imagePath} name={h.name} size={PORTRAIT} tier={h.tier} />
                        <div style={styles.lvlBadge}>{h.level}</div>
                        {elemSymbol && (
                          <div style={{ ...styles.elemBadge, color: elemColor ?? '#fff' }}>{elemSymbol}</div>
                        )}
                      </div>

                      {/* Hero name */}
                      <div style={styles.heroName}>
                        {h.name.length > 13 ? h.name.slice(0, 13) + '…' : h.name}
                      </div>

                      {/* XP bar */}
                      <div style={styles.xpBarWrap}>
                        <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }} />
                      </div>
                      <div style={styles.xpLabel}>{h.currentXp} / {h.xpToNextLevel} XP</div>

                      {/* Gear grid — always 6 slots */}
                      <div style={styles.gearGrid}>
                        {gearSlots.map((gs) =>
                          gs.type ? (
                            <EquipmentTooltip
                              key={gs.slotNumber}
                              name={gs.name ?? ''}
                              type={gs.type as 'item' | 'ability'}
                              bonuses={gs.bonuses ?? {}}
                              tier={gs.type === 'ability' ? (gs.tier ?? null) : null}
                              copies={gs.copies ?? undefined}
                            >
                              <div style={{
                                ...styles.gearSlot,
                                borderColor: gs.type === 'ability' ? '#5b3fa8' : '#1e4a8a',
                                backgroundColor: gs.type === 'ability' ? 'rgba(91,63,168,0.15)' : 'rgba(30,74,138,0.15)',
                              }}>
                                <span style={{ color: gs.type === 'ability' ? '#a78bfa' : '#60a5fa', fontWeight: 900, fontSize: 8, flexShrink: 0 }}>
                                  {gs.type === 'ability' ? 'A' : 'I'}
                                </span>
                                <span style={styles.gearSlotName}>
                                  {gs.name && gs.name.length > 9 ? gs.name.slice(0, 9) + '…' : (gs.name ?? '')}
                                </span>
                              </div>
                            </EquipmentTooltip>
                          ) : (
                            <div key={gs.slotNumber} style={styles.gearSlotEmpty} />
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summon section */}
              <div style={styles.summonRow}>
                <div style={styles.summonLabel}>SUMMON</div>
                {(() => {
                  const summonSlot = team.slots.find((s) => s.type === 'summon');
                  const s = summonSlot?.summon;
                  if (!s) return <div style={styles.emptySummon}>No summon equipped</div>;
                  const xpPct = s.xpToNextLevel > 0 ? Math.min((s.currentXp / s.xpToNextLevel) * 100, 100) : 100;
                  return (
                    <div style={styles.summonContent}>
                      <HeroPortrait imagePath={s.imagePath} name={s.name} size={38} />
                      <div style={styles.summonInfo}>
                        <div style={styles.summonTitleRow}>
                          <span style={styles.summonName}>{s.name}</span>
                          <span style={styles.summonLv}>Lv {s.level}</span>
                        </div>
                        <div style={styles.summonXpWrap}>
                          <div style={{ ...styles.summonXpFill, width: `${xpPct}%` }} />
                        </div>
                        <div style={styles.summonXpLabel}>{s.currentXp} / {s.xpToNextLevel} XP</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  popup: {
    position: 'fixed',
    backgroundColor: '#0e0e22',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '14px 14px 12px',
    zIndex: 9999,
    boxShadow: '0 8px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 44, height: 44, borderRadius: '50%',
    backgroundColor: '#16213e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 700, color: '#e0e0e0', flexShrink: 0,
    border: '2px solid #2a2a4a',
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  playerName: { color: '#e8e8f0', fontSize: 15, fontWeight: 700 },
  teamNameText: { color: '#a78bfa', fontSize: 12, fontWeight: 500 },
  power: { color: '#e94560', fontSize: 13, fontWeight: 700 },
  loading: { color: '#666', fontSize: 12, textAlign: 'center' as const, padding: '8px 0' },

  // ── Hero grid ─────────────────────────────────────────────────────────────────
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 10,
  },
  heroCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '8px 6px 6px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid #1e1e3a',
    borderRadius: 7,
    gap: 4,
  },
  portraitWrap: { position: 'relative' },
  lvlBadge: {
    position: 'absolute',
    bottom: 4, right: 3,
    backgroundColor: 'rgba(0,0,0,0.78)',
    color: '#fff',
    fontSize: 11, fontWeight: 900,
    padding: '1px 4px',
    borderRadius: 3,
    lineHeight: 1,
    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
    pointerEvents: 'none',
  },
  elemBadge: {
    position: 'absolute',
    top: 2, left: 2,
    fontSize: 11, lineHeight: 1,
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  },
  heroName: {
    color: '#c8c8de',
    fontSize: 10,
    fontWeight: 600,
    textAlign: 'center' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    width: '100%',
    letterSpacing: 0.2,
  },
  xpBarWrap: {
    width: '100%',
    height: 7,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid rgba(251,191,36,0.22)',
  },
  xpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #92400e 0%, #d97706 30%, #fbbf24 55%, #fde68a 75%, #fbbf24 100%)',
    backgroundSize: '200% 100%',
    animation: 'xpShimmer 2.5s ease-in-out infinite',
    borderRadius: 3,
    boxShadow: '0 0 7px rgba(251,191,36,0.5)',
  },
  xpLabel: {
    color: '#92691a',
    fontSize: 8,
    fontWeight: 600,
    textAlign: 'center' as const,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: 0.2,
  },
  gearGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 2,
    width: '100%',
    marginTop: 2,
  },
  gearSlot: {
    fontSize: 9,
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '3px 4px',
    border: '1px solid',
    borderRadius: 3,
    cursor: 'default',
    overflow: 'hidden',
    minHeight: 20,
  },
  gearSlotName: {
    color: '#b0b0c8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    fontSize: 9,
    flex: 1,
  },
  gearSlotEmpty: {
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 3,
    minHeight: 20,
    backgroundColor: 'rgba(255,255,255,0.012)',
  },
  emptyPortrait: {
    width: PORTRAIT,
    height: Math.round(PORTRAIT * (200 / 180)),
    backgroundColor: '#0a0a1e',
    border: '1px dashed #2a2a4a',
    borderRadius: 4,
  },

  // ── Summon row ────────────────────────────────────────────────────────────────
  summonRow: {
    paddingTop: 10,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  summonLabel: {
    color: '#4a4a6a',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  summonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  summonInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 3,
  },
  summonTitleRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  summonName: { color: '#c4b5fd', fontSize: 12, fontWeight: 600 },
  summonLv: { color: '#7c3aed', fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  summonXpWrap: {
    width: '100%',
    height: 7,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid rgba(251,191,36,0.22)',
  },
  summonXpFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #92400e 0%, #d97706 30%, #fbbf24 55%, #fde68a 75%, #fbbf24 100%)',
    backgroundSize: '200% 100%',
    animation: 'xpShimmer 2.5s ease-in-out infinite',
    borderRadius: 3,
    boxShadow: '0 0 7px rgba(251,191,36,0.5)',
  },
  summonXpLabel: {
    color: '#92691a',
    fontSize: 8,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  emptySummon: { color: '#444', fontSize: 11, fontStyle: 'italic' as const },
};
