import type { TeamSlot as TeamSlotType } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';
import CapBadge from '../Hero/CapBadge';
import AbilityTierIcon from '../Equipment/AbilityTierIcon';
import EquipmentTooltip from '../Equipment/EquipmentTooltip';

const ITEM_ICON: Record<string, string> = {
  'Training Weights': '🏋️', 'Iron Kunai': '🗡️', 'Chakra Scroll': '📜',
  'Mana Crystal': '💎', 'Swift Boots': '👟', 'Warrior Armor': '🛡️',
  'Mystic Tome': '📖', 'Shadow Cloak': '🌑', 'Legendary Blade': '⚔️', 'Sage Staff': '📿',
};
const ITEM_TIER_COLOR: Record<string, string> = { COMMON: '#9ca3af', RARE: '#a78bfa', LEGENDARY: '#f97316' };
function itemColor(cost: number | null | undefined): string {
  if (!cost || cost < 300) return ITEM_TIER_COLOR.COMMON;
  if (cost < 600) return ITEM_TIER_COLOR.RARE;
  return ITEM_TIER_COLOR.LEGENDARY;
}
const ABILITY_TIER_COLOR: Record<number, string> = { 1: '#9ca3af', 2: '#38bdf8', 3: '#a78bfa', 4: '#fb923c', 5: '#fbbf24' };
function abilityColor(tier: number | null | undefined): string {
  return ABILITY_TIER_COLOR[tier ?? 1] ?? '#9ca3af';
}

