import { Newspaper } from 'lucide-react';

interface NewsPost {
  id: number;
  date: string;
  tag: string;
  tagColor: string;
  tagBg: string;
  tagBorder: string;
  title: string;
  body: string[];
}

const NEWS: NewsPost[] = [
  {
    id: 1,
    date: 'February 2026',
    tag: 'Dev',
    tagColor: '#a78bfa',
    tagBg: 'rgba(167,139,250,0.12)',
    tagBorder: 'rgba(167,139,250,0.25)',
    title: 'Development begins!',
    body: [
      'HeroManager is now in active development. The journey to build a competitive hero management game has officially started.',
      'Our first milestone includes the core game loop: recruit heroes from the Shop, assemble your team, and challenge other players in the Arena to climb the leaderboard.',
      'Upcoming features include guilds, a world map, the blacksmith, championships, and much more. Stay tuned for updates right here in the News section!',
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
          <article key={post.id} style={styles.card}>
            {/* Card header stripe */}
            <div style={styles.cardStripe} />

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

              {/* Title */}
              <h2 style={styles.title}>{post.title}</h2>

              {/* Body paragraphs */}
              <div style={styles.bodyWrap}>
                {post.body.map((para, i) => (
                  <p key={i} style={styles.para}>{para}</p>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
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
