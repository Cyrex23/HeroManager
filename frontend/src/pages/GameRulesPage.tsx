import { Link } from 'react-router-dom';
import { Swords, Users, Tag, Crown, Gavel, Bug } from 'lucide-react';
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
  const backTo = isAuthenticated ? '/team' : '/login';
  const backLabel = isAuthenticated ? '← Back to Game' : '← Back to Login';
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
            Know the Code
          </span>
        </div>
        <h1 className="gradient-title" style={{ fontSize: 46, margin: '0 0 16px', letterSpacing: 2 }}>
          Game Rules
        </h1>
        <p style={{ color: '#555577', fontSize: 15, maxWidth: 540, margin: '0 auto', lineHeight: 1.7, fontFamily: 'Inter, sans-serif' }}>
          Every commander who enters the realm is bound by these rules. Ignorance is not a defense — read them, know them, follow them.
        </p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 100px', position: 'relative', zIndex: 1 }}>

        <Section icon={<Swords size={18} />} title="Arena & Battle Conduct" color="#e94560">
          <Rule
            label="No Win Trading"
            text="Deliberately throwing matches, intentionally removing heroes from your roster to hand victories to allies, or coordinating result manipulation in any form is strictly prohibited. Competing honestly is the only acceptable standard."
            color="#e94560"
          />
        </Section>

        <Section icon={<Users size={18} />} title="Account Limits & Ownership" color="#60a5fa">
          <Rule
            label="Two-Account Maximum"
            text="You may register and actively play with up to two accounts. Operating more than two will result in a ban across all associated accounts without exception."
            color="#60a5fa"
          />
          <Rule
            label="No Account Sharing"
            text="Your account is yours alone. Sharing login credentials — even with friends or family — puts your team at risk and violates our rules. We cannot restore heroes, items, or progress lost due to shared access."
            color="#60a5fa"
          />
          <Rule
            label="No Trading or Selling"
            text="Accounts may not be sold, gifted, traded, or transferred under any circumstances. Doing so results in a temporary ban for both parties and permanent deletion of the accounts involved."
            color="#60a5fa"
          />
          <Rule
            label="Full Responsibility"
            text="You are solely accountable for everything that occurs on your account — whether posted, purchased, or initiated. Keep hackers, unauthorized users, and curious siblings away from your credentials. We also cannot be held liable for game-side bugs, though we fix reported ones as soon as possible."
            color="#60a5fa"
          />
          <Rule
            label="Credentials"
            text="Use a valid, accessible email address. Your password must be unique and strong. Write it down and store it securely — never share it, and never reuse it from another site."
            color="#60a5fa"
          />
        </Section>

        <Section icon={<Tag size={18} />} title="Name & Identity Standards" color="#a78bfa">
          <Rule
            label="No Offensive Names"
            text="Your username and team name must be clean and respectful. Sexual, racist, discriminatory, or excessively offensive names are banned outright. We won't rename your account — we'll ban it. If you think a name might cross the line, it almost certainly does."
            color="#a78bfa"
          />
          <Rule
            label="Be Yourself"
            text="Impersonating other players, pretending to be an admin, or using names associated with well-known public figures is forbidden. Don't use your account name for advertising. Be original — the realm has plenty of room for your own legend."
            color="#a78bfa"
          />
        </Section>

        <Section icon={<Crown size={18} />} title="Admins & Game Masters" color="#fbbf24">
          <Rule
            label="Don't Ask for the Role"
            text="If we want your help, we'll reach out to you directly. Asking, pestering, or repeatedly lobbying for an admin or Game Master position will earn you a temporary ban, not a promotion."
            color="#fbbf24"
          />
          <Rule
            label="Watch for Imposters"
            text="HeroManager staff will never contact you outside the game, never ask for your password, and never solicit you through external channels. If someone claims otherwise, report them immediately — do not follow outside links or hand over any information."
            color="#fbbf24"
          />
        </Section>

        <Section icon={<Gavel size={18} />} title="Bans & Enforcement" color="#f97316">
          <Rule
            label="Warnings and Bans"
            text="Minor infractions may receive a warning first. More serious violations result in a temporary or permanent ban at our discretion. The decision is final — you may explain your behavior calmly, but complaining or harassing staff will only extend the punishment."
            color="#f97316"
          />
          <Rule
            label="No Refunds or Rollbacks"
            text="We will not grant power-ups, currency, heroes, or items, nor will we undo purchases or recruiting decisions on your behalf. There are no exceptions. Think carefully before you act — especially on shared devices. Always log out when done."
            color="#f97316"
          />
        </Section>

        <Section icon={<Bug size={18} />} title="Exploits & Security" color="#4ade80">
          <Rule
            label="No Bots or Automation"
            text="Using macros, scripts, browser reload plugins, or any third-party software that automates gameplay or gives you an unfair mechanical edge is forbidden. The game is meant to be played by you."
            color="#4ade80"
          />
          <Rule
            label="No Hacking or Exploiting"
            text="Attempting to exploit bugs, glitches, or vulnerabilities — or asking others how to do so — carries severe consequences. Distributing exploits or teaching them to others is treated with the same severity as the original offense. All known exploits are patched as quickly as possible."
            color="#4ade80"
          />
          <Rule
            label="Report Glitches"
            text="If you discover a bug that could be abused, report it to us immediately. We genuinely appreciate responsible disclosure and will treat you well for it. Sitting on an exploit instead of reporting it is itself a violation."
            color="#4ade80"
          />
        </Section>

      </div>

      <Footer />
    </div>
  );
}
