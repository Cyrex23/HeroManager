import type { CombinedSlot } from '../../types';
import EquipmentTooltip from './EquipmentTooltip';

interface Props {
  slot: CombinedSlot;
  onUnequip: (slotNumber: number) => void;
  onSell?: (equippedItemId: number) => void;
}

type ItemTier = 'COMMON' | 'RARE' | 'LEGENDARY';

const ITEM_TIER_CFG: Record<ItemTier, { label: string; color: string; glow: string; bg: string }> = {
  COMMON:    { label: 'Common',    color: '#9ca3af', glow: 'rgba(156,163,175,0.18)', bg: 'linear-gradient(160deg, rgba(156,163,175,0.07) 0%, rgba(26,26,46,0.9) 100%)' },
  RARE:      { label: 'Rare',      color: '#a78bfa', glow: 'rgba(167,139,250,0.28)', bg: 'linear-gradient(160deg, rgba(167,139,250,0.1) 0%, rgba(26,26,46,0.9) 100%)'  },
  LEGENDARY: { label: 'Legendary', color: '#f97316', glow: 'rgba(249,115,22,0.32)',  bg: 'linear-gradient(160deg, rgba(249,115,22,0.12) 0%, rgba(26,26,46,0.9) 100%)' },
};

// Ability slots have no tier in CombinedSlot — use a fixed purple style
const ABILITY_TC = { label: 'Ability', color: '#a78bfa', glow: 'rgba(167,139,250,0.28)', bg: 'linear-gradient(160deg, rgba(167,139,250,0.1) 0%, rgba(26,26,46,0.9) 100%)' };

const ITEM_ICON: Record<string, string> = {
  'Training Weights': '🏋️',
  'Iron Kunai':       '🗡️',
  'Chakra Scroll':    '📜',
  'Mana Crystal':     '💎',
  'Swift Boots':      '👟',
  'Warrior Armor':    '🛡️',
  'Mystic Tome':      '📖',
  'Shadow Cloak':     '🌑',
  'Legendary Blade':  '⚔️',
  'Sage Staff':       '📿',
};

const STAT_CFG: Record<string, { label: string; color: string; icon: string }> = {
  physicalAttack: { label: 'PA',   color: '#f97316', icon: '⚔'  },
  magicPower:     { label: 'MP',   color: '#60a5fa', icon: '✦'  },
  dexterity:      { label: 'Dex',  color: '#4ade80', icon: '◈'  },
  mana:           { label: 'Mana', color: '#818cf8', icon: '◆'  },
  stamina:        { label: 'Stam', color: '#fb923c', icon: '◉'  },
  element:        { label: 'Elem', color: '#facc15', icon: '⚡' },
};

function getItemTierBySell(sellPrice: number | null): ItemTier {
  if (sellPrice == null) return 'COMMON';
  if (sellPrice >= 300) return 'LEGENDARY';
  if (sellPrice >= 150) return 'RARE';
  return 'COMMON';
}

export default function ItemSlot({ slot, onUnequip }: Props) {
  if (!slot.type) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptySlotNum}>#{slot.slotNumber}</span>
        <span style={styles.emptyText}>Empty</span>
        <span style={styles.emptyDash}>— —</span>
      </div>
    );
  }

  const isAbility = slot.type === 'ability';
  const tc = isAbility ? ABILITY_TC : ITEM_TIER_CFG[getItemTierBySell(slot.sellPrice)];
  const bonusEntries = slot.bonuses ? Object.entries(slot.bonuses).filter(([, v]) => v !== 0) : [];

  return (
    <EquipmentTooltip
      name={slot.name ?? ''}
      type={slot.type}
      bonuses={slot.bonuses ?? {}}
      sellPrice={slot.sellPrice}
      copies={slot.copies ?? undefined}
      spell={slot.spell ?? null}
    >
      <div style={{
        position: 'relative',
        padding: '14px 14px 12px',
        borderRadius: 10,
        border: `1px solid ${tc.color}38`,
        background: tc.bg,
        boxShadow: `0 4px 20px ${tc.glow}, inset 0 0 0 1px ${tc.color}14`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflow: 'hidden',
        cursor: 'default',
        height: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Top color bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, background: tc.color,
          boxShadow: `0 0 8px ${tc.color}`,
        }} />

        {/* Type badge (top-right) */}
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 8, fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          padding: '2px 6px', borderRadius: 6,
          background: tc.color + '22',
          border: `1px solid ${tc.color}55`,
          color: tc.color,
        }}>
          {tc.label}
        </div>

        {/* Slot # (top-left) */}
        <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 9, fontWeight: 700, color: tc.color + '77' }}>
          #{slot.slotNumber}
        </div>

        {/* Icon + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: tc.color + '16',
            border: `2px solid ${tc.color}44`,
            flexShrink: 0,
          }}>
            {isAbility
              ? <span style={{ color: tc.color, fontSize: 17, lineHeight: 1 }}>✦</span>
              : <span style={{ fontSize: 17, lineHeight: 1 }}>{ITEM_ICON[slot.name ?? ''] ?? '📦'}</span>
            }
          </div>
          <span style={{ color: '#e8e8f0', fontWeight: 700, fontSize: 13, lineHeight: 1.25 }}>
            {slot.name}
          </span>
        </div>

        {/* Stat chips */}
        {bonusEntries.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
            {bonusEntries.map(([stat, val]) => {
              const sc = STAT_CFG[stat] ?? { label: stat, color: '#9ca3af', icon: '·' };
              return (
                <div key={stat} style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '2px 7px', borderRadius: 6,
                  background: sc.color + '14',
                  border: `1px solid ${sc.color}45`,
                }}>
                  <span style={{ color: sc.color, fontSize: 9, lineHeight: 1 }}>{sc.icon}</span>
                  <span style={{ color: sc.color, fontWeight: 800, fontSize: 11, lineHeight: 1 }}>+{val}</span>
                  <span style={{ color: sc.color + 'aa', fontSize: 9, lineHeight: 1 }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Unslot button */}
        <button
          onClick={() => onUnequip(slot.slotNumber)}
          style={{
            padding: '5px 12px',
            background: 'transparent',
            border: `1px solid ${tc.color}33`,
            borderRadius: 5,
            color: tc.color + 'cc',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          Unslot
        </button>
      </div>
    </EquipmentTooltip>
  );
}

const styles: Record<string, React.CSSProperties> = {
  empty: {
    padding: '12px 14px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
    border: '1px dashed rgba(255,255,255,0.07)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    height: '100%',
    boxSizing: 'border-box',
  },
  emptySlotNum: {
    color: '#303050',
    fontSize: 11,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums' as const,
    flexShrink: 0,
  },
  emptyText: {
    color: '#303050',
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  emptyDash: {
    color: '#202035',
    fontSize: 14,
    letterSpacing: 4,
  },
};
