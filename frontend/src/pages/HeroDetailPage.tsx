import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getHeroes } from '../api/playerApi';
import { getHeroEquipment, unequipItemFromSlot, sellInventoryItem, unequipAbilityFromSlot, equipItemToSlot, equipAbilityToSlot } from '../api/equipmentApi';
import { listAbilities, buyAbility } from '../api/shopApi';
import { usePlayer } from '../context/PlayerContext';
import type {
  HeroResponse,
  HeroStats as StatsType,
  HeroEquipmentResponse,
  ShopAbilityResponse,
  InventoryItem,
  HeroAbilityEntry,
} from '../types';
import HeroPortrait from '../components/Hero/HeroPortrait';
import HexStatDiagram from '../components/Hero/HexStatDiagram';
import ItemSlot from '../components/Equipment/ItemSlot';
import AbilitySlot from '../components/Equipment/AbilitySlot';

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '💧', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
};
const ELEMENT_COLOR: Record<string, string> = {
  FIRE: '#f97316', WATER: '#38bdf8', WIND: '#86efac',
  EARTH: '#a16207', LIGHTNING: '#facc15',
};
const TIER_COLOR: Record<string, string> = {
  COMMONER: '#6b7280', ELITE: '#a78bfa', LEGENDARY: '#f97316',
};

const STAT_LABELS: Record<string, string> = {
  physicalAttack: 'PA',
  magicPower: 'MP',
  dexterity: 'Dex',
  element: 'Elem',
  mana: 'Mana',
  stamina: 'Stam',
};

