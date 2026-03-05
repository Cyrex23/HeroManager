import { Link } from 'react-router-dom';
import { Scale, AlertTriangle, BookOpen, Globe } from 'lucide-react';
import HeroManagerLogo from '../components/brand/HeroManagerLogo';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../context/AuthContext';

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
  const backTo = isAuthenticated ? '/team' : '/login';
  const backLabel = isAuthenticated ? '← Back to Game' : '← Back to Login';

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
            Fan-Made Project
          </span>
        </div>
        <h1 className="gradient-title" style={{ fontSize: 46, margin: '0 0 16px', letterSpacing: 2 }}>
          Legal Disclaimer
        </h1>
        <p style={{ color: '#555577', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          HeroManager is an independent, non-profit fan project
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>

        <Section icon={<AlertTriangle size={18} />} title="Fan-Made Project — No Affiliation">
          <p style={{ margin: '0 0 10px' }}>
            HeroManager is an independent, fan-made web game created purely for entertainment and fan appreciation.
            This project has <strong style={{ color: '#e0e0e0' }}>no affiliation, sponsorship, endorsement, or
            connection</strong> of any kind with the original series, their authors, publishers, or any related
            organisations. It is not an official product and does not represent the views or positions of any of
            the rights-holders mentioned herein.
          </p>
          <p style={{ margin: 0 }}>
            This project is entirely non-commercial and non-profit. No revenue, subscriptions, or financial gain
            of any kind is derived from its operation.
          </p>
        </Section>

        <Section icon={<Scale size={18} />} title="Intellectual Property">
          <p style={{ margin: '0 0 10px' }}>
            All intellectual property, trademarks, character names, images, and related content featured in
            HeroManager belong exclusively to their respective creators and publishers:
          </p>
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
          <p style={{ margin: 0 }}>
            The use of character names, likenesses, and references in this project does not constitute any claim
            of ownership and is intended solely for fan appreciation and cultural discussion purposes.
          </p>
        </Section>

        <Section icon={<BookOpen size={18} />} title="Fair Use & Fan Content">
          <p style={{ margin: '0 0 10px' }}>
            All references to characters, series, and related material are used under the principles of fan
            content creation — for commentary, parody, and transformative fan expression. The use of names
            and character references does not constitute a violation of copyright when used for non-commercial,
            fan-appreciation purposes.
          </p>
          <p style={{ margin: 0 }}>
            If you are a rights-holder and have concerns regarding content featured in this project, please
            contact us directly. We are committed to respecting intellectual property rights and will address
            any legitimate concerns promptly.
          </p>
        </Section>

        <Section icon={<Globe size={18} />} title="Limitation of Liability">
          <p style={{ margin: '0 0 10px' }}>
            HeroManager is provided as-is, without warranties of any kind. The creators and operators of this
            project shall not be held liable for any direct, indirect, incidental, or consequential damages
            arising from the use of or inability to use this service.
          </p>
          <p style={{ margin: 0 }}>
            By continuing to access and use HeroManager, you acknowledge that you have read and understood this
            disclaimer and agree to its terms.
          </p>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
