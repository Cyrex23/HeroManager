import type { CombinedSlot } from '../../types';
import EquipmentTooltip from './EquipmentTooltip';

interface Props {
  slot: CombinedSlot;
  onUnequip: (slotNumber: number) => void;
  onSell?: (equippedItemId: number) => void;
}

const STAT_COLORS: Record<string, string> = {
  physicalAttack: '#f97316',
  magicPower:     '#60a5fa',
  dexterity:      '#4ade80',
  element:        '#facc15',
  mana:           '#a78bfa',
  stamina:        '#fb7185',
};

function formatStat(key: string): string {
  const map: Record<string, string> = {
    physicalAttack: 'PA', magicPower: 'MP', dexterity: 'Dex',
    element: 'Elem', mana: 'Mana', stamina: 'Stam',
  };
  return map[key] || key;
}

export default function ItemSlot({ slot, onUnequip }: Props) {
  if (!slot.type) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyLeft}>
          <span style={styles.emptySlotNum}>#{slot.slotNumber}</span>
          <span style={styles.emptyText}>Empty</span>
        </div>
        <span style={styles.emptyDash}>— —</span>
      </div>
    );
  }

  const isAbility = slot.type === 'ability';
  const accentColor = isAbility ? '#a78bfa' : '#60a5fa';
  const bonusEntries = slot.bonuses
    ? Object.entries(slot.bonuses).filter(([, v]) => v !== 0)
    : [];

  return (
    <EquipmentTooltip
      name={slot.name ?? ''}
      type={slot.type}
      bonuses={slot.bonuses ?? {}}
      sellPrice={slot.sellPrice}
      copies={slot.copies ?? undefined}
      spell={slot.spell ?? null}
    >
      <div style={{ ...styles.filled, borderColor: `${accentColor}28` }}>
        {/* Left accent stripe */}
        <div style={{ ...styles.accentStripe, backgroundColor: accentColor }} />

        <div style={styles.body}>
          {/* Header row */}
          <div style={styles.headerRow}>
            <span style={styles.slotNum}>#{slot.slotNumber}</span>
            {isAbility && slot.bonuses && (() => {
              // Infer tier from copies or default — use AbilityTierIcon if tier is available
              return null;
            })()}
            <span style={{ ...styles.typeTag, color: accentColor, borderColor: `${accentColor}40`, backgroundColor: `${accentColor}12` }}>
              {isAbility ? 'ABILITY' : 'ITEM'}
            </span>
            <span style={styles.itemName}>{slot.name}</span>
          </div>

          {/* Bonus chips */}
          {bonusEntries.length > 0 && (
            <div style={styles.bonuses}>
              {bonusEntries.map(([stat, val]) => {
                const c = STAT_COLORS[stat] ?? '#a0a0b0';
                return (
                  <span key={stat} style={{ ...styles.bonusChip, color: c, borderColor: `${c}35`, backgroundColor: `${c}12` }}>
                    +{val} {formatStat(stat)}
                  </span>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div style={styles.actions}>
            <button onClick={() => onUnequip(slot.slotNumber)} style={styles.unequipBtn}>
              Unslot
            </button>
          </div>
        </div>
      </div>
    </EquipmentTooltip>
  );
}

const styles: Record<string, React.CSSProperties> = {
  empty: {
    padding: '10px 14px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 7,
    border: '1px dashed rgba(255,255,255,0.07)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  emptySlotNum: {
    color: '#333',
    fontSize: 12,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums' as const,
  },
  emptyText: {
    color: '#3a3a5a',
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyDash: {
    color: '#252540',
    fontSize: 14,
    letterSpacing: 4,
  },
  filled: {
    borderRadius: 7,
    border: '1px solid',
    backgroundColor: '#12121e',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentStripe: {
    width: 3,
    flexShrink: 0,
    borderRadius: '7px 0 0 7px',
    opacity: 0.75,
  },
  body: {
    flex: 1,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  slotNum: {
    color: '#3a3a5a',
    fontSize: 11,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums' as const,
    flexShrink: 0,
  },
  typeTag: {
    fontSize: 8,
    fontWeight: 800,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    padding: '2px 6px',
    borderRadius: 10,
    border: '1px solid',
    flexShrink: 0,
  },
  itemName: {
    color: '#d8d8ec',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  bonuses: {
    display: 'flex',
    gap: 5,
    flexWrap: 'wrap' as const,
  },
  bonusChip: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 7px',
    borderRadius: 10,
    border: '1px solid',
  },
  actions: {
    display: 'flex',
    gap: 6,
    marginTop: 2,
  },
  unequipBtn: {
    padding: '3px 10px',
    backgroundColor: 'transparent',
    color: '#505070',
    border: '1px solid #252535',
    borderRadius: 4,
    fontSize: 11,
    cursor: 'pointer',
    letterSpacing: 0.2,
  },
  sellBtn: {
    padding: '3px 10px',
    backgroundColor: 'rgba(251,191,36,0.07)',
    color: '#fbbf24',
    border: '1px solid rgba(251,191,36,0.25)',
    borderRadius: 4,
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 600,
  },
};
