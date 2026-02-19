type Tier = 'COMMONER' | 'ELITE' | 'LEGENDARY' | null | undefined;

const TIER_BORDER: Record<string, string> = {
  COMMONER:  '#6b7280',
  ELITE:     '#a78bfa',
  LEGENDARY: '#f97316',
};

interface Props {
  imagePath: string;
  name: string;
  size?: number;
  tier?: Tier;
}

export default function HeroPortrait({ imagePath, name, size = 180, tier }: Props) {
  const src = `/src/assets/heroes/${imagePath}`;
  const borderColor = (tier && TIER_BORDER[tier]) ?? '#16213e';
  return (
    <img
      src={src}
      alt={name}
      style={{
        width: size,
        height: size * (200 / 180),
        objectFit: 'cover',
        borderRadius: 4,
        border: `2px solid ${borderColor}`,
      }}
    />
  );
}
