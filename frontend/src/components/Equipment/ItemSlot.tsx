import type { CombinedSlot } from '../../types';
import EquipmentTooltip from './EquipmentTooltip';

interface Props {
  slot: CombinedSlot;
  onUnequip: (slotNumber: number) => void;
  onSell: (equippedItemId: number) => void;
}

export default function ItemSlot({ slot, onUnequip, onSell }: Props) {
  if (!slot.type) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptyLabel}>Slot {slot.slotNumber}</span>
        <span style={styles.emptyText}>Empty</span>
      </div>
    );
  }

  const bonusEntries = slot.bonuses
    ? Object.entries(slot.bonuses).filter(([, v]) => v !== 0)
    : [];

  const typeColor = slot.type === 'ability' ? '#a78bfa' : '#60a5fa';
  const typeLabel = slot.type === 'ability' ? 'Ability' : 'Item';

  return (
    <EquipmentTooltip
      name={slot.name ?? ''}
      type={slot.type}
      bonuses={slot.bonuses ?? {}}
      sellPrice={slot.sellPrice}
      copies={slot.copies ?? undefined}
      spell={slot.spell ?? null}
    >
      <div style={{ ...styles.filled, borderColor: `${typeColor}40` }}>
        <div style={styles.header}>
          <span style={styles.slotLabel}>Slot {slot.slotNumber}</span>
          <span style={{ ...styles.typeTag, color: typeColor }}>{typeLabel}</span>
          <span style={styles.itemName}>{slot.name}</span>
        </div>
        {bonusEntries.length > 0 && (
          <div style={styles.bonuses}>
            {bonusEntries.map(([stat, val]) => (
              <span key={stat} style={styles.bonus}>+{val} {formatStat(stat)}</span>
            ))}
          </div>
        )}
        <div style={styles.actions}>
          <button onClick={() => onUnequip(slot.slotNumber)} style={styles.unequipBtn}>Unequip</button>
          {slot.type === 'item' && slot.id !== null && slot.sellPrice !== null && (
            <button onClick={() => onSell(slot.id!)} style={styles.sellBtn}>
              Sell ({slot.sellPrice}g)
            </button>
          )}
        </div>
      </div>
    </EquipmentTooltip>
  );
}

function formatStat(key: string): string {
  const map: Record<string, string> = {
    physicalAttack: 'PA', magicPower: 'MP', dexterity: 'Dex',
    element: 'Elem', mana: 'Mana', stamina: 'Stam',
  };
  return map[key] || key;
}

const styles: Record<string, React.CSSProperties> = {
  empty: {
    padding: '12px 14px',
    backgroundColor: '#16213e',
    borderRadius: 6,
    border: '1px dashed #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyLabel: {
    color: '#666',
    fontSize: 12,
  },
  emptyText: {
    color: '#444',
    fontSize: 12,
    fontStyle: 'italic',
  },
  filled: {
    padding: '12px 14px',
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  header: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  slotLabel: {
    color: '#a0a0b0',
    fontSize: 11,
  },
  typeTag: {
    fontSize: 9,
    fontWeight: 800,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  itemName: {
    color: '#e0e0e0',
    fontWeight: 600,
    fontSize: 13,
  },
  bonuses: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  bonus: {
    color: '#4ade80',
    fontSize: 11,
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  unequipBtn: {
    padding: '4px 10px',
    backgroundColor: 'transparent',
    color: '#a0a0b0',
    border: '1px solid #333',
    borderRadius: 3,
    fontSize: 11,
    cursor: 'pointer',
  },
  sellBtn: {
    padding: '4px 10px',
    backgroundColor: 'transparent',
    color: '#fbbf24',
    border: '1px solid #665500',
    borderRadius: 3,
    fontSize: 11,
    cursor: 'pointer',
  },
};
