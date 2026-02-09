interface EnergyBarProps {
  current: number;
  max: number;
  type: 'arena' | 'world';
}

export default function EnergyBar({ current, max, type }: EnergyBarProps) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const color = type === 'arena' ? '#4caf50' : '#ffd700';
  const label = type === 'arena' ? 'Arena Energy' : 'World Energy';

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '0.8em' }}>
        <span style={{ color: '#eee' }}>{label}</span>
        <span style={{ color }}>{current} / {max}</span>
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#0f3460',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: color,
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
