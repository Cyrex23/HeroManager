import { Link } from 'react-router-dom';
import { Shield, Monitor, Clock, Swords } from 'lucide-react';
import HeroManagerLogo from '../components/brand/HeroManagerLogo';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

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

export default function AboutPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const backTo = isAuthenticated ? '/team' : '/login';
  const backLabel = isAuthenticated ? t('back_to_game') : t('back_to_login');

  const timeline = [
    { year: '2026', short: '\'26', label: t('about_tl1_label'), desc: t('about_tl1_desc') },
    { year: '2027', short: '\'27', label: t('about_tl2_label'), desc: t('about_tl2_desc') },
    { year: '2027', short: '\'27', label: t('about_tl3_label'), desc: t('about_tl3_desc') },
  ];

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
            {t('about_badge')}
          </span>
        </div>
        <h1 className="gradient-title" style={{ fontSize: 46, margin: '0 0 16px', letterSpacing: 2 }}>
          {t('about_title')}
        </h1>
        <p style={{ color: '#555577', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          {t('about_subtitle')}
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>

        <Section icon={<Shield size={18} />} title={t('about_s1_title')} color="#e94560">
          <p style={{ margin: '0 0 14px' }}>{t('about_s1_p1')}</p>
          <p style={{ margin: 0 }}>{t('about_s1_p2')}</p>
        </Section>

        <Section icon={<Monitor size={18} />} title={t('about_s2_title')} color="#60a5fa">
          <p style={{ margin: '0 0 14px' }}>{t('about_s2_p1')}</p>
          <p style={{ margin: 0 }}>{t('about_s2_p2')}</p>
        </Section>

        <Section icon={<Clock size={18} />} title={t('about_s3_title')} color="#a78bfa">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timeline.map(({ short, label, desc }, i) => (
              <div key={short + i} style={{ display: 'flex', gap: 20 }}>
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
