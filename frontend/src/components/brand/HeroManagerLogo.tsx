import { Link } from 'react-router-dom';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  linkTo?: string;
}

const sizeMap = {
  sm: { icon: 26, heroText: 13, managerText: 10 },
  md: { icon: 34, heroText: 17, managerText: 12 },
  lg: { icon: 64, heroText: 30, managerText: 20 },
};

function LogoMark({ iconSize }: { iconSize: number }) {
  return (
    <div className="logo-glow logo-float" style={{ lineHeight: 0, flexShrink: 0 }}>
      <svg
        width={iconSize}
        height={Math.round(iconSize * 1.18)}
        viewBox="0 0 40 47"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGradA" x1="0" y1="0" x2="40" y2="47" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#e94560" />
            <stop offset="55%"  stopColor="#c73852" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="shieldHighlightA" x1="5" y1="0" x2="20" y2="47" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id="shieldInnerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset dx="0" dy="2" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
            <feFlood floodColor="rgba(0,0,0,0.5)" result="color" />
            <feComposite in="color" in2="shadowDiff" operator="in" result="shadow" />
            <feComposite in="SourceGraphic" in2="shadow" operator="over" />
          </filter>
        </defs>

        {/* Shield body */}
        <path
          d="M20 2 L37 9 L37 25 C37 35.5 20 45 20 45 C20 45 3 35.5 3 25 L3 9 Z"
          fill="url(#shieldGradA)"
        />
        {/* Shield inner highlight */}
        <path
          d="M20 2 L37 9 L37 25 C37 35.5 20 45 20 45 C20 45 3 35.5 3 25 L3 9 Z"
          fill="url(#shieldHighlightA)"
          opacity="0.5"
        />
        {/* Shield border */}
        <path
          d="M20 2 L37 9 L37 25 C37 35.5 20 45 20 45 C20 45 3 35.5 3 25 L3 9 Z"
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth="0.8"
        />

        {/* Sword — blade */}
        <rect x="18.7" y="8" width="2.6" height="23" rx="1" fill="rgba(255,255,255,0.96)" />
        {/* Sword — tip */}
        <path d="M18.7 8 L20 4.5 L21.3 8 Z" fill="rgba(255,255,255,0.96)" />
        {/* Sword — crossguard */}
        <rect x="11.5" y="18" width="17" height="2.5" rx="1.2" fill="rgba(255,255,255,0.96)" />
        {/* Sword — pommel */}
        <ellipse cx="20" cy="33.5" rx="3" ry="2.5" fill="rgba(255,255,255,0.96)" />

        {/* Small stars on shield */}
        <circle cx="10" cy="13" r="0.8" fill="rgba(255,255,255,0.5)" />
        <circle cx="30" cy="13" r="0.8" fill="rgba(255,255,255,0.5)" />
        <circle cx="8"  cy="26" r="0.6" fill="rgba(255,255,255,0.35)" />
        <circle cx="32" cy="26" r="0.6" fill="rgba(255,255,255,0.35)" />
      </svg>
    </div>
  );
}

export default function HeroManagerLogo({ size = 'md', linkTo }: Props) {
  const { icon, heroText, managerText } = sizeMap[size];

  const inner = (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'lg' ? 18 : 10, textDecoration: 'none' }}>
      <LogoMark iconSize={icon} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, gap: 2 }}>
        <span
          className="brand-text"
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: heroText,
            fontWeight: 900,
            letterSpacing: '0.08em',
          }}
        >
          HERO
        </span>
        <span
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: managerText,
            fontWeight: 600,
            letterSpacing: '0.22em',
            color: '#8888a8',
          }}
        >
          MANAGER
        </span>
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} style={{ textDecoration: 'none' }}>
        {inner}
      </Link>
    );
  }

  return inner;
}
