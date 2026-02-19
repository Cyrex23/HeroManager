import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeam } from '../../api/teamApi';
import type { TeamResponse } from '../../types';
import HeroPortrait from '../Hero/HeroPortrait';

const ELEMENT_COLOR: Record<string, string> = {
  FIRE:      '#f97316',
  WATER:     '#38bdf8',
  WIND:      '#86efac',
  EARTH:     '#a16207',
  LIGHTNING: '#facc15',
};

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '💧', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};

const SLOT_LABEL: Record<number, string> = {
  1: 'C1', 2: 'C2', 3: 'C3', 4: 'E1', 5: 'E2', 6: 'L', 7: 'S',
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
                <HeroPortrait imagePath={s.imagePath} name={s.name} size={36} />
                <div style={styles.lvlBadge}>Lv{s.level}</div>
              </div>
              <div style={styles.xpBarBg}>
                <div style={{ ...styles.xpBarFill, width: `${xpPct}%`, backgroundColor: '#a78bfa' }} />
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
              <div style={styles.slotTag}>{SLOT_LABEL[slot.slotNumber]}</div>
              <div style={styles.portraitWrap}>
                <HeroPortrait imagePath={h.imagePath} name={h.name} size={36} tier={h.tier} />
                <div style={styles.lvlBadge}>Lv{h.level}</div>
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
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: '#e0e0e0',
    fontSize: 8,
    padding: '1px 2px',
    borderRadius: 2,
    lineHeight: 1,
  },
  elemBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    fontSize: 10,
    lineHeight: 1,
  },
  emptyBox: {
    width: 36,
    height: 40,
    backgroundColor: '#1a1a2e',
    border: '1px dashed #333',
    borderRadius: 4,
  },
  xpBarBg: {
    width: 36,
    height: 3,
    backgroundColor: '#1a1a2e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 2,
  },
};
