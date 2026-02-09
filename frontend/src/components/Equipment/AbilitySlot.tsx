import { EquipmentAbility } from '../../types';

interface AbilitySlotProps {
  ability: EquipmentAbility;
  onUnequip: (abilityTemplateId: number) => void;
}

const BONUS_LABELS: Record<string, string> = {
  bonusPa: 'PA',
  bonusMp: 'MP',
  bonusDex: 'DEX',
  bonusElem: 'ELE',
  bonusMana: 'MAN',
  bonusStam: 'STA',
  physicalAttack: 'PA',
  magicPower: 'MP',
  dexterity: 'DEX',
  element: 'ELE',
  mana: 'MAN',
  stamina: 'STA',
};

export default function AbilitySlot({ ability, onUnequip }: AbilitySlotProps) {
  const bonusEntries = Object.entries(ability.bonuses).filter(([, v]) => v !== 0);

  return (
    <div
      style={{
        backgroundColor: '#16213e',
        border: '1px solid #0f3460',
        borderRadius: '6px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#eee', fontWeight: 'bold', fontSize: '0.9em' }}>
          {ability.name}
        </span>
        <span style={{ color: '#999', fontSize: '0.75em' }}>
          Tier {ability.tier}
        </span>
      </div>

      {bonusEntries.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {bonusEntries.map(([key, val]) => (
            <span
              key={key}
              style={{
                backgroundColor: '#0f3460',
                color: val > 0 ? '#4caf50' : '#e94560',
                padding: '1px 6px',
                borderRadius: '3px',
                fontSize: '0.75em',
              }}
            >
              {BONUS_LABELS[key] || key}: {val > 0 ? '+' : ''}{val}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => onUnequip(ability.abilityTemplateId)}
        style={{
          backgroundColor: '#0f3460',
          color: '#eee',
          border: '1px solid #0f3460',
          padding: '3px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '0.75em',
          alignSelf: 'flex-start',
        }}
      >
        Unequip
      </button>
    </div>
  );
}
