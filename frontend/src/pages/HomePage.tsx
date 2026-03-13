import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getDashboard } from '../api/dashboardApi';
import HeroPortrait from '../components/Hero/HeroPortrait';
import type { DashboardResponse, DashboardPeriodStats, DashboardHeroSummary } from '../types';

const PERIOD_LABELS = ['Today', 'This Week', 'This Month', 'All Time'] as const;
type PeriodKey = 'today' | 'week' | 'month' | 'allTime';
const PERIOD_KEYS: PeriodKey[] = ['today', 'week', 'month', 'allTime'];

const TIER_COLOR: Record<string, string> = {
  LEGENDARY: '#fbbf24',
  ELITE:     '#a78bfa',
  COMMONER:  '#9ca3af',
};
const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};

const PAGE_CSS = `
  @keyframes hpFadeIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes hpShimmer {
    0%   { transform: translateX(-120%) skewX(-16deg); }
    100% { transform: translateX(220%) skewX(-16deg); }
  }
  @keyframes winRingFill {
    from { stroke-dashoffset: 200; }
    to   { stroke-dashoffset: var(--target-offset); }
  }
  .hp-stat-card:hover { transform: translateY(-2px); }
  .hp-hero-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; }
  .hp-period-tab:hover { background: rgba(255,255,255,0.09) !important; }
`;

