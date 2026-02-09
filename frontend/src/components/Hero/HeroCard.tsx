import { Link } from 'react-router-dom';
import { HeroResponse } from '../../types';
import HeroPortrait from './HeroPortrait';

interface HeroCardProps {
  hero: HeroResponse;
}

export default function HeroCard({ hero }: HeroCardProps) {
  const totalPower =
    hero.stats.physicalAttack +
    hero.stats.magicPower +
    hero.stats.dexterity +
    hero.stats.element +
    hero.stats.mana +
    hero.stats.stamina;

  return (
    <Link
      to={`/hero/${hero.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        style={{
          display: 'flex',
          gap: '12px',
          backgroundColor: '#16213e',
          border: '1px solid #0f3460',
          borderRadius: '8px',
          padding: '10px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#e94560')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#0f3460')}
      >
        <HeroPortrait imagePath={hero.imagePath} size={0.5} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 'bold', color: '#eee', fontSize: '1em', marginBottom: '4px' }}>
            {hero.name}
          </div>
          <div style={{ color: '#999', fontSize: '0.85em', marginBottom: '4px' }}>
            Lv. {hero.level} | Cap: {hero.capacity}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', fontSize: '0.8em', color: '#ccc' }}>
            <span>PA: {hero.stats.physicalAttack}</span>
            <span>MP: {hero.stats.magicPower}</span>
            <span>DEX: {hero.stats.dexterity}</span>
            <span>ELE: {hero.stats.element}</span>
            <span>MAN: {hero.stats.mana}</span>
            <span>STA: {hero.stats.stamina}</span>
          </div>
          <div style={{ color: '#ffd700', fontSize: '0.8em', marginTop: '4px' }}>
            Power: {totalPower}
          </div>
        </div>
      </div>
    </Link>
  );
}
