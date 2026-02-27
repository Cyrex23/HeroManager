import { useState, useEffect } from 'react';
import type { LeaderboardHeroEntry, LeaderboardSummonEntry, LeaderboardTeamEntry } from '../types';
import { getTopHeroes, getTopSummons, getTopTeams } from '../api/leaderboardApi';
import HeroPortrait from '../components/Hero/HeroPortrait';
import TeamInspectHover from '../components/Leaderboard/TeamInspectHover';

type Tab = 'heroes' | 'summons' | 'teams';

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const TIER_COLOR: Record<string, string> = {
  LEGENDARY: '#f59e0b', ELITE: '#a78bfa', COMMONER: '#6b7280',
};

function rankStyle(rank: number): React.CSSProperties {
  if (rank === 1) return { color: '#ffd700', fontWeight: 800 };
  if (rank === 2) return { color: '#c0c0c0', fontWeight: 700 };
  if (rank === 3) return { color: '#cd7f32', fontWeight: 700 };
  return { color: '#555', fontWeight: 600 };
}

function rankClass(rank: number): string {
  if (rank === 1) return 'rank-1';
  if (rank === 2) return 'rank-2';
  if (rank === 3) return 'rank-3';
  return '';
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('teams');
  const [heroes, setHeroes] = useState<LeaderboardHeroEntry[]>([]);
  const [summons, setSummons] = useState<LeaderboardSummonEntry[]>([]);
  const [teams, setTeams] = useState<LeaderboardTeamEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Set<Tab>>(new Set());

  useEffect(() => {
    if (loaded.has(tab)) return;
    setLoading(true);
    const fetch = tab === 'heroes' ? getTopHeroes()
      : tab === 'summons' ? getTopSummons()
      : getTopTeams();

    fetch.then((data) => {
      if (tab === 'heroes') setHeroes(data as LeaderboardHeroEntry[]);
      else if (tab === 'summons') setSummons(data as LeaderboardSummonEntry[]);
      else setTeams(data as LeaderboardTeamEntry[]);
      setLoaded((prev) => new Set(prev).add(tab));
    }).finally(() => setLoading(false));
  }, [tab, loaded]);

  return (
    <div style={styles.page}>
      <h2 style={styles.title} className="gradient-title">Leaderboards</h2>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['teams', 'heroes', 'summons'] as Tab[]).map((t) => (
          <button
            key={t}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
            onClick={() => setTab(t)}
          >
            {t === 'teams' ? '⚔ Teams' : t === 'heroes' ? '🗡 Heroes' : '✨ Summons'}
          </button>
        ))}
      </div>

      {loading && <div style={styles.loading}>Loading...</div>}

      {/* Teams tab */}
      {!loading && tab === 'teams' && (
        <div style={styles.table}>
          <div style={styles.headerRow}>
            <span style={{ ...styles.col, ...styles.colRank }}>#</span>
            <span style={{ ...styles.col, width: 44 }} />
            <span style={{ ...styles.col, flex: 1 }}>Team</span>
            <span style={{ ...styles.col, ...styles.colNum }}>Power</span>
            <span style={{ ...styles.col, ...styles.colNum }}>Heroes</span>
          </div>
          {teams.map((t) => (
            <div key={t.playerId} style={{ ...styles.row, ...(t.rank <= 3 ? styles.topRow : {}) }}>
              <span style={{ ...styles.col, ...styles.colRank, ...rankStyle(t.rank) }} className={rankClass(t.rank)}>{t.rank}</span>
              <span style={{ ...styles.col, width: 44 }}>
                {t.profileImagePath
                  ? <HeroPortrait imagePath={t.profileImagePath} name={t.username} size={36} />
                  : <div style={styles.avatar}>{t.username.charAt(0).toUpperCase()}</div>}
              </span>
              <div style={{ ...styles.col, flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <TeamInspectHover
                  playerId={t.playerId}
                  username={t.username}
                  teamName={t.teamName}
                  profileImagePath={t.profileImagePath}
                >
                  <span style={{ ...styles.teamName, ...styles.inspectTrigger }}>{t.teamName}</span>
                  {t.teamName !== t.username && (
                    <span style={styles.ownerName}>{t.username}</span>
                  )}
                </TeamInspectHover>
              </div>
              <span style={{ ...styles.col, ...styles.colNum, color: '#e94560', fontWeight: 700 }}>
                {t.teamPower.toFixed(0)}
              </span>
              <span style={{ ...styles.col, ...styles.colNum, color: '#a0a0b0' }}>{t.heroCount}</span>
            </div>
          ))}
          {teams.length === 0 && <div style={styles.empty}>No teams yet.</div>}
        </div>
      )}

      {/* Heroes tab */}
      {!loading && tab === 'heroes' && (
        <div style={styles.table}>
          <div style={styles.headerRow}>
            <span style={{ ...styles.col, ...styles.colRank }}>#</span>
            <span style={{ ...styles.col, width: 44 }} />
            <span style={{ ...styles.col, flex: 1 }}>Hero</span>
            <span style={{ ...styles.col, ...styles.colNum }}>Lv</span>
            <span style={{ ...styles.col, ...styles.colNum }}>W / L</span>
            <span style={{ ...styles.col, flex: 1 }}>Owner</span>
          </div>
          {heroes.map((h) => {
            const elemColor = h.element ? (ELEMENT_COLOR[h.element] ?? '#a0a0b0') : null;
            const elemSymbol = h.element ? (ELEMENT_SYMBOL[h.element] ?? '') : null;
            const tierColor = h.tier ? (TIER_COLOR[h.tier] ?? '#6b7280') : '#6b7280';
            return (
              <div key={h.heroId} style={{ ...styles.row, ...(h.rank <= 3 ? styles.topRow : {}) }}>
                <span style={{ ...styles.col, ...styles.colRank, ...rankStyle(h.rank) }} className={rankClass(h.rank)}>{h.rank}</span>
                <span style={{ ...styles.col, width: 44, position: 'relative' }}>
                  <HeroPortrait imagePath={h.imagePath} name={h.name} size={36} tier={h.tier} />
                  {elemSymbol && (
                    <span style={{ position: 'absolute', top: 0, left: 0, fontSize: 10, color: elemColor ?? '#fff' }}>
                      {elemSymbol}
                    </span>
                  )}
                </span>
                <div style={{ ...styles.col, flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                  <span style={{ ...styles.heroName, color: tierColor }}>{h.name}</span>
                  {h.tier && <span style={{ ...styles.tierBadge, color: tierColor }}>{h.tier}</span>}
                </div>
                <span style={{ ...styles.col, ...styles.colNum, color: '#60a5fa', fontWeight: 700 }}>{h.level}</span>
                <span style={{ ...styles.col, ...styles.colNum, fontSize: 11 }}>
                  <span style={{ color: '#4ade80' }}>{h.clashesWon}</span>
                  <span style={{ color: '#555577', fontWeight: 800 }}> / </span>
                  <span style={{ color: '#e94560' }}>{h.clashesLost}</span>
                </span>
                <div style={{ ...styles.col, flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                  <TeamInspectHover
                    playerId={h.ownerPlayerId}
                    username={h.ownerUsername}
                    teamName={h.ownerTeamName}
                    profileImagePath={h.ownerProfileImagePath}
                  >
                    <span style={{ ...styles.teamName, ...styles.inspectTrigger }}>{h.ownerTeamName}</span>
                    {h.ownerTeamName !== h.ownerUsername && (
                      <span style={styles.ownerName}>{h.ownerUsername}</span>
                    )}
                  </TeamInspectHover>
                </div>
              </div>
            );
          })}
          {heroes.length === 0 && <div style={styles.empty}>No heroes yet.</div>}
        </div>
      )}

      {/* Summons tab */}
      {!loading && tab === 'summons' && (
        <div style={styles.table}>
          <div style={styles.headerRow}>
            <span style={{ ...styles.col, ...styles.colRank }}>#</span>
            <span style={{ ...styles.col, width: 44 }} />
            <span style={{ ...styles.col, flex: 1 }}>Summon</span>
            <span style={{ ...styles.col, ...styles.colNum }}>Lv</span>
            <span style={{ ...styles.col, flex: 1 }}>Owner</span>
          </div>
          {summons.map((s) => (
            <div key={s.summonId} style={{ ...styles.row, ...(s.rank <= 3 ? styles.topRow : {}) }}>
              <span style={{ ...styles.col, ...styles.colRank, ...rankStyle(s.rank) }} className={rankClass(s.rank)}>{s.rank}</span>
              <span style={{ ...styles.col, width: 44 }}>
                <HeroPortrait imagePath={s.imagePath} name={s.name} size={36} />
              </span>
              <span style={{ ...styles.col, flex: 1, ...styles.heroName }}>{s.name}</span>
              <span style={{ ...styles.col, ...styles.colNum, color: '#a78bfa', fontWeight: 700 }}>{s.level}</span>
              <div style={{ ...styles.col, flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                <TeamInspectHover
                  playerId={s.ownerPlayerId}
                  username={s.ownerUsername}
                  teamName={s.ownerTeamName}
                  profileImagePath={s.ownerProfileImagePath}
                >
                  <span style={{ ...styles.teamName, ...styles.inspectTrigger }}>{s.ownerTeamName}</span>
                  {s.ownerTeamName !== s.ownerUsername && (
                    <span style={styles.ownerName}>{s.ownerUsername}</span>
                  )}
                </TeamInspectHover>
              </div>
            </div>
          ))}
          {summons.length === 0 && <div style={styles.empty}>No summons yet.</div>}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 760, margin: '0 auto' },
  title: { color: '#e8c97a', fontSize: 22, fontWeight: 700, marginBottom: 16 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: {
    padding: '8px 20px', borderRadius: 4, border: '1px solid #2a2a4a',
    backgroundColor: '#1a1a2e', color: '#a0a0b0', cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
  },
  tabActive: { backgroundColor: '#16213e', color: '#e0e0e0', borderColor: '#7a5a1a' },
  loading: { color: '#666', textAlign: 'center', padding: 32 },
  empty: { color: '#444', textAlign: 'center', padding: '24px 0', fontStyle: 'italic' },
  table: {
    backgroundColor: '#12122a', border: '1px solid #1a1a3e', borderRadius: 8, overflow: 'visible',
  },
  headerRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 14px',
    backgroundColor: '#0d0d20',
    borderBottom: '1px solid #1a1a3e',
    borderRadius: '8px 8px 0 0',
    fontSize: 10, color: '#555', letterSpacing: 1, textTransform: 'uppercase' as const,
    fontWeight: 600,
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px',
    borderBottom: '1px solid #0f0f25',
  },
  topRow: { backgroundColor: 'rgba(255,215,0,0.03)' },
  col: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  colRank: { width: 28, justifyContent: 'center', fontSize: 13 },
  colNum: { width: 64, justifyContent: 'center', fontSize: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    backgroundColor: '#16213e', border: '1px solid #2a2a4a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, color: '#e0e0e0',
  },
  teamName: { color: '#e0e0e0', fontSize: 13, fontWeight: 600 },
  ownerName: { color: '#666', fontSize: 11 },
  heroName: { color: '#e0e0e0', fontSize: 13, fontWeight: 600 },
  tierBadge: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase' as const, fontWeight: 700 },
  inspectTrigger: {
    cursor: 'default',
    borderBottom: '1px dashed #444',
  },
};
