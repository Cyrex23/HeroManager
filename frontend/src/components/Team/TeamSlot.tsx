import type { TeamSlot as TeamSlotType } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';
import CapBadge from '../Hero/CapBadge';

// Inject XP + level keyframes once
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
    `;
    document.head.appendChild(el);
  }
}

const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const SLOT_TIER_LABEL: Record<string, string> = {
  COMMONER: 'Commoner', ELITE: 'Elite', LEGENDARY: 'Legendary',
};
const SLOT_TIER_COLOR: Record<string, string> = {
  COMMONER: '#6b7280', ELITE: '#a78bfa', LEGENDARY: '#f97316',
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

function EmptyTarget({ offSlot, onClick }: Readonly<{ offSlot: boolean; onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      style={offSlot ? styles.emptyTargetOffSlot : styles.emptyTarget}
      type="button"
    >
      {offSlot ? '⚠ Off-slot — Click to equip' : 'Click to equip'}
    </button>
  );
}

export default function TeamSlotComponent({ slot, onUnequip, onHeroClick, onSummonClick, onEmptySlotClick, selectedHeroTier }: Props) {
  if (slot.type === 'summon') {
    const summon = slot.summon;
    const xpPct = summon && summon.xpToNextLevel > 0
      ? Math.min((summon.currentXp / summon.xpToNextLevel) * 100, 100) : 0;
    const emptySummonContent = onEmptySlotClick
      ? <EmptyTarget offSlot={false} onClick={onEmptySlotClick} />
      : <div style={styles.empty}>Empty summon slot</div>;

    return (
      <div style={{ ...styles.slot, boxShadow: onEmptySlotClick && !summon ? '0 0 8px #4ade8060' : undefined, borderColor: onEmptySlotClick && !summon ? '#4ade80' : undefined }}>
        <div style={styles.slotLabel}>Summon</div>
        {summon ? (
          <div style={styles.filled}>
            <div
              style={{ position: 'relative', ...(onSummonClick ? { cursor: 'pointer' } : {}) }}
              onClick={onSummonClick ? () => onSummonClick(summon.id) : undefined}
            >
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
                <HeroPortrait imagePath={summon.imagePath} name={summon.name} size={60} />
                <div style={styles.portraitXpBg}>
                  <div style={{ ...styles.portraitXpFill, width: `${xpPct}%` }} />
                  <div style={styles.xpPctLabel}>{Math.round(xpPct)}%</div>
                </div>
              </div>
              <span className="slot-lvl-num" style={styles.lvlNum}>{summon.level}</span>
            </div>
            <div style={styles.info}>
              <div
                style={{ ...styles.name, ...(onSummonClick ? { cursor: 'pointer' } : {}) }}
                onClick={onSummonClick ? () => onSummonClick(summon.id) : undefined}
              >{summon.name}</div>
              <CapBadge value={summon.capacity} />
              <div style={styles.miniStatTable}>
                <div style={styles.miniStatRow}>
                  <span style={styles.miniStatLabel}>Magic Power</span>
                  <span style={styles.miniStatVal}>{Math.round(summon.magicPower)}</span>
                </div>
                <div style={styles.miniStatRow}>
                  <span style={styles.miniStatLabel}>Mana</span>
                  <span style={styles.miniStatVal}>{Math.round(summon.mana)}</span>
                </div>
              </div>
            </div>
            {onUnequip && (
              <button onClick={onUnequip} style={styles.unequipBtn}>Unequip</button>
            )}
          </div>
        ) : (
          emptySummonContent
        )}
      </div>
    );
  }

  const tierLabel = slot.slotTier ? SLOT_TIER_LABEL[slot.slotTier] : 'Slot';
  const tierColor = slot.slotTier ? SLOT_TIER_COLOR[slot.slotTier] : '#a0a0b0';
  const slotIndex = slot.slotTier === 'COMMONER' ? slot.slotNumber
    : slot.slotTier === 'ELITE' ? slot.slotNumber - 3
    : 1;

  const isSelectTarget = !!onEmptySlotClick && !slot.hero;
  const wouldBeOffSlot = isSelectTarget && isOffSlot(selectedHeroTier ?? null, slot.slotTier);

  let slotBorderColor = `${tierColor}40`;
  let slotBoxShadow: string | undefined = undefined;
  if (isSelectTarget && wouldBeOffSlot) {
    slotBorderColor = '#f97316';
    slotBoxShadow = '0 0 8px #f9731660';
  } else if (isSelectTarget) {
    slotBorderColor = '#4ade80';
    slotBoxShadow = '0 0 8px #4ade8060';
  }

  return (
    <div style={{ ...styles.slot, borderColor: slotBorderColor, boxShadow: slotBoxShadow }}>
      <div style={{ ...styles.slotLabel, color: tierColor }}>
        {tierLabel} {slotIndex}
      </div>
      {slot.hero ? (
        <div style={styles.filled}>
          <div
            onClick={onHeroClick ? () => onHeroClick(slot.hero!.id) : undefined}
            style={{ position: 'relative', ...(onHeroClick ? { cursor: 'pointer' } : {}) }}
          >
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
              <HeroPortrait
                imagePath={slot.hero.imagePath}
                name={slot.hero.name}
                size={60}
                tier={slot.hero.tier}
              />
              {isOffSlot(slot.hero.tier, slot.slotTier) && (
                <div style={styles.offSlotOverlay} title="Off-slot: -20% damage">
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
          <div style={styles.info}>
            <div style={styles.nameRow}>
              <div
                style={{ ...styles.name, ...(onHeroClick ? styles.clickableName : {}) }}
                onClick={onHeroClick ? () => onHeroClick(slot.hero!.id) : undefined}
              >
                {slot.hero.name}
              </div>
              {slot.hero.element && (
                <span
                  style={{ ...styles.elemBadge, color: ELEMENT_COLOR[slot.hero.element] ?? '#a0a0b0' }}
                  title={slot.hero.element}
                >
                  {ELEMENT_SYMBOL[slot.hero.element] ?? slot.hero.element}
                </span>
              )}
            </div>
            <CapBadge value={slot.hero.capacity} />
            {isOffSlot(slot.hero.tier, slot.slotTier) && (
              <div style={styles.offSlotBadge}>⚠ Off-slot · -20% dmg</div>
            )}
          </div>
          {onUnequip && (
            <button onClick={onUnequip} style={styles.unequipBtn}>Unequip</button>
          )}
        </div>
      ) : isSelectTarget ? (
        <EmptyTarget offSlot={wouldBeOffSlot} onClick={onEmptySlotClick ?? (() => {})} />
      ) : (
        <div style={styles.empty}>Empty — {tierLabel} slot</div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  slot: {
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    border: '1px solid #16213e',
    padding: 12,
  },
  slotLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: 600,
  },
  filled: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    alignItems: 'flex-start',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: '#e0e0e0',
    fontWeight: 600,
    fontSize: 14,
  },
  clickableName: {
    cursor: 'pointer',
  },
  clickablePortrait: {
    cursor: 'pointer',
  },
  elemBadge: {
    fontSize: 14,
    lineHeight: '1',
  },
  miniStatTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    marginTop: 1,
  },
  miniStatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  miniStatLabel: {
    color: '#8888aa',
    fontSize: 11,
    fontStyle: 'italic',
    minWidth: 72,
  },
  miniStatVal: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  portraitXpBg: {
    position: 'absolute' as const,
    bottom: 0, left: 0, right: 0,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.82)',
    border: '1px solid rgba(251,191,36,0.45)',
    overflow: 'hidden',
    zIndex: 4,
  },
  portraitXpFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #d97706 0%, #fbbf24 60%, #fde68a 100%)',
    boxShadow: '0 0 8px rgba(251,191,36,0.7), 0 0 2px rgba(251,191,36,0.7)',
    animation: 'slotXpBreathe 2.2s ease-in-out infinite',
    transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  xpPctLabel: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.88)',
    fontSize: 8,
    fontWeight: 900,
    letterSpacing: '0.05em',
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 1px 2px rgba(0,0,0,0.95)',
    pointerEvents: 'none' as const,
    zIndex: 5,
  },
  lvlNum: {
    position: 'absolute' as const,
    bottom: 12,
    right: 5,
    transform: 'translateY(50%)',
    zIndex: 5,
    fontSize: 15,
    fontWeight: 900,
    fontStyle: 'italic',
    lineHeight: 1,
    letterSpacing: '-0.01em',
    fontFamily: 'Inter, sans-serif',
    pointerEvents: 'none' as const,
  },
  empty: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
    padding: 12,
  },
  emptyTarget: {
    width: '100%',
    padding: '12px 0',
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    border: '1px dashed #4ade80',
    borderRadius: 4,
    color: '#4ade80',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
  emptyTargetOffSlot: {
    width: '100%',
    padding: '12px 0',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    border: '1px dashed #f97316',
    borderRadius: 4,
    color: '#f97316',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
  },
  offSlotOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(180, 30, 30, 0.55)',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  offSlotText: {
    color: '#fff',
    fontWeight: 900,
    fontSize: 15,
    textShadow: '0 1px 4px rgba(0,0,0,0.9)',
    letterSpacing: 0.5,
  },
  offSlotBadge: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: 600,
    marginTop: 1,
  },
  unequipBtn: {
    padding: '6px 12px',
    backgroundColor: '#333',
    color: '#e0e0e0',
    border: '1px solid #444',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
  },
};
