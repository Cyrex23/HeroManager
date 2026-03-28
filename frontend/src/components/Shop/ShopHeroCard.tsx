import type { ShopHeroResponse } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';
import HexStatDiagram from '../Hero/HexStatDiagram';
import CapBadge from '../Hero/CapBadge';
import { useLanguage } from '../../context/LanguageContext';

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const TIER_COLOR: Record<string, string> = {
  COMMONER: '#9ca3af', ELITE: '#a78bfa', LEGENDARY: '#f97316',
};

interface Props {
  hero: ShopHeroResponse;
  playerGold: number;
  onBuy: () => void;
}

export default function ShopHeroCard({ hero, playerGold, onBuy }: Props) {
  const canBuy = !hero.owned && playerGold >= hero.cost;
  const { t } = useLanguage();

  return (
    <div style={{ ...styles.card, opacity: hero.owned ? 0.6 : 1 }} className="card-hover">
      {/* Top row: portrait col + hexagram */}
      <div style={styles.topRow}>
        <div style={styles.portraitCol}>
          <div style={{ ...styles.name, color: TIER_COLOR[hero.tier ?? ''] ?? '#6b7280' }}>{hero.displayName}</div>
          <div style={styles.portraitWrapper}>
            <HeroPortrait imagePath={hero.imagePath} name={hero.displayName} size={100} tier={hero.tier} />
            {hero.element && (
              <span style={{ ...styles.elementBadge, color: ELEMENT_COLOR[hero.element] ?? '#a0a0b0' }}>
                {ELEMENT_SYMBOL[hero.element] ?? hero.element}
              </span>
            )}
          </div>
          <CapBadge value={hero.capacity} />
        </div>
        <div style={styles.info}>
          <HexStatDiagram
            stats={hero.baseStats}
            growthStats={hero.growthStats}
            size={390}
          />
        </div>
      </div>

      {/* Bottom: gold + button */}
      <div style={styles.bottomRow}>
        <div style={styles.costDisplay}>
          <span style={styles.goldIcon}>💰</span>
          <span style={styles.gold}>{hero.cost}g</span>
        </div>
        {hero.owned ? (
          <div style={styles.ownedBadge}>{t('shop_owned')}</div>
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
            {t('shop_buy')}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    border: '1px solid #16213e',
  },
  topRow: {
    display: 'flex',
    gap: 16,
  },
  portraitCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  portraitWrapper: {
    position: 'relative',
  },
  elementBadge: {
    position: 'absolute',
    top: 3,
    left: 3,
    fontSize: 16,
    lineHeight: 1,
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
  },
  portraitMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
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
    fontWeight: 700,
    fontStyle: 'italic',
    fontSize: 16,
  },
  gold: {
    color: '#fbbf24',
    fontWeight: 600,
    fontSize: 13,
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  costDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  goldIcon: {
    fontSize: 18,
    lineHeight: 1,
  },
  buyBtn: {
    padding: '8px 24px',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
  },
  ownedBadge: {
    padding: '8px 24px',
    backgroundColor: '#16213e',
    color: '#4ade80',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center' as const,
  },
};
