import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeam } from '../../api/teamApi';
import type { TeamResponse } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';

// Inject XP shimmer keyframe once
if (typeof document !== 'undefined') {
  const id = 'inspect-popup-css';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @keyframes xpShimmer {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
    `;
    document.head.appendChild(el);
  }
}

const ELEMENT_COLOR: Record<string, string> = {
  FIRE:      '#f97316',
  WATER:     '#38bdf8',
  WIND:      '#86efac',
  EARTH:     '#a16207',
  LIGHTNING: '#facc15',
};

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};


export default function TeamLineupBar() {
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getTeam().then(setTeam).catch(() => {/* non-fatal */});
  }, []);

  if (!team) return null;

  return (
    <div style={styles.bar}>
      {team.slots.map((slot) => {
        const isEmpty = slot.type === 'hero' ? !slot.hero : !slot.summon;
        const isSummon = slot.type === 'summon';

        if (isEmpty) {
          return (
            <div key={slot.slotNumber} style={styles.slot}>
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
              <div style={styles.portraitWrap}>
                <HeroPortrait imagePath={s.imagePath} name={s.name} size={38} />
                <div style={styles.lvlBadge}>{s.level}</div>
              </div>
              <div style={styles.xpBarBg}>
                <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }} />
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
              title={`${h.name} — Lv.${h.level}`}
            >
              <div style={styles.portraitWrap}>
                <HeroPortrait imagePath={h.imagePath} name={h.name} size={38} tier={h.tier} />
                <div style={styles.lvlBadge}>{h.level}</div>
                {elemSymbol && (
                  <div style={{ ...styles.elemBadge, color: elemColor ?? '#fff' }}>
                    {elemSymbol}
                  </div>
                )}
              </div>
              <div style={styles.xpBarBg}>
                <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }} />
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '4px 16px',
    backgroundColor: '#12122a',
    borderBottom: '1px solid #16213e',
    overflowX: 'auto',
  },
  slot: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    cursor: 'pointer',
    minWidth: 44,
  },
  slotTag: {
    fontSize: 9,
    color: '#555',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  portraitWrap: {
    position: 'relative',
  },
  lvlBadge: {
    position: 'absolute',
    bottom: 3,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(5,5,18,0.88)',
    border: '1px solid rgba(251,191,36,0.6)',
    color: '#fde68a',
    fontSize: 11,
    fontWeight: 900,
    padding: '1px 7px',
    borderRadius: 8,
    lineHeight: 1.25,
    whiteSpace: 'nowrap' as const,
    boxShadow: '0 0 10px rgba(251,191,36,0.28)',
    textShadow: '0 0 8px rgba(251,191,36,0.9)',
    letterSpacing: 0.5,
    zIndex: 2,
    pointerEvents: 'none' as const,
  },
  elemBadge: {
    position: 'absolute',
    top: 1,
    left: 1,
    fontSize: 10,
    lineHeight: 1,
    textShadow: '0 1px 4px rgba(0,0,0,0.9)',
  },
  emptyBox: {
    width: 38,
    height: 42,
    backgroundColor: '#1a1a2e',
    border: '1px dashed #2a2a4a',
    borderRadius: 4,
  },
  xpBarBg: {
    width: 38,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 3,
    overflow: 'hidden',
    border: '1px solid rgba(251,191,36,0.22)',
  },
  xpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #92400e 0%, #d97706 30%, #fbbf24 55%, #fde68a 75%, #fbbf24 100%)',
    backgroundSize: '200% 100%',
    animation: 'xpShimmer 2.5s ease-in-out infinite',
    borderRadius: 2,
    boxShadow: '0 0 5px rgba(251,191,36,0.4)',
  },
};
