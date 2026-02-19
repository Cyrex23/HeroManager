interface Props {
  used: number;
  max: number;
}

export default function CapacityBar({ used, max }: Props) {
  const pct = Math.min((used / max) * 100, 100);
  const isHigh = pct > 80;

  return (
    <div style={styles.container}>
      <div style={styles.label}>
        Capacity: {used}/{max}
      </div>
      <div style={styles.track}>
        <div
          style={{
            ...styles.fill,
            width: `${pct}%`,
            backgroundColor: isHigh ? '#e94560' : '#4ade80',
          }}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    color: '#a0a0b0',
    fontSize: 13,
    fontWeight: 500,
  },
  track: {
    height: 8,
    backgroundColor: '#16213e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
};
