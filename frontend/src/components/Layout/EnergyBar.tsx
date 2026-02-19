import { useEffect, useState } from 'react';

interface EnergyBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  nextTickSeconds: number | null;
  onTickComplete?: () => void;
}

export default function EnergyBar({ label, current, max, color, nextTickSeconds, onTickComplete }: EnergyBarProps) {
  const [countdown, setCountdown] = useState<number | null>(nextTickSeconds);

  useEffect(() => {
    setCountdown(nextTickSeconds);
  }, [nextTickSeconds]);

  useEffect(() => {
    if (countdown == null || countdown <= 0 || current >= max) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev == null || prev <= 1) {
          clearInterval(timer);
          onTickComplete?.();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, current, max, onTickComplete]);

  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const minutes = countdown != null ? Math.floor(countdown / 60) : 0;
  const seconds = countdown != null ? countdown % 60 : 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={{ color, fontWeight: 600, fontSize: 12 }}>{label}</span>
        <span style={styles.value}>{current}/{max}</span>
      </div>
      <div style={styles.barBg}>
        <div style={{ ...styles.barFill, width: `${pct}%`, backgroundColor: color }} />
      </div>
      {current < max && countdown != null && countdown > 0 && (
        <div style={styles.timer}>
          +1 in {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    color: '#e0e0e0',
    fontSize: 12,
  },
  barBg: {
    height: 6,
    backgroundColor: '#0f0f23',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  timer: {
    color: '#a0a0b0',
    fontSize: 10,
    textAlign: 'right',
  },
};
