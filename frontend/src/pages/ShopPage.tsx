import { useEffect, useState, useCallback, useRef } from 'react';
import {
  listHeroes, buyHero, buySummon,
  listItems, buyItem,
  listAbilities, buyAbility,
} from '../api/shopApi';
import { getHeroes } from '../api/playerApi';
import { usePlayer } from '../context/PlayerContext';
import type {
  ShopHeroResponse, ShopSummonResponse,
  ShopItemResponse, ShopAbilityResponse,
  HeroResponse, ErrorResponse,
} from '../types';
import ShopHeroCard from '../components/Shop/ShopHeroCard';
import ShopSummonCard from '../components/Shop/ShopSummonCard';
import ShopItemCard from '../components/Shop/ShopItemCard';
import EquipmentTooltip from '../components/Equipment/EquipmentTooltip';
import { AxiosError } from 'axios';
import { Coins } from 'lucide-react';

type Tab = 'heroes' | 'items' | 'abilities';
type TierFilter = 'COMMONER' | 'ELITE' | 'LEGENDARY' | 'SUMMONS';
type StatFilter = 'PA' | 'MP' | 'DEX';

const STAT_FILTER_CONFIG: { key: StatFilter; label: string; color: string }[] = [
  { key: 'PA',  label: '⚔ PA',  color: '#f97316' },
  { key: 'MP',  label: '✦ MP',  color: '#60a5fa' },
  { key: 'DEX', label: '◈ DEX', color: '#4ade80' },
];

function growthValue(h: ShopHeroResponse, stat: StatFilter): number {
  if (stat === 'PA')  return h.growthStats.physicalAttack;
  if (stat === 'MP')  return h.growthStats.magicPower;
  return h.growthStats.dexterity;
}

const TIER_COLOR: Record<string, string> = {
  COMMONER: '#6b7280', ELITE: '#a78bfa', LEGENDARY: '#f97316', SUMMONS: '#a78bfa',
};

const ALL_FILTERS: TierFilter[] = ['COMMONER', 'ELITE', 'LEGENDARY', 'SUMMONS'];