// Inject keyframes once
if (typeof document !== 'undefined') {
  const id = 'team-slot-css';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @keyframes xpShimmer {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
      @keyframes slotXpBreathe {
        0%, 100% { filter: brightness(1); }
        50%       { filter: brightness(1.35); }
      }
      @keyframes slotLvlGlow {
        0%, 100% { background-position: 0% 0%; }
        50%       { background-position: 0% 100%; }
      }
      @keyframes slotCardPulse {
        0%, 100% { opacity: 0.5; }
        50%       { opacity: 1; }
      }
      .slot-lvl-num {
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
        animation: slotLvlGlow 2.4s ease-in-out infinite;
      }
      .slot-equip-target:hover { opacity: 0.85; }
    `;
    document.head.appendChild(el);
  }
}

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};

type TierKey = 'COMMONER' | 'ELITE' | 'LEGENDARY' | 'SUMMON';
const TIER_CFG: Record<TierKey, { label: string; color: string; glow: string; bg: string }> = {
  COMMONER:  { label: 'Commoner',  color: '#6b7280', glow: 'rgba(107,114,128,0.18)', bg: 'linear-gradient(160deg, rgba(107,114,128,0.07) 0%, rgba(10,10,24,0.97) 100%)' },
  ELITE:     { label: 'Elite',     color: '#a78bfa', glow: 'rgba(167,139,250,0.26)', bg: 'linear-gradient(160deg, rgba(167,139,250,0.10) 0%, rgba(10,10,24,0.97) 100%)' },
  LEGENDARY: { label: 'Legendary', color: '#f97316', glow: 'rgba(249,115,22,0.30)',  bg: 'linear-gradient(160deg, rgba(249,115,22,0.12) 0%, rgba(10,10,24,0.97) 100%)' },
  SUMMON:    { label: 'Summon',    color: '#38bdf8', glow: 'rgba(56,189,248,0.26)',  bg: 'linear-gradient(160deg, rgba(56,189,248,0.10) 0%, rgba(10,10,24,0.97) 100%)' },
};

interface Props {
  slot: TeamSlotType;
  onUnequip?: () => void;
  onHeroClick?: (heroId: number) => void;
  onSummonClick?: (summonId: number) => void;
  onEmptySlotClick?: () => void;
  selectedHeroTier?: string | null;
}

function isOffSlot(heroTier: string | null, slotTier: string | null): boolean {
  if (!heroTier || !slotTier) return false;
  return heroTier !== slotTier;
}

function SlotCard({ tc, children, isTarget, isOffTarget }: {
  tc: typeof TIER_CFG[TierKey];
  children: React.ReactNode;
  isTarget?: boolean;
  isOffTarget?: boolean;
}) {
  const borderColor = isOffTarget ? '#f97316' : isTarget ? '#4ade80' : tc.color + '45';
  const glow = isOffTarget ? 'rgba(249,115,22,0.25)' : isTarget ? 'rgba(74,222,128,0.2)' : tc.glow;
  return (
    <div style={{
      position: 'relative',
      borderRadius: 12,
      border: `1px solid ${borderColor}`,
      background: tc.bg,
      boxShadow: `0 4px 24px ${glow}, inset 0 0 0 1px ${tc.color}0e`,
      overflow: 'hidden',
      height: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: isOffTarget ? '#f97316' : isTarget ? '#4ade80' : tc.color,
        boxShadow: `0 0 8px ${isOffTarget ? '#f97316' : isTarget ? '#4ade80' : tc.color}`,
      }} />
      {children}
    </div>
  );
}

export default function TeamSlotComponent({ slot, onUnequip, onHeroClick, onSummonClick, onEmptySlotClick, selectedHeroTier }: Props) {

  // ── SUMMON SLOT ──────────────────────────────────────────────────────────
  if (slot.type === 'summon') {
    const summon = slot.summon;
    const tc = TIER_CFG.SUMMON;
    const xpPct = summon && summon.xpToNextLevel > 0
      ? Math.min((summon.currentXp / summon.xpToNextLevel) * 100, 100) : 0;

    return (
      <SlotCard tc={tc} isTarget={!!onEmptySlotClick && !summon}>
        <div style={{ padding: '10px 10px 8px', display: 'flex', flexDirection: 'column', gap: 0, flex: 1, marginTop: 3 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: tc.color, opacity: 0.85,
            }}>Summon</span>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
              background: tc.color + '20', border: `1px solid ${tc.color}50`, color: tc.color,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{tc.label}</span>
          </div>

          {summon ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Portrait */}
                <div
                  style={{ position: 'relative', flexShrink: 0, cursor: onSummonClick ? 'pointer' : 'default' }}
                  onClick={onSummonClick ? () => onSummonClick(summon.id) : undefined}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 6, boxShadow: `0 0 10px ${tc.glow}` }}>
                    <HeroPortrait imagePath={summon.imagePath} name={summon.name} size={50} />
                    <div style={styles.portraitXpBg}>
                      <div style={{ ...styles.portraitXpFill, width: `${xpPct}%` }} />
                      <div style={styles.xpPctLabel}>{Math.round(xpPct)}%</div>
                    </div>
                  </div>
                  <span className="slot-lvl-num" style={styles.lvlNum}>{summon.level}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div
                    style={{ color: '#e8e8f0', fontWeight: 700, fontSize: 13, cursor: onSummonClick ? 'pointer' : 'default', lineHeight: 1.2 }}
                    onClick={onSummonClick ? () => onSummonClick(summon.id) : undefined}
                  >{summon.name}</div>
                  <div style={{ alignSelf: 'flex-start' }}><CapBadge value={summon.capacity} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#44446a', fontSize: 9 }}>Magic Power</span>
                      <span style={{ color: '#60a5fa', fontSize: 10, fontWeight: 700 }}>{Math.round(summon.magicPower)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#44446a', fontSize: 9 }}>Mana</span>
                      <span style={{ color: '#818cf8', fontSize: 10, fontWeight: 700 }}>{Math.round(summon.mana)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {onUnequip && (
                <button onClick={onUnequip} style={{ ...styles.unequipBtn, borderColor: tc.color + '35', color: tc.color + 'bb', marginTop: 6 }}>
                  Unequip
                </button>
              )}
            </>
          ) : onEmptySlotClick ? (
            <button className="slot-equip-target" onClick={onEmptySlotClick} style={{
              flex: 1, minHeight: 48,
              background: 'rgba(56,189,248,0.06)', border: `1px dashed ${tc.color}70`,
              borderRadius: 6, color: tc.color, fontSize: 11, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <span style={{ fontSize: 15, opacity: 0.7 }}>+</span> Equip Summon
            </button>
          ) : (
            <div style={styles.emptyInner}>
              <span style={{ fontSize: 17, opacity: 0.15 }}>✦</span>
              <span style={{ color: '#2a2a4a', fontSize: 11, fontStyle: 'italic' }}>Empty summon slot</span>
            </div>
          )}
        </div>
      </SlotCard>
    );
  }

  // ── HERO SLOT ────────────────────────────────────────────────────────────
  const rawTier = (slot.slotTier ?? 'COMMONER') as TierKey;
  const tc = TIER_CFG[rawTier] ?? TIER_CFG.COMMONER;
  const slotIndex = rawTier === 'COMMONER' ? slot.slotNumber
    : rawTier === 'ELITE' ? slot.slotNumber - 3
    : 1;

  const isSelectTarget = !!onEmptySlotClick && !slot.hero;
  const wouldBeOffSlot = isSelectTarget && isOffSlot(selectedHeroTier ?? null, slot.slotTier);
  const offSlot = slot.hero ? isOffSlot(slot.hero.tier, slot.slotTier) : false;

  return (
    <SlotCard tc={tc} isTarget={isSelectTarget && !wouldBeOffSlot} isOffTarget={isSelectTarget && wouldBeOffSlot}>
      <div style={{ padding: '10px 10px 8px', display: 'flex', flexDirection: 'column', flex: 1, marginTop: 3 }}>

        {/* Header row: label + tier badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: tc.color, opacity: 0.85,
          }}>{tc.label} {slotIndex}</span>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
            background: tc.color + '20', border: `1px solid ${tc.color}50`, color: tc.color,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>{tc.label}</span>
        </div>

        {slot.hero ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Portrait */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <div
                  onClick={onHeroClick ? () => onHeroClick(slot.hero!.id) : undefined}
                  style={{ position: 'relative', flexShrink: 0, cursor: onHeroClick ? 'pointer' : 'default' }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 6, boxShadow: `0 0 12px ${tc.glow}` }}>
                    <HeroPortrait imagePath={slot.hero.imagePath} name={slot.hero.name} size={50} tier={slot.hero.tier} />
                    {offSlot && (
                      <div style={styles.offSlotOverlay}>
                        <span style={styles.offSlotText}>-20%</span>
                      </div>
                    )}
                    <div style={styles.portraitXpBg}>
                      <div style={{
                        ...styles.portraitXpFill,
                        width: `${slot.hero.xpToNextLevel > 0 ? Math.min((slot.hero.currentXp / slot.hero.xpToNextLevel) * 100, 100) : 0}%`,
                      }} />
                      <div style={styles.xpPctLabel}>
                        {slot.hero.xpToNextLevel > 0 ? Math.round((slot.hero.currentXp / slot.hero.xpToNextLevel) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                  <span className="slot-lvl-num" style={styles.lvlNum}>{slot.hero.level}</span>
                </div>
                <div style={{ color: '#e94560', fontWeight: 800, fontSize: 11, letterSpacing: '-0.01em', filter: 'drop-shadow(0 0 4px rgba(233,69,96,0.6))' }}>
                  ⚔ {Math.round(Object.values(slot.hero.totalStats).reduce((s, v) => s + v, 0))}
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div
                    style={{ color: '#e8e8f0', fontWeight: 700, fontSize: 13, lineHeight: 1.2, cursor: onHeroClick ? 'pointer' : 'default', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    onClick={onHeroClick ? () => onHeroClick(slot.hero!.id) : undefined}
                  >
                    {slot.hero.name}
                  </div>
                  {slot.hero.element && (
                    <span style={{ fontSize: 12, flexShrink: 0 }} title={slot.hero.element}>
                      {ELEMENT_SYMBOL[slot.hero.element] ?? slot.hero.element}
                    </span>
                  )}
                </div>
                <div style={{ alignSelf: 'flex-start' }}><CapBadge value={slot.hero.capacity} /></div>
                {offSlot && (
                  <div style={{ color: '#f87171', fontSize: 9, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span>⚠</span><span>Off-slot · -20% dmg</span>
                  </div>
                )}
                {/* Gear chips */}
                {Array.from({ length: 3 }, (_, i) => {
                  const gs = slot.hero!.equippedSlots?.find(g => g.slotNumber === i + 1)
                    ?? { slotNumber: i + 1, type: null as null, name: null as null, bonuses: undefined, tier: null as null, cost: null as null, copies: null as null };
                  if (!gs.type) {
                    return (
                      <div key={i} style={{
                        minHeight: 18, borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(255,255,255,0.012)',
                      }} />
                    );
                  }
                  const c = gs.type === 'ability' ? abilityColor(gs.tier) : itemColor(gs.cost);
                  return (
                    <EquipmentTooltip
                      key={gs.slotNumber}
                      name={gs.name ?? ''}
                      type={gs.type as 'item' | 'ability'}
                      bonuses={gs.bonuses ?? {}}
                      tier={gs.type === 'ability' ? (gs.tier ?? null) : null}
                      copies={gs.copies ?? undefined}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '2px 5px', borderRadius: 3, overflow: 'hidden',
                        border: `1px solid ${c}52`,
                        background: `linear-gradient(90deg, ${c}30 0%, ${c}09 100%)`,
                        boxShadow: `inset 2px 0 0 ${c}c0`,
                        cursor: 'default', minHeight: 18,
                      }}>
                        {gs.type === 'ability' ? (
                          <AbilityTierIcon tier={gs.tier ?? 1} size={13} />
                        ) : (
                          <span style={{ fontSize: 10, lineHeight: 1, flexShrink: 0 }}>
                            {ITEM_ICON[gs.name ?? ''] ?? '🎒'}
                          </span>
                        )}
                        <span style={{
                          color: c, fontWeight: 700, fontSize: 10,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                        }}>
                          {gs.name ?? ''}
                        </span>
                      </div>
                    </EquipmentTooltip>
                  );
                })}
              </div>
            </div>

            {onUnequip && (
              <button onClick={onUnequip} style={{ ...styles.unequipBtn, borderColor: tc.color + '35', color: tc.color + 'bb', marginTop: 6 }}>
                Unequip
              </button>
            )}
          </>
        ) : isSelectTarget ? (
          <button
            className="slot-equip-target"
            onClick={onEmptySlotClick ?? (() => {})}
            style={{
              flex: 1, minHeight: 48,
              background: wouldBeOffSlot ? 'rgba(249,115,22,0.06)' : 'rgba(74,222,128,0.06)',
              border: `1px dashed ${wouldBeOffSlot ? '#f97316' : '#4ade80'}88`,
              borderRadius: 6,
              color: wouldBeOffSlot ? '#f97316' : '#4ade80',
              fontSize: 11, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <span style={{ fontSize: 15, opacity: 0.7 }}>+</span>
            {wouldBeOffSlot ? '⚠ Off-slot — equip' : 'Click to equip'}
          </button>
        ) : (
          <div style={styles.emptyInner}>
            <span style={{ fontSize: 17, opacity: 0.12, color: tc.color }}>⬡</span>
            <span style={{ color: '#2a2a4a', fontSize: 11, fontStyle: 'italic' }}>Empty — {tc.label} slot</span>
          </div>
        )}
      </div>
    </SlotCard>
  );
}

const styles: Record<string, React.CSSProperties> = {
  portraitXpBg: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 12,
    backgroundColor: 'rgba(0,0,0,0.82)',
    border: '1px solid rgba(251,191,36,0.45)',
    overflow: 'hidden', zIndex: 4,
  },
  portraitXpFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #d97706 0%, #fbbf24 60%, #fde68a 100%)',
    boxShadow: '0 0 8px rgba(251,191,36,0.7)',
    animation: 'slotXpBreathe 2.2s ease-in-out infinite',
    transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  xpPctLabel: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.88)', fontSize: 8, fontWeight: 900,
    letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif',
    textShadow: '0 1px 2px rgba(0,0,0,0.95)', pointerEvents: 'none', zIndex: 5,
  },
  lvlNum: {
    position: 'absolute', bottom: 12, right: 5,
    transform: 'translateY(50%)', zIndex: 5,
    fontSize: 15, fontWeight: 900, fontStyle: 'italic', lineHeight: 1,
    letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif', pointerEvents: 'none',
  },
  emptyInner: {
    flex: 1, minHeight: 48,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  offSlotOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(180,30,30,0.55)',
    borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
  },
  offSlotText: {
    color: '#fff', fontWeight: 900, fontSize: 15,
    textShadow: '0 1px 4px rgba(0,0,0,0.9)', letterSpacing: 0.5,
  },
  unequipBtn: {
    padding: '5px 12px', background: 'transparent',
    border: '1px solid', borderRadius: 6,
    fontSize: 10, fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    alignSelf: 'flex-start',
  },
};
