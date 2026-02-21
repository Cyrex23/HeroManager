import type { TeamSlot as TeamSlotType } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';

// Inject XP shimmer keyframe once
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

const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '💧', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
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

export default function TeamSlotComponent({ slot, onUnequip, onHeroClick, onEmptySlotClick, selectedHeroTier }: Props) {
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
            <HeroPortrait imagePath={summon.imagePath} name={summon.name} size={60} />
            <div style={styles.info}>
              <div style={styles.name}>{summon.name}</div>
              <div style={styles.detail}>Lv.{summon.level} | Cap: {summon.capacity}</div>
              <div style={styles.bonus}>{summon.teamBonus}</div>
              <div style={styles.xpWrap}>
                <div style={styles.xpLabel}>XP: {summon.currentXp} / {summon.xpToNextLevel}</div>
                <div style={styles.xpBarBg}>
                  <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }} />
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
            <div style={styles.detail}>Lv.{slot.hero.level} | Cap: {slot.hero.capacity}</div>
            {isOffSlot(slot.hero.tier, slot.slotTier) && (
              <div style={styles.offSlotBadge}>⚠ Off-slot · -20% dmg</div>
            )}
            {slot.hero.xpToNextLevel > 0 && (
              <div style={styles.xpWrap}>
                <div style={styles.xpLabel}>
                  XP: {slot.hero.currentXp} / {slot.hero.xpToNextLevel}
                </div>
                <div style={styles.xpBarBg}>
                  <div style={{
                    ...styles.xpBarFill,
                    width: `${Math.min((slot.hero.currentXp / slot.hero.xpToNextLevel) * 100, 100)}%`,
                  }} />
                </div>
              </div>
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
  detail: {
    color: '#a0a0b0',
    fontSize: 12,
  },
  bonus: {
    color: '#4ade80',
    fontSize: 12,
  },
  xpWrap: {
    marginTop: 4,
  },
  xpLabel: {
    color: '#a0a0b0',
    fontSize: 11,
    marginBottom: 2,
  },
  xpBarBg: {
    height: 7,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
    maxWidth: 160,
    border: '1px solid rgba(251,191,36,0.22)',
  },
  xpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #92400e 0%, #d97706 30%, #fbbf24 55%, #fde68a 75%, #fbbf24 100%)',
    backgroundSize: '200% 100%',
    animation: 'xpShimmer 2.5s ease-in-out infinite',
    borderRadius: 3,
    boxShadow: '0 0 6px rgba(251,191,36,0.45)',
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
