import type { HeroAbilityEntry } from '../../types';
import EquipmentTooltip from './EquipmentTooltip';
import AbilityTierIcon from './AbilityTierIcon';

interface Props {
  ability: HeroAbilityEntry;
  onUnequip: (slotNumber: number) => void;
}

export default function AbilitySlot({ ability, onUnequip }: Props) {
  const bonusEntries = Object.entries(ability.bonuses).filter(([, v]) => v !== 0);

  return (
    <EquipmentTooltip
      name={ability.name}
      type="ability"
      bonuses={ability.bonuses}
      tier={ability.tier}
      copies={ability.copies}
      spell={ability.spell ?? null}
    >
      <div style={styles.container}>
        <div style={styles.header}>
          <AbilityTierIcon tier={ability.tier} />
          <span style={styles.name}>{ability.name}</span>
          {ability.slotNumber !== null && (
            <span style={styles.slotTag}>Slot {ability.slotNumber}</span>
          )}
        </div>
        {bonusEntries.length > 0 && (
          <div style={styles.bonuses}>
            {bonusEntries.map(([stat, val]) => (
              <span key={stat} style={styles.bonus}>+{val} {formatStat(stat)}</span>
            ))}
          </div>
        )}
        {ability.slotNumber !== null && (
          <button onClick={() => onUnequip(ability.slotNumber!)} style={styles.unequipBtn}>
            Unslot
          </button>
        )}
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
    gap: 8,
  },
  name: {
    color: '#e0e0e0',
    fontWeight: 600,
    fontSize: 13,
    flex: 1,
  },
  slotTag: {
    color: '#a78bfa',
    fontSize: 10,
    padding: '1px 5px',
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderRadius: 8,
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
