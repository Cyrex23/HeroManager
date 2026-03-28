import { Link } from 'react-router-dom';
import { Shield, Cookie, Globe, Baby, Lock, Database, Trash2, RefreshCw } from 'lucide-react';
import HeroManagerLogo from '../components/brand/HeroManagerLogo';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Section({
  icon, title, color = '#a78bfa', children,
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

export default function PrivacyPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const backTo = isAuthenticated ? '/team' : '/login';
  const backLabel = isAuthenticated ? t('back_to_game') : t('back_to_login');
  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: '#07061a', position: 'relative' }}>

      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse at 20% 20%, rgba(167,139,250,0.10) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 80% 75%, rgba(96,165,250,0.07) 0%, transparent 55%)',
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
          backgroundColor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)',
        }}>
          <Shield size={12} color="#a78bfa" />
          <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {t('privacy_badge')}
          </span>
        </div>
        <h1 className="gradient-title" style={{ fontSize: 46, margin: '0 0 16px', letterSpacing: 2 }}>
          {t('privacy_title')}
        </h1>
        <p style={{ color: '#555577', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          {t('privacy_subtitle')}
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>

        <Section icon={<Shield size={18} />} title={t('privacy_s1_title')} color="#a78bfa">
          <p style={{ margin: 0 }}>{t('privacy_s1_body')}</p>
        </Section>

        <Section icon={<Cookie size={18} />} title={t('privacy_s2_title')} color="#60a5fa">
          <p style={{ margin: 0 }}>{t('privacy_s2_body')}</p>
        </Section>

        <Section icon={<Globe size={18} />} title={t('privacy_s3_title')} color="#4ade80">
          <p style={{ margin: 0 }}>{t('privacy_s3_body')}</p>
        </Section>

        <Section icon={<Baby size={18} />} title={t('privacy_s4_title')} color="#fbbf24">
          <p style={{ margin: 0 }}>{t('privacy_s4_body')}</p>
        </Section>

        <Section icon={<Lock size={18} />} title={t('privacy_s5_title')} color="#e94560">
          <p style={{ margin: 0 }}>{t('privacy_s5_body')}</p>
        </Section>

        <Section icon={<Database size={18} />} title={t('privacy_s6_title')} color="#a78bfa">
          <p style={{ margin: '0 0 14px' }}>{t('privacy_s6_intro')}</p>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><span style={{ color: '#c8c8e8' }}>{t('privacy_s6_li1_label')}</span> — {t('privacy_s6_li1_text')}</li>
            <li><span style={{ color: '#c8c8e8' }}>{t('privacy_s6_li2_label')}</span> — {t('privacy_s6_li2_text')}</li>
            <li><span style={{ color: '#c8c8e8' }}>{t('privacy_s6_li3_label')}</span> — {t('privacy_s6_li3_text')}</li>
          </ul>
          <p style={{ margin: '14px 0 0' }}>{t('privacy_s6_footer')}</p>
        </Section>

        <Section icon={<Trash2 size={18} />} title={t('privacy_s7_title')} color="#60a5fa">
          <p style={{ margin: '0 0 14px' }}>
            {t('privacy_s7_p1')} <span style={{ color: '#c8c8e8' }}>{t('privacy_s7_subject')}</span> {t('privacy_s7_p1_end')}
          </p>
          <p style={{ margin: 0 }}>{t('privacy_s7_p2')}</p>
        </Section>

        <Section icon={<RefreshCw size={18} />} title={t('privacy_s8_title')} color="#fbbf24">
          <p style={{ margin: 0 }}>{t('privacy_s8_body')}</p>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
