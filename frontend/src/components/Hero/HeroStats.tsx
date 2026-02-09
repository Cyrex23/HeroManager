import { HeroStats as HeroStatsType } from '../../types';

interface HeroStatsProps {
  stats: HeroStatsType;
  bonusStats: HeroStatsType;
  level?: number;
  detailed?: boolean;
}

const STAT_LABELS: { key: keyof HeroStatsType; label: string; abbr: string }[] = [
  { key: 'physicalAttack', label: 'Physical Attack', abbr: 'PA' },
  { key: 'magicPower', label: 'Magic Power', abbr: 'MP' },
  { key: 'dexterity', label: 'Dexterity', abbr: 'DEX' },
  { key: 'element', label: 'Element', abbr: 'ELE' },
  { key: 'mana', label: 'Mana', abbr: 'MAN' },
  { key: 'stamina', label: 'Stamina', abbr: 'STA' },
];

export default function HeroStatsTable({ stats, bonusStats, level, detailed = false }: HeroStatsProps) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #0f3460' }}>
          <th style={{ textAlign: 'left', padding: '6px 8px', color: '#999' }}>Stat</th>
          {detailed && (
            <>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: '#999' }}>Base</th>
              <th style={{ textAlign: 'right', padding: '6px 8px', color: '#999' }}>Bonus</th>
            </>
          )}
          <th style={{ textAlign: 'right', padding: '6px 8px', color: '#999' }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {STAT_LABELS.map(({ key, label, abbr }) => {
          const total = stats[key];
          const bonus = bonusStats[key];
          const base = total - bonus;

          return (
            <tr key={key} style={{ borderBottom: '1px solid #0f3460' }}>
              <td style={{ padding: '6px 8px', color: '#eee' }}>
                {detailed ? label : abbr}
              </td>
              {detailed && (
                <>
                  <td style={{ textAlign: 'right', padding: '6px 8px', color: '#ccc' }}>{base}</td>
                  <td style={{ textAlign: 'right', padding: '6px 8px', color: bonus > 0 ? '#4caf50' : '#ccc' }}>
                    {bonus > 0 ? `+${bonus}` : '0'}
                  </td>
                </>
              )}
              <td style={{ textAlign: 'right', padding: '6px 8px', color: '#ffd700', fontWeight: 'bold' }}>
                {total}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
