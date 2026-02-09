interface HeroPortraitProps {
  imagePath: string;
  size?: number;
}

export default function HeroPortrait({ imagePath, size = 1 }: HeroPortraitProps) {
  const width = Math.round(180 * size);
  const height = Math.round(200 * size);
  const imageUrl = new URL(`../../assets/heroes/${imagePath}`, import.meta.url).href;

  return (
    <img
      src={imageUrl}
      alt="Hero portrait"
      width={width}
      height={height}
      style={{
        borderRadius: '6px',
        border: '2px solid #0f3460',
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}
