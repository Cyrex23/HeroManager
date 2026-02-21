import { useEffect, useRef, useState } from 'react';
import { getAccountData, setProfileImage, changeTeamName, changePassword } from '../api/accountApi';
import { getHeroes } from '../api/playerApi';
import { usePlayer } from '../context/PlayerContext';
import type { AccountData, AvatarOption } from '../types';
import HeroPortrait from '../components/Hero/HeroPortrait';
import LevelUpPopup, { type LevelUpEvent } from '../components/Hero/LevelUpPopup';
import { AxiosError } from 'axios';

interface ErrorResponse { message: string; }

export default function AccountPage() {
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const { fetchPlayer } = usePlayer();

  // Level-up detection
  const heroLevelsRef = useRef<Record<number, number>>({});
  const [levelUpQueue, setLevelUpQueue] = useState<LevelUpEvent[]>([]);

  // Team name form
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamNameMsg, setTeamNameMsg] = useState('');
  const [teamNameErr, setTeamNameErr] = useState('');

  // Password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  async function load() {
    try {
      const d = await getAccountData();
      setData(d);
      setTeamNameInput(d.teamName);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Poll for hero level-ups every 15 s while on this page
  useEffect(() => {
    let mounted = true;

    async function checkLevels(isInitial: boolean) {
      try {
        const heroes = await getHeroes();
        if (!mounted) return;
        const newLevels: Record<number, number> = {};
        heroes.forEach(h => { newLevels[h.id] = h.level; });

        if (!isInitial) {
          const prev = heroLevelsRef.current;
          const events: LevelUpEvent[] = heroes
            .filter(h => prev[h.id] !== undefined && h.level > prev[h.id])
            .map(h => ({
              heroId:      h.id,
              heroName:    h.name,
              imagePath:   h.imagePath,
              oldLevel:    prev[h.id],
              newLevel:    h.level,
              baseStats:   h.baseStats,
              growthStats: h.growthStats,
              tier:        h.tier,
            }));
          if (events.length > 0) setLevelUpQueue(q => [...q, ...events]);
        }

        heroLevelsRef.current = newLevels;
      } catch { /* non-fatal */ }
    }

    checkLevels(true);
    const interval = setInterval(() => checkLevels(false), 15_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  async function handleSelectAvatar(av: AvatarOption) {
    try {
      await setProfileImage(av.imagePath);
      await load();
      await fetchPlayer();
    } catch { /* non-fatal */ }
  }

  async function handleTeamName(e: React.FormEvent) {
    e.preventDefault();
    setTeamNameMsg(''); setTeamNameErr('');
    try {
      await changeTeamName(teamNameInput);
      setTeamNameMsg('Team name updated successfully.');
      await load();
      await fetchPlayer();
    } catch (err) {
      setTeamNameErr((err as AxiosError<ErrorResponse>).response?.data?.message || 'Failed to update.');
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(''); setPwErr('');
    if (newPw !== confirmPw) { setPwErr('New passwords do not match.'); return; }
    try {
      await changePassword(currentPw, newPw);
      setPwMsg('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwErr((err as AxiosError<ErrorResponse>).response?.data?.message || 'Failed to change password.');
    }
  }

  if (loading || !data) return <div style={{ color: '#a0a0b0' }}>Loading account...</div>;

  const memberDate = new Date(data.memberSince).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const winRate = data.totalBattles > 0
    ? Math.round((data.wins / data.totalBattles) * 100) : 0;

  return (
    <div style={styles.page}>
      {levelUpQueue.length > 0 && (
        <LevelUpPopup
          event={levelUpQueue[0]}
          onClose={() => setLevelUpQueue(q => q.slice(1))}
        />
      )}
      {/* ── Profile header ── */}
      <div style={styles.profileCard}>
        <div style={styles.avatarBlock}>
          {data.profileImagePath ? (
            <HeroPortrait imagePath={data.profileImagePath} name={data.username} size={96} />
          ) : (
            <div style={styles.noAvatar}>{data.username.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div style={styles.profileInfo}>
          <div style={styles.username}>{data.username}</div>
          <div style={styles.memberSince}>Member since {memberDate}</div>
        </div>
        <div style={styles.statsBlock}>
          <div style={styles.statItem}>
            <span style={styles.statVal}>{data.totalBattles}</span>
            <span style={styles.statLabel}>Battles</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statVal, color: '#4ade80' }}>{data.wins}</span>
            <span style={styles.statLabel}>Wins</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statVal, color: '#e94560' }}>{data.losses}</span>
            <span style={styles.statLabel}>Losses</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statVal, color: '#fbbf24' }}>{winRate}%</span>
            <span style={styles.statLabel}>Win Rate</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statVal, color: '#4ade80' }}>{data.winStreak}</span>
            <span style={styles.statLabel}>Win Streak</span>
          </div>
          <div style={styles.statItem}>
            <span style={{ ...styles.statVal, color: '#e94560' }}>{data.lossStreak}</span>
            <span style={styles.statLabel}>Loss Streak</span>
          </div>
        </div>
      </div>

      {/* ── Avatar selection ── */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Profile Picture</div>
        <div style={styles.sectionSub}>Select from heroes you have owned</div>
        {data.avatarOptions.length === 0 ? (
          <p style={styles.muted}>No heroes unlocked yet. Buy heroes from the Shop!</p>
        ) : (
          <div style={styles.avatarGrid}>
            {data.avatarOptions.map((av) => {
              const isSelected = av.imagePath === data.profileImagePath;
              return (
                <div
                  key={av.imagePath}
                  onClick={() => handleSelectAvatar(av)}
                  style={{
                    ...styles.avatarOption,
                    border: isSelected ? '2px solid #e94560' : '2px solid transparent',
                    backgroundColor: isSelected ? 'rgba(233,69,96,0.1)' : '#1a1a2e',
                  }}
                  title={av.heroName}
                >
                  <HeroPortrait imagePath={av.imagePath} name={av.heroName} size={56} />
                  <div style={styles.avatarName}>{av.heroName}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Team name ── */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Team Name</div>
        {!data.canChangeTeamName && (
          <div style={styles.cooldownNote}>
            Available to change in {data.daysUntilTeamNameChange} day{data.daysUntilTeamNameChange !== 1 ? 's' : ''}
          </div>
        )}
        <form onSubmit={handleTeamName} style={styles.form}>
          <input
            value={teamNameInput}
            onChange={(e) => setTeamNameInput(e.target.value)}
            placeholder="Team name (3–30 chars)"
            maxLength={30}
            disabled={!data.canChangeTeamName}
            style={{ ...styles.input, opacity: data.canChangeTeamName ? 1 : 0.5 }}
          />
          <button
            type="submit"
            disabled={!data.canChangeTeamName}
            style={{ ...styles.btn, opacity: data.canChangeTeamName ? 1 : 0.5 }}
          >
            Save
          </button>
        </form>
        {teamNameMsg && <div style={styles.success}>{teamNameMsg}</div>}
        {teamNameErr && <div style={styles.error}>{teamNameErr}</div>}
      </section>

      {/* ── Change password ── */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Change Password</div>
        <form onSubmit={handlePassword} style={styles.form}>
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Current password"
            style={styles.input}
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New password (min 6 chars)"
            style={styles.input}
          />
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Confirm new password"
            style={styles.input}
          />
          <button type="submit" style={styles.btn}>Change Password</button>
        </form>
        {pwMsg && <div style={styles.success}>{pwMsg}</div>}
        {pwErr && <div style={styles.error}>{pwErr}</div>}
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: '20px 24px',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    border: '1px solid #16213e',
    flexWrap: 'wrap' as const,
  },
  avatarBlock: { flexShrink: 0 },
  noAvatar: {
    width: 96, height: 96, borderRadius: '50%',
    backgroundColor: '#16213e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 36, fontWeight: 700, color: '#e0e0e0',
  },
  profileInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  username: { color: '#e0e0e0', fontSize: 22, fontWeight: 700 },
  teamNameDisplay: { color: '#a78bfa', fontSize: 14, fontWeight: 500 },
  memberSince: { color: '#666', fontSize: 12 },
  statsBlock: { display: 'flex', gap: 20, flexWrap: 'wrap' as const },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statVal: { color: '#e0e0e0', fontSize: 20, fontWeight: 700 },
  statLabel: { color: '#666', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  section: {
    padding: '20px 24px',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    border: '1px solid #16213e',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  sectionTitle: { color: '#e0e0e0', fontSize: 15, fontWeight: 700 },
  sectionSub: { color: '#666', fontSize: 12 },
  cooldownNote: {
    color: '#fbbf24', fontSize: 12,
    padding: '6px 10px',
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius: 4,
    border: '1px solid rgba(251,191,36,0.2)',
  },
  avatarGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  avatarOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: 8,
    cursor: 'pointer',
  },
  avatarName: { color: '#a0a0b0', fontSize: 9, textAlign: 'center' as const, maxWidth: 56 },
  form: { display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 },
  input: {
    padding: '8px 12px',
    backgroundColor: '#0f0f23',
    color: '#e0e0e0',
    border: '1px solid #333',
    borderRadius: 4,
    fontSize: 13,
  },
  btn: {
    alignSelf: 'flex-start',
    padding: '8px 20px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  success: { color: '#4ade80', fontSize: 13 },
  error: { color: '#e94560', fontSize: 13 },
  muted: { color: '#666', fontSize: 13 },
};
