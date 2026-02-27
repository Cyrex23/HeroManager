import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/about',   label: 'About' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms',   label: 'Terms of Use' },
  { to: '/rules',   label: 'Game Rules' },
];

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.028.02.054.042.073a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}

function PatreonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M14.82 2.41C18.78 2.41 22 5.65 22 9.62c0 3.96-3.22 7.19-7.18 7.19-3.95 0-7.17-3.23-7.17-7.19 0-3.97 3.22-7.21 7.17-7.21M2 21.6h3.5V2.41H2V21.6z"/>
    </svg>
  );
}

function BuyMeACoffeeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.Interstate.108 1.131l-.149.748c-.117.585-.418 1.169-1.006 1.381-.203.073-.43.104-.578.252-.152.151-.19.38-.222.589-.08.509-.156 1.02-.231 1.53-.075.507-.132 1.019-.064 1.528.053.409.225.81.518 1.097.416.404.987.559 1.55.598.805.057 1.614-.075 2.41-.172.963-.118 1.93-.224 2.895-.261 1.04-.04 2.082-.025 3.12.04.948.058 1.894.162 2.84.28.764.096 1.533.22 2.306.199.682-.019 1.373-.217 1.871-.713.355-.352.55-.826.589-1.311.052-.659-.095-1.32-.232-1.961z"/>
      <path d="M3.5 12.5h17v.5a8.5 8.5 0 01-8.5 8.5 8.5 8.5 0 01-8.5-8.5v-.5z" opacity=".3"/>
    </svg>
  );
}

export default function Footer() {
  const { pathname } = useLocation();
  return (
    <footer style={s.footer}>
      <div style={s.inner}>
        {/* Community pills */}
        <div style={s.discordPill}>
          <DiscordIcon />
          Discord
        </div>
        <div style={s.patreonPill}>
          <PatreonIcon />
          Patreon
        </div>
        <a href="https://buymeacoffee.com/heromanager" target="_blank" rel="noreferrer" style={s.bmcPill}>
          <BuyMeACoffeeIcon />
          Buy me a coffee
        </a>

        <span style={s.sep}>·</span>

        {LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{ ...s.link, color: pathname === to ? '#e94560' : '#3a3a5a' }}
          >
            {label}
          </Link>
        ))}
        <span style={s.sep}>·</span>
        <span style={s.copy}>© {new Date().getFullYear()} HeroManager</span>
      </div>
    </footer>
  );
}

const s: Record<string, React.CSSProperties> = {
  footer: {
    flexShrink: 0,
    backgroundColor: 'rgba(7, 6, 26, 0.97)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  inner: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 20, padding: '10px 24px', flexWrap: 'wrap' as const,
  },
  link: {
    textDecoration: 'none', fontSize: 12, fontWeight: 500,
    letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif',
    transition: 'color 0.2s',
  },
  sep:  { color: '#1c1c30', fontSize: 14 },
  copy: { color: '#252542', fontSize: 11, fontFamily: 'Inter, sans-serif' },
  discordPill: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 20,
    backgroundColor: 'rgba(88,101,242,0.15)',
    border: '1px solid rgba(88,101,242,0.3)',
    color: '#7983f5', fontSize: 11, fontWeight: 600,
    fontFamily: 'Inter, sans-serif', cursor: 'default',
  },
  patreonPill: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 20,
    backgroundColor: 'rgba(255,66,77,0.12)',
    border: '1px solid rgba(255,66,77,0.28)',
    color: '#ff7a7f', fontSize: 11, fontWeight: 600,
    fontFamily: 'Inter, sans-serif', cursor: 'default',
  },
  bmcPill: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 20,
    backgroundColor: 'rgba(255,213,0,0.1)',
    border: '1px solid rgba(255,213,0,0.28)',
    color: '#ffd500', fontSize: 11, fontWeight: 600,
    fontFamily: 'Inter, sans-serif', textDecoration: 'none',
    transition: 'background-color 0.2s, border-color 0.2s',
  },
};
