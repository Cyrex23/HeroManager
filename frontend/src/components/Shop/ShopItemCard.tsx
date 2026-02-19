import type { ShopItemResponse } from '../../types';

interface Props {
  item: ShopItemResponse;
  onBuy: (templateId: number) => void;
  playerGold: number;
  disabled?: boolean;
}

export default function ShopItemCard({ item, onBuy, playerGold, disabled }: Props) {
  const bonusEntries = Object.entries(item.bonuses).filter(([, v]) => v !== 0);
  const canAfford = playerGold >= item.cost;

  return (
    <div style={styles.card}>
      <div style={styles.name}>{item.name}</div>
      <div style={styles.cost}>{item.cost}g</div>
      {bonusEntries.length > 0 && (
        <div style={styles.bonuses}>
          {bonusEntries.map(([stat, val]) => (
            <span key={stat} style={styles.bonus}>+{val} {formatStat(stat)}</span>
          ))}
        </div>
      )}
      <button
        onClick={() => onBuy(item.templateId)}
        disabled={disabled || !canAfford}
        style={{
          ...styles.buyBtn,
          opacity: disabled || !canAfford ? 0.5 : 1,
          cursor: disabled || !canAfford ? 'not-allowed' : 'pointer',
        }}
      >
        {!canAfford ? 'Not enough gold' : 'Buy & Equip'}
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
  card: {
    padding: 14,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    border: '1px solid #16213e',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 180,
  },
  name: {
    color: '#e0e0e0',
    fontWeight: 600,
    fontSize: 14,
  },
  cost: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 500,
  },
  bonuses: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  bonus: {
    color: '#4ade80',
    fontSize: 12,
  },
  buyBtn: {
    marginTop: 6,
    padding: '6px 14px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
  },
};
