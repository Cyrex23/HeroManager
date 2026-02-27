import type { TeamResponse } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';
import EquipmentTooltip from '../Equipment/EquipmentTooltip';

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
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

const PORTRAIT = 52;

export const INSPECT_CSS = `
  @keyframes xpShimmer {
    0%   { transform: translateX(-180%) skewX(-18deg); opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { transform: translateX(380%) skewX(-18deg); opacity: 0; }
  }
  @keyframes xpBreathe {
    0%, 100% { filter: brightness(1); }
    50%       { filter: brightness(1.35); }
  }
  @keyframes inspectLvlFlow {
    0%, 100% { background-position: 0% 0%; }
    50%       { background-position: 0% 100%; }
  }
  @keyframes fightGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(233,69,96,0.7), 0 0 22px rgba(233,69,96,0.35), 0 3px 10px rgba(0,0,0,0.6); }
    50%       { box-shadow: 0 0 18px rgba(249,115,22,0.9), 0 0 38px rgba(233,69,96,0.55), 0 3px 10px rgba(0,0,0,0.6); }
  }
  @keyframes fightPulse {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.04); }
  }
  @keyframes fightShimmer {
    0%   { transform: translateX(-120%) skewX(-15deg); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateX(320%) skewX(-15deg); opacity: 0; }
  }
  .fight-btn-popup {
    background: linear-gradient(135deg, #e94560 0%, #f97316 100%) !important;
    border: 1px solid rgba(249,115,22,0.55) !important;
    border-radius: 6px !important;
    position: relative;
    overflow: hidden;
    animation: fightGlow 1.8s ease-in-out infinite, fightPulse 1.8s ease-in-out infinite;
    letter-spacing: 0.04em;
    text-shadow: 0 1px 4px rgba(0,0,0,0.6);
    transition: filter 0.15s ease;
  }
  .fight-btn-popup::after {
    content: '';
    position: absolute;
    top: 0; bottom: 0;
    width: 38%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
    animation: fightShimmer 2.2s ease-in-out infinite;
    pointer-events: none;
  }
  .fight-btn-popup:hover { filter: brightness(1.18); }
  .fight-btn-popup:disabled { animation: none !important; filter: grayscale(0.5) opacity(0.5); }
  .inspect-lvl {
    background: linear-gradient(180deg, #c8c8c8 0%, #ff6b85 45%, #b01c32 100%);
    background-size: 100% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter:
      drop-shadow(0  1px 0 rgba(0,0,0,0.95))
      drop-shadow(0 -1px 0 rgba(0,0,0,0.85))
      drop-shadow( 1px 0 0 rgba(0,0,0,0.85))
      drop-shadow(-1px 0 0 rgba(0,0,0,0.85))
      drop-shadow(0  2px 4px rgba(0,0,0,0.75));
    animation: inspectLvlFlow 2.4s ease-in-out infinite;
  }
`;

interface Props {
  team: TeamResponse;
}

