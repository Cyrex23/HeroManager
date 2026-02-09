import { ShopItem } from '../../types';

interface ShopItemCardProps {
  item: ShopItem;
  playerGold: number;
  onBuy: (templateId: number) => void;
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

export default function ShopItemCard({ item, playerGold, onBuy }: ShopItemCardProps) {
  const canBuy = playerGold >= item.cost;
  const bonusEntries = Object.entries(item.bonuses).filter(([, v]) => v !== 0);

  return (
    <div
      style={{
        backgroundColor: '#16213e',
        border: '1px solid #0f3460',
        borderRadius: '8px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ fontWeight: 'bold', color: '#eee', fontSize: '0.95em' }}>
        {item.name}
      </div>
      <div style={{ color: '#ffd700', fontSize: '0.85em' }}>
        {item.cost}g
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {bonusEntries.map(([key, val]) => (
          <span
            key={key}
            style={{
              backgroundColor: '#0f3460',
              color: val > 0 ? '#4caf50' : '#e94560',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.8em',
            }}
          >
            {BONUS_LABELS[key] || key}: {val > 0 ? '+' : ''}{val}
          </span>
        ))}
      </div>
      <button
        onClick={() => onBuy(item.templateId)}
        disabled={!canBuy}
        style={{
          backgroundColor: canBuy ? '#4caf50' : '#666',
          color: '#fff',
          border: 'none',
          padding: '6px 16px',
          borderRadius: '4px',
          cursor: canBuy ? 'pointer' : 'not-allowed',
          fontSize: '0.85em',
          marginTop: 'auto',
        }}
      >
        {canBuy ? `Buy - ${item.cost}g` : 'Not enough gold'}
      </button>
    </div>
  );
}
