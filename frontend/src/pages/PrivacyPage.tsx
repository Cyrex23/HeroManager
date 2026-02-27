import { Link } from 'react-router-dom';
import { Shield, Cookie, Globe, Baby, Lock, Database, Trash2, RefreshCw } from 'lucide-react';
import HeroManagerLogo from '../components/brand/HeroManagerLogo';
import Footer from '../components/Layout/Footer';
import { useAuth } from '../context/AuthContext';

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
  const backTo = isAuthenticated ? '/team' : '/login';
  const backLabel = isAuthenticated ? '← Back to Game' : '← Back to Login';
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
            Your Trust Matters
          </span>
        </div>
        <h1 className="gradient-title" style={{ fontSize: 46, margin: '0 0 16px', letterSpacing: 2 }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#555577', fontSize: 15, maxWidth: 500, margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          How we handle your data — clearly and honestly
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>

        <Section icon={<Shield size={18} />} title="Our Privacy Commitment" color="#a78bfa">
          <p style={{ margin: 0 }}>
            Your privacy is a priority, not an afterthought. We've put together this policy so you know exactly how your
            personal information is collected, used, and protected within HeroManager. We safeguard your data against
            unauthorized access, loss, or misuse using reasonable and industry-standard security measures.
          </p>
        </Section>

        <Section icon={<Cookie size={18} />} title="Cookies & Preferences" color="#60a5fa">
          <p style={{ margin: 0 }}>
            Cookies are small text files stored on your device by your browser when you visit HeroManager. We use them
            to keep you logged in when you've chosen that option, remember your settings and preferences, record past
            activity so returning visits feel seamless, and tailor content to your browser and device. You may disable
            cookies in your browser settings, though some features — like auto-login — may not function without them.
          </p>
        </Section>

        <Section icon={<Globe size={18} />} title="Third-Party Services" color="#4ade80">
          <p style={{ margin: 0 }}>
            When you visit HeroManager, third-party services such as analytics and advertising platforms may collect
            general technical data about your session — things like your domain type, approximate IP address, and
            navigation patterns. This is standard practice across the web. For details on how those parties handle
            your data, please refer to the privacy policies published by Google and other services linked to the game.
          </p>
        </Section>

        <Section icon={<Baby size={18} />} title="Children Under 13" color="#fbbf24">
          <p style={{ margin: 0 }}>
            HeroManager is committed to protecting the privacy of younger users. We do not knowingly collect or store
            personal information from anyone under the age of 13. If you are younger than 13, please do not submit
            any information through this site. Parents or guardians who believe their child has provided us with
            personal data are encouraged to contact us so we can promptly remove it.
          </p>
        </Section>

        <Section icon={<Lock size={18} />} title="Account Security" color="#e94560">
          <p style={{ margin: 0 }}>
            While no system can guarantee absolute security, we take precautions including encryption where applicable
            to protect your credentials. You are responsible for keeping your password confidential. Passwords must
            meet our complexity requirements — a mix of uppercase letters, lowercase letters, and numbers — to ensure
            a reasonable baseline of protection. Write it down somewhere safe, and never share it with anyone.
          </p>
        </Section>

        <Section icon={<Database size={18} />} title="What We Collect" color="#a78bfa">
          <p style={{ margin: '0 0 14px' }}>
            We store the minimum amount of information needed to provide you with a working account:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><span style={{ color: '#c8c8e8' }}>Preference cookies</span> — auto-login settings and UI preferences you've selected.</li>
            <li><span style={{ color: '#c8c8e8' }}>Registration data</span> — your email address, username, hashed password, and IP address, stored privately to create and maintain your unique account.</li>
            <li><span style={{ color: '#c8c8e8' }}>Login IP</span> — recorded privately on each login to help detect and prevent multi-account abuse.</li>
          </ul>
          <p style={{ margin: '14px 0 0' }}>
            Your email is used solely to provide account access. Your IP is used solely to maintain fair play.
            Neither is sold, rented, or traded to third parties.
          </p>
        </Section>

        <Section icon={<Trash2 size={18} />} title="Data Deletion" color="#60a5fa">
          <p style={{ margin: '0 0 14px' }}>
            You have the right to request removal of your data at any time. To do so, send an email from your
            registered address with the subject line <span style={{ color: '#c8c8e8' }}>"Data deletion"</span> and
            we will process your request promptly.
          </p>
          <p style={{ margin: 0 }}>
            Upon deletion, your public profile details will be anonymized and any third-party sign-in connections
            will be severed. Please note that after deletion, the same email address cannot be used to register
            a new account. If you want to know exactly what data we hold on you, feel free to ask — same process,
            just a different subject line.
          </p>
        </Section>

        <Section icon={<RefreshCw size={18} />} title="Policy Updates" color="#fbbf24">
          <p style={{ margin: 0 }}>
            We reserve the right to update this Privacy Policy as the game evolves. Significant changes will be
            announced, but it is your responsibility to review this page periodically. Continuing to use HeroManager
            after a policy change constitutes acceptance of the updated terms. If you disagree with any revision,
            you may stop using the service or contact us to have your account removed.
          </p>
        </Section>

      </div>

      <Footer />
    </div>
  );
}
