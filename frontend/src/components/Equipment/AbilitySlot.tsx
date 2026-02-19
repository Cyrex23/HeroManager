import type { EquipmentAbility } from '../../types';

interface Props {
  ability: EquipmentAbility;
  onUnequip: (abilityTemplateId: number) => void;
}

export default function AbilitySlot({ ability, onUnequip }: Props) {
  const bonusEntries = Object.entries(ability.bonuses).filter(([, v]) => v !== 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.name}>{ability.name}</span>
        <span style={styles.tier}>Tier {ability.tier}</span>
      </div>
      {bonusEntries.length > 0 && (
        <div style={styles.bonuses}>
          {bonusEntries.map(([stat, val]) => (
            <span key={stat} style={styles.bonus}>+{val} {formatStat(stat)}</span>
          ))}
        </div>
      )}
      <button onClick={() => onUnequip(ability.abilityTemplateId)} style={styles.unequipBtn}>
        Unequip
      </button>
    </div>
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
  container: {
    padding: '10px 14px',
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    border: '1px solid #16213e',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: '#e0e0e0',
    fontWeight: 600,
    fontSize: 13,
  },
  tier: {
    color: '#60a5fa',
    fontSize: 11,
    padding: '1px 6px',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 8,
  },
  bonuses: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  bonus: {
    color: '#4ade80',
    fontSize: 11,
  },
  unequipBtn: {
    padding: '4px 10px',
    backgroundColor: 'transparent',
    color: '#a0a0b0',
    border: '1px solid #333',
    borderRadius: 3,
    fontSize: 11,
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
};
