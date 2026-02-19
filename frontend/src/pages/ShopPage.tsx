import { useEffect, useState, useCallback } from 'react';
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
import ShopItemCard from '../components/Shop/ShopItemCard';
import HeroPortrait from '../components/Hero/HeroPortrait';
import { AxiosError } from 'axios';

type Tab = 'heroes' | 'items' | 'abilities';
type TierFilter = 'COMMONER' | 'ELITE' | 'LEGENDARY' | 'SUMMONS';

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
  const { player, fetchPlayer } = usePlayer();

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

  const refreshItems = useCallback(async () => {
    const data = await listItems();
    setItems(data.items);
    const owned = await getHeroes();
    setOwnedHeroes(owned);
  }, []);

  const refreshAbilities = useCallback(async (heroId: number) => {
    const data = await listAbilities(heroId);
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
    if (tab === 'items' || tab === 'abilities') {
      refreshItems().catch(() => setError('Failed to load data.'));
    }
  }, [tab, refreshItems]);

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
    if (!buyItemHeroId || !buyItemSlot) {
      setError('Select a hero and slot first.');
      return;
    }
    setError(''); setSuccessMsg('');
    try {
      const result = await buyItem({
        itemTemplateId: templateId,
        heroId: buyItemHeroId,
        slotNumber: buyItemSlot,
      });
      setSuccessMsg(result.message);
      await refreshItems();
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

  // Item buy flow state
  const [buyItemHeroId, setBuyItemHeroId] = useState<number | null>(null);
  const [buyItemSlot, setBuyItemSlot] = useState<number | null>(null);

  if (loading) return <div style={{ color: '#a0a0b0' }}>Loading shop...</div>;

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Shop</h2>
        <div style={styles.gold}>Gold: {player?.gold ?? 0}</div>
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

          {(['COMMONER', 'ELITE', 'LEGENDARY'] as const).map((tier) => {
            if (!visibleTiers.has(tier)) return null;
            const tierHeroes = heroes.filter((h) => h.tier === tier);
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
              <div key={summon.templateId} style={{ ...styles.summonCard, opacity: summon.owned ? 0.6 : 1 }}>
                <HeroPortrait imagePath={summon.imagePath} name={summon.name} size={80} />
                <div style={styles.summonInfo}>
                  <div style={styles.summonName}>{summon.name}</div>
                  <div style={styles.summonCost}>{summon.cost}g | Cap: {summon.capacity}</div>
                  <div style={styles.summonStat}>
                    MP: {summon.baseStats.magicPower} (+{summon.growthStats.magicPower}/lv)
                  </div>
                  <div style={styles.summonStat}>
                    Mana: {summon.baseStats.mana} (+{summon.growthStats.mana}/lv)
                  </div>
                  {summon.owned ? (
                    <div style={styles.ownedBadge}>Owned</div>
                  ) : (
                    <button
                      onClick={() => handleBuySummon(summon.templateId)}
                      disabled={(player?.gold ?? 0) < summon.cost}
                      style={{
                        ...styles.buyBtn,
                        opacity: (player?.gold ?? 0) >= summon.cost ? 1 : 0.5,
                      }}
                    >
                      Buy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </>}
        </>
      )}

      {tab === 'items' && (
        <>
          <h3 style={styles.subtitle}>Equip To</h3>
          <div style={styles.equipTarget}>
            <select
              value={buyItemHeroId ?? ''}
              onChange={(e) => setBuyItemHeroId(e.target.value ? Number(e.target.value) : null)}
              style={styles.select}
            >
              <option value="">Select hero...</option>
              {ownedHeroes.map((h) => (
                <option key={h.id} value={h.id}>{h.name} (Lv.{h.level})</option>
              ))}
            </select>
            <select
              value={buyItemSlot ?? ''}
              onChange={(e) => setBuyItemSlot(e.target.value ? Number(e.target.value) : null)}
              style={styles.select}
            >
              <option value="">Slot...</option>
              <option value="1">Slot 1</option>
              <option value="2">Slot 2</option>
              <option value="3">Slot 3</option>
            </select>
          </div>

          <h3 style={styles.subtitle}>Items</h3>
          <div style={styles.itemGrid}>
            {items.map((item) => (
              <ShopItemCard
                key={item.templateId}
                item={item}
                playerGold={player?.gold ?? 0}
                onBuy={() => handleBuyItem(item.templateId)}
                disabled={!buyItemHeroId || !buyItemSlot}
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
            onChange={(e) => setSelectedHeroId(e.target.value ? Number(e.target.value) : null)}
            style={styles.select}
          >
            <option value="">Select hero...</option>
            {ownedHeroes.length === 0 && heroes.length > 0 && (
              <option disabled>Loading heroes...</option>
            )}
            {ownedHeroes.map((h) => (
              <option key={h.id} value={h.id}>{h.name} (Lv.{h.level})</option>
            ))}
          </select>

          {selectedHeroId && heroAbilities.length > 0 && (
            <>
              <h3 style={styles.subtitle}>{heroAbilityName} — Abilities</h3>
              <div style={styles.abilityList}>
                {heroAbilities.map((ab) => {
                  const bonusEntries = Object.entries(ab.bonuses).filter(([, v]) => v !== 0);
                  return (
                    <div key={ab.templateId} style={styles.abilityRow}>
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
  gold: {
    color: '#fbbf24',
    fontWeight: 600,
    fontSize: 18,
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
    marginBottom: 4,
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
  summonCard: {
    display: 'flex',
    gap: 16,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    border: '1px solid #16213e',
  },
  summonInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  summonName: {
    color: '#e0e0e0',
    fontWeight: 700,
    fontSize: 16,
  },
  summonCost: {
    color: '#fbbf24',
    fontSize: 13,
  },
  summonStat: {
    color: '#a0a0b0',
    fontSize: 12,
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
  equipTarget: {
    display: 'flex',
    gap: 12,
    marginBottom: 8,
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