export default function ShopPage() {
  const [tab, setTab] = useState<Tab>('heroes');
  const [heroes, setHeroes] = useState<ShopHeroResponse[]>([]);
  const [shopSummons, setShopSummons] = useState<ShopSummonResponse[]>([]);
  const [items, setItems] = useState<ShopItemResponse[]>([]);
  const [ownedHeroes, setOwnedHeroes] = useState<HeroResponse[]>([]);
  const [selectedHeroId, setSelectedHeroId] = useState<number | null>(null);
  const [heroAbilities, setHeroAbilities] = useState<ShopAbilityResponse[]>([]);
  const [heroAbilityName, setHeroAbilityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [visibleTiers, setVisibleTiers] = useState<Set<TierFilter>>(new Set(ALL_FILTERS));
  const [statFilter, setStatFilter] = useState<StatFilter | null>(null);
  const { player, fetchPlayer } = usePlayer();
  const abilityReqId = useRef(0);

  function toggleTier(tier: TierFilter) {
    setVisibleTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) { next.delete(tier); } else { next.add(tier); }
      return next;
    });
  }

  const refreshHeroes = useCallback(async () => {
    const data = await listHeroes();
    setHeroes(data.heroes);
    setShopSummons(data.summons);
  }, []);

  const refreshAbilities = useCallback(async (heroId: number) => {
    const reqId = ++abilityReqId.current;
    const data = await listAbilities(heroId);
    if (reqId !== abilityReqId.current) return; // stale — newer request in flight, discard
    setHeroAbilities(data.abilities);
    setHeroAbilityName(data.heroName);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await refreshHeroes();
      } catch {
        setError('Failed to load shop.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [refreshHeroes]);

  useEffect(() => {
    if (tab === 'items') {
      listItems().then((d) => setItems(d.items)).catch(() => setError('Failed to load items.'));
    }
    if (tab === 'abilities' || tab === 'items') {
      getHeroes().then(setOwnedHeroes).catch(() => {});
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'abilities' && selectedHeroId) {
      refreshAbilities(selectedHeroId).catch(() => setError('Failed to load abilities.'));
    }
  }, [tab, selectedHeroId, refreshAbilities]);

  async function handleBuyHero(templateId: number) {
    setError(''); setSuccessMsg('');
    try {
      const result = await buyHero({ templateId });
      setSuccessMsg(result.message);
      await refreshHeroes();
      await fetchPlayer();
    } catch (err) {
      setError((err as AxiosError<ErrorResponse>).response?.data?.message || 'Purchase failed.');
    }
  }

  async function handleBuySummon(templateId: number) {
    setError(''); setSuccessMsg('');
    try {
      const result = await buySummon({ templateId });
      setSuccessMsg(result.message);
      await refreshHeroes();
      await fetchPlayer();
    } catch (err) {
      setError((err as AxiosError<ErrorResponse>).response?.data?.message || 'Purchase failed.');
    }
  }

  async function handleBuyItem(templateId: number) {
    setError(''); setSuccessMsg('');
    try {
      const result = await buyItem({ itemTemplateId: templateId });
      setSuccessMsg(result.message);
      await fetchPlayer();
    } catch (err) {
      setError((err as AxiosError<ErrorResponse>).response?.data?.message || 'Purchase failed.');
    }
  }

  async function handleBuyAbility(abilityTemplateId: number) {
    if (!selectedHeroId) return;
    setError(''); setSuccessMsg('');
    try {
      const result = await buyAbility({ abilityTemplateId, heroId: selectedHeroId });
      setSuccessMsg(result.message);
      await refreshAbilities(selectedHeroId);
      await fetchPlayer();
    } catch (err) {
      setError((err as AxiosError<ErrorResponse>).response?.data?.message || 'Purchase failed.');
    }
  }

  if (loading) return <div style={{ color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: 10 }}><span className="spinner" style={{ width: 18, height: 18 }} />Loading shop...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title} className="gradient-title">Shop</h2>
        <div style={styles.goldBadge}>
          <span style={styles.goldIcon}><Coins size={22} /></span>
          <div style={styles.goldInfo}>
            <span style={styles.goldLabel}>Gold</span>
            <span className="gold-text gold-text-animated" style={styles.goldValue}>
              {(player?.gold ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        {(['heroes', 'items', 'abilities'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              ...styles.tab,
              borderBottomColor: tab === t ? '#e94560' : 'transparent',
              color: tab === t ? '#e0e0e0' : '#666',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {successMsg && <div style={styles.success}>{successMsg}</div>}

      {tab === 'heroes' && (
        <>
          <div style={styles.filterRow}>
            {ALL_FILTERS.map((tier) => {
              const active = visibleTiers.has(tier);
              const color = TIER_COLOR[tier];
              return (
                <button
                  key={tier}
                  onClick={() => toggleTier(tier)}
                  style={{
                    ...styles.filterBtn,
                    borderColor: color,
                    color: active ? '#0f0f23' : color,
                    backgroundColor: active ? color : 'transparent',
                  }}
                >
                  {tier.charAt(0) + tier.slice(1).toLowerCase()}s
                </button>
              );
            })}
          </div>

          <div style={styles.statFilterRow}>
            <span style={styles.statFilterLabel}>Scaling:</span>
            {STAT_FILTER_CONFIG.map(({ key, label, color }) => {
              const active = statFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setStatFilter(active ? null : key)}
                  style={{
                    ...styles.statFilterBtn,
                    borderColor: color,
                    color: active ? '#0f0f23' : color,
                    backgroundColor: active ? color : 'rgba(0,0,0,0)',
                    boxShadow: active ? `0 0 8px ${color}55` : 'none',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {(['COMMONER', 'ELITE', 'LEGENDARY'] as const).map((tier) => {
            if (!visibleTiers.has(tier)) return null;
            const tierHeroes = heroes
              .filter((h) => h.tier === tier)
              .sort((a, b) => statFilter ? growthValue(b, statFilter) - growthValue(a, statFilter) : 0);
            if (tierHeroes.length === 0) return null;
            return (
              <div key={tier}>
                <div style={{ ...styles.tierHeader, borderLeftColor: TIER_COLOR[tier] }}>
                  <span style={{ color: TIER_COLOR[tier] }}>{tier.charAt(0) + tier.slice(1).toLowerCase()}s</span>
                </div>
                <div style={styles.grid}>
                  {tierHeroes.map((hero) => (
                    <ShopHeroCard
                      key={hero.templateId}
                      hero={hero}
                      playerGold={player?.gold ?? 0}
                      onBuy={() => handleBuyHero(hero.templateId)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {visibleTiers.has('SUMMONS') && <>
          <div style={{ ...styles.tierHeader, borderLeftColor: '#a78bfa', marginTop: 8 }}>
            <span style={{ color: '#a78bfa' }}>Summons</span>
          </div>
          <div style={styles.grid}>
            {shopSummons.map((summon) => (
              <ShopSummonCard
                key={summon.templateId}
                summon={summon}
                playerGold={player?.gold ?? 0}
                onBuy={() => handleBuySummon(summon.templateId)}
              />
            ))}
          </div>
          </>}
        </>
      )}

      {tab === 'items' && (
        <>
          <p style={styles.inventoryHint}>
            Items go to your team inventory — equip them to heroes from the <strong>Team</strong> page.
          </p>
          <div style={styles.itemGrid}>
            {items.map((item) => (
              <ShopItemCard
                key={item.templateId}
                item={item}
                playerGold={player?.gold ?? 0}
                onBuy={() => handleBuyItem(item.templateId)}
              />
            ))}
          </div>
        </>
      )}

      {tab === 'abilities' && (
        <>
          <h3 style={styles.subtitle}>Select Hero</h3>
          <select
            value={selectedHeroId ?? ''}
            onChange={(e) => {
              setSelectedHeroId(e.target.value ? Number(e.target.value) : null);
              setHeroAbilities([]);
              setHeroAbilityName('');
            }}
            style={styles.select}
          >
            <option value="">Select hero...</option>
            {ownedHeroes.map((h) => (
              <option key={h.id} value={h.id}>{h.name} (Lv.{h.level})</option>
            ))}
          </select>

          {selectedHeroId && heroAbilities.length > 0 && (
            <>
              <h3 style={styles.subtitle}>{heroAbilityName} — Abilities</h3>
              <p style={styles.inventoryHint}>
                Abilities go to this hero's inventory — slot them from the <strong>Team</strong> page.
              </p>
              <div style={styles.abilityList}>
                {heroAbilities.map((ab) => {
                  const bonusEntries = Object.entries(ab.bonuses).filter(([, v]) => v !== 0);
                  return (
                    <EquipmentTooltip
                      key={ab.templateId}
                      name={ab.name}
                      type="ability"
                      bonuses={ab.bonuses}
                      tier={ab.tier}
                      spell={ab.spell ?? null}
                    >
                      <div style={styles.abilityRow}>
                        <div style={styles.abilityInfo}>
                          <span style={styles.abilityName}>{ab.name}</span>
                          <span style={styles.abilityTier}>Tier {ab.tier}</span>
                          <span style={styles.abilityCost}>{ab.cost}g</span>
                        </div>
                        <div style={styles.abilityBonuses}>
                          {bonusEntries.map(([stat, val]) => (
                            <span key={stat} style={styles.abilityBonus}>+{val} {formatStat(stat)}</span>
                          ))}
                        </div>
                        {ab.owned ? (
                          <span style={styles.ownedTag}>Owned</span>
                        ) : (
                          <button
                            onClick={() => handleBuyAbility(ab.templateId)}
                            disabled={(player?.gold ?? 0) < ab.cost}
                            style={{
                              ...styles.smallBuyBtn,
                              opacity: (player?.gold ?? 0) >= ab.cost ? 1 : 0.5,
                            }}
                          >
                            Buy
                          </button>
                        )}
                      </div>
                    </EquipmentTooltip>
                  );
                })}
              </div>
            </>
          )}

          {selectedHeroId && heroAbilities.length === 0 && (
            <p style={styles.muted}>No abilities available for this hero.</p>
          )}
        </>
      )}
    </div>
  );
}

function formatStat(key: string): string {
  const map: Record<string, string> = {
    physicalAttack: 'PA', magicPower: 'MP', dexterity: 'Dex',
    element: 'Elem', mana: 'Mana', stamina: 'Stam',
  };
  return map[key] || key;
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#e0e0e0',
    fontSize: 22,
    margin: 0,
  },
  goldBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 14px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(251,191,36,0.04) 100%)',
    border: '1px solid rgba(251,191,36,0.25)',
    overflow: 'hidden' as const,
  },
  goldIcon: {
    color: '#fbbf24',
    filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.7))',
    flexShrink: 0,
    display: 'flex',
  },
  goldInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
  },
  goldLabel: {
    color: '#9090c0',
    fontSize: 9,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    fontWeight: 700,
  },
  goldValue: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1,
  },
  tabs: {
    display: 'flex',
    gap: 0,
    marginBottom: 16,
    borderBottom: '1px solid #16213e',
  },
  tab: {
    padding: '8px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  subtitle: {
    color: '#e0e0e0',
    marginTop: 20,
    marginBottom: 12,
    fontSize: 16,
  },
  tierHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 12,
    paddingLeft: 10,
    borderLeft: '3px solid',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap' as const,
  },
  filterBtn: {
    padding: '5px 16px',
    border: '1px solid',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    transition: 'all 0.15s',
  },
  statFilterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statFilterLabel: {
    color: '#4a4a6a',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginRight: 2,
  },
  statFilterBtn: {
    padding: '3px 12px',
    border: '1px solid',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
    transition: 'all 0.15s',
    fontFamily: 'Inter, sans-serif',
  },
  error: {
    color: '#e94560',
    fontSize: 13,
    padding: '8px 12px',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderRadius: 4,
    marginBottom: 12,
  },
  success: {
    color: '#4ade80',
    fontSize: 13,
    padding: '8px 12px',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 4,
    marginBottom: 12,
  },
  inventoryHint: {
    color: '#a0a0b0',
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 12,
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  buyBtn: {
    padding: '8px 16px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 'auto',
  },
  smallBuyBtn: {
    padding: '4px 12px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  ownedBadge: {
    padding: '8px 16px',
    backgroundColor: '#16213e',
    color: '#4ade80',
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'center',
    marginTop: 'auto',
  },
  ownedTag: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: 600,
  },
  select: {
    padding: '6px 12px',
    backgroundColor: '#16213e',
    color: '#e0e0e0',
    border: '1px solid #333',
    borderRadius: 4,
    fontSize: 13,
  },
  abilityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  abilityRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    border: '1px solid #16213e',
    gap: 12,
  },
  abilityInfo: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  abilityName: {
    color: '#e0e0e0',
    fontWeight: 600,
    fontSize: 13,
  },
  abilityTier: {
    color: '#60a5fa',
    fontSize: 11,
    padding: '1px 6px',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 8,
  },
  abilityCost: {
    color: '#fbbf24',
    fontSize: 12,
  },
  abilityBonuses: {
    display: 'flex',
    gap: 6,
    flex: 1,
  },
  abilityBonus: {
    color: '#4ade80',
    fontSize: 11,
  },
  muted: {
    color: '#666',
    fontSize: 13,
  },
};