export default function TeamInspectBody({ team }: Props) {
  return (
    <>
      <style>{INSPECT_CSS}</style>

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
          const heroPower = h.totalStats
            ? Object.values(h.totalStats).reduce((s, v) => s + v, 0)
            : 0;

          const gearSlots = Array.from({ length: 3 }, (_, i) => {
            const sn = i + 1;
            return (
              h.equippedSlots?.find((g) => g.slotNumber === sn) ??
              { slotNumber: sn, type: null as null, name: null as null, bonuses: undefined as undefined, tier: null as null, copies: null as null }
            );
          });

          return (
            <div key={slot.slotNumber} style={{ ...styles.heroCard, borderColor: cardBorder }}>
              {/* Left: portrait column */}
              <div style={styles.portraitColumn}>
                <div style={styles.portraitWrap}>
                  <div style={styles.portraitClip}>
                    <HeroPortrait imagePath={h.imagePath} name={h.name} size={PORTRAIT} tier={h.tier} />
                    {elemSymbol && (
                      <div style={{ ...styles.elemBadge, color: elemColor ?? '#fff' }}>{elemSymbol}</div>
                    )}
                    <div style={styles.xpBarOverlay}>
                      <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }}>
                        {xpPct > 5 && <div style={styles.xpShimmer} />}
                      </div>
                      <div style={styles.xpBarLabel}>
                        <span style={styles.xpBarLabelText}>{Math.round(xpPct)}%</span>
                      </div>
                    </div>
                  </div>
                  <span className="inspect-lvl" style={styles.lvlBadge}>{h.level}</span>
                </div>
                <div style={styles.heroPower}>⚔ {heroPower.toFixed(0)}</div>
              </div>

              {/* Right: gear slots */}
              <div style={styles.heroCardRight}>
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
                            {gs.name && gs.name.length > 11 ? gs.name.slice(0, 11) + '…' : (gs.name ?? '')}
                          </span>
                        </div>
                      </EquipmentTooltip>
                    ) : (
                      <div key={gs.slotNumber} style={styles.gearSlotEmpty} />
                    )
                  )}
                </div>
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
              <div style={styles.portraitWrap}>
                <div style={styles.portraitClip}>
                  <HeroPortrait imagePath={s.imagePath} name={s.name} size={PORTRAIT} />
                  <div style={styles.xpBarOverlay}>
                    <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }}>
                      {xpPct > 5 && <div style={styles.xpShimmer} />}
                    </div>
                    <div style={styles.xpBarLabel}>
                      <span style={styles.xpBarLabelText}>{Math.round(xpPct)}%</span>
                    </div>
                  </div>
                </div>
                <span className="inspect-lvl" style={styles.lvlBadge}>{s.level}</span>
              </div>
              <div style={styles.summonInfo}>
                {s.teamBonus && (
                  <div style={styles.summonBonusList}>
                    {s.teamBonus.split(', ').map((bonus, i) => (
                      <div key={i} style={styles.summonBonusRow}>
                        <span style={styles.summonBonusIcon}>✦</span>
                        <span style={styles.summonBonusText}>{bonus}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 10,
  },
  heroCard: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: '8px 6px 6px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid #1e1e3a',
    borderRadius: 7,
    gap: 8,
  },
  heroCardRight: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 3,
    minWidth: 0,
  },
  portraitColumn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0 },
  portraitWrap: { position: 'relative' },
  portraitClip: { position: 'relative', overflow: 'hidden', borderRadius: 4 },
  xpBarOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.82)',
    border: '1px solid rgba(251,191,36,0.45)',
    overflow: 'hidden',
    zIndex: 4,
  },
  xpBarLabel: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    pointerEvents: 'none',
  },
  xpBarLabelText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 7,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: '0.04em',
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 1px 2px rgba(0,0,0,0.95)',
  },
  xpBarFill: {
    position: 'absolute',
    bottom: 0, left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #78350f, #d97706, #fbbf24)',
    animation: 'xpBreathe 2.2s ease-in-out infinite',
    boxShadow: '0 0 8px rgba(251,191,36,0.7), 0 0 2px rgba(251,191,36,0.7)',
    overflow: 'hidden',
    transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  xpShimmer: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: '35%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)',
    animation: 'xpShimmer 2.6s ease-in-out infinite',
  },
  lvlBadge: {
    position: 'absolute',
    bottom: 8,
    right: 4,
    transform: 'translateY(50%)',
    zIndex: 5,
    fontSize: 14,
    fontWeight: 900,
    fontStyle: 'italic',
    lineHeight: 1,
    letterSpacing: '-0.01em',
    fontFamily: 'Inter, sans-serif',
    pointerEvents: 'none',
  },
  elemBadge: {
    position: 'absolute',
    top: 2, left: 2,
    fontSize: 11, lineHeight: 1,
    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
  },
  heroPower: {
    textAlign: 'center',
    color: '#e94560',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.04em',
    width: '100%',
  },
  gearGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
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
    whiteSpace: 'nowrap',
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
  summonRow: {
    paddingTop: 10,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  summonLabel: {
    color: '#4a4a6a',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  summonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  summonInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  summonBonusList: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignSelf: 'flex-start',
    gap: 3,
    backgroundColor: 'rgba(167,139,250,0.08)',
    border: '1px solid rgba(167,139,250,0.3)',
    borderRadius: 5,
    padding: '5px 9px',
  },
  summonBonusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  summonBonusIcon: {
    color: '#a78bfa',
    fontSize: 9,
    flexShrink: 0,
  },
  summonBonusText: {
    color: '#c4b5fd',
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  emptySummon: { color: '#444', fontSize: 11, fontStyle: 'italic' },
};
