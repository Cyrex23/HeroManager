import { ShopHero } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';

interface ShopHeroCardProps {
  shopHero: ShopHero;
  playerGold: number;
  onBuy: (templateId: number) => void;
}

const STAT_KEYS: { key: keyof ShopHero['baseStats']; label: string }[] = [
  { key: 'physicalAttack', label: 'PA' },
  { key: 'magicPower', label: 'MP' },
  { key: 'dexterity', label: 'DEX' },
  { key: 'element', label: 'ELE' },
  { key: 'mana', label: 'MAN' },
  { key: 'stamina', label: 'STA' },
];

export default function ShopHeroCard({ shopHero, playerGold, onBuy }: ShopHeroCardProps) {
  const canBuy = !shopHero.owned && playerGold >= shopHero.cost;

  return (
    <div
      style={{
        backgroundColor: '#16213e',
        border: '1px solid #0f3460',
        borderRadius: '8px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        opacity: shopHero.owned ? 0.6 : 1,
      }}
    >
      <HeroPortrait imagePath={shopHero.imagePath} size={0.7} />
      <div style={{ fontWeight: 'bold', color: '#eee', fontSize: '1em', textAlign: 'center' }}>
        {shopHero.displayName || shopHero.name}
      </div>
      <div style={{ display: 'flex', gap: '12px', fontSize: '0.85em', color: '#999' }}>
        <span style={{ color: '#ffd700' }}>{shopHero.cost}g</span>
        <span>Cap: {shopHero.capacity}</span>
      </div>

      <div style={{ width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8em' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '3px 6px', color: '#999' }}>Stat</th>
              <th style={{ textAlign: 'right', padding: '3px 6px', color: '#999' }}>Base</th>
              <th style={{ textAlign: 'right', padding: '3px 6px', color: '#999' }}>Growth</th>
            </tr>
          </thead>
          <tbody>
            {STAT_KEYS.map(({ key, label }) => (
              <tr key={key} style={{ borderBottom: '1px solid #0f3460' }}>
                <td style={{ padding: '3px 6px', color: '#ccc' }}>{label}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', color: '#eee' }}>
                  {shopHero.baseStats[key]}
                </td>
                <td style={{ textAlign: 'right', padding: '3px 6px', color: '#4caf50' }}>
                  +{shopHero.growthStats[key]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => onBuy(shopHero.templateId)}
        disabled={!canBuy}
        style={{
          backgroundColor: shopHero.owned ? '#555' : canBuy ? '#4caf50' : '#666',
          color: '#fff',
          border: 'none',
          padding: '8px 20px',
          borderRadius: '4px',
          cursor: canBuy ? 'pointer' : 'not-allowed',
          fontSize: '0.9em',
          width: '100%',
        }}
      >
        {shopHero.owned ? 'Owned' : `Buy - ${shopHero.cost}g`}
      </button>
    </div>
  );
}
