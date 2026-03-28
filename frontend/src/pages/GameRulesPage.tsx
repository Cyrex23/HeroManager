import { Link } from 'react-router-dom';
import { Swords, Users, Tag, Crown, Gavel, Bug } from 'lucide-react';
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

function Rule({ label, text, color = '#e94560' }: { label: string; text: string; color?: string }) {
  return (
    <div style={{
      borderLeft: `3px solid ${color}40`,
      paddingLeft: 16, marginBottom: 20,
    }}>
      <div style={{ color: '#c8c8e8', fontWeight: 700, fontSize: 13.5, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
        {label}
      </div>
      <div>{text}</div>
    </div>
  );
}

export default function GameRulesPage() {
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
          'radial-gradient(ellipse at 10% 25%, rgba(233,69,96,0.09) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 88% 65%, rgba(251,191,36,0.06) 0%, transparent 55%)',
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
            {t('rules_badge')}
          </span>
        </div>
        <h1 className="gradient-title" style={{ fontSize: 46, margin: '0 0 16px', letterSpacing: 2 }}>
          {t('rules_title')}
        </h1>
        <p style={{ color: '#555577', fontSize: 15, maxWidth: 540, margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          {t('rules_subtitle')}
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>

        <Section icon={<Swords size={18} />} title={t('rules_s1_title')} color="#e94560">
          <Rule label={t('rules_r1_label')} text={t('rules_r1_text')} color="#e94560" />
        </Section>

        <Section icon={<Users size={18} />} title={t('rules_s2_title')} color="#60a5fa">
          <Rule label={t('rules_r2_label')} text={t('rules_r2_text')} color="#60a5fa" />
          <Rule label={t('rules_r3_label')} text={t('rules_r3_text')} color="#60a5fa" />
          <Rule label={t('rules_r4_label')} text={t('rules_r4_text')} color="#60a5fa" />
          <Rule label={t('rules_r5_label')} text={t('rules_r5_text')} color="#60a5fa" />
          <Rule label={t('rules_r6_label')} text={t('rules_r6_text')} color="#60a5fa" />
        </Section>

        <Section icon={<Tag size={18} />} title={t('rules_s3_title')} color="#a78bfa">
          <Rule label={t('rules_r7_label')} text={t('rules_r7_text')} color="#a78bfa" />
          <Rule label={t('rules_r8_label')} text={t('rules_r8_text')} color="#a78bfa" />
        </Section>

        <Section icon={<Crown size={18} />} title={t('rules_s4_title')} color="#fbbf24">
          <Rule label={t('rules_r9_label')} text={t('rules_r9_text')} color="#fbbf24" />
          <Rule label={t('rules_r10_label')} text={t('rules_r10_text')} color="#fbbf24" />
        </Section>

        <Section icon={<Gavel size={18} />} title={t('rules_s5_title')} color="#f97316">
          <Rule label={t('rules_r11_label')} text={t('rules_r11_text')} color="#f97316" />
          <Rule label={t('rules_r12_label')} text={t('rules_r12_text')} color="#f97316" />
        </Section>

        <Section icon={<Bug size={18} />} title={t('rules_s6_title')} color="#4ade80">
          <Rule label={t('rules_r13_label')} text={t('rules_r13_text')} color="#4ade80" />
          <Rule label={t('rules_r14_label')} text={t('rules_r14_text')} color="#4ade80" />
          <Rule label={t('rules_r15_label')} text={t('rules_r15_text')} color="#4ade80" />
        </Section>

      </div>

      <Footer />
    </div>
  );
}
