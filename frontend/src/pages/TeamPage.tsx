import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeam, equipHero, unequipHero, equipSummon, unequipSummon, getTeamSetups, switchTeamSetup, renameTeamSetup } from '../api/teamApi';
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
  TeamResponse, TeamSetupResponse, HeroResponse, SummonResponse, ErrorResponse,
  HeroEquipmentResponse, CombinedSlot, InventoryItem, HeroAbilityEntry, HeroStats,
} from '../types';
const POWER_CSS = `
@keyframes setupTabPulse {
  0%, 100% { box-shadow: 0 0 10px rgba(233,69,96,0.25), inset 0 1px 0 rgba(255,255,255,0.05); }
  50%       { box-shadow: 0 0 22px rgba(233,69,96,0.55), 0 0 40px rgba(233,69,96,0.18), inset 0 1px 0 rgba(255,255,255,0.08); }
}
.setup-tab-active { animation: setupTabPulse 2.8s ease-in-out infinite; }
@keyframes powerGlow {
  0%, 100% { text-shadow: 0 0 8px rgba(233,69,96,0.5); }
  50%       { text-shadow: 0 0 18px rgba(233,69,96,0.95), 0 0 40px rgba(233,69,96,0.45); }
}
@keyframes powerBadgeGlow {
  0%, 100% { box-shadow: 0 0 10px rgba(233,69,96,0.15), inset 0 0 10px rgba(233,69,96,0.04); }
  50%       { box-shadow: 0 0 26px rgba(233,69,96,0.45), inset 0 0 18px rgba(233,69,96,0.09); }
}
.power-badge-anim { animation: powerBadgeGlow 2.5s ease-in-out infinite; }
.power-value-anim { animation: powerGlow      2.5s ease-in-out infinite; }
@keyframes equipLvlFlow {
  0%, 100% { background-position: 0% 0%; }
  50%       { background-position: 0% 100%; }
}
@keyframes equipXpBreathe {
  0%, 100% { filter: brightness(1); }
  50%       { filter: brightness(1.35); }
}
.equip-lvl-badge {
  background: linear-gradient(180deg, #c8c8c8 0%, #ff6b85 45%, #b01c32 100%);
  background-size: 100% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter:
    drop-shadow(0  1px 0 rgba(0,0,0,0.95))
    drop-shadow(0 -1px 0 rgba(0,0,0,0.85))
    drop-shadow( 1px 0 0 rgba(0,0,0,0.85))
    drop-shadow(-1px 0 0 rgba(0,0,0,0.85))
    drop-shadow(0  2px 4px rgba(0,0,0,0.75));
  animation: equipLvlFlow 2.4s ease-in-out infinite;
}
`;

