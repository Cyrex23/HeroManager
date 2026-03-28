import { Newspaper } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Bullet {
  icon: string;
  text: string;
}

interface NewsPostConfig {
  id: number;
  tagColor: string;
  tagBg: string;
  tagBorder: string;
  accentColor: string;
  bulletIcons: string[];
}

const POST_CONFIGS: NewsPostConfig[] = [
  {
    id: 4,
    tagColor: '#4ade80', tagBg: 'rgba(74,222,128,0.1)', tagBorder: 'rgba(74,222,128,0.25)',
    accentColor: '#4ade80',
    bulletIcons: ['⚔', '🪙', '🛡', '🔄', '📖', '✦'],
  },
  {
    id: 2,
    tagColor: '#a78bfa', tagBg: 'rgba(167,139,250,0.12)', tagBorder: 'rgba(167,139,250,0.25)',
    accentColor: '#a78bfa',
    bulletIcons: ['✨', '🔮', '🎒', '🌀', '💥', '🔁'],
  },
  {
    id: 3,
    tagColor: '#e94560', tagBg: 'rgba(233,69,96,0.1)', tagBorder: 'rgba(233,69,96,0.25)',
    accentColor: '#e94560',
    bulletIcons: ['🏟', '🎬', '🎨', '⚡', '📊', '🏆'],
  },
  {
    id: 1,
    tagColor: '#fbbf24', tagBg: 'rgba(251,191,36,0.1)', tagBorder: 'rgba(251,191,36,0.25)',
    accentColor: '#fbbf24',
    bulletIcons: ['⚔', '🏪', '🧩', '👥', '🥷', '📈'],
  },
];

export default function NewsPage() {
  const { t } = useLanguage();

  type PostKey = 'p4' | 'p2' | 'p3' | 'p1';
  const postKeys: PostKey[] = ['p4', 'p2', 'p3', 'p1'];

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <Newspaper size={22} color="#e94560" />
        </div>
        <div>
          <h1 style={styles.heading}>{t('news_title')}</h1>
          <p style={styles.subheading}>{t('news_subtitle')}</p>
        </div>
      </div>

      {/* Posts */}
      <div style={styles.list}>
        {POST_CONFIGS.map((cfg, idx) => {
          const key = postKeys[idx];
          const date = t(`news_${key}_date` as Parameters<typeof t>[0]);
          const tag = t(`news_${key}_tag` as Parameters<typeof t>[0]);
          const title = t(`news_${key}_title` as Parameters<typeof t>[0]);
          const subtitle = t(`news_${key}_subtitle` as Parameters<typeof t>[0]);
          const body1 = t(`news_${key}_body1` as Parameters<typeof t>[0]);
          const body2Key = `news_${key}_body2` as Parameters<typeof t>[0];
          const bullets: Bullet[] = cfg.bulletIcons.map((icon, i) => ({
            icon,
            text: t(`news_${key}_b${i + 1}` as Parameters<typeof t>[0]),
          }));

          return (
            <article key={cfg.id} style={{ ...styles.card, borderColor: `rgba(${hexToRgb(cfg.accentColor)},0.2)` }}>
              <div style={{ ...styles.cardStripe, background: `linear-gradient(90deg, ${cfg.accentColor}, rgba(${hexToRgb(cfg.accentColor)},0.1))` }} />

              <div style={styles.cardInner}>
                <div style={styles.metaRow}>
                  <span style={styles.date}>{date}</span>
                  <span style={{ ...styles.tag, color: cfg.tagColor, backgroundColor: cfg.tagBg, border: `1px solid ${cfg.tagBorder}` }}>
                    {tag}
                  </span>
                </div>

                <div>
                  <h2 style={styles.title}>{title}</h2>
                  {subtitle && <p style={{ ...styles.para, color: '#6666a0', fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>{subtitle}</p>}
                </div>

                <div style={styles.bodyWrap}>
                  <p style={styles.para}>{body1}</p>
                  {(key === 'p2' || key === 'p3' || key === 'p1') && (
                    <p style={styles.para}>{t(body2Key)}</p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginTop: 4, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                  {bullets.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#7a7aa0', lineHeight: 1.55, fontFamily: 'Inter, sans-serif' }}>
                      <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{b.icon}</span>
                      <span>{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
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
