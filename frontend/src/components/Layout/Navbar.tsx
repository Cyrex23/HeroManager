import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTeam } from '../../context/TeamContext';
import { usePlayer } from '../../context/PlayerContext';
import HeroPortrait from '../Hero/HeroPortrait';
import HeroManagerLogo from '../brand/HeroManagerLogo';
import EnergyBar from './EnergyBar';
import { getOnlineCount } from '../../api/playerApi';

const navItems: Array<{ path: string; label: string; locked?: boolean }> = [
  { path: '/team',         label: 'Team' },
  { path: '/blacksmith',   label: 'Blacksmith',  locked: true },
  { path: '/world',        label: 'World',        locked: true },
  { path: '/arena',        label: 'Arena' },
  { path: '/championship', label: 'Championship', locked: true },
  { path: '/guild',        label: 'Guild',        locked: true },
];

const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const TIER_GLOW: Record<string, string> = {
  LEGENDARY: '0 0 14px rgba(251,191,36,0.65), 0 0 28px rgba(251,191,36,0.2)',
  ELITE:     '0 0 14px rgba(167,139,250,0.65), 0 0 24px rgba(167,139,250,0.2)',
  COMMONER:  'none',
};

const PORTRAIT = 64;
const STRIP_H = 12; // height of the integrated xp+level strip

// Separators go BEFORE these slot numbers
const GROUP_SEP_BEFORE = new Set([4, 6, 7]);
// Portrait height constant
const PORTRAIT_H = Math.round(PORTRAIT * (200 / 180));

const XP_STRIP_CSS = `
  nav::-webkit-scrollbar { display: none; }
  nav { scrollbar-width: none; -ms-overflow-style: none; }
  .nav-lineup::-webkit-scrollbar { display: none; }
  .nav-lineup { scrollbar-width: none; -ms-overflow-style: none; }
  .nav-link:hover {
    color: #c0c0e0 !important;
    background-color: rgba(255,255,255,0.07) !important;
    border-color: rgba(255,255,255,0.16) !important;
    transform: translateY(-1px);
  }
  @keyframes xp-shimmer {
    0%   { transform: translateX(-180%) skewX(-18deg); opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { transform: translateX(380%) skewX(-18deg); opacity: 0; }
  }
  @keyframes xp-breathe {
    0%, 100% { filter: brightness(1); }
    50%       { filter: brightness(1.35); }
  }
  @keyframes empty-pulse {
    0%, 100% { border-color: rgba(233,69,96,0.45); box-shadow: inset 0 0 14px rgba(233,69,96,0.08), 0 0 8px rgba(233,69,96,0.1); }
    50%       { border-color: rgba(233,69,96,0.85); box-shadow: inset 0 0 20px rgba(233,69,96,0.18), 0 0 18px rgba(233,69,96,0.22); }
  }
  .slot-bracket {
    position: relative;
  }
  .slot-bracket::before {
    content: '';
    position: absolute;
    top: -1px; left: -1px;
    width: 10px; height: 10px;
    border-top: 2px solid rgba(233,69,96,0.5);
    border-left: 2px solid rgba(233,69,96,0.5);
    border-radius: 1px 0 0 0;
    z-index: 3;
  }
  .slot-bracket::after {
    content: '';
    position: absolute;
    bottom: -1px; right: -1px;
    width: 10px; height: 10px;
    border-bottom: 2px solid rgba(233,69,96,0.5);
    border-right: 2px solid rgba(233,69,96,0.5);
    border-radius: 0 0 1px 0;
    z-index: 3;
  }
  @keyframes lvl-gradient-flow {
    0%, 100% { background-position: 0% 0%; }
    50%       { background-position: 0% 100%; }
  }
  .xp-lvl-hero {
    background: linear-gradient(180deg, #c8c8c8 0%, #ff6b85 45%, #b01c32 100%);
    background-size: 100% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter:
      drop-shadow(0  1px 0 rgba(0,0,0,0.95))
      drop-shadow(0 -1px 0 rgba(0,0,0,0.85))
      drop-shadow( 1px 0 0 rgba(0,0,0,0.85))
      drop-shadow(-1px 0 0 rgba(0,0,0,0.85))
      drop-shadow(0  2px 4px rgba(0,0,0,0.75));
    animation: lvl-gradient-flow 2.4s ease-in-out infinite;
  }
  .xp-lvl-summon {
    background: linear-gradient(180deg, #c8c8c8 0%, #d8b4fe 45%, #5b21b6 100%);
    background-size: 100% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter:
      drop-shadow(0  1px 0 rgba(0,0,0,0.95))
      drop-shadow(0 -1px 0 rgba(0,0,0,0.85))
      drop-shadow( 1px 0 0 rgba(0,0,0,0.85))
      drop-shadow(-1px 0 0 rgba(0,0,0,0.85))
      drop-shadow(0  2px 4px rgba(0,0,0,0.75));
    animation: lvl-gradient-flow 2.4s ease-in-out infinite;
  }
`;

