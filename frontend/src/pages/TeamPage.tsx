import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeam, equipHero, unequipHero, equipSummon, unequipSummon } from '../api/teamApi';
import { getHeroes, getSummons } from '../api/playerApi';
import { usePlayer } from '../context/PlayerContext';
import { useTeam } from '../context/TeamContext';
import {
  getHeroEquipment,
  equipItemToSlot,
  unequipItemFromSlot,
  equipAbilityToSlot,
  unequipAbilityFromSlot,
  sellInventoryItem,
} from '../api/equipmentApi';
import type {
  TeamResponse, HeroResponse, SummonResponse, ErrorResponse,
  HeroEquipmentResponse, CombinedSlot, InventoryItem, HeroAbilityEntry, HeroStats,
} from '../types';
import TeamSlotComponent from '../components/Team/TeamSlot';
import CapacityBar from '../components/Team/CapacityBar';
import HeroCard from '../components/Hero/HeroCard';
import HeroPortrait from '../components/Hero/HeroPortrait';
import EquipmentTooltip from '../components/Equipment/EquipmentTooltip';
import { AxiosError } from 'axios';

interface PickerOption {
  id: number;
  label: string;
  type: 'item' | 'ability';
  sellPrice?: number;
  bonuses?: Partial<HeroStats>;
  tier?: number;
  copies?: number;
  spell?: import('../types').SpellInfo | null;
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [heroes, setHeroes] = useState<HeroResponse[]>([]);
  const [summons, setSummons] = useState<SummonResponse[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [heroEquipment, setHeroEquipment] = useState<Record<number, HeroEquipmentResponse>>({});
  const [activePicker, setActivePicker] = useState<{ heroId: number; slotNumber: number } | null>(null);
  const [selectedBenchHeroId, setSelectedBenchHeroId] = useState<number | null>(null);
  const [selectedBenchSummonId, setSelectedBenchSummonId] = useState<number | null>(null);
  const pickerCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { fetchPlayer } = usePlayer();
  const { refreshTeam } = useTeam();
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

      // Load equipment for ALL heroes (team + bench)
      const eqEntries = await Promise.all(
        heroData.map((h) => getHeroEquipment(h.id).then((eq) => [h.id, eq] as const))
      );
      setHeroEquipment(Object.fromEntries(eqEntries));
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

  async function refreshEquipment(heroId: number) {
    try {
      const eq = await getHeroEquipment(heroId);
      setHeroEquipment((prev) => ({ ...prev, [heroId]: eq }));
    } catch { /* non-fatal */ }
  }

  async function handleEquipHero(heroId: number, slotNumber: number) {
    setSelectedBenchHeroId(null);
    try {
      await equipHero({ heroId, slotNumber });
      await Promise.all([refresh(), refreshTeam(), fetchPlayer()]);
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to equip hero.');
    }
  }

  async function handleUnequipHero(slotNumber: number) {
    try {
      await unequipHero({ slotNumber });
      await Promise.all([refresh(), refreshTeam(), fetchPlayer()]);
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to unequip hero.');
    }
  }

  async function handleEquipSummon(summonId: number) {
    setSelectedBenchSummonId(null);
    try {
      await equipSummon({ summonId });
      await Promise.all([refresh(), refreshTeam(), fetchPlayer()]);
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to equip summon.');
    }
  }

  async function handleUnequipSummon() {
    try {
      await unequipSummon();
      await Promise.all([refresh(), refreshTeam(), fetchPlayer()]);
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to unequip summon.');
    }
  }

  async function handleEquipToSlot(heroId: number, slotNumber: number, option: PickerOption) {
    setActivePicker(null);
    setError('');
    try {
      if (option.type === 'item') {
        await equipItemToSlot(option.id, heroId, slotNumber);
      } else {
        await equipAbilityToSlot(option.id, slotNumber);
      }
      await refreshEquipment(heroId);
      await fetchPlayer();
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to equip.');
    }
  }

  async function handleUnequipSlot(heroId: number, slot: CombinedSlot) {
    setError('');
    try {
      if (slot.type === 'item') {
        await unequipItemFromSlot(heroId, slot.slotNumber);
      } else if (slot.type === 'ability') {
        await unequipAbilityFromSlot(heroId, slot.slotNumber);
      }
      await refreshEquipment(heroId);
      await fetchPlayer();
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to unequip.');
    }
  }

  async function handleSellItem(heroId: number, equippedItemId: number) {
    setError('');
    try {
      await sellInventoryItem(equippedItemId);
      await refreshEquipment(heroId);
      await fetchPlayer();
    } catch (err) {
      const msg = (err as AxiosError<ErrorResponse>).response?.data?.message;
      setError(msg || 'Failed to sell item.');
    }
  }

  function buildPickerOptions(eq: HeroEquipmentResponse): PickerOption[] {
    const options: PickerOption[] = [];
    for (const item of eq.inventoryItems) {
      options.push({ id: item.equippedItemId, label: item.name, type: 'item', sellPrice: item.sellPrice, bonuses: item.bonuses, copies: item.copies });
    }
    for (const ab of eq.heroAbilities) {
      if (ab.slotNumber === null) {
        options.push({ id: ab.equippedAbilityId, label: `${ab.name} (T${ab.tier})`, type: 'ability', bonuses: ab.bonuses, tier: ab.tier, copies: ab.copies, spell: ab.spell });
      }
    }
    return options;
  }

  if (loading) return <div style={{ color: '#a0a0b0' }}>Loading team...</div>;

  const benchHeroes = heroes.filter((h) => !h.isEquipped);
  const benchSummons = summons.filter((s) => !s.isEquipped);

  const selectedHero = heroes.find((h) => h.id === selectedBenchHeroId) ?? null;


  return (
    <div onClick={() => setActivePicker(null)} onKeyDown={() => setActivePicker(null)}>
      <h2 style={styles.title}>Team Lineup</h2>

      {error && <div style={styles.error}>{error}</div>}

      {team && (
        <>
          <div style={styles.topRow}>
            <CapacityBar used={team.capacity.used} max={team.capacity.max} />
            <div style={styles.power}>Team Power: {team.teamPower.toFixed(0)}</div>
          </div>

          {(selectedBenchHeroId !== null || selectedBenchSummonId !== null) && (
            <div style={styles.selectionHint}>
              {selectedBenchSummonId === null
                ? 'Hero selected — click an empty slot to equip.'
                : 'Summon selected — click the summon slot to equip.'}
              {' '}Click the card again to cancel.
            </div>
          )}

          <div style={styles.slotsGrid}>
            {team.slots.map((slot) => {
              let onUnequip: (() => void) | undefined;
              if (slot.type === 'hero' && slot.hero) onUnequip = () => { handleUnequipHero(slot.slotNumber); };
              else if (slot.type === 'summon' && slot.summon) onUnequip = () => { handleUnequipSummon(); };

              let onEmptySlotClick: (() => void) | undefined;
              if (selectedBenchHeroId !== null && slot.type === 'hero' && !slot.hero) {
                onEmptySlotClick = () => { handleEquipHero(selectedBenchHeroId, slot.slotNumber); };
              } else if (selectedBenchSummonId !== null && slot.type === 'summon' && !slot.summon) {
                onEmptySlotClick = () => { handleEquipSummon(selectedBenchSummonId); };
              }

              return (
                <TeamSlotComponent
                  key={slot.slotNumber}
                  slot={slot}
                  onUnequip={onUnequip}
                  onHeroClick={(id) => navigate(`/hero/${id}`)}
                  onEmptySlotClick={onEmptySlotClick}
                  selectedHeroTier={selectedHero?.tier}
                />
              );
            })}
          </div>

          <h3 style={styles.subtitle}>Bench Heroes</h3>
          {benchHeroes.length === 0 ? (
            <p style={styles.muted}>No heroes on bench. Buy heroes from the Shop!</p>
          ) : (
            <>
              <p style={styles.benchHint}>Click a hero to select them, then click an empty team slot above to equip.</p>
              <div style={styles.benchGrid}>
                {benchHeroes.map((hero) => {
                  const isSelected = selectedBenchHeroId === hero.id;
                  return (
                    <div
                      key={hero.id}
                      style={{ ...styles.benchItem, ...(isSelected ? styles.benchItemSelected : {}) }}
                    >
                      <HeroCard
                        hero={hero}
                        onClick={() => { setSelectedBenchHeroId(isSelected ? null : hero.id); setSelectedBenchSummonId(null); }}
                      />
                      <button
                        style={styles.viewBtn}
                        onClick={() => navigate(`/hero/${hero.id}`)}
                        type="button"
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {benchSummons.length > 0 && (
            <>
              <h3 style={styles.subtitle}>Bench Summons</h3>
              <p style={styles.benchHint}>Click a summon to select it, then click the summon slot above to equip.</p>
              <div style={styles.benchGrid}>
                {benchSummons.map((summon) => {
                  const isSelected = selectedBenchSummonId === summon.id;
                  const xpPct = summon.xpToNextLevel > 0
                    ? Math.min((summon.currentXp / summon.xpToNextLevel) * 100, 100) : 0;
                  return (
                    <div
                      key={summon.id}
                      style={{ ...styles.benchItem, ...(isSelected ? styles.benchItemSelected : {}) }}
                    >
                      <button
                        type="button"
                        style={styles.summonCardBtn}
                        onClick={() => {
                          setSelectedBenchSummonId(isSelected ? null : summon.id);
                          setSelectedBenchHeroId(null);
                        }}
                      >
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
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Equipment management section */}
          {heroes.length > 0 && (
            <>
              <h3 style={styles.subtitle}>Equipment</h3>
              <p style={styles.equipHint}>Each hero has 3 slots for items and abilities.</p>
              <div style={styles.equipSection}>
                {heroes.map((hero) => {
                  const eq = heroEquipment[hero.id];
                  if (!eq) return null;
                  const pickerOptions = buildPickerOptions(eq);

                  return (
                    <div key={hero.id} style={styles.heroEquipRow} onClick={(e) => e.stopPropagation()}>
                      {/* Hero identity */}
                      <div style={styles.heroEquipHeader}>
                        <HeroPortrait imagePath={hero.imagePath} name={hero.name} size={44} />
                        <div>
                          <div style={styles.heroEquipName}>
                            {hero.name}
                            {!hero.isEquipped && <span style={{ color: '#a0a0b0', fontSize: 11, marginLeft: 6 }}>(Bench)</span>}
                          </div>
                          <div style={styles.heroEquipLv}>Lv.{hero.level}</div>
                        </div>
                      </div>

                      {/* 3 combined slots */}
                      <div style={styles.slotsRow}>
                        {eq.slots.map((slot) => {
                          const isPickerOpen = activePicker?.heroId === hero.id && activePicker?.slotNumber === slot.slotNumber;

                          const matchedAbility = slot.type === 'ability'
                            ? eq.heroAbilities.find((a) => a.slotNumber === slot.slotNumber)
                            : null;
                          const abilityTier = matchedAbility?.tier ?? null;
                          const abilitySpell = matchedAbility?.spell ?? slot.spell ?? null;

                          return (
                            <div key={slot.slotNumber} style={styles.slotWrap}>
                              {slot.type ? (
                                /* Occupied slot */
                                <EquipmentTooltip
                                  name={slot.name ?? ''}
                                  type={slot.type}
                                  bonuses={slot.bonuses ?? {}}
                                  tier={abilityTier}
                                  sellPrice={slot.sellPrice}
                                  copies={slot.copies ?? undefined}
                                  spell={abilitySpell}
                                >
                                  <div style={{
                                    ...styles.slotFilled,
                                    borderColor: slot.type === 'ability' ? '#a78bfa' : '#60a5fa',
                                  }}>
                                    <span style={{
                                      ...styles.slotTypeTag,
                                      color: slot.type === 'ability' ? '#a78bfa' : '#60a5fa',
                                    }}>
                                      {slot.type === 'ability' ? 'A' : 'I'}
                                    </span>
                                    <span style={styles.slotItemName} title={slot.name ?? ''}>
                                      {slot.name}
                                    </span>
                                    <button
                                      onClick={() => handleUnequipSlot(hero.id, slot)}
                                      style={styles.unequipBtn}
                                      title="Unequip (back to inventory)"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </EquipmentTooltip>
                              ) : (
                                /* Empty slot */
                                <div style={{ position: 'relative' }}>
                                  <button
                                    style={styles.emptySlot}
                                    disabled={pickerOptions.length === 0}
                                    title={pickerOptions.length === 0 ? 'No items or abilities in inventory' : 'Equip item or ability'}
                                    onMouseEnter={() => {
                                      if (pickerCloseTimer.current) clearTimeout(pickerCloseTimer.current);
                                      if (pickerOptions.length > 0) setActivePicker({ heroId: hero.id, slotNumber: slot.slotNumber });
                                    }}
                                    onMouseLeave={() => {
                                      pickerCloseTimer.current = setTimeout(() => setActivePicker(null), 150);
                                    }}
                                  >
                                    {pickerOptions.length === 0 ? '—' : '+'}
                                  </button>

                                  {isPickerOpen && (
                                    <div
                                      style={styles.pickerDropdown}
                                      onMouseEnter={() => { if (pickerCloseTimer.current) clearTimeout(pickerCloseTimer.current); }}
                                      onMouseLeave={() => { pickerCloseTimer.current = setTimeout(() => setActivePicker(null), 150); }}
                                    >
                                      {pickerOptions.map((opt) => (
                                        <EquipmentTooltip
                                          key={`${opt.type}-${opt.id}`}
                                          name={opt.label}
                                          type={opt.type}
                                          bonuses={opt.bonuses ?? {}}
                                          tier={opt.tier}
                                          sellPrice={opt.sellPrice}
                                          copies={opt.copies}
                                          spell={opt.spell}
                                        >
                                          <button
                                            style={styles.pickerOption}
                                            onClick={() => handleEquipToSlot(hero.id, slot.slotNumber, opt)}
                                          >
                                            <span style={{
                                              ...styles.pickerTypeTag,
                                              color: opt.type === 'ability' ? '#a78bfa' : '#60a5fa',
                                            }}>
                                              {opt.type === 'ability' ? 'A' : 'I'}
                                            </span>
                                            {opt.label}
                                          </button>
                                        </EquipmentTooltip>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div style={styles.slotLabel}>Slot {slot.slotNumber}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Inventory items (with sell button) */}
                      {eq.inventoryItems.length > 0 && (
                        <div style={styles.inventoryRow}>
                          <span style={styles.inventoryLabel}>Inventory:</span>
                          {eq.inventoryItems.map((item: InventoryItem) => (
                            <div key={item.equippedItemId} style={styles.inventoryItem}>
                              <span style={styles.inventoryItemName}>{item.name}</span>
                              <button
                                onClick={() => handleSellItem(hero.id, item.equippedItemId)}
                                style={styles.sellBtn}
                                title={`Sell for ${item.sellPrice}g`}
                              >
                                Sell {item.sellPrice}g
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Unslotted abilities */}
                      {eq.heroAbilities.some((a: HeroAbilityEntry) => a.slotNumber === null) && (
                        <div style={styles.inventoryRow}>
                          <span style={styles.inventoryLabel}>Abilities (unslotted):</span>
                          {eq.heroAbilities.filter((a: HeroAbilityEntry) => a.slotNumber === null).map((ab: HeroAbilityEntry) => (
                            <span key={ab.equippedAbilityId} style={styles.unslottedAbility}>
                              {ab.name}
                            </span>
                          ))}
                        </div>
                      )}
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
  equipHint: {
    color: '#a0a0b0',
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
    fontStyle: 'italic',
  },
  equipSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  heroEquipRow: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #16213e',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  heroEquipHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  heroEquipName: {
    color: '#e0e0e0',
    fontWeight: 700,
    fontSize: 14,
  },
  heroEquipLv: {
    color: '#a0a0b0',
    fontSize: 12,
  },
  slotsRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  slotWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  slotLabel: {
    color: '#555',
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  slotFilled: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '4px 8px',
    backgroundColor: '#12122a',
    border: '1px solid',
    borderRadius: 4,
    minWidth: 120,
    maxWidth: 160,
  },
  slotTypeTag: {
    fontSize: 9,
    fontWeight: 800,
    flexShrink: 0,
  },
  slotItemName: {
    color: '#e0e0e0',
    fontSize: 11,
    fontWeight: 500,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  unequipBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: 10,
    cursor: 'pointer',
    padding: '0 2px',
    flexShrink: 0,
    lineHeight: 1,
  },
  emptySlot: {
    width: 120,
    height: 28,
    backgroundColor: '#12122a',
    border: '1px dashed #333',
    borderRadius: 4,
    color: '#444',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerDropdown: {
    position: 'absolute' as const,
    top: 32,
    left: 0,
    zIndex: 100,
    backgroundColor: '#12122a',
    border: '1px solid #2a2a4a',
    borderRadius: 6,
    padding: '4px 0',
    minWidth: 180,
    boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
  },
  pickerOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    padding: '6px 12px',
    background: 'none',
    border: 'none',
    color: '#e0e0e0',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  pickerTypeTag: {
    fontSize: 9,
    fontWeight: 800,
    flexShrink: 0,
  },
  inventoryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap' as const,
    paddingTop: 6,
    borderTop: '1px solid #16213e',
  },
  inventoryLabel: {
    color: '#555',
    fontSize: 11,
    flexShrink: 0,
  },
  inventoryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0d0d20',
    borderRadius: 3,
    padding: '2px 6px',
  },
  inventoryItemName: {
    color: '#a0a0b0',
    fontSize: 11,
  },
  sellBtn: {
    background: 'none',
    border: '1px solid #333',
    color: '#fbbf24',
    fontSize: 10,
    borderRadius: 3,
    padding: '1px 5px',
    cursor: 'pointer',
  },
  unslottedAbility: {
    color: '#a78bfa',
    fontSize: 11,
    backgroundColor: 'rgba(167,139,250,0.08)',
    borderRadius: 3,
    padding: '2px 6px',
  },
  benchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12,
  },
  selectionHint: {
    color: '#60a5fa',
    fontSize: 12,
    padding: '6px 12px',
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
    border: '1px solid rgba(96, 165, 250, 0.2)',
    borderRadius: 4,
    marginBottom: 12,
  },
  benchHint: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
    marginTop: -4,
  },
  benchItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  benchItemSelected: {
    outline: '2px solid #60a5fa',
    borderRadius: 6,
  },
  viewBtn: {
    padding: '5px 12px',
    backgroundColor: 'transparent',
    color: '#a0a0b0',
    border: '1px solid #333',
    borderRadius: 4,
    fontSize: 12,
    cursor: 'pointer',
    alignSelf: 'flex-start',
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
  summonCardBtn: {
    padding: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    border: '1px solid #16213e',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
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