export default function HeroDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchPlayer } = usePlayer();
  const [hero, setHero] = useState<HeroResponse | null>(null);
  const [equipment, setEquipment] = useState<HeroEquipmentResponse | null>(null);
  const [availableAbilities, setAvailableAbilities] = useState<ShopAbilityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activePicker, setActivePicker] = useState<number | null>(null);

  const heroId = Number(id);

  const refresh = useCallback(async () => {
    try {
      const heroes = await getHeroes();
      const found = heroes.find((h) => h.id === heroId);
      setHero(found ?? null);

      if (found) {
        try {
          const eq = await getHeroEquipment(heroId);
          setEquipment(eq);
        } catch {
          setEquipment(null);
        }

        try {
          const abData = await listAbilities(heroId);
          setAvailableAbilities(abData.abilities);
        } catch {
          // non-fatal
        }
      }
    } catch {
      setError('Failed to load hero data.');
    } finally {
      setLoading(false);
    }
  }, [heroId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleUnequipItem(slotNumber: number) {
    setError(''); setMessage('');
    try {
      const res = await unequipItemFromSlot(heroId, slotNumber);
      setMessage(res.message);
      await refresh();
    } catch {
      setError('Failed to unequip item.');
    }
  }

  async function handleSellItem(equippedItemId: number) {
    setError(''); setMessage('');
    try {
      const res = await sellInventoryItem(equippedItemId);
      setMessage(res.message);
      await Promise.all([refresh(), fetchPlayer()]);
    } catch {
      setError('Failed to sell item.');
    }
  }

  async function handleUnequipAbility(slotNumber: number) {
    setError(''); setMessage('');
    try {
      const res = await unequipAbilityFromSlot(heroId, slotNumber);
      setMessage(res.message);
      await refresh();
    } catch {
      setError('Failed to unequip ability.');
    }
  }

  async function handleEquipToSlot(slotNumber: number, opt: { type: 'item' | 'ability'; id: number }) {
    setError(''); setMessage('');
    try {
      const res = opt.type === 'item'
        ? await equipItemToSlot(opt.id, heroId, slotNumber)
        : await equipAbilityToSlot(opt.id, slotNumber);
      setMessage(res.message);
      setActivePicker(null);
      await refresh();
    } catch {
      setError('Failed to equip.');
    }
  }

  async function handleBuyAbility(abilityTemplateId: number) {
    setError(''); setMessage('');
    try {
      const res = await buyAbility({ abilityTemplateId, heroId });
      setMessage(res.message);
      await Promise.all([refresh(), fetchPlayer()]);
    } catch {
      setError('Failed to buy ability.');
    }
  }

  if (loading) return <div style={{ color: '#a0a0b0' }}>Loading hero...</div>;
  if (!hero) return <div style={{ color: '#e94560' }}>Hero not found.</div>;

  const xpPct = hero.xpToNextLevel > 0
    ? Math.min((hero.currentXp / hero.xpToNextLevel) * 100, 100) : 0;

  const unboughtAbilities = availableAbilities.filter((a) => !a.owned);

  return (
    <div onClick={() => setActivePicker(null)}>
      <Link to="/team" style={styles.backLink}>Back to Team</Link>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.header}>
        <HeroPortrait imagePath={hero.imagePath} name={hero.name} size={160} tier={hero.tier} />
        <div style={styles.headerInfo}>
          <div style={styles.heroNameRow}>
            <h2 style={styles.heroName}>{hero.name}</h2>
            {hero.element && (
              <span style={{ color: ELEMENT_COLOR[hero.element] ?? '#a0a0b0', fontSize: 20 }}>
                {ELEMENT_SYMBOL[hero.element] ?? hero.element}
              </span>
            )}
            {hero.tier && (
              <span style={{ color: TIER_COLOR[hero.tier] ?? '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, alignSelf: 'center' }}>
                {hero.tier.charAt(0) + hero.tier.slice(1).toLowerCase()}
              </span>
            )}
          </div>
          <div style={styles.level}>Level {hero.level}</div>
          <div style={styles.capacity}>Capacity: {hero.capacity}</div>
          <div style={styles.equippedStatus}>
            {hero.isEquipped ? `Equipped — Slot ${hero.teamSlot}` : 'On Bench'}
          </div>

          <div style={styles.xpSection}>
            <div style={styles.xpLabel}>
              XP: {hero.currentXp} / {hero.xpToNextLevel}
            </div>
            <div style={styles.xpBarBg}>
              <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <h3 style={styles.subtitle}>Battle Stats</h3>
      <div style={styles.battleStatsGrid}>
        <div style={styles.battleStat}>
          <div style={styles.battleStatValue}>{hero.clashesWon}</div>
          <div style={styles.battleStatLabel}>Clashes Won</div>
        </div>
        <div style={styles.battleStat}>
          <div style={{ ...styles.battleStatValue, color: '#e94560' }}>{hero.clashesLost}</div>
          <div style={styles.battleStatLabel}>Clashes Lost</div>
        </div>
        <div style={styles.battleStat}>
          <div style={{ ...styles.battleStatValue, color: '#fbbf24' }}>{hero.maxDamageDealt.toFixed(1)}</div>
          <div style={styles.battleStatLabel}>Max Damage Dealt</div>
        </div>
        <div style={styles.battleStat}>
          <div style={{ ...styles.battleStatValue, color: '#a78bfa' }}>{hero.maxDamageReceived.toFixed(1)}</div>
          <div style={styles.battleStatLabel}>Max Damage Received</div>
        </div>
      </div>

      <HexStatDiagram
        stats={hero.baseStats}
        growthStats={hero.growthStats}
        size={240}
      />

      <h3 style={styles.subtitle}>Stats Breakdown</h3>
      <div style={styles.statsTable}>
        <div style={styles.tableHeader}>
          <span style={styles.thStat}>Stat</span>
          <span style={styles.th}>Base (incl. growth)</span>
          <span style={styles.th}>Equipment Bonus</span>
          <span style={styles.thTotal}>Total</span>
        </div>
        {Object.entries(STAT_LABELS).map(([key, label]) => {
          const base = hero.stats[key as keyof StatsType] ?? 0;
          const bonus = hero.bonusStats[key as keyof StatsType] ?? 0;
          const total = base + bonus;
          return (
            <div key={key} style={styles.tableRow}>
              <span style={styles.tdStat}>{label}</span>
              <span style={styles.td}>{base.toFixed(1)}</span>
              <span style={{ ...styles.td, color: bonus > 0 ? '#4ade80' : '#a0a0b0' }}>
                {bonus > 0 ? `+${bonus.toFixed(1)}` : '—'}
              </span>
              <span style={styles.tdTotal}>{total.toFixed(1)}</span>
            </div>
          );
        })}
      </div>

      {equipment && (
        <>
          <h3 style={styles.subtitle}>Equipment Slots (3)</h3>
          <div style={styles.equipList}>
            {equipment.slots.map((slot) => {
              if (slot.type) {
                return (
                  <ItemSlot
                    key={slot.slotNumber}
                    slot={slot}
                    onUnequip={slot.type === 'ability' ? handleUnequipAbility : handleUnequipItem}
                    onSell={handleSellItem}
                  />
                );
              }
              // Empty slot — show equip picker
              const pickerItems = (equipment.inventoryItems as InventoryItem[]).map((item) => ({
                type: 'item' as const, id: item.equippedItemId, label: item.name,
              }));
              const pickerAbilities = (equipment.heroAbilities as HeroAbilityEntry[])
                .filter((ab) => ab.slotNumber === null)
                .map((ab) => ({ type: 'ability' as const, id: ab.equippedAbilityId, label: ab.name }));
              const options = [...pickerItems, ...pickerAbilities];
              const isOpen = activePicker === slot.slotNumber;
              return (
                <div key={slot.slotNumber} style={styles.emptySlotWrap} onClick={(e) => e.stopPropagation()}>
                  <span style={styles.emptySlotLabel}>Slot {slot.slotNumber} — Empty</span>
                  <div style={{ position: 'relative' }}>
                    <button
                      style={options.length === 0 ? styles.emptySlotBtnDisabled : styles.emptySlotBtn}
                      disabled={options.length === 0}
                      onClick={(e) => { e.stopPropagation(); setActivePicker(isOpen ? null : slot.slotNumber); }}
                      title={options.length === 0 ? 'No items or abilities in inventory' : 'Equip to this slot'}
                    >
                      {options.length === 0 ? 'Empty' : '+ Equip'}
                    </button>
                    {isOpen && (
                      <div style={styles.pickerDropdown} onClick={(e) => e.stopPropagation()}>
                        {options.map((opt) => (
                          <button
                            key={`${opt.type}-${opt.id}`}
                            style={styles.pickerOption}
                            onClick={() => handleEquipToSlot(slot.slotNumber, opt)}
                          >
                            <span style={{ color: opt.type === 'ability' ? '#a78bfa' : '#60a5fa', marginRight: 5, fontWeight: 700 }}>
                              {opt.type === 'ability' ? 'A' : 'I'}
                            </span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <h3 style={styles.subtitle}>Abilities</h3>
          {equipment.heroAbilities.length > 0 ? (
            <div style={styles.equipList}>
              {equipment.heroAbilities.map((ab) => (
                <AbilitySlot
                  key={ab.equippedAbilityId}
                  ability={ab}
                  onUnequip={handleUnequipAbility}
                />
              ))}
            </div>
          ) : (
            <p style={styles.muted}>No abilities owned.</p>
          )}

          {unboughtAbilities.length > 0 && (
            <>
              <h4 style={styles.subtitleSmall}>Available Abilities</h4>
              <div style={styles.equipList}>
                {unboughtAbilities.map((ab) => {
                  const bonusEntries = Object.entries(ab.bonuses).filter(([, v]) => v !== 0);
                  return (
                    <div key={ab.templateId} style={styles.abilityShopRow}>
                      <div>
                        <span style={styles.abilityName}>{ab.name}</span>
                        <span style={styles.abilityTier}> T{ab.tier}</span>
                        <span style={styles.abilityCost}> — {ab.cost}g</span>
                      </div>
                      <div style={styles.abilityBonuses}>
                        {bonusEntries.map(([stat, val]) => (
                          <span key={stat} style={styles.abilityBonus}>+{val} {formatStat(stat)}</span>
                        ))}
                      </div>
                      <button onClick={() => handleBuyAbility(ab.templateId)} style={styles.buyBtn}>
                        Buy
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
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
  backLink: {
    color: '#a0a0b0',
    textDecoration: 'none',
    fontSize: 13,
    display: 'inline-block',
    marginBottom: 16,
  },
  success: {
    color: '#4ade80',
    fontSize: 13,
    padding: '8px 12px',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderRadius: 4,
    marginBottom: 12,
  },
  error: {
    color: '#e94560',
    fontSize: 13,
    padding: '8px 12px',
    backgroundColor: 'rgba(233, 69, 96, 0.1)',
    borderRadius: 4,
    marginBottom: 12,
  },
  header: {
    display: 'flex',
    gap: 24,
    marginBottom: 32,
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  },
  heroNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  heroName: {
    color: '#e0e0e0',
    fontSize: 22,
    margin: 0,
  },
  level: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: 600,
  },
  capacity: {
    color: '#a0a0b0',
    fontSize: 13,
  },
  equippedStatus: {
    color: '#4ade80',
    fontSize: 13,
  },
  xpSection: {
    marginTop: 8,
  },
  xpLabel: {
    color: '#a0a0b0',
    fontSize: 12,
    marginBottom: 4,
  },
  xpBarBg: {
    height: 8,
    backgroundColor: '#0f0f23',
    borderRadius: 4,
    overflow: 'hidden',
    maxWidth: 280,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#60a5fa',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  subtitle: {
    color: '#e0e0e0',
    fontSize: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  subtitleSmall: {
    color: '#a0a0b0',
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  statsTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    maxWidth: 550,
  },
  tableHeader: {
    display: 'flex',
    padding: '8px 12px',
    backgroundColor: '#16213e',
    borderRadius: '6px 6px 0 0',
    fontSize: 11,
    color: '#a0a0b0',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    display: 'flex',
    padding: '8px 12px',
    backgroundColor: '#1a1a2e',
    borderBottom: '1px solid #16213e',
    fontSize: 13,
  },
  thStat: { flex: 1 },
  th: { flex: 1.5, textAlign: 'center' },
  thTotal: { flex: 1, textAlign: 'right', color: '#fbbf24' },
  tdStat: { flex: 1, color: '#a0a0b0', fontWeight: 500 },
  td: { flex: 1.5, textAlign: 'center', color: '#e0e0e0' },
  tdTotal: { flex: 1, textAlign: 'right', color: '#fbbf24', fontWeight: 600 },
  equipList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxWidth: 550,
  },
  muted: {
    color: '#666',
    fontSize: 13,
  },
  abilityShopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#16213e',
    borderRadius: 4,
    border: '1px solid #1a1a2e',
    fontSize: 13,
    gap: 12,
  },
  abilityName: {
    color: '#e0e0e0',
    fontWeight: 500,
  },
  abilityTier: {
    color: '#60a5fa',
    fontSize: 11,
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
  buyBtn: {
    padding: '4px 12px',
    backgroundColor: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 3,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  emptySlotWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    backgroundColor: '#1a1a2e',
    border: '1px dashed #2a2a4e',
    borderRadius: 6,
    marginBottom: 6,
  },
  emptySlotLabel: {
    color: '#4a4a6e',
    fontSize: 13,
    flex: 1,
  },
  emptySlotBtn: {
    padding: '4px 12px',
    backgroundColor: '#16213e',
    color: '#60a5fa',
    border: '1px solid #60a5fa',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  emptySlotBtnDisabled: {
    padding: '4px 12px',
    backgroundColor: '#16213e',
    color: '#4a4a6e',
    border: '1px solid #2a2a4e',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'default',
    whiteSpace: 'nowrap' as const,
  },
  pickerDropdown: {
    position: 'absolute' as const,
    top: '110%',
    right: 0,
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a4e',
    borderRadius: 6,
    zIndex: 100,
    minWidth: 180,
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  pickerOption: {
    padding: '7px 12px',
    background: 'none',
    border: 'none',
    color: '#d0d0e0',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'left' as const,
    display: 'flex',
    alignItems: 'center',
  },
  battleStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    maxWidth: 550,
    marginBottom: 8,
  },
  battleStat: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #16213e',
    borderRadius: 6,
    padding: '12px 8px',
    textAlign: 'center',
  },
  battleStatValue: {
    color: '#4ade80',
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: 4,
  },
  battleStatLabel: {
    color: '#a0a0b0',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
};
