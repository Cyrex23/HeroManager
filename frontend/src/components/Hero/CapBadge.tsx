interface Props {
  value: number;
}

export default function CapBadge({ value }: Props) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: 'rgba(167,139,250,0.09)',
      border: '1px solid rgba(167,139,250,0.22)',
      borderRadius: 6,
      padding: '3px 9px',
    }}>
      <span style={{
        background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1,
      }}>CAP</span>
      <span style={{
        color: '#a78bfa',
        fontSize: 15,
        fontWeight: 900,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        fontFamily: 'Inter, sans-serif',
      }}>{value}</span>
    </div>
  );
}
