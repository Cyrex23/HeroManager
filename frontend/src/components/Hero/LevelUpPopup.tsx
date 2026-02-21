import { useEffect, useState } from 'react';
import type { HeroStats } from '../../types';
import HeroPortrait from './HeroPortrait';

// CSS animations
if (typeof document !== 'undefined') {
  const id = 'levelup-popup-css';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @keyframes lvlupGlow {
        0%, 100% { text-shadow: 0 0 12px rgba(251,191,36,0.9), 0 0 30px rgba(251,191,36,0.5); }
        50%       { text-shadow: 0 0 24px rgba(251,191,36,1), 0 0 60px rgba(251,191,36,0.8), 0 0 80px rgba(251,191,36,0.3); }
      }
      @keyframes lvlupSlideIn {
        from { transform: translateY(-24px) scale(0.94); opacity: 0; }
        to   { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes lvlupCardPulse {
        0%, 100% { box-shadow: 0 0 30px rgba(251,191,36,0.3), 0 8px 40px rgba(0,0,0,0.7); }
        50%       { box-shadow: 0 0 60px rgba(251,191,36,0.55), 0 8px 40px rgba(0,0,0,0.7); }
      }
      @keyframes lvlupBadgeShine {
        0%, 100% { box-shadow: 0 0 10px rgba(251,191,36,0.5); }
        50%       { box-shadow: 0 0 22px rgba(251,191,36,0.9), 0 0 40px rgba(251,191,36,0.4); }
      }
    `;
    document.head.appendChild(el);
  }
}

export interface LevelUpEvent {
  heroId: number;
  heroName: string;
  imagePath: string;
  oldLevel: number;
  newLevel: number;
  baseStats: HeroStats;
  growthStats: HeroStats;
  tier: 'COMMONER' | 'ELITE' | 'LEGENDARY' | null;
}

interface Props {
  event: LevelUpEvent;
  onClose: () => void;
}

const STAT_KEYS: (keyof HeroStats)[] = [
  'physicalAttack', 'magicPower', 'dexterity', 'element', 'mana', 'stamina',
];
const STAT_LABELS: Record<keyof HeroStats, string> = {
  physicalAttack: 'Phys. Atk',
  magicPower:     'Magic Pwr',
  dexterity:      'Dexterity',
  element:        'Element',
  mana:           'Mana',
  stamina:        'Stamina',
};

const TIER_BORDER: Record<string, string> = {
  COMMONER:   '2px solid rgba(107,114,128,0.7)',
  ELITE:      '2px solid rgba(167,139,250,0.8)',
  LEGENDARY:  '2px solid rgba(249,115,22,0.85)',
};
const TIER_GLOW: Record<string, string> = {
  COMMONER:   '0 0 28px rgba(107,114,128,0.5)',
  ELITE:      '0 0 28px rgba(167,139,250,0.55)',
  LEGENDARY:  '0 0 28px rgba(249,115,22,0.6)',
};

export default function LevelUpPopup({ event, onClose }: Props) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 250);
    return () => clearTimeout(t);
  }, []);

  const levelsGained = event.newLevel - event.oldLevel;
  const tierBorder = event.tier ? (TIER_BORDER[event.tier] ?? TIER_BORDER.COMMONER) : TIER_BORDER.COMMONER;
  const tierGlow   = event.tier ? (TIER_GLOW[event.tier]  ?? TIER_GLOW.COMMONER)   : TIER_GLOW.COMMONER;

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.card, animation: 'lvlupSlideIn 0.4s ease-out forwards, lvlupCardPulse 2.5s ease-in-out 0.4s infinite' }}>

        {/* Portrait */}
        <div style={{ ...styles.portraitWrap, border: tierBorder, boxShadow: tierGlow }}>
          <HeroPortrait imagePath={event.imagePath} name={event.heroName} size={110} tier={event.tier} />
        </div>

        {/* LEVEL UP! heading */}
        <div style={{ ...styles.lvlUpText, animation: 'lvlupGlow 1.6s ease-in-out infinite' }}>
          ★ LEVEL UP! ★
        </div>

        {/* Hero name */}
        <div style={styles.heroName}>{event.heroName}</div>

        {/* Level badge */}
        <div style={styles.lvlRow}>
          <span style={styles.oldLvl}>Lv. {event.oldLevel}</span>
          <span style={styles.arrow}>➜</span>
          <div style={{ ...styles.newLvlBadge, animation: 'lvlupBadgeShine 1.8s ease-in-out infinite' }}>
            Lv. {event.newLevel}
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Stat bars */}
        <div style={styles.statsBlock}>
          {STAT_KEYS.map(key => {
            const base   = event.baseStats[key];
            const growth = event.growthStats[key];
            const newRaw = base + growth * (event.newLevel - 1);
            const oldRaw = base + growth * (event.oldLevel - 1);
            const gain   = growth * levelsGained;
            const maxStat = Math.max(base + growth * 49, newRaw, 1);

            const oldPct  = Math.min((oldRaw / maxStat) * 100, 100);
            const gainPct = Math.min((gain  / maxStat) * 100, Math.max(0, 100 - oldPct));

            return (
              <div key={key} style={styles.statRow}>
                <div style={styles.statLabel}>{STAT_LABELS[key]}</div>
                <div style={styles.barBg}>
                  {/* Base portion (previous level) */}
                  <div style={{ ...styles.barBase, width: `${oldPct}%` }} />
                  {/* Gain portion (new levels) */}
                  <div style={{
                    ...styles.barGain,
                    width: animated ? `${gainPct}%` : '0%',
                    transition: animated ? 'width 1.1s cubic-bezier(0.22,1,0.36,1)' : 'none',
                  }} />
                </div>
                <div style={styles.statRight}>
                  <span style={styles.statNum}>{Math.round(newRaw)}</span>
                  {gain > 0 && <span style={styles.statGain}> +{Math.round(gain)}</span>}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} style={styles.closeBtn}>Continue</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#0d0d1f',
    border: '1px solid rgba(251,191,36,0.35)',
    borderRadius: 16,
    padding: '28px 30px 24px',
    width: 340,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 11,
  },
  portraitWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
  },
  lvlUpText: {
    fontSize: 24,
    fontWeight: 900,
    color: '#fde68a',
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
    marginTop: 2,
  },
  heroName: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.5,
    marginTop: -4,
  },
  lvlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  oldLvl: {
    color: '#4b5563',
    fontSize: 15,
    fontWeight: 700,
  },
  arrow: {
    color: '#fbbf24',
    fontSize: 18,
  },
  newLvlBadge: {
    backgroundColor: 'rgba(5,5,18,0.9)',
    border: '2px solid rgba(251,191,36,0.7)',
    color: '#fde68a',
    fontSize: 18,
    fontWeight: 900,
    padding: '3px 14px',
    borderRadius: 20,
    letterSpacing: 1,
    textShadow: '0 0 10px rgba(251,191,36,0.9)',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    margin: '2px 0',
  },
  statsBlock: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 11,
    width: 72,
    flexShrink: 0,
    textAlign: 'right' as const,
    letterSpacing: 0.2,
  },
  barBg: {
    flex: 1,
    height: 9,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
  },
  barBase: {
    height: '100%',
    backgroundColor: '#2d3f5c',
    flexShrink: 0,
    borderRadius: '5px 0 0 5px',
  },
  barGain: {
    height: '100%',
    background: 'linear-gradient(90deg, #b45309 0%, #d97706 40%, #fbbf24 75%, #fde68a 100%)',
    boxShadow: '0 0 8px rgba(251,191,36,0.65)',
    flexShrink: 0,
  },
  statRight: {
    width: 58,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  statNum: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: 600,
  },
  statGain: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 700,
  },
  closeBtn: {
    marginTop: 6,
    padding: '9px 36px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.8,
  },
};
