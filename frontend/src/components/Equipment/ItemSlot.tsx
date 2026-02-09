import { EquipmentItemSlot } from '../../types';

interface ItemSlotProps {
  slot: EquipmentItemSlot;
  onUnequip: (slotNumber: number) => void;
  onSell: (slotNumber: number) => void;
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

export default function ItemSlot({ slot, onUnequip, onSell }: ItemSlotProps) {
  const isEmpty = !slot.equippedItemId;

  return (
    <div
      style={{
        backgroundColor: '#16213e',
        border: isEmpty ? '2px dashed #0f3460' : '1px solid #0f3460',
        borderRadius: '6px',
        padding: '12px',
        minHeight: '80px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#999', fontSize: '0.8em' }}>Slot {slot.slotNumber}</span>
        {!isEmpty && slot.sellPrice != null && (
          <span style={{ color: '#ffd700', fontSize: '0.75em' }}>Sell: {slot.sellPrice}g</span>
        )}
      </div>

      {isEmpty ? (
        <div style={{ color: '#666', fontSize: '0.85em', textAlign: 'center', padding: '10px 0' }}>
          Empty
        </div>
      ) : (
        <>
          <div style={{ color: '#eee', fontWeight: 'bold', fontSize: '0.9em' }}>
            {slot.name}
          </div>
          {slot.bonuses && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {Object.entries(slot.bonuses)
                .filter(([, v]) => v !== 0)
                .map(([key, val]) => (
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
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <button
              onClick={() => onUnequip(slot.slotNumber)}
              style={{
                backgroundColor: '#0f3460',
                color: '#eee',
                border: '1px solid #0f3460',
                padding: '3px 10px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '0.75em',
              }}
            >
              Unequip
            </button>
            <button
              onClick={() => onSell(slot.slotNumber)}
              style={{
                backgroundColor: '#e94560',
                color: '#fff',
                border: 'none',
                padding: '3px 10px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '0.75em',
              }}
            >
              Sell
            </button>
          </div>
        </>
      )}
    </div>
  );
}
