const CSS = `
@keyframes capShimmer {
  0%   { transform: translateX(-120%) skewX(-15deg); }
  100% { transform: translateX(300%)  skewX(-15deg); }
}
@keyframes capGlow {
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 1;   }
}
.cap-label-text {
  background: linear-gradient(90deg, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
`;

interface Props {
  used: number;
  max: number;
}

export default function CapacityBar({ used, max }: Props) {
  const pct = Math.min((used / max) * 100, 100);
  const isHigh = pct > 80;
  const isMed  = pct > 50;

  const gradient = isHigh
    ? 'linear-gradient(90deg, #c73652 0%, #e94560 60%, #ff8fa3 100%)'
    : isMed
    ? 'linear-gradient(90deg, #b45309 0%, #f59e0b 60%, #fcd34d 100%)'
    : 'linear-gradient(90deg, #15803d 0%, #22c55e 60%, #4ade80 100%)';

  const glowRgb    = isHigh ? '233,69,96' : isMed ? '245,158,11' : '74,222,128';
  const labelColor = isHigh ? '#e94560'   : isMed ? '#fbbf24'    : '#4ade80';

  return (
    <>
      <style>{CSS}</style>
      <div style={styles.container}>
        <div style={styles.labelRow}>
          <span style={styles.capLabel} className="cap-label-text">⬡ Capacity</span>
          <span style={styles.capValueRow}>
            <span style={{ ...styles.capUsed, color: labelColor }}>{used}</span>
            <span style={styles.capSlash}>/</span>
            <span style={styles.capMax}>{max}</span>
          </span>
        </div>
        <div style={styles.track}>
          <div style={{
            ...styles.fill,
            width: `${pct}%`,
            background: gradient,
            boxShadow: `0 0 10px rgba(${glowRgb},0.7), inset 0 1px 0 rgba(255,255,255,0.15)`,
            animation: 'capGlow 2s ease-in-out infinite',
          }}>
            <div style={styles.shimmer} />
          </div>
          <span style={styles.pctLabel}>{pct.toFixed(0)}%</span>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 240,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  capLabel: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  capValueRow: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: 3,
  },
  capUsed: {
    fontSize: 17,
    fontWeight: 900,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  },
  capSlash: {
    fontSize: 14,
    fontWeight: 800,
    color: '#555577',
  },
  capMax: {
    fontSize: 14,
    fontWeight: 800,
    color: '#8888aa',
    fontVariantNumeric: 'tabular-nums',
  },
  track: {
    position: 'relative' as const,
    height: 14,
    backgroundColor: '#0a0a1a',
    borderRadius: 7,
    overflow: 'hidden',
    border: '1px solid rgba(167,139,250,0.7)',
    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 0 6px rgba(167,139,250,0.35)',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
    transition: 'width 0.5s ease',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '45%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    animation: 'capShimmer 2.5s ease-in-out infinite',
  },
  pctLabel: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    fontWeight: 800,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: '0.05em',
    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
    pointerEvents: 'none' as const,
  },
};
