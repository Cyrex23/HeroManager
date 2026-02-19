import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeam, equipHero, unequipHero, equipSummon, unequipSummon } from '../api/teamApi';
import { getHeroes, getSummons } from '../api/playerApi';
import { usePlayer } from '../context/PlayerContext';
import type { TeamResponse, HeroResponse, SummonResponse, ErrorResponse } from '../types';
import TeamSlotComponent from '../components/Team/TeamSlot';
import CapacityBar from '../components/Team/CapacityBar';
import HeroCard from '../components/Hero/HeroCard';
import HeroPortrait from '../components/Hero/HeroPortrait';
import { AxiosError } from 'axios';

export default function TeamPage() {
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [heroes, setHeroes] = useState<HeroResponse[]>([]);
  const [summons, setSummons] = useState<SummonResponse[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { fetchPlayer } = usePlayer();
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const [teamData, heroData, summonData] = await Promise.all([
        getTeam(),
        getHeroes(),
        getSummons(),
      ]);
      setTeam(teamData);
      setHeroes(heroData);
      setSummons(summonData);
      setError('');
    } catch (err) {
      console.error('Failed to load team data:', err);
      setError('Failed to load team data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleEquipHero(heroId: number, slotNumber: number) {
    try {
      await equipHero({ heroId, slotNumber });
      await refresh();
      await fetchPlayer();
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to equip hero.');
    }
  }

  async function handleUnequipHero(slotNumber: number) {
    try {
      await unequipHero({ slotNumber });
      await refresh();
      await fetchPlayer();
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to unequip hero.');
    }
  }

  async function handleEquipSummon(summonId: number) {
    try {
      await equipSummon({ summonId });
      await refresh();
      await fetchPlayer();
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to equip summon.');
    }
  }

  async function handleUnequipSummon() {
    try {
      await unequipSummon();
      await refresh();
      await fetchPlayer();
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to unequip summon.');
    }
  }

  if (loading) return <div style={{ color: '#a0a0b0' }}>Loading team...</div>;

  // Bench heroes (not equipped)
  const benchHeroes = heroes.filter((h) => !h.isEquipped);
  const benchSummons = summons.filter((s) => !s.isEquipped);

  // Find first empty slot
  const firstEmptySlot = team?.slots
    .filter((s) => s.type === 'hero' && s.hero === null)
    .map((s) => s.slotNumber)[0];

  return (
    <div>
      <h2 style={styles.title}>Team Lineup</h2>

      {error && <div style={styles.error}>{error}</div>}

      {team && (
        <>
          <div style={styles.topRow}>
            <CapacityBar used={team.capacity.used} max={team.capacity.max} />
            <div style={styles.power}>Team Power: {team.teamPower.toFixed(0)}</div>
          </div>

          <div style={styles.slotsGrid}>
            {team.slots.map((slot) => (
              <TeamSlotComponent
                key={slot.slotNumber}
                slot={slot}
                onUnequip={
                  slot.type === 'hero' && slot.hero
                    ? () => handleUnequipHero(slot.slotNumber)
                    : slot.type === 'summon' && slot.summon
                      ? () => handleUnequipSummon()
                      : undefined
                }
                onHeroClick={(id) => navigate(`/hero/${id}`)}
              />
            ))}
          </div>
        </>
      )}

      <h3 style={styles.subtitle}>Bench Heroes</h3>
      {benchHeroes.length === 0 ? (
        <p style={styles.muted}>No heroes on bench. Buy heroes from the Shop!</p>
      ) : (
        <div style={styles.benchGrid}>
          {benchHeroes.map((hero) => (
            <div key={hero.id} style={styles.benchItem}>
              <HeroCard
                hero={hero}
                onClick={() => navigate(`/hero/${hero.id}`)}
              />
              {firstEmptySlot && (
                <button
                  onClick={() => handleEquipHero(hero.id, firstEmptySlot)}
                  style={styles.equipBtn}
                >
                  Equip to Slot {firstEmptySlot}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {benchSummons.length > 0 && (
        <>
          <h3 style={styles.subtitle}>Bench Summons</h3>
          <div style={styles.benchGrid}>
            {benchSummons.map((summon) => {
              const xpPct = summon.xpToNextLevel > 0
                ? Math.min((summon.currentXp / summon.xpToNextLevel) * 100, 100) : 0;
              return (
              <div key={summon.id} style={styles.benchItem}>
                <div style={styles.summonCard}>
                  <HeroPortrait imagePath={summon.imagePath} name={summon.name} size={72} />
                  <div style={styles.summonName}>{summon.name}</div>
                  <div style={styles.muted}>Lv.{summon.level} | Cap: {summon.capacity}</div>
                  <div style={{ color: '#4ade80', fontSize: 12 }}>{summon.teamBonus}</div>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ color: '#a0a0b0', fontSize: 11, marginBottom: 2 }}>
                      XP: {summon.currentXp} / {summon.xpToNextLevel}
                    </div>
                    <div style={styles.xpBarBg}>
                      <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleEquipSummon(summon.id)}
                  style={styles.equipBtn}
                >
                  Equip Summon
                </button>
              </div>
            );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    color: '#e0e0e0',
    marginBottom: 16,
    fontSize: 22,
  },
  subtitle: {
    color: '#e0e0e0',
    marginTop: 32,
    marginBottom: 12,
    fontSize: 16,
  },
  error: {
    color: '#e94560',
    fontSize: 13,
    padding: '8px 12px',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderRadius: 4,
    marginBottom: 16,
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 24,
    marginBottom: 20,
  },
  power: {
    color: '#e94560',
    fontWeight: 600,
    fontSize: 16,
    whiteSpace: 'nowrap',
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
  },
  benchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12,
  },
  benchItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  equipBtn: {
    padding: '6px 12px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
  },
  muted: {
    color: '#666',
    fontSize: 13,
  },
  summonCard: {
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    border: '1px solid #16213e',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  summonName: {
    color: '#e0e0e0',
    fontWeight: 600,
    fontSize: 14,
  },
  xpBarBg: {
    height: 5,
    backgroundColor: '#0f0f23',
    borderRadius: 3,
    overflow: 'hidden',
    maxWidth: 160,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 3,
  },
};
