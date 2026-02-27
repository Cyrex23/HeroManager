import type { HeroResponse } from '../../types';
import HeroPortrait from './HeroPortrait';
import HeroStats from './HeroStats';
import CapBadge from './CapBadge';

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
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
  const accentColor = hero.element ? (ELEMENT_COLOR[hero.element] ?? '#3a3a5a') : '#3a3a5a';
  const xpPct = hero.xpToNextLevel > 0
    ? Math.min((hero.currentXp / hero.xpToNextLevel) * 100, 100) : 0;

  return (
    <div
      style={{ ...styles.card, borderLeft: `3px solid ${accentColor}` }}
      className="card-hover"
      onClick={onClick}
    >
      {/* Portrait with level badge + XP bar overlays */}
      <div style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
        <HeroPortrait imagePath={hero.imagePath} name={hero.name} size={80} tier={hero.tier} />
        <span className="equip-lvl-badge" style={styles.lvlBadge}>{hero.level}</span>
        <div style={styles.xpBarBg}>
          <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }} />
          <div style={styles.xpBarCenter}>
            <span style={styles.xpBarText}>{Math.round(xpPct)}%</span>
          </div>
        </div>
      </div>

      <div style={styles.info}>
        <div style={styles.nameRow}>
          <div style={styles.name}>{hero.name}</div>
          {hero.element && (
            <span style={{ color: accentColor, fontSize: 13, lineHeight: 1 }}>
              {ELEMENT_SYMBOL[hero.element] ?? hero.element}
            </span>
          )}
        </div>
        <CapBadge value={hero.capacity} />
        <HeroStats stats={hero.stats} compact />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '13px 14px',
    background: 'linear-gradient(135deg, rgba(20,20,44,0.97) 0%, rgba(10,10,26,0.9) 100%)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 100,
    flex: 1,
    alignItems: 'flex-start',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: '#e8e8f0',
    fontWeight: 700,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
  },
  lvlBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    zIndex: 5,
    fontSize: 13,
    fontWeight: 900,
    fontStyle: 'italic',
    lineHeight: 1,
    letterSpacing: '-0.01em',
    fontFamily: 'Inter, sans-serif',
    pointerEvents: 'none',
  },
  xpBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 9,
    backgroundColor: 'rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 4,
  },
  xpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #78350f, #d97706, #fbbf24)',
    animation: 'equipXpBreathe 2.2s ease-in-out infinite',
    boxShadow: '0 0 4px rgba(251,191,36,0.8)',
    transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  xpBarCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 5,
  },
  xpBarText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 6,
    fontWeight: 900,
    letterSpacing: '0.04em',
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 1px 2px rgba(0,0,0,0.95)',
    lineHeight: 1,
  },
};
