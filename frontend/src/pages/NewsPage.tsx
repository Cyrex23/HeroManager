import { Newspaper } from 'lucide-react';

interface Bullet {
  icon: string;
  text: string;
}

interface NewsPost {
  id: number;
  date: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  tagBorder: string;
  accentColor: string;
  title: string;
  subtitle: string;
  body: string[];
  bullets?: Bullet[];
}

const NEWS: NewsPost[] = [
  {
    id: 4,
    date: 'March 2026',
    tag: 'Update',
    tagColor: '#4ade80',
    tagBg: 'rgba(74,222,128,0.1)',
    tagBorder: 'rgba(74,222,128,0.25)',
    accentColor: '#4ade80',
    title: 'Quality of Life & Polish',
    subtitle: 'Smarter UI, richer battle feedback, and team management upgrades.',
    body: [
      'This update focused on sharpening the experience across every corner of the game. The battle simulator now tracks XP and gold bonuses in real time — you can see exactly how your summon aura and equipment multipliers affect every reward you earn.',
    ],
    bullets: [
      { icon: '⚔', text: 'Battle XP count-up animation — watch base XP grow to its final bonus total' },
      { icon: '🪙', text: 'Gold breakdown shown in victory panel: base + bonus % = total' },
      { icon: '🛡', text: 'Team setup staging — queue multiple hero/summon swaps, then apply all at once with the green Update button' },
      { icon: '🔄', text: 'Confirmation popup when switching between team setups' },
      { icon: '📖', text: 'Guide expanded: Magic Proficiency multi-reroll, XP & Leveling, Gold Bonus sections' },
      { icon: '✦', text: 'Round numbers removed from battle simulator — no more spoilers' },
    ],
  },
  {
    id: 2,
    date: 'Late February 2026',
    tag: 'Major Update',
    tagColor: '#a78bfa',
    tagBg: 'rgba(167,139,250,0.12)',
    tagBorder: 'rgba(167,139,250,0.25)',
    accentColor: '#a78bfa',
    title: 'Depth of Combat',
    subtitle: 'Spells, sub-stats, equipment, and the full combat formula unveiled.',
    body: [
      'The second week exploded the depth of every fight. What started as a simple stat comparison evolved into a layered combat engine with 6 core stats and 14 sub-stats, each influencing battles in distinct ways.',
      'The Spell System arrived with hero abilities that trigger mid-battle — each with a mana cost, activation chance, and mastery modifiers. Equip items and abilities to fill your 12 hero slots and push your team power beyond what raw stats can achieve.',
    ],
    bullets: [
      { icon: '✨', text: '14 sub-stats: Attack, Magic Prof, Spell Mastery, Spell Activation, Dex Prof, Dex Posture, Crit Chance, Crit Damage, XP Bonus, Gold Bonus, Item Discovery, and 3 immunity stats' },
      { icon: '🔮', text: 'Spell system — spells fire in battle based on mana cost and activation chance' },
      { icon: '🎒', text: '12-slot equipment system per hero: 6 item slots + 6 ability slots' },
      { icon: '🌀', text: 'Dexterity cycle — DEX depletes as a hero wins clashes and recovers over time' },
      { icon: '💥', text: 'Critical hits — chance and multiplier sub-stats that randomly amplify PA damage' },
      { icon: '🔁', text: 'Magic Proficiency reroll — guarantee better MP rolls with high proficiency' },
    ],
  },
  {
    id: 3,
    date: 'Mid February 2026',
    tag: 'Major Update',
    tagColor: '#e94560',
    tagBg: 'rgba(233,69,96,0.1)',
    tagBorder: 'rgba(233,69,96,0.25)',
    accentColor: '#e94560',
    title: 'The Arena Opens — UI Rework',
    subtitle: 'A complete visual overhaul, live battle replays, and the competitive arena.',
    body: [
      'The third week of development delivered the game\'s biggest transformation yet. Every page was rebuilt from the ground up with a dark, atmospheric aesthetic — richer card layouts, animated team slots, glowing power badges, and a color-coded tier system spanning Commoner, Elite, and Legendary.',
      'The Arena launched with a full opponent roster, team portraits, live battle replays, XP tracking per hero, and a return-challenge system. The Battle Simulator renders every round with spell effects, mana bars, element matchup banners, and stamina decay — giving players a complete picture of every fight.',
    ],
    bullets: [
      { icon: '🏟', text: 'Arena with real opponents, team power comparison, and return challenges' },
      { icon: '🎬', text: 'Full battle replay simulator — hero portraits, spell tags, mana bars, round controls' },
      { icon: '🎨', text: 'Complete UI rework — dark theme, animated slots, tier-glow colors, power badge' },
      { icon: '⚡', text: 'Element matchup system — Fire, Water, Wind, Earth, Lightning with advantage banners' },
      { icon: '📊', text: 'Detailed battle log: stat breakdowns, crit bonuses, dex cycle, stamina modifiers' },
      { icon: '🏆', text: 'Victory panel with animated results, XP per hero, gold earned' },
    ],
  },
  {
    id: 1,
    date: 'Early February 2026',
    tag: 'Dev Start',
    tagColor: '#fbbf24',
    tagBg: 'rgba(251,191,36,0.1)',
    tagBorder: 'rgba(251,191,36,0.25)',
    accentColor: '#fbbf24',
    title: 'Development Begins',
    subtitle: 'The core game loop is born — recruit, build, battle.',
    body: [
      'HeroManager officially began development in February 2026. From day one, the vision was clear: a competitive hero management game where roster building, strategic team composition, and smart resource use determine who rises to the top.',
      'The first milestone shipped the complete core loop. Recruit heroes and summons from the Shop, assemble a team across Commoner, Elite, and Legendary slots respecting the capacity limit, and challenge real players in the Arena to earn gold and XP.',
    ],
    bullets: [
      { icon: '⚔', text: 'Core battle engine — 6 main stats: Physical Attack, Magic Power, Dexterity, Element, Mana, Stamina' },
      { icon: '🏪', text: 'Shop system — buy heroes, summons, stat upgrades, and abilities with gold' },
      { icon: '🧩', text: 'Team builder — Commoner / Elite / Legendary tier slots with capacity limits' },
      { icon: '👥', text: 'Summon system — equip a summon for team-wide aura bonuses in battle' },
      { icon: '🥷', text: 'Hero roster — 30+ unique hero portraits with individual stats and growth curves' },
      { icon: '📈', text: 'Leaderboard and arena energy system — limited fights per day, strategic choices matter' },
    ],
  },
];

