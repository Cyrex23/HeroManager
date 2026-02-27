import { Link } from 'react-router-dom';
import { Shield, Monitor, Clock, Swords } from 'lucide-react';
import HeroManagerLogo from '../components/brand/HeroManagerLogo';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../context/AuthContext';

function Section({
  icon, title, color = '#e94560', children,
}: {
  icon: React.ReactNode; title: string; color?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'rgba(10, 10, 24, 0.75)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderTop: `2px solid ${color}`,
      borderRadius: 14, padding: '28px 32px', marginBottom: 14,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -24, right: -24, width: 90, height: 90,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}16, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}14`, border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0, filter: `drop-shadow(0 0 6px ${color}45)`,
        }}>
          {icon}
        </div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>
          {title}
        </h2>
      </div>
      <div style={{ color: '#7e7e9a', fontSize: 13.5, lineHeight: 1.85 }}>
        {children}
      </div>
    </div>
  );
}

const timeline = [
  {
    year: '2026', short: '\'26', label: 'Development Begins',
    desc: 'A group of passionate anime fans starts building HeroManager from scratch in early February 2026, driven by a shared love of strategy games and animated lore.',
  },
  {
    year: '2027', short: '\'27', label: 'Open Beta',
    desc: 'The gates are set to open in June 2027. Players will flood in, test the arena, and shape the future of the game through real feedback.',
  },
  {
    year: '2027', short: '\'27', label: 'Official Launch',
    desc: 'Beta concludes and HeroManager officially opens to all commanders by the end of 2027. The realm becomes a permanent home.',
  },
];

export default function AboutPage() {
  const { isAuthenticated } = useAuth();
  const backTo = isAuthenticated ? '/team' : '/login';
  const backLabel = isAuthenticated ? '← Back to Game' : '← Back to Login';
  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: '#07061a', position: 'relative' }}>

      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse at 10% 15%, rgba(233,69,96,0.12) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 90% 80%, rgba(167,139,250,0.08) 0%, transparent 55%)',
      }} />

      {/* Top nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 64,
        backgroundColor: 'rgba(7,6,26,0.93)', backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <HeroManagerLogo size="sm" linkTo={backTo} />
        <Link to={backTo} style={{ color: '#444466', fontSize: 13, textDecoration: 'none', fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>
          {backLabel}
        </Link>
      </nav>

      {/* Hero banner */}
      <div style={{ textAlign: 'center', padding: '68px 24px 44px', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 22,
          padding: '5px 15px', borderRadius: 20,
          backgroundColor: 'rgba(233,69,96,0.08)', border: '1px solid rgba(233,69,96,0.18)',
        }}>
          <Swords size={12} color="#e94560" />
          <span style={{ color: '#e94560', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            The Realm Awaits
          </span>
        </div>
        <h1 className="gradient-title" style={{ fontSize: 46, margin: '0 0 16px', letterSpacing: 2 }}>
          About HeroManager
        </h1>
        <p style={{ color: '#555577', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          Where legendary commanders are forged and rivals are conquered
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>

        <Section icon={<Shield size={18} />} title="The HeroManager Universe" color="#e94560">
          <p style={{ margin: '0 0 14px' }}>
            HeroManager is a free, browser-based MMORPG set in a realm of legendary warriors drawn from manga, anime, and world mythology.
            You take the role of a strategic commander — assembling a roster of powerful heroes and leading them through fierce competitive battles
            against players from around the globe.
          </p>
          <p style={{ margin: 0 }}>
            Level up your fighters, unlock devastating abilities, and outfit them with rare equipment as you climb the arena rankings.
            Every decision shapes your team's destiny. The ultimate ambition: to be crowned the most formidable commander the realm has ever known.
            Will you answer the call?
          </p>
        </Section>

        <Section icon={<Monitor size={18} />} title="Playing in Your Browser" color="#60a5fa">
          <p style={{ margin: '0 0 14px' }}>
            There's nothing to download, install, or configure. HeroManager runs entirely within your browser — open the page and you're in.
            For the sharpest performance and smoothest battle animations, we recommend running the latest version of Google Chrome.
          </p>
          <p style={{ margin: 0 }}>
            Prefer gaming on the go? HeroManager is fully optimized for tablets and smartphones, so your team is always just a tap away —
            whether you're managing roster changes, challenging rivals, or climbing the leaderboard from anywhere in the world.
          </p>
        </Section>

        <Section icon={<Clock size={18} />} title="Our Journey" color="#a78bfa">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timeline.map(({ short, label, desc }, i) => (
              <div key={short} style={{ display: 'flex', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(167,139,250,0.12)', border: '2px solid rgba(167,139,250,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#a78bfa', fontSize: 13, fontWeight: 800, fontFamily: 'Cinzel, serif',
                  }}>
                    {short}
                  </div>
                  {i < timeline.length - 1 && (
                    <div style={{ width: 1, flex: 1, background: 'rgba(167,139,250,0.15)', margin: '6px 0', minHeight: 28 }} />
                  )}
                </div>
                <div style={{ paddingBottom: i < timeline.length - 1 ? 28 : 0, paddingTop: 10 }}>
                  <div style={{ color: '#c8c8e8', fontWeight: 700, fontSize: 14, marginBottom: 5, fontFamily: 'Inter, sans-serif' }}>
                    {label}
                  </div>
                  <div>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
