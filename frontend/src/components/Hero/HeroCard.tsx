import type { HeroResponse } from '../../types';
import HeroPortrait from './HeroPortrait';
import HeroStats from './HeroStats';

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '💧', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};

interface Props {
  hero: HeroResponse;
  onClick?: () => void;
}

export default function HeroCard({ hero, onClick }: Props) {
  return (
    <div style={styles.card} onClick={onClick}>
      <HeroPortrait imagePath={hero.imagePath} name={hero.name} size={80} tier={hero.tier} />
      <div style={styles.info}>
        <div style={styles.nameRow}>
          <div style={styles.name}>{hero.name}</div>
          {hero.element && (
            <span style={{ color: ELEMENT_COLOR[hero.element] ?? '#a0a0b0', fontSize: 14 }}>
              {ELEMENT_SYMBOL[hero.element] ?? hero.element}
            </span>
          )}
        </div>
        <div style={styles.level}>Lv.{hero.level}</div>
        <HeroStats stats={hero.stats} compact />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    gap: 12,
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    border: '1px solid #16213e',
    cursor: 'pointer',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 100,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: '#e0e0e0',
    fontWeight: 600,
    fontSize: 14,
  },
  level: {
    color: '#a0a0b0',
    fontSize: 12,
  },
};
