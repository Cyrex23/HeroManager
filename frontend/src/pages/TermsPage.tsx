import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, Star, Users, CreditCard, ShieldOff, Ban } from 'lucide-react';
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

export default function TermsPage() {
  const { isAuthenticated } = useAuth();
  const backTo = isAuthenticated ? '/team' : '/login';
  const backLabel = isAuthenticated ? '← Back to Game' : '← Back to Login';
  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: '#07061a', position: 'relative' }}>

      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background:
          'radial-gradient(ellipse at 15% 20%, rgba(233,69,96,0.10) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 85% 70%, rgba(249,115,22,0.07) 0%, transparent 55%)',
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
          <FileText size={12} color="#e94560" />
          <span style={{ color: '#e94560', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Read Before Playing
          </span>
        </div>
        <h1 className="gradient-title" style={{ fontSize: 46, margin: '0 0 16px', letterSpacing: 2 }}>
          Terms of Use
        </h1>
        <p style={{ color: '#555577', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          The rules of the realm — know them before you enter
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>

        <Section icon={<FileText size={18} />} title="Agreement to These Terms" color="#e94560">
          <p style={{ margin: '0 0 14px' }}>
            By accessing or using HeroManager, you agree to be bound by these Terms of Use and all applicable laws
            and regulations. If you do not accept these terms in full, you may not use the site. These terms may be
            revised at any time — major changes will be announced, but it is ultimately your responsibility to stay
            informed and compliant. Continued use after any update constitutes acceptance.
          </p>
          <p style={{ margin: 0 }}>
            All content on HeroManager is protected by applicable copyright and intellectual property law.
            Violation of these terms may result in the immediate suspension or deletion of your account.
          </p>
        </Section>

        <Section icon={<AlertTriangle size={18} />} title="Disclaimer" color="#f97316">
          <p style={{ margin: '0 0 14px' }}>
            HeroManager accepts no responsibility for the personal choices or actions of its players outside
            the game. While we hope the game brings you joy, please remember to keep a healthy balance — spend
            time with the people in your life. HeroManager is a game, not a substitute for real-world connections.
          </p>
          <p style={{ margin: 0 }}>
            This site and all its materials are provided on an "AS IS" and "AS AVAILABLE" basis without warranties
            of any kind. We do not guarantee uninterrupted or error-free service. Any reliance on the site's content
            is strictly at your own risk.
          </p>
        </Section>

        <Section icon={<Star size={18} />} title="A Fan-Created Universe" color="#fbbf24">
          <p style={{ margin: 0 }}>
            HeroManager is an independent fan project created by and for fans of anime, manga, and world mythology.
            The characters and franchises featured here belong to their respective creators and studios — we hold
            no claim over them. This game exists purely out of passion, to celebrate the stories we love and give
            the community a place to compete and connect. We are not affiliated with any of the original publishers
            or production companies.
          </p>
        </Section>

        <Section icon={<Users size={18} />} title="Account Rules & Player Conduct" color="#60a5fa">
          <p style={{ margin: '0 0 14px' }}>
            You may register up to two accounts, but using multiple accounts to challenge yourself, inflate rankings,
            or gain any unfair advantage is strictly prohibited. Account sharing and transfers are forbidden —
            you are solely responsible for everything that happens under your account.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            Every player must treat others with basic respect. Discrimination based on age, gender, ethnicity,
            religion, sexual orientation, or personal belief — whether expressed through character names, forum posts,
            or chat — will not be tolerated and may result in permanent account termination.
          </p>
          <p style={{ margin: 0 }}>
            HeroManager is not liable for user-generated content posted on the platform. We reserve the right
            to remove, modify, or refuse any content that violates these terms, and to revoke the privileges
            of users who repeatedly break the rules.
          </p>
        </Section>

        <Section icon={<CreditCard size={18} />} title="Purchases & Donations" color="#4ade80">
          <p style={{ margin: '0 0 14px' }}>
            Any payments or donations made to support HeroManager's running costs or unlock premium features are
            final and non-refundable, unless a minor accessed your payment method without authorization — in which
            case, contact us and we'll investigate promptly.
          </p>
          <p style={{ margin: 0 }}>
            HeroManager makes no guarantees regarding the outcome or reliability of transactions processed through
            third-party payment providers. The full risk of any purchase rests with the buyer, including any costs
            associated with resolving issues on their end.
          </p>
        </Section>

        <Section icon={<ShieldOff size={18} />} title="Limitation of Liability" color="#a78bfa">
          <p style={{ margin: 0 }}>
            To the fullest extent permitted by law, HeroManager, its team members, affiliates, and third-party
            service providers shall not be liable for any indirect, incidental, special, or consequential damages
            arising from your use of — or inability to use — the service. This includes but is not limited to loss
            of data, account progress, or in-game assets. Any attempt to hack, reverse-engineer, or interfere
            with the platform's integrity may be subject to legal action.
          </p>
        </Section>

        <Section icon={<Ban size={18} />} title="Account Termination" color="#e94560">
          <p style={{ margin: 0 }}>
            HeroManager reserves the right to suspend or permanently delete any account at any time, regardless
            of donor or supporter status. We will always provide a reason for termination. Accounts that breach
            these terms — through cheating, harassment, hacking, or any conduct deemed harmful to the community —
            may be removed without prior notice. If you wish to close your account voluntarily, contact us and
            we will process your request.
          </p>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
