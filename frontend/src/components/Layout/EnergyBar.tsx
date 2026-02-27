import { useEffect, useState } from 'react';

interface EnergyBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  nextTickSeconds: number | null;
  onTickComplete?: () => void | Promise<void>;
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

  const pct    = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isFull = current >= max;
  const minutes = countdown != null ? Math.floor(countdown / 60) : 0;
  const seconds = countdown != null ? countdown % 60 : 0;

  const rgb =
    color === '#4ade80' ? '74,222,128' :
    color === '#fbbf24' ? '251,191,36' : '96,165,250';

  const pulseAnim = isFull
    ? (color === '#4ade80'
        ? 'energyPulseGreen 2.5s ease-in-out infinite'
        : 'energyPulseGold 2.5s ease-in-out infinite')
    : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Label */}
      <span style={{
        color,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: 1.8,
        fontFamily: 'Inter, sans-serif',
        textShadow: `0 0 8px rgba(${rgb},0.5)`,
      }}>
        {label}
      </span>

      {/* Bar + values + timer all on one row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          flex: 1,
          position: 'relative',
          height: 10,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 5,
          border: `1px solid rgba(${rgb},0.35)`,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, rgba(${rgb},0.55) 0%, rgba(${rgb},1) 100%)`,
            boxShadow: `0 0 12px rgba(${rgb},0.75), inset 0 1px 0 rgba(255,255,255,0.18)`,
            borderRadius: 'inherit',
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            animation: pulseAnim,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)',
              animation: 'energyShimmer 2.8s ease-in-out infinite',
            }} />
          </div>
        </div>

        {/* current / max */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 1, flexShrink: 0 }}>
          <span style={{ color, fontWeight: 800, fontSize: 13, lineHeight: 1 }}>{current}</span>
          <span style={{ color: '#444466', fontSize: 11, fontWeight: 700 }}>/</span>
          <span style={{ color: '#9090b0', fontSize: 11, fontWeight: 600 }}>{max}</span>
        </div>

        {/* timer */}
        <div style={{ width: 52, flexShrink: 0 }}>
          {!isFull && countdown != null && countdown > 0 && (
            <span style={{ fontSize: 10, whiteSpace: 'nowrap' as const }}>
              <span style={{ color: `rgba(${rgb},0.9)`, fontWeight: 800 }}>+1</span>
              <span style={{ color: '#7070a0' }}> in </span>
              <span style={{ color: `rgba(${rgb},0.95)`, fontWeight: 700 }}>{minutes}:{seconds.toString().padStart(2, '0')}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