const XP_FILL = {
  bg:     'linear-gradient(90deg, #78350f, #d97706, #fbbf24)',
  glow:   'rgba(251,191,36,0.7)',
  border: 'rgba(251,191,36,0.45)',
};

// Shared style for the level number rendered OUTSIDE the clip div
const LVL_STYLE: React.CSSProperties = {
  position: 'absolute',
  bottom: STRIP_H,
  right: 6,
  transform: 'translateY(50%)',
  zIndex: 5,
  fontSize: 16,
  fontWeight: 900,
  fontStyle: 'italic',
  lineHeight: 1,
  letterSpacing: '-0.01em',
  fontFamily: 'Inter, sans-serif',
};

/**
 * XP bar + % label only — must be rendered inside a `position:relative overflow:hidden`
 * clip div so the shimmer is clipped correctly. The level number is rendered as a sibling
 * OUTSIDE that div to avoid being clipped.
 */
function XpBar({ xpPct }: { xpPct: number }) {
  return (
    <>
      {/* Bar track */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: STRIP_H,
        backgroundColor: 'rgba(0,0,0,0.82)',
        border: `1px solid ${XP_FILL.border}`,
        overflow: 'hidden',
        zIndex: 4,
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0,
          height: '100%',
          width: `${xpPct}%`,
          background: XP_FILL.bg,
          boxShadow: `0 0 8px ${XP_FILL.glow}, 0 0 2px ${XP_FILL.glow}`,
          transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
          animation: 'xp-breathe 2.2s ease-in-out infinite',
          overflow: 'hidden',
        }}>
          {xpPct > 5 && (
            <div style={{
              position: 'absolute',
              top: 0, bottom: 0,
              width: '35%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)',
              animation: 'xp-shimmer 2.6s ease-in-out infinite',
            }} />
          )}
        </div>
      </div>

      {/* XP % label centered in bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 26,
        height: STRIP_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
        pointerEvents: 'none',
      }}>
        <span style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: 9,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '0.04em',
          fontFamily: 'Inter, sans-serif',
          textShadow: '0 1px 2px rgba(0,0,0,0.95)',
        }}>
          {Math.round(xpPct)}%
        </span>
      </div>
    </>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { team } = useTeam();
  const { player, fetchPlayer } = usePlayer();
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    function poll() {
      getOnlineCount().then((n) => { if (active) setOnlineCount(n); }).catch(() => {});
    }
    poll();
    const id = setInterval(poll, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <nav style={styles.nav}>
      <style>{XP_STRIP_CSS}</style>
      {/* Left: Brand + online pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 50, flexShrink: 0 }}>
        <HeroManagerLogo size="md" linkTo="/team" />
        {onlineCount !== null && (
          <div style={styles.onlinePill}>
            <span style={styles.onlineDot} />
            <span style={styles.onlinePillText}>{onlineCount} players online</span>
          </div>
        )}
      </div>

      {/* Energy bars */}
      {player && (
        <div style={styles.energyBlock}>
          <EnergyBar label="Arena" current={player.arenaEnergy} max={player.arenaEnergyMax}
            color="#4ade80" nextTickSeconds={player.nextEnergyTickSeconds} onTickComplete={fetchPlayer} />
          <EnergyBar label="World" current={player.worldEnergy} max={player.worldEnergyMax}
            color="#fbbf24" nextTickSeconds={player.nextEnergyTickSeconds} onTickComplete={fetchPlayer} />
        </div>
      )}

      {/* Center: Team lineup */}
      <div className="nav-lineup" style={styles.lineup}>
        {team && team.slots.flatMap((slot) => {
          const isEmpty = slot.type === 'hero' ? !slot.hero : !slot.summon;
          const isSummon = slot.type === 'summon';

          // Group separator before certain slots
          const sep = GROUP_SEP_BEFORE.has(slot.slotNumber)
            ? <div key={`sep-${slot.slotNumber}`} style={styles.groupSep} />
            : null;

          let slotEl: React.ReactElement | null = null;

          if (isEmpty) {
            slotEl = (
              <div key={slot.slotNumber} style={styles.slot} onClick={() => navigate('/team')} title="Add hero to team">
                <div style={styles.emptyBox}>
                  <span style={styles.emptyPlus}>+</span>
                  <span style={styles.emptyLabel}>EMPTY</span>
                </div>
              </div>
            );
          } else if (isSummon && slot.summon) {
            const s = slot.summon;
            const xpPct = s.xpToNextLevel > 0
              ? Math.min((s.currentXp / s.xpToNextLevel) * 100, 100) : 0;
            slotEl = (
              <div key={slot.slotNumber} style={styles.slot} onClick={() => navigate(`/summon/${s.id}`)} title={`${s.name} — Lv.${s.level}`}>
                <motion.div
                  className="slot-bracket"
                  style={{ ...styles.portraitWrap, overflow: 'visible', cursor: 'pointer' }}
                  whileHover={{ scale: 1.08, filter: 'brightness(1.18)' }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Inner clip: portrait + bar rounded; level number is OUTSIDE to avoid clipping */}
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
                    <HeroPortrait imagePath={s.imagePath} name={s.name} size={PORTRAIT} />
                    <XpBar xpPct={xpPct} />
                  </div>
                  <span className="xp-lvl-hero" style={LVL_STYLE}>{s.level}</span>
                </motion.div>
              </div>
            );
          } else if (!isSummon && slot.hero) {
            const h = slot.hero;
            const xpPct = h.xpToNextLevel > 0
              ? Math.min((h.currentXp / h.xpToNextLevel) * 100, 100) : 0;
            const elemColor = h.element ? (ELEMENT_COLOR[h.element] ?? '#a0a0b0') : null;
            const elemSymbol = h.element ? (ELEMENT_SYMBOL[h.element] ?? '') : null;
            const tierGlow = h.tier ? (TIER_GLOW[h.tier] ?? 'none') : 'none';
            slotEl = (
              <div key={slot.slotNumber} style={styles.slot} onClick={() => navigate(`/hero/${h.id}`)} title={`${h.name} — Lv.${h.level}`}>
                <motion.div
                  className="slot-bracket"
                  style={{ ...styles.portraitWrap, overflow: 'visible', boxShadow: tierGlow, cursor: 'pointer' }}
                  whileHover={{ scale: 1.08, filter: 'brightness(1.2)' }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Inner clip: portrait + bar rounded; level number is OUTSIDE to avoid clipping */}
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
                    <HeroPortrait imagePath={h.imagePath} name={h.name} size={PORTRAIT} tier={h.tier} />
                    {elemSymbol && (
                      <div style={{ ...styles.elemBadge, color: elemColor ?? '#fff' }}>{elemSymbol}</div>
                    )}
                    <XpBar xpPct={xpPct} />
                  </div>
                  <span className="xp-lvl-hero" style={LVL_STYLE}>{h.level}</span>
                </motion.div>
              </div>
            );
          }

          return sep ? [sep, slotEl!] : [slotEl!];
        })}
      </div>

      {/* Right: Nav links */}
      <div style={styles.links}>
        {navItems.map((item) => {
          if (item.locked) {
            return (
              <span
                key={item.path}
                title="Coming soon"
                style={{ ...styles.link, ...styles.lockedLink }}
              >
                {item.label}
                <span style={styles.lockIcon}>🔒</span>
              </span>
            );
          }
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link${isActive ? ' active' : ''}`}
              style={{
                ...styles.link,
                color: isActive ? '#ffffff' : '#c0c0d8',
                backgroundColor: isActive ? 'rgba(233,69,96,0.14)' : 'rgba(255,255,255,0.06)',
                borderColor: isActive ? 'rgba(233,69,96,0.5)' : 'rgba(255,255,255,0.18)',
                boxShadow: isActive ? '0 0 14px rgba(233,69,96,0.22), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 22px',
    height: 90,
    backgroundColor: 'rgba(10, 10, 24, 0.92)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    borderBottom: '1px solid rgba(233, 69, 96, 0.12)',
    boxShadow: '0 1px 0 rgba(233,69,96,0.06), 0 4px 30px rgba(0,0,0,0.5)',
    gap: 16,
    flexShrink: 0,
    position: 'relative',
    zIndex: 100,
  },
  lineup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    justifyContent: 'center',
    overflowX: 'hidden',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 10,
    padding: '4px 14px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    maxWidth: 640,
  },
  slot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },
  portraitWrap: {
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
  },
  elemBadge: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontSize: 12,
    lineHeight: 1,
    filter: 'drop-shadow(0 0 3px currentColor)',
  },
  groupSep: {
    width: 1,
    height: 48,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 1,
    margin: '0 3px',
    flexShrink: 0,
  },
  emptyBox: {
    width: PORTRAIT,
    height: PORTRAIT_H,
    borderRadius: 6,
    border: '2px dashed rgba(233,69,96,0.55)',
    backgroundColor: 'rgba(233,69,96,0.07)',
    backgroundImage: 'repeating-linear-gradient(135deg, rgba(233,69,96,0.04) 0px, rgba(233,69,96,0.04) 2px, transparent 2px, transparent 10px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    cursor: 'pointer',
    animation: 'empty-pulse 2.8s ease-in-out infinite',
  },
  emptyPlus: {
    color: 'rgba(233,69,96,0.75)',
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 400,
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 0 8px rgba(233,69,96,0.5)',
  },
  emptyLabel: {
    color: 'rgba(233,69,96,0.55)',
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: '0.1em',
    fontFamily: 'Inter, sans-serif',
  },
  links: {
    display: 'flex',
    gap: 4,
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  link: {
    textDecoration: 'none',
    padding: '6px 13px',
    borderRadius: 7,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    transition: 'all 0.18s ease',
    border: '1px solid rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  lockedLink: {
    color: '#2e2e50',
    cursor: 'not-allowed',
    userSelect: 'none' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    border: '1px solid rgba(255,255,255,0.03)',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  lockIcon: {
    fontSize: 8,
    opacity: 0.5,
    lineHeight: 1,
  },
  energyBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    width: 220,
    flexShrink: 0,
    marginLeft: 56,
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8,
    padding: '7px 10px',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  onlinePill: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '4px 9px', borderRadius: 20,
    backgroundColor: 'rgba(74,222,128,0.06)',
    border: '1px solid rgba(74,222,128,0.18)',
  },
  onlineDot: {
    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
    backgroundColor: '#4ade80',
    boxShadow: '0 0 5px rgba(74,222,128,0.8)',
    flexShrink: 0,
  } as React.CSSProperties,
  onlinePillText: {
    color: '#4ade80', fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif',
  },
};
