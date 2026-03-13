import { useEffect, useState, useCallback, useRef } from 'react';
import {
  listHeroes, buyHero, buySummon,
  listItems, buyItem,
  listAbilities, buyAbility,
} from '../api/shopApi';
import {
  buyExtraLineupGold, buyExtraLineupDiamonds,
  buyEnergyPlus, buyHeroPlusCapacity, buyCapacityPlus, buyStatReset, buyExtraCraftingSlot, buyDoubleSpin, buyBattleLog, buyReturnCap, buyChallengeLimitUpgrade, buyEnergyGainUpgrade,
} from '../api/upgradeApi';
import { getHeroes } from '../api/playerApi';
import { usePlayer } from '../context/PlayerContext';
import type {
  ShopHeroResponse, ShopSummonResponse,
  ShopItemResponse, ShopAbilityResponse,
  HeroResponse, ErrorResponse,
} from '../types';
import ShopHeroCard from '../components/Shop/ShopHeroCard';
import ShopSummonCard from '../components/Shop/ShopSummonCard';
import ShopItemCard, { getItemTier } from '../components/Shop/ShopItemCard';
import ShopAbilityCard from '../components/Shop/ShopAbilityCard';
import UpgradeCard from '../components/Shop/UpgradeCard';
import HeroPortrait from '../components/Hero/HeroPortrait';
import { AxiosError } from 'axios';
import { Coins } from 'lucide-react';

type Tab = 'heroes' | 'items' | 'abilities' | 'upgrades';
type TierFilter = 'COMMONER' | 'ELITE' | 'LEGENDARY' | 'SUMMONS';
type StatFilter = 'PA' | 'MP' | 'DEX';

const STAT_FILTER_CONFIG: { key: StatFilter; label: string; color: string }[] = [
  { key: 'PA',  label: '✊ PA',  color: '#f97316' },
  { key: 'MP',  label: '✦ MP',  color: '#60a5fa' },
  { key: 'DEX', label: '🗡 DEX', color: '#4ade80' },
];

function growthValue(h: ShopHeroResponse, stat: StatFilter): number {
  if (stat === 'PA')  return h.growthStats.physicalAttack;
  if (stat === 'MP')  return h.growthStats.magicPower;
  return h.growthStats.dexterity;
}

const TIER_COLOR: Record<string, string> = {
  COMMONER: '#94a3b8', ELITE: '#a78bfa', LEGENDARY: '#f97316', SUMMONS: '#22d3ee',
};

const TIER_ICON: Record<string, string> = {
  COMMONER: '👤', ELITE: '🔱', LEGENDARY: '✨', SUMMONS: '🐉',
};

