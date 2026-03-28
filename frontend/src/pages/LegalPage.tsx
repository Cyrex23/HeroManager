import { Link } from 'react-router-dom';
import { Scale, AlertTriangle, BookOpen, Globe } from 'lucide-react';
import HeroManagerLogo from '../components/brand/HeroManagerLogo';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const COLOR = '#fb923c';

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(10, 10, 24, 0.75)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderTop: `2px solid ${COLOR}`,
      borderRadius: 14, padding: '28px 32px', marginBottom: 14,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -24, right: -24, width: 90, height: 90,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${COLOR}16, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${COLOR}14`, border: `1px solid ${COLOR}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: COLOR, flexShrink: 0, filter: `drop-shadow(0 0 6px ${COLOR}45)`,
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

export default function LegalPage() {
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
          'radial-gradient(ellipse at 10% 15%, rgba(251,146,60,0.08) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 90% 80%, rgba(251,146,60,0.05) 0%, transparent 55%)',
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
          backgroundColor: `${COLOR}12`, border: `1px solid ${COLOR}30`,
        }}>
          <Scale size={12} color={COLOR} />
          <span style={{ color: COLOR, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
            {t('legal_badge')}
          </span>
        </div>
        <h1 className="gradient-title" style={{ fontSize: 46, margin: '0 0 16px', letterSpacing: 2 }}>
          {t('legal_title')}
        </h1>
        <p style={{ color: '#555577', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          {t('legal_subtitle')}
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>

        <Section icon={<AlertTriangle size={18} />} title={t('legal_s1_title')}>
          <p style={{ margin: '0 0 10px' }}>
            {t('legal_s1_p1').split(t('legal_s1_p1_strong'))[0]}
            <strong style={{ color: '#e0e0e0' }}>{t('legal_s1_p1_strong')}</strong>
            {t('legal_s1_p1').split(t('legal_s1_p1_strong'))[1]}
          </p>
          <p style={{ margin: 0 }}>{t('legal_s1_p2')}</p>
        </Section>

        <Section icon={<Scale size={18} />} title={t('legal_s2_title')}>
          <p style={{ margin: '0 0 10px' }}>{t('legal_s2_intro')}</p>
          <ul style={{ margin: '0 0 12px', paddingLeft: 22, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <li>
              <em style={{ color: '#e0e0e0' }}>Naruto</em> — created by{' '}
              <strong style={{ color: '#e0e0e0' }}>Masashi Kishimoto</strong>, published by{' '}
              <strong style={{ color: '#e0e0e0' }}>Shueisha Inc.</strong>
            </li>
            <li>
              <em style={{ color: '#e0e0e0' }}>One Piece</em> — created by{' '}
              <strong style={{ color: '#e0e0e0' }}>Eiichiro Oda</strong>, published by{' '}
              <strong style={{ color: '#e0e0e0' }}>Shueisha Inc.</strong>
            </li>
            <li>
              <em style={{ color: '#e0e0e0' }}>Hunter × Hunter</em> — created by{' '}
              <strong style={{ color: '#e0e0e0' }}>Yoshihiro Togashi</strong>, published by{' '}
              <strong style={{ color: '#e0e0e0' }}>Shueisha Inc.</strong>
            </li>
          </ul>
          <p style={{ margin: 0 }}>{t('legal_s2_footer')}</p>
        </Section>

        <Section icon={<BookOpen size={18} />} title={t('legal_s3_title')}>
          <p style={{ margin: '0 0 10px' }}>{t('legal_s3_p1')}</p>
          <p style={{ margin: 0 }}>{t('legal_s3_p2')}</p>
        </Section>

        <Section icon={<Globe size={18} />} title={t('legal_s4_title')}>
          <p style={{ margin: '0 0 10px' }}>{t('legal_s4_p1')}</p>
          <p style={{ margin: 0 }}>{t('legal_s4_p2')}</p>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
