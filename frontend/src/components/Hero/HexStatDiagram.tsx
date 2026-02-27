import type { HeroStats } from '../../types';

const STAT_ORDER: { key: keyof HeroStats; label: string; color: string }[] = [
  { key: 'physicalAttack', label: 'PA',   color: '#f97316' },
  { key: 'magicPower',     label: 'MP',   color: '#60a5fa' },
  { key: 'dexterity',      label: 'Dex',  color: '#4ade80' },
  { key: 'element',        label: 'Elem', color: '#facc15' },
  { key: 'mana',           label: 'Mana', color: '#a78bfa' },
  { key: 'stamina',        label: 'Stam', color: '#fb7185' },
];

const RING_FRACTIONS = [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1.0];

interface Props {
  stats: HeroStats;
  growthStats: HeroStats;
  size?: number;
  maxValue?: number;
}

function getHexPoint(cx: number, cy: number, r: number, index: number) {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function hexPoints(cx: number, cy: number, r: number): string {
  return STAT_ORDER.map((_, i) => {
    const p = getHexPoint(cx, cy, r, i);
    return `${p.x},${p.y}`;
  }).join(' ');
}

export default function HexStatDiagram({ stats, growthStats, size = 240, maxValue = 100 }: Props) {
  const pad = 42;
  const center = size / 2;
  const radius = size * 0.35;
  const labelRadius = size * 0.47;
  const fontSize = size >= 200 ? 11 : 10;
  const lineH = fontSize * 1.55;

  const uid = `hex-${size}`;

  const dataPoints = STAT_ORDER.map((s, i) => {
    const value = Math.min(Math.max(stats[s.key] ?? 0, 0), maxValue);
    const r = (value / maxValue) * radius;
    const p = getHexPoint(center, center, r, i);
    return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <svg
      width={size + pad * 2}
      height={size + pad * 2}
      viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
    >
      <defs>
        {/* Gradient fill for the data polygon */}
        <radialGradient id={`${uid}-fill`} cx={center} cy={center} r={radius} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.35" />
          <stop offset="70%"  stopColor="#c084fc" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.55" />
        </radialGradient>

        {/* Soft glow around the data shape */}
        <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle outer ring glow */}
        <filter id={`${uid}-ringGlow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dark background disc */}
      <circle
        cx={center} cy={center} r={radius + 8}
        fill="rgba(6, 6, 22, 0.72)"
      />

      {/* Axis lines — each tinted with its stat colour */}
      {STAT_ORDER.map((s, i) => {
        const p = getHexPoint(center, center, radius, i);
        return (
          <line
            key={`axis-${i}`}
            x1={center} y1={center} x2={p.x} y2={p.y}
            stroke={s.color}
            strokeWidth={0.75}
            opacity={0.35}
          />
        );
      })}

      {/* Concentric guide rings */}
      {RING_FRACTIONS.map((frac) => {
        const isOuter = frac === 1.0;
        const isMid = frac === 0.5;
        return (
          <polygon
            key={`ring-${frac}`}
            points={hexPoints(center, center, radius * frac)}
            fill="none"
            stroke={isOuter ? '#5c5c88' : isMid ? '#2e2e52' : '#1a1a30'}
            strokeWidth={isOuter ? 1.4 : isMid ? 0.9 : 0.6}
            opacity={isOuter ? 1 : isMid ? 0.8 : 0.7}
            filter={isOuter ? `url(#${uid}-ringGlow)` : undefined}
          />
        );
      })}

      {/* Glow halo around the data polygon */}
      <polygon
        points={dataPoints}
        fill="rgba(251,191,36,0.06)"
        stroke="#fbbf24"
        strokeWidth={8}
        strokeLinejoin="round"
        filter={`url(#${uid}-glow)`}
        opacity={0.5}
      />

      {/* Data fill polygon */}
      <polygon
        points={dataPoints}
        fill={`url(#${uid}-fill)`}
        stroke="#fbbf24"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />

      {/* Vertex dots — per-stat color with outer halo */}
      {STAT_ORDER.map((s, i) => {
        const value = Math.min(Math.max(stats[s.key] ?? 0, 0), maxValue);
        const r = (value / maxValue) * radius;
        const p = getHexPoint(center, center, r, i);
        return (
          <g key={`dot-${i}`}>
            <circle cx={p.x} cy={p.y} r={6.5} fill={s.color} opacity={0.2} />
            <circle cx={p.x} cy={p.y} r={3.5} fill={s.color} stroke="#08081a" strokeWidth={1.2} />
          </g>
        );
      })}

      {/* Labels */}
      {STAT_ORDER.map((s, i) => {
        const p = getHexPoint(center, center, labelRadius, i);
        const value = stats[s.key] ?? 0;
        const growth = growthStats[s.key] ?? 0;

        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        if (i === 1 || i === 2) textAnchor = 'start';
        if (i === 4 || i === 5) textAnchor = 'end';

        const y0 = p.y - lineH / 2;

        return (
          <text key={`label-${i}`} textAnchor={textAnchor} fontSize={fontSize}>
            <tspan x={p.x} y={y0}>
              <tspan fill={s.color} fontWeight="700">{value.toFixed(0)}</tspan>
              <tspan fill="#4ade80" fontSize={fontSize - 1}> +{growth.toFixed(1)}</tspan>
            </tspan>
            <tspan x={p.x} dy={lineH} fill="#6b6b90" fontSize={fontSize - 1}>{s.label}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