const TIER_LABEL: Record<string, string> = {
  COMMONER: 'Commoners', ELITE: 'Elites', LEGENDARY: 'Legendarys', SUMMONS: 'Summons',
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
  const [pendingBuy, setPendingBuy] = useState<{
    label: string; cost: number; currency: 'gold' | 'diamonds';
    action: () => Promise<void>;
  } | null>(null);
  const { player, fetchPlayer } = usePlayer();
  const abilityReqId = useRef(0);

  function requestConfirm(label: string, cost: number, currency: 'gold' | 'diamonds', action: () => Promise<void>) {
    setPendingBuy({ label, cost, currency, action });
  }

  async function confirmBuy() {
    if (!pendingBuy) return;
    const action = pendingBuy.action;
    setPendingBuy(null);
    await action();
  }

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

  async function handleUpgrade(fn: () => Promise<{ message: string }>) {
    setError(''); setSuccessMsg('');
    try {
      const result = await fn();
      setSuccessMsg(result.message);
      await fetchPlayer();
    } catch (err) {
      setError((err as AxiosError<ErrorResponse>).response?.data?.message || 'Purchase failed.');
    }
  }

  if (loading) return <div style={{ color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: 10 }}><span className="spinner" style={{ width: 18, height: 18 }} />Loading shop...</div>;

  return (
    <div>
      {/* ── Confirmation Modal ──────────────────────────────────────── */}
      {pendingBuy && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setPendingBuy(null)}>
          <div style={{
            background: 'linear-gradient(160deg, #1a1a2e, #12121e)',
            border: '1px solid rgba(233,69,96,0.3)',
            borderTop: '2px solid #e94560',
            borderRadius: 10,
            padding: '28px 32px',
            minWidth: 300, maxWidth: 400,
            boxShadow: '0 0 40px rgba(233,69,96,0.15), 0 20px 60px rgba(0,0,0,0.6)',
            textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 13, color: '#a0a0b0', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
              Confirm Purchase
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#e0e0e0', marginBottom: 6 }}>
              {pendingBuy.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
              <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: 18 }}>{pendingBuy.cost.toLocaleString()}</span>
              {pendingBuy.currency === 'gold'
                ? <Coins size={16} style={{ color: '#fbbf24' }} />
                : <span style={{ fontSize: 14 }}>💎</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setPendingBuy(null)} style={{
                padding: '8px 22px', borderRadius: 6, border: '1px solid #3a3a5a',
                background: 'transparent', color: '#6a6a8a', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', letterSpacing: 0.5,
              }}>
                Cancel
              </button>
              <button onClick={confirmBuy} style={{
                padding: '8px 22px', borderRadius: 6,
                border: '1px solid rgba(233,69,96,0.5)',
                background: 'linear-gradient(135deg, rgba(233,69,96,0.2), rgba(180,30,60,0.15))',
                color: '#e94560', fontWeight: 800, fontSize: 13,
                cursor: 'pointer', letterSpacing: 0.5,
                boxShadow: '0 0 12px rgba(233,69,96,0.2)',
              }}>
                ✓ Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
        {(['heroes', 'items', 'abilities', 'upgrades'] as Tab[]).map((t) => (
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
                    borderColor: active ? color : `${color}55`,
                    color: active ? '#0f0f1a' : color,
                    background: active
                      ? `linear-gradient(135deg, ${color}ee, ${color}bb)`
                      : `linear-gradient(135deg, ${color}12, ${color}06)`,
                    boxShadow: active ? `0 0 14px ${color}88, 0 2px 8px ${color}44, inset 0 1px 0 ${color}55` : `0 0 0 1px ${color}22`,
                    textShadow: active ? `0 0 8px rgba(0,0,0,0.6)` : 'none',
                    transform: active ? 'translateY(-1px)' : 'none',
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 10px ${color}55`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}99`; } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 1px ${color}22`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}55`; } }}
                >
                  <span style={{ marginRight: 5, fontSize: 13 }}>{TIER_ICON[tier]}</span>
                  {TIER_LABEL[tier]}
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
                <div style={styles.heroGrid}>
                  {tierHeroes.map((hero) => (
                    <ShopHeroCard
                      key={hero.templateId}
                      hero={hero}
                      playerGold={player?.gold ?? 0}
                      onBuy={() => requestConfirm(hero.name, hero.cost, 'gold', () => handleBuyHero(hero.templateId))}
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
                onBuy={() => requestConfirm(summon.name, summon.cost, 'gold', () => handleBuySummon(summon.templateId))}
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
          {(['COMMON', 'RARE', 'LEGENDARY'] as const).map((tier) => {
            const tierItems = items.filter((item) => getItemTier(item.cost) === tier);
            if (tierItems.length === 0) return null;
            const tierColor = { COMMON: '#9ca3af', RARE: '#a78bfa', LEGENDARY: '#f97316' }[tier];
            const tierLabel = { COMMON: 'Common', RARE: 'Rare', LEGENDARY: 'Legendary' }[tier];
            return (
              <div key={tier}>
                <div style={{ ...styles.tierHeader, borderLeftColor: tierColor }}>
                  <span style={{ color: tierColor }}>{tierLabel}</span>
                  <span style={{ color: tierColor + '66', fontSize: 12, fontWeight: 500, textTransform: 'none' as const, letterSpacing: 0 }}>
                    — {tierItems.length} item{tierItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={styles.itemGrid}>
                  {tierItems.map((item) => (
                    <ShopItemCard
                      key={item.templateId}
                      item={item}
                      playerGold={player?.gold ?? 0}
                      onBuy={() => requestConfirm(item.name, item.cost, 'gold', () => handleBuyItem(item.templateId))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === 'abilities' && (
        <>
          {/* ── Hero picker ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              color: '#4a4a6a', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 10,
            }}>
              Choose a hero to view their abilities
            </div>
            {ownedHeroes.length === 0 ? (
              <p style={styles.muted}>You have no heroes yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ownedHeroes.map((h) => {
                  const isSelected = selectedHeroId === h.id;
                  const tc = TIER_COLOR[h.tier ?? 'COMMONER'];
                  return (
                    <button
                      key={h.id}
                      onClick={() => {
                        setSelectedHeroId(isSelected ? null : h.id);
                        setHeroAbilities([]);
                        setHeroAbilityName('');
                      }}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: 4,
                        padding: '8px 10px',
                        background: isSelected
                          ? `linear-gradient(160deg, ${tc}1a, rgba(26,26,46,0.9))`
                          : 'rgba(22,22,40,0.7)',
                        border: `1px solid ${isSelected ? tc + '70' : '#252540'}`,
                        borderRadius: 10, cursor: 'pointer',
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? `0 0 18px ${tc}30` : 'none',
                      }}
                    >
                      <div style={{ position: 'relative' as const }}>
                        <HeroPortrait imagePath={h.imagePath} name={h.name} size={58} tier={h.tier} />
                      </div>
                      <span style={{
                        color: isSelected ? '#e0e0e0' : '#666',
                        fontSize: 11, fontWeight: 700,
                        whiteSpace: 'nowrap' as const,
                        transition: 'color 0.15s',
                      }}>
                        {h.name}
                      </span>
                      <span style={{
                        color: isSelected ? tc : '#3a3a5a',
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                        transition: 'color 0.15s',
                      }}>
                        Lv.{h.level}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Abilities by tier ────────────────────────────────────────── */}
          {selectedHeroId && heroAbilities.length > 0 && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 6, paddingLeft: 10,
                borderLeft: '3px solid #a78bfa',
                fontSize: 15, fontWeight: 700, letterSpacing: 0.5,
                textTransform: 'uppercase', marginTop: 4,
              }}>
                <span style={{ color: '#a78bfa' }}>{heroAbilityName}</span>
                <span style={{ color: '#a78bfa55', fontSize: 11, fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                  — abilities
                </span>
              </div>
              <p style={{ ...styles.inventoryHint, marginTop: 8 }}>
                Abilities go to this hero's inventory — slot them from the <strong>Team</strong> page.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 420px))', gap: 16 }}>
                {[1, 2, 3, 4].map((tier) => {
                  const tierAbilities = heroAbilities.filter((ab) => ab.tier === tier);
                  if (tierAbilities.length === 0) return null;
                  const ATIER_COLORS: Record<number, string> = { 1: '#9ca3af', 2: '#38bdf8', 3: '#a78bfa', 4: '#fb923c' };
                  const ATIER_LABELS: Record<number, string> = { 1: 'Tier I', 2: 'Tier II', 3: 'Tier III', 4: 'Tier IV' };
                  const tc = ATIER_COLORS[tier];
                  return (
                    <div key={tier}>
                      <div style={{ ...styles.tierHeader, borderLeftColor: tc }}>
                        <span style={{ color: tc }}>{ATIER_LABELS[tier]}</span>
                        <span style={{ color: tc + '66', fontSize: 12, fontWeight: 500, textTransform: 'none' as const, letterSpacing: 0 }}>
                          — {tierAbilities.length} ability{tierAbilities.length !== 1 ? 'abilities' : ''}
                        </span>
                      </div>
                      <div style={styles.abilityGrid}>
                        {tierAbilities.map((ab) => (
                          <ShopAbilityCard
                            key={ab.templateId}
                            ability={ab}
                            canAfford={(player?.gold ?? 0) >= ab.cost}
                            onBuy={() => requestConfirm(ab.name, ab.cost, 'gold', () => handleBuyAbility(ab.templateId))}
                          />
                        ))}
                      </div>
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

      {tab === 'upgrades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 680 }}>
          <p style={{ ...styles.muted, marginBottom: 4 }}>
            Permanent upgrades for your account. Gold and diamond purchases are independent.
          </p>

          <div style={styles.upgradeSection}>TEAM SETUPS</div>
          <UpgradeCard
            icon="📋"
            name="Extra Team Setup"
            description="Unlock a 3rd team setup slot. Save and switch between 3 different team configurations."
            cost={2000} currency="gold"
            purchased={player?.extraLineupGoldPurchased ?? false}
            canAfford={(player?.gold ?? 0) >= 2000}
            onBuy={() => handleUpgrade(buyExtraLineupGold)}
          />
          <UpgradeCard
            icon="📋"
            name="Extra Team Setup"
            description="Unlock a 4th team setup slot. Save and switch between 4 different team configurations."
            cost={100} currency="diamonds"
            purchased={player?.extraLineupDiamondsPurchased ?? false}
            canAfford={(player?.diamonds ?? 0) >= 100}
            onBuy={() => handleUpgrade(buyExtraLineupDiamonds)}
          />

          <div style={styles.upgradeSection}>ENERGY</div>
          <UpgradeCard
            icon="⚡"
            name="Energy Plus"
            description="Permanently increase your max World and Arena Energy limit by 20. Adds a bonus 40 energy refill now, and on each reset!"
            cost={40} currency="diamonds"
            purchased={player?.energyPlusPurchased ?? false}
            canAfford={(player?.diamonds ?? 0) >= 40}
            onBuy={() => handleUpgrade(buyEnergyPlus)}
          />

          <div style={styles.upgradeSection}>ROSTER</div>
          <UpgradeCard
            icon="👥"
            name="Hero Capacity Plus"
            description="Expand your hero roster from 20 to 40 heroes. More heroes, more possibilities."
            cost={4000} currency="gold"
            purchased={player?.heroPlusCapacityPurchased ?? false}
            canAfford={(player?.gold ?? 0) >= 4000}
            onBuy={() => handleUpgrade(buyHeroPlusCapacity)}
          />

          <div style={styles.upgradeSection}>CAPACITY</div>
          <UpgradeCard
            icon="🛡"
            name="Capacity Plus"
            description={`Increase your team's capacity limit by 10. Currently ${player?.teamCapacityMax ?? 100}.`}
            cost={8000} currency="gold"
            purchased={(player?.capacityPlusCount ?? 0) >= 1}
            canAfford={(player?.gold ?? 0) >= 8000}
            onBuy={() => handleUpgrade(buyCapacityPlus)}
          />

          <div style={styles.upgradeSection}>HEROES</div>
          <UpgradeCard
            icon="🔄"
            name="Stat Reset"
            description="Unlock the ability to reset a hero's allocated stat points back into their unallocated pool. First reset costs 1,000g per hero, doubling each time."
            cost={15000} currency="gold"
            purchased={player?.statResetUnlocked ?? false}
            canAfford={(player?.gold ?? 0) >= 15000}
            onBuy={() => handleUpgrade(buyStatReset)}
          />

          <div style={styles.upgradeSection}>ARENA</div>
          <UpgradeCard
            icon="📜"
            name="Battle Log"
            description="Unlock the battle log in the Arena. View your full history of challenges sent and received, and replay past battles."
            cost={500} currency="gold"
            purchased={player?.battleLogUnlocked ?? false}
            canAfford={(player?.gold ?? 0) >= 500}
            onBuy={() => handleUpgrade(buyBattleLog)}
          />
          <UpgradeCard
            icon="↩"
            name="Return Queue+"
            description="Increase your return challenge queue from 5 to 10 per opponent. When an opponent floods you with challenges, you can return more of them."
            cost={8000} currency="gold"
            purchased={player?.returnCapUpgraded ?? false}
            canAfford={(player?.gold ?? 0) >= 8000}
            onBuy={() => handleUpgrade(buyReturnCap)}
          />
          <UpgradeCard
            icon="⚔"
            name="Challenge Limit+"
            description="Increase the daily challenge limit against the same opponent from 7 to 12 per 24 hours."
            cost={13000} currency="gold"
            purchased={player?.challengeLimitUpgraded ?? false}
            canAfford={(player?.gold ?? 0) >= 13000}
            onBuy={() => handleUpgrade(buyChallengeLimitUpgrade)}
          />
          <UpgradeCard
            icon="⚡"
            name="Energy Gain+"
            description="Increase your energy regeneration from 1 to 1.5 per tick (every 10 minutes). Recover faster and fight more."
            cost={200000} currency="gold"
            purchased={player?.energyGainUpgraded ?? false}
            canAfford={(player?.gold ?? 0) >= 200000}
            onBuy={() => handleUpgrade(buyEnergyGainUpgrade)}
          />

          <div style={styles.upgradeSection}>BLACKSMITH</div>
          <UpgradeCard
            icon="⚒️"
            name="Extra Crafting Slot"
            description="Increase your active crafting limit from 1 to 2. Run two forge or refinement jobs at the same time."
            cost={4000} currency="gold"
            purchased={player?.extraCraftingSlotPurchased ?? false}
            canAfford={(player?.gold ?? 0) >= 4000}
            onBuy={() => handleUpgrade(buyExtraCraftingSlot)}
          />
          <UpgradeCard
            icon="🎰"
            name="Double Daily Spin"
            description="Get 2 spins on the Blacksmith material wheel every day instead of 1. Double your chances at rare crafting materials."
            cost={50} currency="diamonds"
            purchased={player?.doubleSpinPurchased ?? false}
            canAfford={(player?.diamonds ?? 0) >= 50}
            onBuy={() => handleUpgrade(buyDoubleSpin)}
          />
        </div>
      )}
    </div>
  );
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
    padding: '7px 18px',
    border: '1px solid',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    transition: 'all 0.18s ease',
    display: 'flex',
    alignItems: 'center',
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
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
    gap: 12,
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: 14,
    marginBottom: 8,
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
  abilityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: 14,
    marginBottom: 8,
  },
  muted: {
    color: '#666',
    fontSize: 13,
  },
  upgradeSection: {
    color: '#6b5a2a',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    marginTop: 6,
    borderBottom: '1px solid #2a1f08',
    paddingBottom: 4,
  },
};
