interface CapacityBarProps {
  used: number;
  max: number;
}

export default function CapacityBar({ used, max }: CapacityBarProps) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  const isOver = used > max;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85em' }}>
        <span style={{ color: '#eee' }}>Capacity</span>
        <span style={{ color: isOver ? '#e94560' : '#4caf50' }}>
          {used} / {max}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '10px',
          backgroundColor: '#0f3460',
          borderRadius: '5px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: isOver ? '#e94560' : '#4caf50',
            borderRadius: '5px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