import TeamSlotComponent from '../components/Team/TeamSlot';
import CapacityBar from '../components/Team/CapacityBar';
import HeroCard from '../components/Hero/HeroCard';
import HeroPortrait from '../components/Hero/HeroPortrait';
import CapBadge from '../components/Hero/CapBadge';
import EquipmentTooltip from '../components/Equipment/EquipmentTooltip';
import InventoryPage from './InventoryPage';
import ShopPage from './ShopPage';
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
  const [tab, setTab] = useState<'team' | 'shop' | 'inventory'>('team');
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [heroes, setHeroes] = useState<HeroResponse[]>([]);
  const [summons, setSummons] = useState<SummonResponse[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [heroEquipment, setHeroEquipment] = useState<Record<number, HeroEquipmentResponse>>({});
  const [activePicker, setActivePicker] = useState<{ heroId: number; slotNumber: number } | null>(null);
  const [selectedBenchHeroId, setSelectedBenchHeroId] = useState<number | null>(null);
  const [selectedBenchSummonId, setSelectedBenchSummonId] = useState<number | null>(null);
  const [setups, setSetups] = useState<TeamSetupResponse[]>([]);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [hoveredSetupIdx, setHoveredSetupIdx] = useState<number | null>(null);
  const [setupSwitching, setSetupSwitching] = useState(false);
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

  useEffect(() => {
    getTeamSetups().then(setSetups).catch(console.error);
  }, []);

  async function handleSwitchSetup(idx: number) {
    if (setupSwitching) return;
    setSetupSwitching(true);
    try {
      await switchTeamSetup(idx);
      setSetups((prev) => prev.map((s) => ({ ...s, isActive: s.setupIndex === idx })));
      await Promise.all([refresh(), refreshTeam(), fetchPlayer()]);
    } catch (err) {
      console.error('Failed to switch setup:', err);
    } finally {
      setSetupSwitching(false);
    }
  }

  async function handleRenameSetup(idx: number) {
    const name = renameValue.trim();
    setRenamingIdx(null);
    if (!name) return;
    try {
      await renameTeamSetup(idx, name);
      setSetups((prev) => prev.map((s) => s.setupIndex === idx ? { ...s, name } : s));
    } catch (err) {
      console.error('Failed to rename setup:', err);
    }
  }

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

  if (loading) return <div style={{ color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: 10 }}><span className="spinner" style={{ width: 18, height: 18 }} />Loading team...</div>;

  const benchHeroes = heroes.filter((h) => !h.isEquipped);
  const benchSummons = summons.filter((s) => !s.isEquipped);

  const selectedHero = heroes.find((h) => h.id === selectedBenchHeroId) ?? null;


  return (
    <div onClick={() => setActivePicker(null)} onKeyDown={() => setActivePicker(null)}>
      <style>{POWER_CSS}</style>

      {/* ── Tab bar ── */}
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tabBtn, ...(tab === 'team' ? styles.tabBtnActive : {}) }}
          onClick={(e) => { e.stopPropagation(); setTab('team'); }}
        >
          Team
        </button>
        <button
          style={{ ...styles.tabBtn, ...(tab === 'shop' ? styles.tabBtnActive : {}) }}
          onClick={(e) => { e.stopPropagation(); setTab('shop'); }}
        >
          Shop
        </button>
        <button
          style={{ ...styles.tabBtn, ...(tab === 'inventory' ? styles.tabBtnActive : {}) }}
          onClick={(e) => { e.stopPropagation(); setTab('inventory'); }}
        >
          Inventory
        </button>
      </div>

      {tab === 'shop' && <ShopPage />}
      {tab === 'inventory' && <InventoryPage />}

      {tab === 'team' && <>

      {/* ── Team Setup Tabs ── */}
      {setups.length > 0 && (
        <div style={styles.setupTabsContainer}>
          {setups.map((setup) => {
            const isActive = setup.isActive;
            const isHovered = hoveredSetupIdx === setup.setupIndex;
            const isRenaming = renamingIdx === setup.setupIndex;
            return (
              <div
                key={setup.setupIndex}
                className={isActive ? 'setup-tab-active' : undefined}
                style={{
                  ...styles.setupTab,
                  ...(isActive ? styles.setupTabActive : {}),
                  ...(isHovered && !isActive ? styles.setupTabHovered : {}),
                  ...(setupSwitching && !isActive ? { opacity: 0.5, pointerEvents: 'none' } : {}),
                }}
                onMouseEnter={() => setHoveredSetupIdx(setup.setupIndex)}
                onMouseLeave={() => setHoveredSetupIdx(null)}
                onClick={(e) => { e.stopPropagation(); if (!isActive && !isRenaming) handleSwitchSetup(setup.setupIndex); }}
                onDoubleClick={(e) => { e.stopPropagation(); setRenamingIdx(setup.setupIndex); setRenameValue(setup.name); }}
              >
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameSetup(setup.setupIndex)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameSetup(setup.setupIndex);
                      if (e.key === 'Escape') setRenamingIdx(null);
                      e.stopPropagation();
                    }}
                    style={styles.renameInput}
                    maxLength={30}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span>{setup.name}</span>
                    {(isActive || isHovered) && (
                      <span
                        style={styles.pencilIcon}
                        title="Double-click to rename"
                        onClick={(e) => { e.stopPropagation(); setRenamingIdx(setup.setupIndex); setRenameValue(setup.name); }}
                      >✎</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {team && (
        <>
          <div style={styles.topRow}>
            <CapacityBar used={team.capacity.used} max={team.capacity.max} />
            <div style={styles.powerBadge} className="power-badge-anim">
              <span style={styles.powerIcon}>⚔</span>
              <div style={styles.powerInner}>
                <span style={styles.powerLabel}>Power</span>
                <span style={styles.powerValue} className="power-value-anim">
                  {team.teamPower.toFixed(0)}
                </span>
              </div>
            </div>
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
                  onSummonClick={(id) => navigate(`/summon/${id}`)}
                  onEmptySlotClick={onEmptySlotClick}
                  selectedHeroTier={selectedHero?.tier}
                />
              );
            })}
          </div>

          <h3 style={styles.subtitle} className="section-title">Bench Heroes</h3>
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
                      <div style={{ borderRadius: '10px 10px 0 0', overflow: 'hidden' }}>
                        <HeroCard
                          hero={hero}
                          onClick={() => { setSelectedBenchHeroId(isSelected ? null : hero.id); setSelectedBenchSummonId(null); }}
                        />
                      </div>
                      <button
                        style={styles.viewBtn}
                        onClick={() => navigate(`/hero/${hero.id}`)}
                        type="button"
                      >
                        View Hero
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <>
              <h3 style={styles.subtitle} className="section-title">Bench Summons</h3>
              {benchSummons.length === 0 ? (
                <p style={styles.muted}>No summons on bench. Buy summons from the Shop!</p>
              ) : (
              <>
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
                      {/* Clickable card area — selects for equip */}
                      <div
                        style={{ borderRadius: '10px 10px 0 0', overflow: 'hidden' }}
                        onClick={() => { setSelectedBenchSummonId(isSelected ? null : summon.id); setSelectedBenchHeroId(null); }}
                      >
                        <div style={styles.summonCard} className="card-hover">
                          {/* Portrait with level badge + XP bar */}
                          <div style={{ position: 'relative', flexShrink: 0, display: 'flex' }}>
                            <HeroPortrait imagePath={summon.imagePath} name={summon.name} size={80} />
                            <span className="equip-lvl-badge" style={styles.summonLvlBadge}>{summon.level}</span>
                            <div style={styles.summonXpBarBg}>
                              <div style={{ ...styles.summonXpBarFill, width: `${xpPct}%` }} />
                              <div style={styles.summonXpCenter}>
                                <span style={styles.summonXpText}>{Math.round(xpPct)}%</span>
                              </div>
                            </div>
                          </div>
                          <div style={styles.summonInfo}>
                            <div style={styles.summonNameRow}>
                              <span style={styles.summonNameText}>{summon.name}</span>
                            </div>
                            <CapBadge value={summon.capacity} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1 }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ color: '#8888aa', fontSize: 11, fontStyle: 'italic', minWidth: 72 }}>Magic Power</span>
                                <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 700 }}>{Math.round(summon.stats.magicPower)}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ color: '#8888aa', fontSize: 11, fontStyle: 'italic', minWidth: 72 }}>Mana</span>
                                <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 700 }}>{Math.round(summon.stats.mana)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        style={styles.viewBtn}
                        onClick={() => navigate(`/summon/${summon.id}`)}
                        type="button"
                      >
                        View Summon
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
              )}
          </>

          {/* Equipment management section */}
          {heroes.length > 0 && (
            <>
              <h3 style={styles.subtitle} className="section-title">Equipment</h3>
              <p style={styles.equipHint}>Each hero has 3 slots for items and abilities.</p>
              <div style={styles.equipSection}>
                {heroes.map((hero) => {
                  const eq = heroEquipment[hero.id];
                  if (!eq) return null;
                  const pickerOptions = buildPickerOptions(eq);

                  const xpPctHero = hero.xpToNextLevel > 0
                    ? Math.min((hero.currentXp / hero.xpToNextLevel) * 100, 100) : 0;

                  return (
                    <div key={hero.id} style={styles.heroEquipRow} className="card-hover" onClick={(e) => e.stopPropagation()}>
                      {/* Hero identity */}
                      <div style={styles.heroEquipHeader}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <HeroPortrait imagePath={hero.imagePath} name={hero.name} size={44} tier={hero.tier} />
                          <span className="equip-lvl-badge" style={styles.equipLvlBadge}>{hero.level}</span>
                          <div style={styles.equipXpBarBg}>
                            <div style={{ ...styles.equipXpBarFill, width: `${xpPctHero}%` }} />
                            <div style={styles.equipXpBarCenter}>
                              <span style={styles.equipXpBarText}>{Math.round(xpPctHero)}%</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={styles.heroEquipName}>
                            {hero.name}
                            {!hero.isEquipped && <span style={{ color: '#a0a0b0', fontSize: 11, marginLeft: 6 }}>(Bench)</span>}
                          </div>
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

      </>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    gap: 4,
    marginBottom: 20,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    paddingBottom: 0,
  },
  tabBtn: {
    padding: '8px 20px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#6060a0',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.02em',
    marginBottom: -1,
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabBtnActive: {
    color: '#e0e0e0',
    borderBottomColor: '#e94560',
  },
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
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 64,
    marginBottom: 20,
  },
  powerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(233,69,96,0.06)',
    border: '1px solid rgba(233,69,96,0.25)',
    borderRadius: 8,
    padding: '8px 16px',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  powerIcon: {
    fontSize: 22,
    filter: 'drop-shadow(0 0 8px rgba(233,69,96,0.9))',
  },
  powerInner: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 1,
  },
  powerLabel: {
    color: '#555577',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  powerValue: {
    color: '#e94560',
    fontSize: 24,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.1,
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
  equipLvlBadge: {
    position: 'absolute' as const,
    bottom: 3,
    right: 3,
    zIndex: 5,
    fontSize: 11,
    fontWeight: 900,
    fontStyle: 'italic',
    lineHeight: 1,
    letterSpacing: '-0.01em',
    fontFamily: 'Inter, sans-serif',
    pointerEvents: 'none' as const,
  },
  equipXpBarBg: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 9,
    backgroundColor: 'rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 4,
  },
  equipXpBarCenter: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as const,
    zIndex: 5,
  },
  equipXpBarText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 6,
    fontWeight: 900,
    letterSpacing: '0.04em',
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 1px 2px rgba(0,0,0,0.95)',
    lineHeight: 1,
  },
  equipXpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #78350f, #d97706, #fbbf24)',
    animation: 'equipXpBreathe 2.2s ease-in-out infinite',
    boxShadow: '0 0 4px rgba(251,191,36,0.8)',
    transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
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
    gap: 0,
    borderRadius: 10,
  },
  benchItemSelected: {
    boxShadow: '0 0 0 2px #60a5fa, 0 0 20px rgba(96,165,250,0.22)',
    borderRadius: 10,
  },
  viewBtn: {
    padding: '7px 14px',
    backgroundColor: 'rgba(255,255,255,0.025)',
    color: '#5070b0',
    border: '1px solid rgba(255,255,255,0.07)',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '0 0 10px 10px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    letterSpacing: '0.07em',
    fontFamily: 'Inter, sans-serif',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
  },
  muted: {
    color: '#666',
    fontSize: 13,
  },
  summonCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '13px 14px',
    background: 'linear-gradient(135deg, rgba(20,20,44,0.97) 0%, rgba(10,10,26,0.9) 100%)',
    borderLeft: '3px solid #a78bfa',
    borderRadius: 0,
    border: '1px solid rgba(255,255,255,0.07)',
    cursor: 'pointer',
  },
  summonInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 100,
    flex: 1,
    alignItems: 'flex-start',
  },
  summonNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  summonNameText: {
    color: '#e8e8f0',
    fontWeight: 700,
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
  },
  summonLvlBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    zIndex: 5,
    fontSize: 13,
    fontWeight: 900,
    fontStyle: 'italic',
    lineHeight: 1,
    letterSpacing: '-0.01em',
    fontFamily: 'Inter, sans-serif',
    pointerEvents: 'none',
  },
  summonXpBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 9,
    backgroundColor: 'rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 4,
  },
  summonXpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #78350f, #d97706, #fbbf24)',
    boxShadow: '0 0 4px rgba(251,191,36,0.8)',
    transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  summonXpCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 5,
  },
  summonXpText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 6,
    fontWeight: 900,
    letterSpacing: '0.04em',
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 1px 2px rgba(0,0,0,0.95)',
    lineHeight: 1,
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
  setupTabsContainer: {
    display: 'flex',
    gap: 4,
    marginBottom: 24,
    borderBottom: '2px solid rgba(233,69,96,0.18)',
    paddingBottom: 0,
  },
  setupTab: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 22px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderBottom: '2px solid transparent',
    color: '#5050a0',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.03em',
    marginBottom: -2,
    borderRadius: '7px 7px 0 0',
    transition: 'all 0.18s ease',
    userSelect: 'none' as const,
  },
  setupTabActive: {
    background: 'linear-gradient(135deg, rgba(233,69,96,0.18) 0%, rgba(180,30,60,0.12) 100%)',
    border: '1px solid rgba(233,69,96,0.5)',
    borderBottom: '2px solid #e94560',
    color: '#ffffff',
  },
  setupTabHovered: {
    background: 'rgba(255,255,255,0.045)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderBottom: '2px solid rgba(233,69,96,0.2)',
    color: '#8888cc',
  },
  pencilIcon: {
    fontSize: 12,
    color: 'rgba(233,69,96,0.55)',
    cursor: 'pointer',
    lineHeight: 1,
    marginLeft: 2,
    transition: 'color 0.15s',
  },
  renameInput: {
    background: 'rgba(0,0,0,0.6)',
    border: '1px solid rgba(233,69,96,0.6)',
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'Inter, sans-serif',
    padding: '3px 8px',
    outline: 'none',
    width: 130,
    letterSpacing: '0.03em',
  },
};
