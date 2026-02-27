import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Swords, Skull, Zap, ShieldAlert, TrendingUp, TrendingDown, ChevronLeft } from 'lucide-react';
import { getHero, sellHero, halveCapacity, buyStats } from '../api/playerApi';
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
import CapBadge from '../components/Hero/CapBadge';
import HexStatDiagram from '../components/Hero/HexStatDiagram';
import ItemSlot from '../components/Equipment/ItemSlot';
import AbilitySlot from '../components/Equipment/AbilitySlot';
import AbilityTierIcon from '../components/Equipment/AbilityTierIcon';
import EquipmentTooltip from '../components/Equipment/EquipmentTooltip';

// Inject XP shimmer keyframe once
if (typeof document !== 'undefined') {
  const id = 'inspect-popup-css';
  if (!document.getElementById(id)) {
    const el = document.createElement('style');
    el.id = id;
    el.textContent = `
      @keyframes xpShimmer {
        0%   { transform: translateX(-180%) skewX(-18deg); opacity: 0; }
        15%  { opacity: 1; }
        85%  { opacity: 1; }
        100% { transform: translateX(380%) skewX(-18deg); opacity: 0; }
      }
      @keyframes xpBreathe {
        0%, 100% { filter: brightness(1); }
        50%       { filter: brightness(1.35); }
      }
      @keyframes inspectLvlFlow {
        0%, 100% { background-position: 0% 0%; }
        50%       { background-position: 0% 100%; }
      }
      .hero-detail-lvl {
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
          drop-shadow(0  2px 6px rgba(0,0,0,0.75));
        animation: inspectLvlFlow 2.4s ease-in-out infinite;
      }
    `;
    document.head.appendChild(el);
  }
}

