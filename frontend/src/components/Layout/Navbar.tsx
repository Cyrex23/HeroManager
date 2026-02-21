import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTeam } from '../../context/TeamContext';
import HeroPortrait from '../Hero/HeroPortrait';

const navItems = [
  { path: '/team', label: 'Team' },
  { path: '/shop', label: 'Shop' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/arena', label: 'Arena' },
  { path: '/leaderboard', label: 'Ranks' },
];

const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '💧', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const SLOT_LABEL: Record<number, string> = {
  1: 'C1', 2: 'C2', 3: 'C3', 4: 'E1', 5: 'E2', 6: 'L', 7: 'S',
};

const PORTRAIT = 52;

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { team } = useTeam();

  return (
    <nav style={styles.nav}>
      {/* Left: Brand */}
      <Link to="/team" style={styles.brand}>HeroManager</Link>

      {/* Center: Team lineup */}
      <div style={styles.lineup}>
        {team && team.slots.map((slot) => {
          const isEmpty = slot.type === 'hero' ? !slot.hero : !slot.summon;
          const isSummon = slot.type === 'summon';

          if (isEmpty) {
            return (
              <div key={slot.slotNumber} style={styles.slot}>
                <div style={styles.slotTag}>{SLOT_LABEL[slot.slotNumber]}</div>
                <div style={styles.emptyBox} />
              </div>
            );
          }

          if (isSummon && slot.summon) {
            const s = slot.summon;
            const xpPct = s.xpToNextLevel > 0
              ? Math.min((s.currentXp / s.xpToNextLevel) * 100, 100) : 0;
            return (
              <div key={slot.slotNumber} style={styles.slot}>
                <div style={styles.slotTag}>{SLOT_LABEL[slot.slotNumber]}</div>
                <div style={styles.portraitWrap}>
                  <HeroPortrait imagePath={s.imagePath} name={s.name} size={PORTRAIT} />
                  <div style={styles.lvlBadge}>{s.level}</div>
                  <div style={styles.xpBarOnPortrait}>
                    <div style={{ ...styles.xpBarFill, width: `${xpPct}%`, backgroundColor: '#a78bfa' }} />
                  </div>
                </div>
              </div>
            );
          }

          if (!isSummon && slot.hero) {
            const h = slot.hero;
            const xpPct = h.xpToNextLevel > 0
              ? Math.min((h.currentXp / h.xpToNextLevel) * 100, 100) : 0;
            const elemColor = h.element ? (ELEMENT_COLOR[h.element] ?? '#a0a0b0') : null;
            const elemSymbol = h.element ? (ELEMENT_SYMBOL[h.element] ?? '') : null;

            return (
              <div
                key={slot.slotNumber}
                style={styles.slot}
                onClick={() => navigate(`/hero/${h.id}`)}
                title={`${h.name} — ${h.level}`}
              >
                <div style={styles.slotTag}>{SLOT_LABEL[slot.slotNumber]}</div>
                <div style={styles.portraitWrap}>
                  <HeroPortrait imagePath={h.imagePath} name={h.name} size={PORTRAIT} tier={h.tier} />
                  <div style={styles.lvlBadge}>{h.level}</div>
                  {elemSymbol && (
                    <div style={{ ...styles.elemBadge, color: elemColor ?? '#fff' }}>{elemSymbol}</div>
                  )}
                  <div style={styles.xpBarOnPortrait}>
                    <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }} />
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Right: Nav links */}
      <div style={styles.links}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.link,
              ...(location.pathname === item.path ? styles.activeLink : {}),
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: 90,
    backgroundColor: '#1a1a2e',
    borderBottom: '1px solid #16213e',
    gap: 16,
    flexShrink: 0,
  },
  brand: {
    color: '#e94560',
    fontSize: 18,
    fontWeight: 700,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    minWidth: 130,
  },
  lineup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    overflowX: 'auto',
  },
  slot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    cursor: 'pointer',
    minWidth: PORTRAIT + 4,
  },
  slotTag: {
    fontSize: 10,
    color: '#555',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  portraitWrap: {
    position: 'relative',
  },
  lvlBadge: {
    position: 'absolute',
    bottom: 5,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 800,
    padding: '1px 4px',
    borderRadius: 3,
    lineHeight: 1,
    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
  },
  xpBarOnPortrait: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: '0 0 2px 2px',
    overflow: 'hidden',
  },
  elemBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontSize: 12,
    lineHeight: 1,
  },
  emptyBox: {
    width: PORTRAIT,
    height: Math.round(PORTRAIT * (200 / 180)),
    backgroundColor: '#12122a',
    border: '1px dashed #2a2a4a',
    borderRadius: 4,
  },
  xpBarBg: {
    width: PORTRAIT,
    height: 4,
    backgroundColor: '#12122a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 2,
  },
  links: {
    display: 'flex',
    gap: 4,
    minWidth: 130,
    justifyContent: 'flex-end',
  },
  link: {
    color: '#a0a0b0',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  activeLink: {
    color: '#ffffff',
    backgroundColor: '#16213e',
  },
};
