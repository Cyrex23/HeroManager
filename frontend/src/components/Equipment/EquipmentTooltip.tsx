import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { HeroStats, SpellInfo } from '../../types';

interface Props {
  name: string;
  type: 'item' | 'ability';
  bonuses: Partial<HeroStats>;
  tier?: number | null;
  sellPrice?: number | null;
  copies?: number | null;
  spells?: SpellInfo[];
  children: React.ReactNode;
  block?: boolean;
}

const TRIGGER_LABELS: Record<string, string> = {
  ENTRANCE: 'ON ENTER',
  ATTACK: 'ON ATTACK',
  AFTER_CLASH: 'AFTER CLASH',
  AFTER_CLASH_CRIT: 'AFTER CRIT',
  OPPONENT_ENTRANCE: 'OPP. ENTER',
  BEFORE_TURN_X: 'BEFORE TURN',
  AFTER_TURN_X: 'AFTER TURN',
};

const STATS: Array<{ key: keyof HeroStats; label: string }> = [
  { key: 'physicalAttack', label: 'PA' },
  { key: 'magicPower',     label: 'MAGIC' },
  { key: 'dexterity',      label: 'DEX' },
  { key: 'element',        label: 'ELEM' },
  { key: 'mana',           label: 'MANA' },
  { key: 'stamina',        label: 'STAM' },
];

const TOOLTIP_WIDTH = 270;

