import type { TeamSlot as TeamSlotType } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';

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
}

export default function TeamSlotComponent({ slot, onUnequip, onHeroClick }: Props) {
  if (slot.type === 'summon') {
    const summon = slot.summon;
    const xpPct = summon && summon.xpToNextLevel > 0
      ? Math.min((summon.currentXp / summon.xpToNextLevel) * 100, 100) : 0;

    return (
      <div style={styles.slot}>
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
          <div style={styles.empty}>Empty summon slot</div>
        )}
      </div>
    );
  }

  const tierLabel = slot.slotTier ? SLOT_TIER_LABEL[slot.slotTier] : 'Slot';
  const tierColor = slot.slotTier ? SLOT_TIER_COLOR[slot.slotTier] : '#a0a0b0';
  const slotIndex = slot.slotTier === 'COMMONER' ? slot.slotNumber
    : slot.slotTier === 'ELITE' ? slot.slotNumber - 3
    : 1;

  return (
    <div style={{ ...styles.slot, borderColor: `${tierColor}40` }}>
      <div style={{ ...styles.slotLabel, color: tierColor }}>
        {tierLabel} {slotIndex}
      </div>
      {slot.hero ? (
        <div style={styles.filled}>
          <div
            onClick={onHeroClick ? () => onHeroClick(slot.hero!.id) : undefined}
            style={onHeroClick ? styles.clickablePortrait : undefined}
          >
            <HeroPortrait
              imagePath={slot.hero.imagePath}
              name={slot.hero.name}
              size={60}
              tier={slot.hero.tier}
            />
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
    height: 5,
    backgroundColor: '#0f0f23',
    borderRadius: 3,
    overflow: 'hidden',
    maxWidth: 160,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 3,
  },
  empty: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
    padding: 12,
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
