import type { HeroStats } from '../../types';

const STAT_ORDER: { key: keyof HeroStats; label: string }[] = [
  { key: 'physicalAttack', label: 'PA' },
  { key: 'magicPower', label: 'MP' },
  { key: 'dexterity', label: 'Dex' },
  { key: 'element', label: 'Elem' },
  { key: 'mana', label: 'Mana' },
  { key: 'stamina', label: 'Stam' },
];

interface Props {
  stats: HeroStats;
  growthStats: HeroStats;
  size?: number;
  maxValue?: number;
}

function getHexPoint(centerX: number, centerY: number, radius: number, index: number) {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

export default function HexStatDiagram({ stats, growthStats, size = 240, maxValue = 40 }: Props) {
  // Labels are split into two short lines ("Stam 15" / "+1.3") to stay close
  // to the hex vertex. This keeps the worst-case horizontal text width small,
  // so we only need a modest pad on every side.
  const pad = 28;
  const center = size / 2;
  const radius = size * 0.35;
  const labelRadius = size * 0.43;
  const fontSize = size >= 200 ? 11 : 9;
  const lineH = fontSize * 1.35; // line-height in px

  // Hexagonal frame guidelines
  const framePoints = STAT_ORDER.map((_, i) => {
    const p = getHexPoint(center, center, radius, i);
    return `${p.x},${p.y}`;
  }).join(' ');

  // Inner guideline (50%)
  const innerPoints = STAT_ORDER.map((_, i) => {
    const p = getHexPoint(center, center, radius * 0.5, i);
    return `${p.x},${p.y}`;
  }).join(' ');

  // Data polygon
  const dataPoints = STAT_ORDER.map((s, i) => {
    const value = Math.min(stats[s.key] ?? 0, maxValue);
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
            x1={center} y1={center}
            x2={p.x} y2={p.y}
            stroke="#333"
            strokeWidth={1}
          />
        );
      })}

      {/* Inner guideline hexagon */}
      <polygon
        points={innerPoints}
        fill="none"
        stroke="#333"
        strokeWidth={1}
      />

      {/* Outer frame hexagon */}
      <polygon
        points={framePoints}
        fill="none"
        stroke="#555"
        strokeWidth={1.5}
      />

      {/* Data polygon */}
      <polygon
        points={dataPoints}
        fill="rgba(251, 191, 36, 0.2)"
        stroke="#fbbf24"
        strokeWidth={2}
      />

      {/* Data points */}
      {STAT_ORDER.map((s, i) => {
        const value = Math.min(stats[s.key] ?? 0, maxValue);
        const r = (value / maxValue) * radius;
        const p = getHexPoint(center, center, r, i);
        return (
          <circle
            key={`dot-${i}`}
            cx={p.x} cy={p.y}
            r={3}
            fill="#fbbf24"
          />
        );
      })}

      {/* Labels — two-line: "Label value" then "+growth" */}
      {STAT_ORDER.map((s, i) => {
        const p = getHexPoint(center, center, labelRadius, i);
        const value = stats[s.key] ?? 0;
        const growth = growthStats[s.key] ?? 0;

        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        if (i === 1 || i === 2) textAnchor = 'start';
        if (i === 4 || i === 5) textAnchor = 'end';

        // Shift the text block up by half a line so the two lines are
        // vertically centred around the label point.
        const y0 = p.y - lineH / 2;

        return (
          <text
            key={`label-${i}`}
            textAnchor={textAnchor}
            fontSize={fontSize}
          >
            <tspan x={p.x} y={y0}>
              <tspan fill="#a0a0b0">{s.label} </tspan>
              <tspan fill="#e0e0e0">{value.toFixed(0)}</tspan>
            </tspan>
            <tspan x={p.x} dy={lineH}>
              <tspan fill="#4ade80">+{growth.toFixed(1)}</tspan>
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