export default function EquipmentTooltip({ name, type, bonuses, tier, sellPrice, copies, spells, children, block }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number; above: boolean } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setPos(null), 150);
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  function handleMouseEnter() {
    cancelClose();
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      let x = r.left + r.width / 2 - TOOLTIP_WIDTH / 2;
      x = Math.max(8, Math.min(x, window.innerWidth - TOOLTIP_WIDTH - 8));
      // Show above unless there's not enough space (use 240px as conservative estimate)
      const above = r.top >= 240;
      setPos({ x, y: above ? r.top : r.bottom, above });
    }
  }

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: block ? 'block' : 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={scheduleClose}
    >
      {children}
      {pos && createPortal(
        <div
          style={{ ...styles.popup, left: pos.x, top: pos.y, transform: pos.above ? 'translateY(calc(-100% - 8px))' : 'translateY(8px)' }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {/* Header: type badge + name */}
          <div style={styles.header}>
            <span style={{ ...styles.typeBadge, color: type === 'ability' ? '#a78bfa' : '#60a5fa' }}>
              {type === 'ability' ? 'A' : 'I'}
            </span>
            <span style={styles.name}>{name}</span>
          </div>

          <div style={styles.divider} />

          {/* Stats grid: 3 columns × 2 rows */}
          <div style={styles.statsGrid}>
            {STATS.map(({ key, label }) => {
              const val = bonuses[key] ?? 0;
              const nonZero = val !== 0;
              return (
                <div key={key} style={styles.statCell}>
                  <span style={{ ...styles.statVal, color: nonZero ? '#fbbf24' : '#444' }}>
                    {val > 0 ? '+' : ''}{val}
                  </span>
                  {' '}
                  <span style={{ ...styles.statLabel, color: nonZero ? '#c8941a' : '#3a3a5a' }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Spell section — one block per spell */}
          {spells && spells.length > 0 && spells.map((spell, si) => {
            const isPassOn = !!spell.passOnType;
            const sectionBorder = spell.affectsOpponent
              ? 'rgba(248,113,113,0.3)'
              : isPassOn ? 'rgba(20,184,166,0.3)' : 'rgba(59,130,246,0.2)';
            const sectionBg = spell.affectsOpponent
              ? 'rgba(239,68,68,0.06)'
              : isPassOn ? 'rgba(20,184,166,0.07)' : 'rgba(59,130,246,0.06)';
            const iconColor = spell.affectsOpponent ? '#f87171' : isPassOn ? '#2dd4bf' : '#60a5fa';
            const iconGlow  = spell.affectsOpponent ? '#ef4444' : isPassOn ? '#0d9488' : '#3b82f6';
            const icon      = spell.affectsOpponent ? '☠' : isPassOn ? '⤴' : '✦';
            const nameColor = spell.affectsOpponent ? '#fca5a5' : isPassOn ? '#5eead4' : '#93c5fd';
            const manaColor = spell.affectsOpponent ? '#f87171' : isPassOn ? '#2dd4bf' : '#60a5fa';
            const manaBg    = spell.affectsOpponent ? 'rgba(248,113,113,0.15)' : isPassOn ? 'rgba(20,184,166,0.15)' : 'rgba(59,130,246,0.15)';
            const manaBorder = spell.affectsOpponent ? 'rgba(248,113,113,0.3)' : isPassOn ? 'rgba(20,184,166,0.3)' : 'rgba(59,130,246,0.3)';
            const trigColor  = spell.affectsOpponent ? '#f87171' : isPassOn ? '#2dd4bf' : '#a78bfa';
            const trigBg     = spell.affectsOpponent ? 'rgba(248,113,113,0.12)' : isPassOn ? 'rgba(20,184,166,0.12)' : 'rgba(167,139,250,0.12)';
            const trigBorder = spell.affectsOpponent ? 'rgba(248,113,113,0.25)' : isPassOn ? 'rgba(20,184,166,0.25)' : 'rgba(167,139,250,0.25)';
            return (
            <div key={si}>
              <div style={{ ...styles.spellDivider, background: isPassOn ? 'linear-gradient(to right, transparent, rgba(20,184,166,0.4), transparent)' : styles.spellDivider.background }} />
              <div style={{ ...styles.spellSection, borderColor: sectionBorder, backgroundColor: sectionBg }}>
                {/* Pass-on label above spell header */}
                {isPassOn && (
                  <div style={{ fontSize: 9, color: '#2dd4bf', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 5, textTransform: 'uppercase' as const }}>
                    ⤴ TEAM SUB-SPELL · {spell.passOnType}
                  </div>
                )}
                {/* Spell header row */}
                <div style={styles.spellHeader}>
                  <span style={{ ...styles.spellIcon, color: iconColor, textShadow: `0 0 6px ${iconGlow}` }}>
                    {icon}
                  </span>
                  <span style={{ ...styles.spellName, color: nameColor }}>{spell.name}</span>
                  <span style={{ ...styles.spellMana, color: manaColor, backgroundColor: manaBg, borderColor: manaBorder }}>{spell.manaCost} MP</span>
                </div>
                {/* Duration / usage — above trigger row (passOnType badge now shown at top) */}
                {((spell.lastsTurns && spell.lastsTurns > 0) || (spell.maxUsages && spell.maxUsages > 0)) && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' as const }}>
                    {spell.lastsTurns && spell.lastsTurns > 0 && (
                      <span style={{ fontSize: 9, color: '#818cf8', fontWeight: 700, backgroundColor: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: 3, padding: '1px 5px' }}>
                        Lasts {spell.lastsTurns} turn{spell.lastsTurns > 1 ? 's' : ''}
                      </span>
                    )}
                    {spell.maxUsages && spell.maxUsages > 0 && (
                      <span style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700, backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 3, padding: '1px 5px' }}>
                        Max {spell.maxUsages}×
                      </span>
                    )}
                  </div>
                )}
                {/* Trigger + chance */}
                <div style={styles.spellMeta}>
                  <span style={{ ...styles.spellTriggerBadge, color: trigColor, backgroundColor: trigBg, borderColor: trigBorder }}>
                    {TRIGGER_LABELS[spell.trigger] ?? spell.trigger}
                  </span>
                  <span style={styles.spellChance}>{Math.round(spell.chance * 100)}% chance</span>
                </div>
                {/* Spell bonus stats */}
                {Object.keys(spell.bonuses).length > 0 && (
                  <div style={styles.spellBonuses}>
                    {Object.entries(spell.bonuses).map(([key, val]) => {
                      if (!val || val === 0) return null;
                      const isNeg = (val as number) < 0;
                      const statLabel = STATS.find(s => s.key === key)?.label ?? key;
                      const displayVal = typeof val === 'number' && Math.abs(val) < 1
                        ? `${isNeg ? '' : '+'}${Math.round((val as number) * 100)}%`
                        : `${isNeg ? '' : '+'}${val}`;
                      return (
                        <span key={key} style={{ ...styles.spellBonus, color: isNeg ? '#f87171' : '#34d399', backgroundColor: isNeg ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)' }}>
                          {displayVal} {statLabel}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ); })}

          <div style={styles.divider} />

          {/* Footer */}
          <div style={styles.footer}>
            {type === 'ability' && tier != null && (
              <span style={styles.footerTag}>
                TIER <span style={styles.footerVal}>{tier}</span>
              </span>
            )}
            {type === 'item' && sellPrice != null && (
              <span style={styles.footerTag}>
                SELL <span style={styles.footerVal}>{sellPrice}g</span>
              </span>
            )}
            {copies != null && (
              <span style={styles.footerTag}>
                COPIES <span style={styles.footerVal}>{copies}</span>
              </span>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  popup: {
    position: 'fixed',
    width: TOOLTIP_WIDTH,
    backgroundColor: '#0b0b1e',
    border: '1px solid #7a5a1a',
    borderRadius: 6,
    padding: '10px 14px',
    zIndex: 9999,
    boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
    pointerEvents: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: 900,
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid currentColor',
    borderRadius: 3,
    padding: '1px 5px',
    flexShrink: 0,
  },
  name: {
    color: '#e8c97a',
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#7a5a1a44',
    margin: '8px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px 0',
  },
  statCell: {
    fontSize: 11,
    padding: '2px 0',
  },
  statVal: {
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  // ── Spell styles ─────────────────────────────────────────────────────────────
  spellDivider: {
    height: 1,
    background: 'linear-gradient(to right, transparent, #3b82f666, transparent)',
    margin: '8px 0 6px',
  },
  spellSection: {
    backgroundColor: 'rgba(59,130,246,0.06)',
    border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: 5,
    padding: '7px 9px',
    marginBottom: 2,
  },
  spellHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  spellIcon: {
    color: '#60a5fa',
    fontSize: 12,
    flexShrink: 0,
    textShadow: '0 0 6px #3b82f6',
  },
  spellName: {
    color: '#93c5fd',
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: 0.3,
    flex: 1,
  },
  spellMana: {
    color: '#60a5fa',
    fontWeight: 800,
    fontSize: 11,
    backgroundColor: 'rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.3)',
    borderRadius: 3,
    padding: '1px 5px',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  spellMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  spellTriggerBadge: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.8,
    color: '#a78bfa',
    backgroundColor: 'rgba(167,139,250,0.12)',
    border: '1px solid rgba(167,139,250,0.25)',
    borderRadius: 3,
    padding: '1px 5px',
    textTransform: 'uppercase' as const,
  },
  spellChance: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: 600,
  },
  spellBonuses: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '3px 6px',
  },
  spellBonus: {
    fontSize: 10,
    fontWeight: 700,
    color: '#34d399',
    backgroundColor: 'rgba(52,211,153,0.08)',
    borderRadius: 3,
    padding: '1px 4px',
  },
  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    display: 'flex',
    gap: 16,
    justifyContent: 'flex-end',
  },
  footerTag: {
    color: '#555',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  footerVal: {
    color: '#e8c97a',
    fontWeight: 700,
  },
};