export default function NewsPage() {
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <Newspaper size={22} color="#e94560" />
        </div>
        <div>
          <h1 style={styles.heading}>News</h1>
          <p style={styles.subheading}>Updates, announcements and patch notes</p>
        </div>
      </div>

      {/* Posts */}
      <div style={styles.list}>
        {NEWS.map((post) => (
          <article key={post.id} style={{ ...styles.card, borderColor: `rgba(${hexToRgb(post.accentColor)},0.2)` }}>
            {/* Card header stripe */}
            <div style={{ ...styles.cardStripe, background: `linear-gradient(90deg, ${post.accentColor}, rgba(${hexToRgb(post.accentColor)},0.1))` }} />

            <div style={styles.cardInner}>
              {/* Meta row */}
              <div style={styles.metaRow}>
                <span style={styles.date}>{post.date}</span>
                <span style={{
                  ...styles.tag,
                  color: post.tagColor,
                  backgroundColor: post.tagBg,
                  border: `1px solid ${post.tagBorder}`,
                }}>
                  {post.tag}
                </span>
              </div>

              {/* Title + subtitle */}
              <div>
                <h2 style={styles.title}>{post.title}</h2>
                {post.subtitle && <p style={{ ...styles.para, color: '#6666a0', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>{post.subtitle}</p>}
              </div>

              {/* Body paragraphs */}
              <div style={styles.bodyWrap}>
                {post.body.map((para, i) => (
                  <p key={i} style={styles.para}>{para}</p>
                ))}
              </div>

              {/* Bullet list */}
              {post.bullets && post.bullets.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginTop: 4, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  {post.bullets.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#7a7aa0', lineHeight: 1.55, fontFamily: 'Inter, sans-serif' }}>
                      <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{b.icon}</span>
                      <span>{b.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 720,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    paddingBottom: 40,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 20,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(233,69,96,0.1)',
    border: '1px solid rgba(233,69,96,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heading: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: '#e8e8f0',
    fontFamily: 'Inter, sans-serif',
    lineHeight: 1.2,
  },
  subheading: {
    margin: '4px 0 0',
    fontSize: 12,
    color: '#555577',
    fontFamily: 'Inter, sans-serif',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  card: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(233,69,96,0.18)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardStripe: {
    height: 3,
    background: 'linear-gradient(90deg, #e94560, rgba(233,69,96,0.2))',
  },
  cardInner: {
    padding: '20px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  date: {
    color: '#555577',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
  },
  tag: {
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 4,
    padding: '2px 7px',
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    fontFamily: 'Inter, sans-serif',
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: '#e8e8f0',
    fontFamily: 'Inter, sans-serif',
    lineHeight: 1.3,
  },
  bodyWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  para: {
    margin: 0,
    fontSize: 13,
    color: '#8888a8',
    lineHeight: 1.75,
    fontFamily: 'Inter, sans-serif',
  },
};
