import type { HeroStats } from '../../types';

const STAT_ORDER: { key: keyof HeroStats; label: string }[] = [
  { key: 'physicalAttack', label: 'PA' },
  { key: 'magicPower',     label: 'MP' },
  { key: 'dexterity',      label: 'Dex' },
  { key: 'element',        label: 'Elem' },
  { key: 'mana',           label: 'Mana' },
  { key: 'stamina',        label: 'Stam' },
];

// 8 concentric guide rings matching the reference visual
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
  const pad = 38;
  const center = size / 2;
  const radius = size * 0.35;
  const labelRadius = size * 0.46;
  const fontSize = size >= 200 ? 11 : 9;
  const lineH = fontSize * 1.5;

  // Data polygon — cap each stat at maxValue
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
      {/* Axis lines */}
      {STAT_ORDER.map((_, i) => {
        const p = getHexPoint(center, center, radius, i);
        return (
          <line
            key={`axis-${i}`}
            x1={center} y1={center} x2={p.x} y2={p.y}
            stroke="#3a3a5a" strokeWidth={1}
          />
        );
      })}

      {/* Concentric guide rings — thin, many */}
      {RING_FRACTIONS.map((frac) => (
        <polygon
          key={`ring-${frac}`}
          points={hexPoints(center, center, radius * frac)}
          fill="none"
          stroke={frac === 1.0 ? '#5a5a7a' : '#252540'}
          strokeWidth={frac === 1.0 ? 1.5 : 0.8}
        />
      ))}

      {/* Data fill polygon */}
      <polygon
        points={dataPoints}
        fill="rgba(251, 191, 36, 0.45)"
        stroke="#fbbf24"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data point circles at each vertex */}
      {STAT_ORDER.map((s, i) => {
        const value = Math.min(Math.max(stats[s.key] ?? 0, 0), maxValue);
        const r = (value / maxValue) * radius;
        const p = getHexPoint(center, center, r, i);
        return (
          <circle
            key={`dot-${i}`}
            cx={p.x} cy={p.y} r={3.5}
            fill="#fbbf24" stroke="#0b0b1e" strokeWidth={1}
          />
        );
      })}

      {/* Labels: "value +growth" then stat name */}
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
              <tspan fill="#e8e8f0" fontWeight="700">{value.toFixed(0)}</tspan>
              <tspan fill="#4ade80" fontSize={fontSize - 1}> +{growth.toFixed(1)}</tspan>
            </tspan>
            <tspan x={p.x} dy={lineH} fill="#a0a0b0">{s.label}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
