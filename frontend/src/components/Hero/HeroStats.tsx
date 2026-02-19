import type { HeroStats as StatsType } from '../../types';

const STAT_LABELS: Record<string, string> = {
  physicalAttack: 'PA',
  magicPower: 'MP',
  dexterity: 'Dex',
  element: 'Elem',
  mana: 'Mana',
  stamina: 'Stam',
};

interface Props {
  stats: StatsType;
  bonusStats?: StatsType;
  compact?: boolean;
  showBreakdown?: boolean;
}

export default function HeroStats({ stats, bonusStats, compact, showBreakdown }: Props) {
  if (showBreakdown && bonusStats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={styles.breakdownHeader}>
          <span style={styles.bHeaderStat}>Stat</span>
          <span style={styles.bHeaderVal}>Base</span>
          <span style={styles.bHeaderVal}>Bonus</span>
          <span style={styles.bHeaderTotal}>Total</span>
        </div>
        {Object.entries(STAT_LABELS).map(([key, label]) => {
          const base = stats[key as keyof StatsType] ?? 0;
          const bonus = bonusStats[key as keyof StatsType] ?? 0;
          const total = base + bonus;
          return (
            <div key={key} style={styles.breakdownRow}>
              <span style={styles.bStat}>{label}</span>
              <span style={styles.bVal}>{base.toFixed(1)}</span>
              <span style={{ ...styles.bVal, color: bonus > 0 ? '#4ade80' : '#666' }}>
                {bonus > 0 ? `+${bonus.toFixed(1)}` : '—'}
              </span>
              <span style={styles.bTotal}>{total.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 2 : 4 }}>
      {Object.entries(STAT_LABELS).map(([key, label]) => {
        const base = stats[key as keyof StatsType] ?? 0;
        const bonus = bonusStats ? (bonusStats[key as keyof StatsType] ?? 0) : 0;
        return (
          <div key={key} style={styles.row}>
            <span style={styles.label}>{label}</span>
            <span style={styles.value}>
              {base.toFixed(1)}
              {bonus > 0 && (
                <span style={{ color: '#4ade80', fontSize: 11 }}> +{bonus.toFixed(1)}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    gap: 8,
  },
  label: {
    color: '#a0a0b0',
  },
  value: {
    color: '#e0e0e0',
    fontWeight: 500,
  },
  breakdownHeader: {
    display: 'flex',
    padding: '4px 8px',
    fontSize: 10,
    color: '#a0a0b0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottom: '1px solid #16213e',
  },
  breakdownRow: {
    display: 'flex',
    padding: '4px 8px',
    fontSize: 12,
    borderBottom: '1px solid rgba(22, 33, 62, 0.5)',
  },
  bHeaderStat: { flex: 1 },
  bHeaderVal: { flex: 1, textAlign: 'center' },
  bHeaderTotal: { flex: 1, textAlign: 'right' },
  bStat: { flex: 1, color: '#a0a0b0' },
  bVal: { flex: 1, textAlign: 'center', color: '#e0e0e0' },
  bTotal: { flex: 1, textAlign: 'right', color: '#fbbf24', fontWeight: 600 },
};
