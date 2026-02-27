const TIER_COLOR: Record<number, string> = {
  1: '#9ca3af',
  2: '#38bdf8',
  3: '#a78bfa',
  4: '#fb923c',
  5: '#fbbf24',
};
function tc(tier: number) { return TIER_COLOR[tier] ?? '#fbbf24'; }

// T1 — Dagger (gray, common)
function Dagger({ c }: { c: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <polygon
        points="10,1 12.5,12 10,14.5 7.5,12"
        fill={`${c}30`} stroke={c} strokeWidth="1.4" strokeLinejoin="round"
      />
      <line x1="6" y1="12" x2="14" y2="12" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="9" y="14.5" width="2" height="3.5" rx="1" fill={c} opacity="0.85" />
    </svg>
  );
}

// T2 — Dual blades (blue, uncommon)
function DualBlades({ c }: { c: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <polygon
        points="6.5,1 8.5,11 6.5,13 4.5,11"
        fill={`${c}30`} stroke={c} strokeWidth="1.3" strokeLinejoin="round"
      />
      <polygon
        points="13.5,1 15.5,11 13.5,13 11.5,11"
        fill={`${c}30`} stroke={c} strokeWidth="1.3" strokeLinejoin="round"
      />
      <line x1="3" y1="13" x2="9.5" y2="13" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="10.5" y1="13" x2="17" y2="13" stroke={c} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// T3 — Crystal (purple, rare)
function Crystal({ c }: { c: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <polygon
        points="10,1 16,7 10,19 4,7"
        fill={`${c}28`} stroke={c} strokeWidth="1.4" strokeLinejoin="round"
      />
      <line x1="4" y1="7" x2="16" y2="7" stroke={c} strokeWidth="1.1" opacity="0.8" />
      <line x1="10" y1="1" x2="4" y2="7" stroke={c} strokeWidth="0.7" opacity="0.5" />
      <line x1="10" y1="1" x2="16" y2="7" stroke={c} strokeWidth="0.7" opacity="0.5" />
      <circle cx="10" cy="7" r="1.4" fill={c} opacity="0.9" />
    </svg>
  );
}

// T4 — 4-pointed star (orange, epic)
function Star({ c }: { c: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 1L11.9 8.1L19 10L11.9 11.9L10 19L8.1 11.9L1 10L8.1 8.1Z"
        fill={`${c}28`} stroke={c} strokeWidth="1.3" strokeLinejoin="round"
      />
      <path
        d="M10 5L10.9 9.1L15 10L10.9 10.9L10 15L9.1 10.9L5 10L9.1 9.1Z"
        fill={c} opacity="0.45"
      />
      <circle cx="10" cy="10" r="1.8" fill={c} opacity="0.9" />
    </svg>
  );
}

// T5 — Crown (gold, legendary)
function Crown({ c }: { c: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M2 15L2 9L6.5 13L10 2L13.5 13L18 9L18 15Z"
        fill={`${c}28`} stroke={c} strokeWidth="1.3" strokeLinejoin="round"
      />
      <rect x="2" y="15" width="16" height="2.5" rx="1" fill={c} opacity="0.55" />
      <circle cx="10" cy="5.5" r="1.6" fill={c} />
      <circle cx="4" cy="11" r="1.2" fill={c} opacity="0.85" />
      <circle cx="16" cy="11" r="1.2" fill={c} opacity="0.85" />
    </svg>
  );
}

interface Props {
  tier: number;
  size?: number;
}

export default function AbilityTierIcon({ tier }: Props) {
  const c = tc(tier);
  const bg = `${c}14`;
  const border = `1px solid ${c}40`;

  const icon =
    tier === 1 ? <Dagger c={c} /> :
    tier === 2 ? <DualBlades c={c} /> :
    tier === 3 ? <Crystal c={c} /> :
    tier === 4 ? <Star c={c} /> :
    <Crown c={c} />;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 26,
      height: 26,
      minWidth: 26,
      backgroundColor: bg,
      border,
      borderRadius: 5,
      flexShrink: 0,
    }}>
      {icon}
    </span>
  );
}