function WinRing({ winRate }: { winRate: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (winRate / 100) * circ;
  const color = winRate >= 60 ? '#4ade80' : winRate >= 40 ? '#fbbf24' : '#e94560';
  return (
    <svg width={72} height={72} style={{ flexShrink: 0 }}>
      <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle
        cx={36} cy={36} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
      <text x={36} y={36} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={14} fontWeight={800} fontFamily="Inter, sans-serif">
        {winRate}%
      </text>
    </svg>
  );
}

function StatCard({ label, value, sub, color, delay }: {
  label: string; value: string | number; sub?: string; color: string; delay: number;
}) {
  return (
    <div className="hp-stat-card" style={{
      background: 'rgba(255,255,255,0.035)',
      border: `1px solid rgba(255,255,255,0.08)`,
      borderTop: `2px solid ${color}55`,
      borderRadius: 10,
      padding: '14px 18px',
      display: 'flex', flexDirection: 'column', gap: 4,
      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      animation: `hpFadeIn 0.4s ease both`,
      animationDelay: `${delay}ms`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: '-60%', width: '40%', height: '100%',
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)`,
        animation: 'hpShimmer 3.5s ease-in-out infinite', animationDelay: `${delay * 0.5}ms` }} />
      <span style={{ color: '#7070a0', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <span style={{ color, fontSize: 24, fontWeight: 900, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ color: '#6060a0', fontSize: 11 }}>{sub}</span>}
    </div>
  );
}

function PeriodPanel({ stats }: { stats: DashboardPeriodStats; label: string }) {
  const winColor  = '#4ade80';
  const lossColor = '#e94560';
  const goldColor = '#fbbf24';
  const batColor  = '#60a5fa';

  return (
    <div style={{ animation: 'hpFadeIn 0.35s ease both' }}>
      {/* Win rate + core stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
        <WinRing winRate={stats.winRate} />
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          <StatCard label="Battles"  value={stats.battles}  color={batColor}  delay={0}   />
          <StatCard label="Wins"     value={stats.wins}     color={winColor}  delay={60}  />
          <StatCard label="Losses"   value={stats.losses}   color={lossColor} delay={120} />
          <StatCard label="Gold Earned" value={stats.goldEarned.toLocaleString()}
            color={goldColor} delay={180} />
        </div>
      </div>
    </div>
  );
}

function HeroCard({ hero }: { hero: DashboardHeroSummary }) {
  const navigate = useNavigate();
  const xpPct = hero.xpToNextLevel > 0 ? Math.min((hero.currentXp / hero.xpToNextLevel) * 100, 100) : 0;
  const tierColor = hero.tier ? (TIER_COLOR[hero.tier] ?? '#9ca3af') : '#9ca3af';
  const elemColor = hero.element ? (ELEMENT_COLOR[hero.element] ?? '#a0a0b0') : null;
  const elemSym   = hero.element ? (ELEMENT_SYMBOL[hero.element] ?? '') : null;
  const totalClashes = hero.clashesWon + hero.clashesLost;
  const heroWinRate = totalClashes > 0 ? Math.round((hero.clashesWon / totalClashes) * 100) : 0;

  return (
    <div className="hp-hero-card" onClick={() => navigate(`/hero/${hero.id}`)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${tierColor}`,
        borderRadius: 10,
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        boxShadow: `0 2px 12px rgba(0,0,0,0.3), inset 0 0 20px rgba(${tierColor === '#fbbf24' ? '251,191,36' : tierColor === '#a78bfa' ? '167,139,250' : '156,163,175'},0.03)`,
      }}>
      {/* Portrait */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ borderRadius: 8, overflow: 'hidden', width: 52, height: 58, position: 'relative' }}>
          <HeroPortrait imagePath={hero.imagePath} name={hero.name} size={52} tier={hero.tier as ('COMMONER' | 'ELITE' | 'LEGENDARY' | null | undefined)} />
          {/* XP bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
            background: 'rgba(0,0,0,0.6)' }}>
            <div style={{ height: '100%', width: `${xpPct}%`,
              background: 'linear-gradient(90deg,#92400e,#d97706,#fbbf24)',
              transition: 'width 0.8s ease' }} />
          </div>
        </div>
        {/* Level badge */}
        <span style={{ position: 'absolute', bottom: 2, right: -4,
          background: 'rgba(0,0,0,0.85)', border: `1px solid ${tierColor}55`,
          borderRadius: 4, padding: '1px 4px',
          color: tierColor, fontSize: 10, fontWeight: 800, lineHeight: 1,
          fontFamily: 'Inter, sans-serif' }}>
          {hero.level}
        </span>
        {elemSym && (
          <span style={{ position: 'absolute', top: 0, left: 0, fontSize: 12, lineHeight: 1,
            filter: `drop-shadow(0 0 3px ${elemColor})` }}>{elemSym}</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ color: '#e0e0f0', fontWeight: 700, fontSize: 13,
            fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{hero.name}</span>
          {hero.tier && (
            <span style={{ color: tierColor, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              background: `${tierColor}18`, padding: '2px 5px', borderRadius: 4 }}>{hero.tier}</span>
          )}
        </div>
        {/* XP text */}
        <div style={{ color: '#6060a0', fontSize: 10, marginBottom: 6 }}>
          XP: <span style={{ color: '#fbbf24' }}>{Math.round(hero.currentXp)}</span>
          <span style={{ color: '#40406060' }}> / {Math.round(hero.xpToNextLevel)}</span>
          <span style={{ color: '#50508880', marginLeft: 4 }}>({Math.round(xpPct)}%)</span>
        </div>
        {/* Win / Loss chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80',
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
            border: '1px solid rgba(74,222,128,0.2)' }}>
            {hero.clashesWon}W
          </span>
          <span style={{ background: 'rgba(233,69,96,0.12)', color: '#e94560',
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
            border: '1px solid rgba(233,69,96,0.2)' }}>
            {hero.clashesLost}L
          </span>
          {totalClashes > 0 && (
            <span style={{ color: '#6060a0', fontSize: 10, fontWeight: 600,
              padding: '2px 5px', alignSelf: 'center' }}>{heroWinRate}%</span>
          )}
          {hero.currentWinStreak > 1 && (
            <span style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
              border: '1px solid rgba(251,191,36,0.2)' }}>
              🔥{hero.currentWinStreak}
            </span>
          )}
        </div>
      </div>

      {/* Max dmg */}
      {hero.maxDamageDealt > 0 && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: '#70709090', fontSize: 9, letterSpacing: '0.08em',
            textTransform: 'uppercase' }}>Best Hit</div>
          <div style={{ color: '#e94560', fontWeight: 800, fontSize: 14,
            fontFamily: 'Inter, sans-serif' }}>{Math.round(hero.maxDamageDealt)}</div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { player } = usePlayer();
  const [data, setData]           = useState<DashboardResponse | null>(null);
  const [activePeriod, setActive] = useState<PeriodKey>('today');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!player) return;
    setLoading(true);
    setError(null);
    getDashboard(player.id)
      .then(setData)
      .catch((err) => {
        console.error('Dashboard error:', err);
        setError(err?.response?.data?.message ?? err?.message ?? 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, [player?.id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#505080' }}>
        Loading...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#e94560', fontSize: 14 }}>
        {error ?? 'No data available'}
      </div>
    );
  }

  const periodData: Record<PeriodKey, DashboardPeriodStats> = {
    today:   data.today,
    week:    data.week,
    month:   data.month,
    allTime: data.allTime,
  };

  const currentStats = periodData[activePeriod];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <style>{PAGE_CSS}</style>

      {/* Header */}
      <div style={{ marginBottom: 24, animation: 'hpFadeIn 0.3s ease both' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#e0e0f0',
          letterSpacing: '0.04em' }}>
          Dashboard
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#505080' }}>
          {player?.teamName ?? player?.username}'s overview
        </p>
      </div>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
        <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)',
          borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'hpFadeIn 0.3s ease both' }}>
          <Coins size={22} color="#fbbf24" />
          <div>
            <div style={{ color: '#7070a0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase' }}>Gold</div>
            <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: 20 }}>
              {(player?.gold ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.18)',
          borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'hpFadeIn 0.35s ease both' }}>
          <span style={{ fontSize: 20 }}>💎</span>
          <div>
            <div style={{ color: '#7070a0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase' }}>Diamonds</div>
            <div style={{ color: '#60a5fa', fontWeight: 900, fontSize: 20 }}>
              {(player?.diamonds ?? 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)',
          borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'hpFadeIn 0.4s ease both' }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <div>
            <div style={{ color: '#7070a0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase' }}>Arena Energy</div>
            <div style={{ color: '#4ade80', fontWeight: 900, fontSize: 20 }}>
              {Number(player?.arenaEnergy ?? 0).toFixed(1)}
              <span style={{ color: '#5050a0', fontSize: 13 }}>/{player?.arenaEnergyMax ?? 120}</span>
            </div>
          </div>
        </div>
        <div style={{ background: 'rgba(233,69,96,0.07)', border: '1px solid rgba(233,69,96,0.18)',
          borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
          animation: 'hpFadeIn 0.45s ease both' }}>
          <span style={{ fontSize: 20 }}>⚔️</span>
          <div>
            <div style={{ color: '#7070a0', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase' }}>All-time Battles</div>
            <div style={{ color: '#e94560', fontWeight: 900, fontSize: 20 }}>
              {data.allTime.battles.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* Left: Period stats */}
        <div>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: 20, animation: 'hpFadeIn 0.4s ease both' }}>
            {/* Period tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {PERIOD_KEYS.map((key, i) => {
                const active = key === activePeriod;
                return (
                  <button key={key} className="hp-period-tab"
                    onClick={() => setActive(key)}
                    style={{
                      padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                      transition: 'all 0.18s ease', border: 'none',
                      color: active ? '#fff' : '#6060a0',
                      background: active ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.05)',
                      boxShadow: active ? '0 0 12px rgba(233,69,96,0.2), inset 0 1px 0 rgba(255,255,255,0.07)' : 'none',
                      outline: active ? '1px solid rgba(233,69,96,0.4)' : '1px solid transparent',
                    }}>
                    {PERIOD_LABELS[i]}
                  </button>
                );
              })}
            </div>

            <PeriodPanel stats={currentStats} label={PERIOD_LABELS[PERIOD_KEYS.indexOf(activePeriod)]} />

            {/* Wins vs Losses bar */}
            {currentStats.battles > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  color: '#5050a0', fontSize: 10, marginBottom: 5, letterSpacing: '0.08em',
                  textTransform: 'uppercase', fontWeight: 700 }}>
                  <span style={{ color: '#4ade80' }}>{currentStats.wins} wins</span>
                  <span style={{ color: '#e94560' }}>{currentStats.losses} losses</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, overflow: 'hidden',
                  background: 'rgba(233,69,96,0.3)', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: `${currentStats.winRate}%`,
                    background: 'linear-gradient(90deg,#16a34a,#4ade80)',
                    boxShadow: '0 0 8px rgba(74,222,128,0.6)',
                    borderRadius: '4px 0 0 4px',
                    transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
                  }} />
                </div>
              </div>
            )}

            {currentStats.battles === 0 && (
              <div style={{ textAlign: 'center', color: '#404060', fontSize: 13,
                padding: '20px 0', fontStyle: 'italic' }}>
                No battles recorded for this period yet.
              </div>
            )}
          </div>
        </div>

        {/* Right: Heroes */}
        <div>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 800,
              color: '#6060a0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Your Heroes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.heroes.length === 0 && (
                <div style={{ color: '#404060', fontSize: 13, padding: '12px 0',
                  textAlign: 'center', fontStyle: 'italic' }}>No heroes yet.</div>
              )}
              {data.heroes
                .sort((a, b) => b.level - a.level || b.clashesWon - a.clashesWon)
                .map(hero => <HeroCard key={hero.id} hero={hero} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
