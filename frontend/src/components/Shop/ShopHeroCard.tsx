import type { ShopHeroResponse } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';
import HexStatDiagram from '../Hero/HexStatDiagram';
import CapBadge from '../Hero/CapBadge';

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const TIER_COLOR: Record<string, string> = {
  COMMONER: '#6b7280', ELITE: '#a78bfa', LEGENDARY: '#f97316',
};

interface Props {
  hero: ShopHeroResponse;
  playerGold: number;
  onBuy: () => void;
}

export default function ShopHeroCard({ hero, playerGold, onBuy }: Props) {
  const canBuy = !hero.owned && playerGold >= hero.cost;

  return (
    <div style={{ ...styles.card, opacity: hero.owned ? 0.6 : 1 }} className="card-hover">
      <HeroPortrait imagePath={hero.imagePath} name={hero.displayName} size={100} tier={hero.tier} />
      <div style={styles.info}>
        <div style={styles.nameRow}>
          <div style={styles.name}>{hero.displayName}</div>
          {hero.element && (
            <span style={{ color: ELEMENT_COLOR[hero.element] ?? '#a0a0b0', fontSize: 15 }}>
              {ELEMENT_SYMBOL[hero.element] ?? hero.element}
            </span>
          )}
          {hero.tier && (
            <span style={{ color: TIER_COLOR[hero.tier] ?? '#a0a0b0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {hero.tier.charAt(0) + hero.tier.slice(1).toLowerCase()}
            </span>
          )}
        </div>
        <div style={styles.costRow}>
          <span style={styles.gold}>{hero.cost}g</span>
          <CapBadge value={hero.capacity} />
        </div>
        <HexStatDiagram
          stats={hero.baseStats}
          growthStats={hero.growthStats}
          size={180}
        />
        {hero.owned ? (
          <div style={styles.ownedBadge}>Owned</div>
        ) : (
          <button
            onClick={onBuy}
            disabled={!canBuy}
            className={canBuy ? 'btn-shimmer' : ''}
            style={{
              ...styles.buyBtn,
              background: canBuy ? 'linear-gradient(135deg, #e94560 0%, #c73652 100%)' : '#2a1a20',
              opacity: canBuy ? 1 : 0.5,
              cursor: canBuy ? 'pointer' : 'not-allowed',
            }}
          >
            {playerGold < hero.cost ? 'Not enough gold' : 'Buy'}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    gap: 16,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    border: '1px solid #16213e',
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#e0e0e0',
    fontWeight: 700,
    fontSize: 16,
  },
  costRow: {
    display: 'flex',
    gap: 12,
    fontSize: 13,
  },
  gold: {
    color: '#fbbf24',
    fontWeight: 600,
  },
  buyBtn: {
    padding: '8px 16px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    marginTop: 'auto',
  },
  ownedBadge: {
    padding: '8px 16px',
    backgroundColor: '#16213e',
    color: '#4ade80',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
    marginTop: 'auto',
  },
};