const ELEMENT_SYMBOL: Record<string, string> = {
  FIRE: '🔥', WATER: '🌊', WIND: '🌀', EARTH: '⛰️', LIGHTNING: '⚡',
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


const STAT_COLORS: Record<string, string> = {
  physicalAttack: '#f97316',
  magicPower:     '#60a5fa',
  dexterity:      '#4ade80',
  element:        '#facc15',
  mana:           '#a78bfa',
  stamina:        '#fb7185',
};

const SUB_STATS: { key: string; label: string; color: string }[] = [
  { key: 'attack',           label: 'Attack',            color: '#f97316' },
  { key: 'magicProficiency', label: 'Magic Proficiency', color: '#60a5fa' },
  { key: 'spellMastery',     label: 'Spell Mastery',     color: '#c084fc' },
  { key: 'spellActivation',  label: 'Spell Activation',  color: '#e879f9' },
  { key: 'dexProficiency',   label: 'Dex Proficiency',   color: '#4ade80' },
  { key: 'dexPosture',       label: 'Dex Posture',       color: '#34d399' },
  { key: 'criticalChance',   label: 'Critical Chance',   color: '#fb923c' },
  { key: 'criticalDamage',   label: 'Critical Damage',   color: '#fbbf24' },
  { key: 'expBonus',         label: 'Exp Bonus',         color: '#a78bfa' },
  { key: 'goldBonus',        label: 'Gold Bonus',        color: '#fde68a' },
  { key: 'itemDiscovery',    label: 'Item Discovery',    color: '#22d3ee' },
  { key: 'physicalImmunity', label: 'Physical Immunity', color: '#94a3b8' },
  { key: 'magicImmunity',    label: 'Magic Immunity',    color: '#818cf8' },
  { key: 'dexEvasiveness',      label: 'Dex Evasiveness',      color: '#86efac' },
  { key: 'staminaEffectiveness', label: 'Stamina Effectiveness', color: '#fb7185' },
];

export default function HeroDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchPlayer } = usePlayer();
  const [hero, setHero] = useState<HeroResponse | null>(null);
  const [equipment, setEquipment] = useState<HeroEquipmentResponse | null>(null);
  const [availableAbilities, setAvailableAbilities] = useState<ShopAbilityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activePicker, setActivePicker] = useState<number | null>(null);
  const [confirmHeroSell, setConfirmHeroSell] = useState(false);
  const [confirmHalve, setConfirmHalve] = useState(false);
  const [showBuyStats, setShowBuyStats] = useState(false);
  const [statAlloc, setStatAlloc] = useState<Record<string, number>>({
    physicalAttack: 0, magicPower: 0, dexterity: 0, element: 0, mana: 0, stamina: 0,
  });

  const heroId = Number(id);

  const refresh = useCallback(async () => {
    try {
      const found = await getHero(heroId);
      setHero(found);

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

  async function handleSellHero() {
    setError(''); setMessage('');
    try {
      const res = await sellHero(heroId);
      setMessage(res.message);
      await fetchPlayer();
      navigate('/team');
    } catch {
      setError('Failed to sell hero.');
    } finally {
      setConfirmHeroSell(false);
    }
  }

  async function handleHalveCapacity() {
    setError(''); setMessage('');
    try {
      const res = await halveCapacity(heroId);
      setMessage(res.message);
      await Promise.all([refresh(), fetchPlayer()]);
    } catch {
      setError('Failed to halve capacity.');
    } finally {
      setConfirmHalve(false);
    }
  }

  async function handleBuyStats() {
    const total = Object.values(statAlloc).reduce((a, b) => a + b, 0);
    if (total !== 6) { setError('You must allocate exactly 6 points.'); return; }
    setError(''); setMessage('');
    try {
      const res = await buyStats(heroId, statAlloc);
      setMessage(res.message);
      setStatAlloc({ physicalAttack: 0, magicPower: 0, dexterity: 0, element: 0, mana: 0, stamina: 0 });
      setShowBuyStats(false);
      await Promise.all([refresh(), fetchPlayer()]);
    } catch {
      setError('Failed to buy stats.');
    }
  }

  if (loading) return <div style={{ color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: 10 }}><span className="spinner" style={{ width: 18, height: 18 }} />Loading hero...</div>;
  if (!hero) return <div style={{ color: '#e94560' }}>Hero not found.</div>;

  const xpPct = hero.xpToNextLevel > 0
    ? Math.min((hero.currentXp / hero.xpToNextLevel) * 100, 100) : 0;

  const totalBattles = hero.clashesWon + hero.clashesLost;
  const winRate = totalBattles > 0 ? Math.round((hero.clashesWon / totalBattles) * 100) : 0;

  const unboughtAbilities = availableAbilities.filter((a) => !a.owned);

  return (
    <div onClick={() => setActivePicker(null)}>
      {confirmHeroSell && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmCard}>
            <div style={styles.confirmTitle}>Sell Hero?</div>
            <div style={styles.confirmHeroName}>{hero.name}</div>
            <div style={styles.confirmSub}>This hero and all their abilities will be removed. Equipped items will return to your inventory.</div>
            <div style={styles.confirmBtns}>
              <button style={styles.confirmYes} onClick={handleSellHero}>Sell</button>
              <button style={styles.confirmNo} onClick={() => setConfirmHeroSell(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmHalve && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmCard}>
            <div style={styles.confirmTitle}>Halve Capacity?</div>
            <div style={styles.confirmHeroName}>{hero.name}</div>
            <div style={styles.confirmSub}>
              Reduces capacity from <strong style={{ color: '#a78bfa' }}>{hero.capacity}</strong> to <strong style={{ color: '#a78bfa' }}>{Math.max(1, Math.floor(hero.capacity / 2))}</strong>.
              <br />Costs <strong style={{ color: '#fbbf24' }}>{hero.sellPrice}g</strong> (half of buy price).
            </div>
            <div style={styles.confirmBtns}>
              <button style={styles.confirmYes} onClick={handleHalveCapacity}>Confirm</button>
              <button style={styles.confirmNo} onClick={() => setConfirmHalve(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showBuyStats && (() => {
        const STAT_ROWS: { key: string; label: string; color: string }[] = [
          { key: 'physicalAttack', label: 'PA',   color: '#f97316' },
          { key: 'magicPower',     label: 'MP',   color: '#60a5fa' },
          { key: 'dexterity',      label: 'DEX',  color: '#4ade80' },
          { key: 'element',        label: 'ELEM', color: '#facc15' },
          { key: 'mana',           label: 'MANA', color: '#a78bfa' },
          { key: 'stamina',        label: 'STAM', color: '#fb7185' },
        ];
        const spent = Object.values(statAlloc).reduce((a, b) => a + b, 0);
        const remaining = 6 - spent;
        return (
          <div style={styles.confirmOverlay} onClick={() => setShowBuyStats(false)}>
            <div style={{ ...styles.confirmCard, maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
              <div style={styles.confirmTitle}>Buy Stats</div>
              <div style={{ color: '#a0a0b0', fontSize: 12, marginBottom: 4 }}>
                Cost: <strong style={{ color: '#fbbf24' }}>{hero.nextStatCost}g</strong>
                &nbsp;·&nbsp; Allocate <strong style={{ color: '#4ade80' }}>{remaining}</strong> more point{remaining !== 1 ? 's' : ''}
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {STAT_ROWS.map(({ key, label, color }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ color, fontSize: 12, fontWeight: 700, width: 42 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        style={styles.allocBtn}
                        onClick={() => setStatAlloc(a => ({ ...a, [key]: Math.max(0, a[key] - 1) }))}
                        disabled={statAlloc[key] === 0}
                      >−</button>
                      <span style={{ color: '#e0e0e0', fontSize: 15, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{statAlloc[key]}</span>
                      <button
                        style={styles.allocBtn}
                        onClick={() => setStatAlloc(a => ({ ...a, [key]: a[key] + 1 }))}
                        disabled={remaining === 0}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={styles.confirmBtns}>
                <button style={{ ...styles.confirmYes, opacity: remaining === 0 ? 1 : 0.4 }} onClick={handleBuyStats} disabled={remaining !== 0}>Buy</button>
                <button style={styles.confirmNo} onClick={() => { setShowBuyStats(false); setStatAlloc({ physicalAttack: 0, magicPower: 0, dexterity: 0, element: 0, mana: 0, stamina: 0 }); }}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      <Link to="/team" style={styles.backLink}>
        <ChevronLeft size={14} style={{ flexShrink: 0 }} />
        Back to Team
      </Link>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.header}>
        {/* Hex diagram — left of portrait */}
        <HexStatDiagram stats={hero.stats} growthStats={hero.growthStats} size={270} maxValue={100} />

        {/* Portrait + hero info — kept together */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <HeroPortrait imagePath={hero.imagePath} name={hero.name} size={160} tier={hero.tier} />
            <span className="hero-detail-lvl" style={styles.portraitLvlBadge}>{hero.level}</span>
            {/* XP bar overlay at portrait bottom */}
            <div style={styles.xpBarBg}>
              <div style={{ ...styles.xpBarFill, width: `${xpPct}%` }}>
                {xpPct > 5 && <div style={styles.xpShimmerDiv} />}
              </div>
              <div style={styles.xpBarCenter}>
                <span style={styles.xpBarCenterText}>{Math.round(xpPct)}%</span>
              </div>
            </div>
          </div>
          <div style={styles.headerInfo}>
            <div style={styles.heroNameRow}>
              <h2 style={styles.heroName} className="gradient-title">{hero.name}</h2>
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
            <CapBadge value={hero.capacity} />
            <div style={styles.equippedStatus}>
              {hero.isEquipped ? `Equipped — Slot ${hero.teamSlot}` : 'On Bench'}
            </div>
            <div style={styles.xpBlock}>
              <div style={styles.xpTopRow}>
                <span style={styles.xpLabel}>EXP</span>
                <span style={styles.xpFraction}>
                  <span style={styles.xpCurrent}>{hero.currentXp}</span>
                  <span style={styles.xpSep}> / </span>
                  <span style={styles.xpMax}>{hero.xpToNextLevel}</span>
                </span>
                <span style={styles.xpPctBadge}>{Math.round(xpPct)}%</span>
              </div>
              <div style={styles.xpTrackBg}>
                <div style={{ ...styles.xpTrackFill, width: `${xpPct}%` }}>
                  <div style={styles.xpTrackShine} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.bodyColumns}>

        {/* ── LEFT COLUMN: combat record + stats ── */}
        <div style={styles.leftCol}>

          {/* Combat Record header */}
          <div style={styles.battleHeader}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={styles.battleTitle}>Combat Record</span>
              <span style={styles.battleTotalTag}>{totalBattles} battles</span>
            </div>
            <div style={styles.winRateBlock}>
              <span style={{ ...styles.winRatePct, color: winRate >= 50 ? '#4ade80' : '#e94560' }}>
                {winRate}%
              </span>
              <span style={styles.winRateTag}>win rate</span>
            </div>
          </div>

          {/* Win rate bar */}
          <div style={styles.winRateTrack}>
            <div style={{
              ...styles.winRateFill,
              width: `${winRate}%`,
              background: winRate >= 60
                ? 'linear-gradient(90deg, #15803d, #4ade80)'
                : winRate >= 40
                ? 'linear-gradient(90deg, #b45309, #fbbf24)'
                : 'linear-gradient(90deg, #991b1b, #e94560)',
            }} />
          </div>

          {/* Stats grid */}
          <div style={styles.battleStatsGrid}>
            {([
              { icon: <Swords size={16} />, value: hero.clashesWon,                    label: 'Wins',             color: '#4ade80', rgb: '74,222,128' },
              { icon: <Skull size={16} />,  value: hero.clashesLost,                   label: 'Losses',           color: '#e94560', rgb: '233,69,96' },
              { icon: <Zap size={16} />,    value: hero.maxDamageDealt.toFixed(1),     label: 'Max DMG Dealt',    color: '#fbbf24', rgb: '251,191,36' },
              { icon: <ShieldAlert size={16} />, value: hero.maxDamageReceived.toFixed(1), label: 'Max DMG Taken', color: '#a78bfa', rgb: '167,139,250' },
              { icon: <TrendingUp size={16} />,  value: hero.currentWinStreak,         label: 'Win Streak',       color: '#4ade80', rgb: '74,222,128' },
              { icon: <TrendingDown size={16} />, value: hero.currentLossStreak,       label: 'Loss Streak',      color: '#e94560', rgb: '233,69,96' },
            ] as const).map(({ icon, value, label, color, rgb }) => (
              <div
                key={label}
                style={{
                  ...styles.battleStat,
                  borderTopColor: color,
                  boxShadow: `0 0 16px rgba(${rgb},0.08), inset 0 0 24px rgba(${rgb},0.025)`,
                }}
              >
                <div style={{ ...styles.battleStatIcon, backgroundColor: `rgba(${rgb},0.12)`, color }}>
                  {icon}
                </div>
                <div style={{ ...styles.battleStatValue, color }}>{value}</div>
                <div style={styles.battleStatLabel}>{label}</div>
              </div>
            ))}
          </div>

          {/* Stats Breakdown section header */}
          <div style={styles.statsSectionHeader}>
            <span style={styles.statsSectionDiamond}>◆</span>
            <span style={styles.statsSectionTitle}>Stats Breakdown</span>
            <div style={styles.statsSectionLine} />
          </div>

          <div style={styles.statsTable}>
            <div style={styles.tableHeader}>
              <span style={styles.thStat}>Stat</span>
              <span style={styles.th}>Base</span>
              <span style={{ ...styles.th, color: '#8b6fd4' }}>Bought</span>
              <span style={{ ...styles.th, color: '#4a7ab0' }}>Equip</span>
              <span style={styles.thTotal}>Total</span>
            </div>
            {Object.entries(STAT_LABELS).map(([key, label]) => {
              const statColor = STAT_COLORS[key] ?? '#a0a0b0';
              const baseGrowth = (hero.baseStats[key as keyof StatsType] ?? 0)
                + (hero.growthStats[key as keyof StatsType] ?? 0) * (hero.level - 1);
              const bought  = hero.purchasedStats?.[key as keyof StatsType] ?? 0;
              const allBonus = hero.bonusStats[key as keyof StatsType] ?? 0;
              const equip   = allBonus - bought;
              const total   = hero.stats[key as keyof StatsType] ?? 0;
              return (
                <div key={key} style={{ ...styles.tableRow, borderLeft: `3px solid ${statColor}33` }}>
                  <span style={{ ...styles.tdStat, color: statColor, fontWeight: 800 }}>{label}</span>
                  <span style={styles.td}>{baseGrowth.toFixed(1)}</span>
                  <span style={{ ...styles.td, color: bought > 0 ? '#a78bfa' : '#35354a', fontWeight: bought > 0 ? 700 : 400 }}>
                    {bought > 0 ? `+${bought.toFixed(0)}` : '—'}
                  </span>
                  <span style={{ ...styles.td, color: equip > 0 ? '#60a5fa' : '#35354a', fontWeight: equip > 0 ? 700 : 400 }}>
                    {equip > 0 ? `+${equip.toFixed(1)}` : '—'}
                  </span>
                  <span style={{ ...styles.tdTotal, color: statColor }}>{total.toFixed(1)}</span>
                </div>
              );
            })}
          </div>

          {/* ── Sub Stats ── */}
          <div style={styles.statsSectionHeader}>
            <span style={styles.statsSectionDiamond}>◆</span>
            <span style={styles.statsSectionTitle}>Sub Stats</span>
            <div style={styles.statsSectionLine} />
          </div>

          <div style={styles.subStatsGrid}>
            {SUB_STATS.map(({ key, label, color }) => {
              let value = '—';
              if (key === 'staminaEffectiveness' && hero) {
                value = `${Math.min(100, (hero.stats.stamina / (60 + hero.level * 2.5)) * 100).toFixed(1)}%`;
              }
              return (
                <div key={key} style={styles.subStatRow}>
                  <span style={{ ...styles.subStatDot, backgroundColor: color, boxShadow: `0 0 4px ${color}55` }} />
                  <span style={styles.subStatLabel}>{label}</span>
                  <span style={styles.subStatValue}>{value}</span>
                </div>
              );
            })}
          </div>

        </div>{/* end leftCol */}

        {/* ── RIGHT COLUMN: equipment + abilities ── */}
        <div style={styles.rightCol}>

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
                    <EquipmentTooltip
                      key={ab.templateId}
                      name={ab.name}
                      type="ability"
                      bonuses={ab.bonuses}
                      tier={ab.tier}
                      spell={ab.spell ?? null}
                    >
                      <div style={styles.abilityShopRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AbilityTierIcon tier={ab.tier} />
                          <div>
                            <span style={styles.abilityName}>{ab.name}</span>
                            <span style={styles.abilityCost}> — {ab.cost}g</span>
                          </div>
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
                    </EquipmentTooltip>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

        </div>{/* end rightCol */}
      </div>{/* end bodyColumns */}

      <div style={styles.sellHeroFooter}>
        <button
          style={{ ...styles.halveCapBtn, ...(hero.capacityHalved ? styles.halveCapBtnDone : {}) }}
          onClick={() => !hero.capacityHalved && setConfirmHalve(true)}
          disabled={hero.capacityHalved}
          title={hero.capacityHalved ? 'Capacity already halved' : undefined}
        >
          ½ Capacity
        </button>
        <span style={styles.halveCapPrice}>
          {hero.capacityHalved ? '✓ Done' : `💰 ${hero.sellPrice}g`}
        </span>

        <div style={styles.sellHeroSep} />

        <button style={styles.buyStatsBtn} onClick={() => setShowBuyStats(true)}>
          Buy Stats
        </button>
        <span style={styles.buyStatsPrice}>💰 {hero.nextStatCost}g</span>

        <div style={styles.sellHeroSep} />

        <button style={styles.sellHeroBtn} onClick={() => setConfirmHeroSell(true)}>
          Sell Hero
        </button>
        <span style={styles.sellHeroPrice}>💰 {hero.sellPrice}g</span>
      </div>
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
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    marginBottom: 20,
    padding: '6px 14px 6px 10px',
    borderRadius: 20,
    border: '1px solid rgba(167,139,250,0.25)',
    background: 'linear-gradient(135deg, rgba(167,139,250,0.07) 0%, rgba(96,165,250,0.05) 100%)',
    color: '#a78bfa',
    textDecoration: 'none',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s, background 0.15s',
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
    gap: 110,
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
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
  equippedStatus: {
    color: '#4ade80',
    fontSize: 13,
  },
  xpBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    marginTop: 2,
    minWidth: 180,
  },
  xpTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
  xpLabel: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: '0.12em',
    color: '#fbbf24',
    textTransform: 'uppercase' as const,
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 0 8px rgba(251,191,36,0.6)',
  },
  xpFraction: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    fontVariantNumeric: 'tabular-nums',
  },
  xpCurrent: {
    color: '#fde68a',
    fontWeight: 800,
  },
  xpSep: {
    color: '#44446a',
    fontWeight: 400,
  },
  xpMax: {
    color: '#666688',
    fontWeight: 600,
  },
  xpPctBadge: {
    fontSize: 10,
    fontWeight: 800,
    color: '#fbbf24',
    fontFamily: 'Inter, sans-serif',
    background: 'rgba(251,191,36,0.1)',
    border: '1px solid rgba(251,191,36,0.25)',
    borderRadius: 4,
    padding: '1px 5px',
    letterSpacing: '0.04em',
  },
  xpTrackBg: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 99,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  xpTrackFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #92400e, #d97706, #fbbf24)',
    borderRadius: 99,
    boxShadow: '0 0 6px rgba(251,191,36,0.7)',
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
  },
  xpTrackShine: {
    position: 'absolute' as const,
    top: 0, left: '-60%',
    width: '50%', height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
    animation: 'xpShimmer 2.6s ease-in-out infinite',
  },
  xpBarBg: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 4,
  },
  xpBarFill: {
    position: 'absolute' as const,
    top: 0, left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #78350f, #d97706, #fbbf24)',
    animation: 'xpBreathe 2.2s ease-in-out infinite',
    boxShadow: '0 0 6px rgba(251,191,36,0.8)',
    overflow: 'hidden',
    transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  xpShimmerDiv: {
    position: 'absolute' as const,
    top: 0, bottom: 0,
    width: '35%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)',
    animation: 'xpShimmer 2.6s ease-in-out infinite',
  },
  xpBarCenter: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as const,
    zIndex: 5,
  },
  xpBarCenterText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: '0.04em',
    fontFamily: 'Inter, sans-serif',
    textShadow: '0 1px 2px rgba(0,0,0,0.95)',
    lineHeight: 1,
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
  statsSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 14,
  },
  statsSectionDiamond: {
    color: '#a78bfa',
    fontSize: 10,
    lineHeight: 1,
    filter: 'drop-shadow(0 0 5px rgba(167,139,250,0.7))',
  },
  statsSectionTitle: {
    background: 'linear-gradient(90deg, #d0d0f0, #8080a8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    whiteSpace: 'nowrap' as const,
    fontFamily: 'Inter, sans-serif',
  },
  statsSectionLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, rgba(160,160,200,0.18), transparent)',
  },
  statsTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #1a1a38',
  },
  tableHeader: {
    display: 'flex',
    padding: '7px 12px',
    background: 'linear-gradient(90deg, #0e0e28 0%, #0b0b20 100%)',
    fontSize: 9,
    color: '#404065',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    fontWeight: 800,
    fontFamily: 'Inter, sans-serif',
    borderBottom: '1px solid #1a1a38',
  },
  tableRow: {
    display: 'flex',
    padding: '9px 12px',
    backgroundColor: '#12122a',
    borderBottom: '1px solid #1a1a35',
    fontSize: 13,
    borderLeft: '3px solid transparent',
  },
  thStat: { flex: 0.8 },
  th: { flex: 1.1, textAlign: 'center' as const },
  thTotal: { flex: 0.9, textAlign: 'right' as const, color: '#4a3a00' },
  tdStat: { flex: 0.8, color: '#a0a0b0', fontWeight: 500 },
  td: { flex: 1.1, textAlign: 'center' as const, color: '#e0e0e0' },
  tdTotal: { flex: 0.9, textAlign: 'right' as const, fontWeight: 700 },
  subStatsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 1,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #1a1a38',
    backgroundColor: '#1a1a38',
  },
  subStatRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 12px',
    backgroundColor: '#12122a',
  },
  subStatDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-block',
  },
  subStatLabel: {
    flex: 1,
    color: '#48486e',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.02em',
  },
  subStatValue: {
    color: '#28283e',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: 'Inter, sans-serif',
    fontVariantNumeric: 'tabular-nums' as const,
  },
  equipList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
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
  bodyColumns: {
    display: 'flex',
    gap: 36,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  leftCol: {
    flex: 1.1,
    minWidth: 0,
  },
  rightCol: {
    flex: 1,
    minWidth: 0,
    paddingTop: 4,
  },
  battleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24,
    marginBottom: 10,
  },
  battleTitle: {
    color: '#e0e0f0',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '0.02em',
    fontFamily: 'Inter, sans-serif',
  },
  battleTotalTag: {
    color: '#4a4a6a',
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
  },
  winRateBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: 1,
  },
  winRatePct: {
    fontSize: 24,
    fontWeight: 900,
    lineHeight: 1,
    fontFamily: 'Inter, sans-serif',
    fontVariantNumeric: 'tabular-nums',
  },
  winRateTag: {
    color: '#4a4a6a',
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontFamily: 'Inter, sans-serif',
  },
  winRateTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  winRateFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  battleStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 8,
  },
  battleStat: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderTop: '2px solid',
    borderRadius: 10,
    padding: '14px 10px 12px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
  },
  battleStatIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  battleStatValue: {
    fontSize: 28,
    fontWeight: 900,
    lineHeight: 1,
    fontFamily: 'Inter, sans-serif',
    fontVariantNumeric: 'tabular-nums',
  },
  battleStatLabel: {
    color: '#5a5a7a',
    fontSize: 9,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontWeight: 700,
    fontFamily: 'Inter, sans-serif',
  },
  sellHeroFooter: {
    marginTop: 36,
    paddingTop: 10,
    marginBottom: 32,
    borderTop: '1px solid rgba(233,69,96,0.12)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  halveCapBtn: {
    padding: '7px 16px',
    backgroundColor: 'rgba(167,139,250,0.08)',
    color: '#a78bfa',
    border: '1px solid rgba(167,139,250,0.35)',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  halveCapBtnDone: {
    opacity: 0.45,
    cursor: 'default',
    borderColor: 'rgba(167,139,250,0.12)',
  },
  halveCapPrice: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
  },
  buyStatsBtn: {
    padding: '7px 16px',
    backgroundColor: 'rgba(74,222,128,0.08)',
    color: '#4ade80',
    border: '1px solid rgba(74,222,128,0.35)',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  buyStatsPrice: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
  },
  sellHeroSep: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.07)',
    margin: '0 4px',
  },
  sellHeroPrice: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
  },
  sellHeroBtn: {
    padding: '7px 18px',
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: '1px solid #991b1b',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  allocBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  confirmOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  confirmCard: {
    backgroundColor: '#0d0d1f',
    border: '1px solid #991b1b',
    borderRadius: 12,
    padding: '28px 32px',
    maxWidth: 340,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
    textAlign: 'center' as const,
  },
  confirmTitle: { color: '#fca5a5', fontSize: 17, fontWeight: 700, letterSpacing: 0.5 },
  confirmHeroName: { color: '#e0e0e0', fontSize: 15, fontWeight: 600 },
  confirmSub: { color: '#6b7280', fontSize: 12, lineHeight: 1.5 },
  confirmBtns: { display: 'flex', gap: 10, marginTop: 4 },
  confirmYes: {
    padding: '8px 24px',
    backgroundColor: '#991b1b',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmNo: {
    padding: '8px 24px',
    backgroundColor: '#1f2937',
    color: '#9ca3af',
    border: '1px solid #374151',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
  },
  portraitLvlBadge: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    zIndex: 5,
    fontSize: 22,
    fontWeight: 900,
    fontStyle: 'italic',
    lineHeight: 1,
    letterSpacing: '-0.01em',
    fontFamily: 'Inter, sans-serif',
    pointerEvents: 'none' as const,
  },
};
