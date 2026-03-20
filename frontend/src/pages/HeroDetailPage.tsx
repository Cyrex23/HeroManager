import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { getHero, sellHero, halveCapacity, buyStats, allocateStats, resetHeroStats, changeSeal, changeElement } from '../api/playerApi';
import { getHeroEquipment, unequipItemFromSlot, sellInventoryItem, unequipAbilityFromSlot, equipItemToSlot, equipAbilityToSlot } from '../api/equipmentApi';
import { getTeamSetups, switchTeamSetup, renameTeamSetup } from '../api/teamApi';
import { usePlayer } from '../context/PlayerContext';
import type {
  HeroResponse,
  HeroStats as StatsType,
  HeroEquipmentResponse,
  HeroAbilityEntry,
  TeamSetupResponse,
} from '../types';
import HeroPortrait from '../components/Hero/HeroPortrait';
import CapBadge from '../components/Hero/CapBadge';
import HexStatDiagram from '../components/Hero/HexStatDiagram';
import ItemSlot from '../components/Equipment/ItemSlot';
import AbilitySlot from '../components/Equipment/AbilitySlot';
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
      @keyframes setupTabPulse {
        0%, 100% { box-shadow: 0 0 0px rgba(233,69,96,0); }
        50%       { box-shadow: 0 0 10px rgba(233,69,96,0.35); }
      }
      .hd-setup-tab-active { animation: setupTabPulse 2.8s ease-in-out infinite; }
      @keyframes hdStatGlowWhite  { 0%,100%{text-shadow:0 0 6px rgba(200,200,255,.15)} 50%{text-shadow:0 0 18px rgba(200,200,255,.65),0 0 36px rgba(200,200,255,.18)} }
      @keyframes hdStatGlowGreen  { 0%,100%{text-shadow:0 0 6px rgba(74,222,128,.2)}   50%{text-shadow:0 0 18px rgba(74,222,128,.8),0 0 36px rgba(74,222,128,.28)} }
      @keyframes hdStatGlowRed    { 0%,100%{text-shadow:0 0 6px rgba(233,69,96,.2)}    50%{text-shadow:0 0 18px rgba(233,69,96,.8),0 0 36px rgba(233,69,96,.28)} }
      @keyframes hdStatGlowGold   { 0%,100%{text-shadow:0 0 6px rgba(251,191,36,.2)}   50%{text-shadow:0 0 18px rgba(251,191,36,.85),0 0 36px rgba(251,191,36,.28)} }
      @keyframes hdStatGlowOrange { 0%,100%{text-shadow:0 0 6px rgba(249,115,22,.2)}   50%{text-shadow:0 0 18px rgba(249,115,22,.8),0 0 36px rgba(249,115,22,.28)} }
      @keyframes hdStatGlowIndigo { 0%,100%{text-shadow:0 0 6px rgba(129,140,248,.2)}  50%{text-shadow:0 0 18px rgba(129,140,248,.8),0 0 36px rgba(129,140,248,.28)} }
      @keyframes hdStatGlowYellow { 0%,100%{text-shadow:0 0 6px rgba(216,212,85,.2)}   50%{text-shadow:0 0 18px rgba(216,212,85,.8),0 0 36px rgba(216,212,85,.28)} }
      @keyframes hdStatGlowTeal   { 0%,100%{text-shadow:0 0 6px rgba(52,211,153,.2)}   50%{text-shadow:0 0 18px rgba(52,211,153,.8),0 0 36px rgba(52,211,153,.28)} }
      @keyframes hdStatGlowPurple { 0%,100%{text-shadow:0 0 6px rgba(167,139,250,.2)}  50%{text-shadow:0 0 18px rgba(167,139,250,.8),0 0 36px rgba(167,139,250,.28)} }
      @keyframes hdWinRateFlow { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.3)} }
      .hd-sv-white  { animation: hdStatGlowWhite  3.4s ease-in-out infinite; }
      .hd-sv-green  { animation: hdStatGlowGreen  3.4s ease-in-out infinite; }
      .hd-sv-red    { animation: hdStatGlowRed    3.4s ease-in-out infinite; }
      .hd-sv-gold   { animation: hdStatGlowGold   3.4s ease-in-out infinite; }
      .hd-sv-orange { animation: hdStatGlowOrange 3.4s ease-in-out infinite; }
      .hd-sv-indigo { animation: hdStatGlowIndigo 3.4s ease-in-out infinite; }
      .hd-sv-yellow { animation: hdStatGlowYellow 3.4s ease-in-out infinite; }
      .hd-sv-teal   { animation: hdStatGlowTeal   3.4s ease-in-out infinite; }
      .hd-sv-purple { animation: hdStatGlowPurple 3.4s ease-in-out infinite; }
      .hd-wr-fill   { animation: hdWinRateFlow    2.8s ease-in-out infinite; }
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

const INV_STAT_CFG: Record<string, { label: string; color: string; icon: string }> = {
  physicalAttack: { label: 'PA',   color: '#f97316', icon: '⚔'  },
  magicPower:     { label: 'MP',   color: '#60a5fa', icon: '✦'  },
  dexterity:      { label: 'Dex',  color: '#4ade80', icon: '◈'  },
  mana:           { label: 'Mana', color: '#818cf8', icon: '◆'  },
  stamina:        { label: 'Stam', color: '#fb923c', icon: '◉'  },
  element:        { label: 'Elem', color: '#facc15', icon: '⚡' },
};

type InvItemTier = 'COMMON' | 'RARE' | 'LEGENDARY';
const INV_TIER_CFG: Record<InvItemTier, { label: string; color: string; glow: string; bg: string }> = {
  COMMON:    { label: 'Common',    color: '#9ca3af', glow: 'rgba(156,163,175,0.18)', bg: 'linear-gradient(160deg, rgba(156,163,175,0.07) 0%, rgba(26,26,46,0.9) 100%)' },
  RARE:      { label: 'Rare',      color: '#a78bfa', glow: 'rgba(167,139,250,0.28)', bg: 'linear-gradient(160deg, rgba(167,139,250,0.1) 0%, rgba(26,26,46,0.9) 100%)'  },
  LEGENDARY: { label: 'Legendary', color: '#f97316', glow: 'rgba(249,115,22,0.32)',  bg: 'linear-gradient(160deg, rgba(249,115,22,0.12) 0%, rgba(26,26,46,0.9) 100%)' },
};

const INV_ITEM_ICON: Record<string, string> = {
  'Training Weights': '🏋️', 'Iron Kunai': '🗡️', 'Chakra Scroll': '📜',
  'Mana Crystal': '💎', 'Swift Boots': '👟', 'Warrior Armor': '🛡️',
  'Mystic Tome': '📖', 'Shadow Cloak': '🌑', 'Legendary Blade': '⚔️', 'Sage Staff': '📿',
};

function getInvItemTier(sellPrice: number): InvItemTier {
  if (sellPrice >= 300) return 'LEGENDARY';
  if (sellPrice >= 150) return 'RARE';
  return 'COMMON';
}

const SEAL_STATS_TABLE: Record<number, [number, number, number]> = {
  [-10]: [35, 25,  1], [-9]: [33, 24,  1], [-8]: [32, 23,  2], [-7]: [30, 21,  2],
  [-6]:  [28, 20,  3], [-5]: [26, 19,  4], [-4]: [25, 18,  5], [-3]: [23, 16,  5],
  [-2]:  [21, 15,  6], [-1]: [19, 14,  7],  [0]: [18, 13,  7],  [1]: [16, 11,  8],
   [2]:  [14, 10,  8],  [3]: [12,  8,  9],  [4]: [11,  8, 10],  [5]: [ 9,  7, 11],
   [6]:  [ 7,  6, 11],  [7]: [ 5,  5, 12],  [8]: [ 4,  4, 13],  [9]: [ 2,  3, 14],
  [10]:  [ 2,  1, 15],
};

const SUB_STATS: { key: string; label: string; color: string }[] = [
  { key: 'attack',           label: 'Attack',            color: '#f97316' },
  { key: 'magicProficiency', label: 'Magic Proficiency', color: '#60a5fa' },
  { key: 'spellMastery',     label: 'Spell Mastery',     color: '#c084fc' },
  { key: 'spellActivation',  label: 'Spell Activation',  color: '#e879f9' },
  { key: 'dexProficiency',   label: 'Dex Proficiency',   color: '#4ade80' },
  { key: 'dexPosture',       label: 'Dex Posture',       color: '#34d399' },
  { key: 'dexMaxPosture',    label: 'Dex Max Posture',   color: '#6ee7b7' },
  { key: 'criticalChance',   label: 'Critical Chance',   color: '#fb923c' },
  { key: 'critDamage',       label: 'Critical Damage',   color: '#fbbf24' },
  { key: 'expBonus',         label: 'Exp Bonus',         color: '#a78bfa' },
  { key: 'goldBonus',        label: 'Gold Bonus',        color: '#fde68a' },
  { key: 'itemDiscovery',    label: 'Item Discovery',    color: '#22d3ee' },
  { key: 'physicalImmunity', label: 'Physical Immunity', color: '#94a3b8' },
  { key: 'magicImmunity',    label: 'Magic Immunity',    color: '#818cf8' },
  { key: 'dexEvasiveness',      label: 'Dex Evasiveness',      color: '#86efac' },
  { key: 'manaRecharge',        label: 'Mana Recharge',        color: '#38bdf8' },
  { key: 'spellLearn',          label: 'Spell Learn',          color: '#a78bfa' },
  { key: 'spellCopy',           label: 'Spell Copy',           color: '#f87171' },
  { key: 'spellAbsorb',         label: 'Spell Absorb',         color: '#34d399' },
  { key: 'rot',                 label: 'Rot',                  color: '#4ade80' },
  { key: 'tenacity',            label: 'Tenacity',             color: '#06b6d4' },
  { key: 'fatigueRecovery',     label: 'Fatigue Recovery',     color: '#34d399' },
  { key: 'cleanse',             label: 'Cleanse',              color: '#a5f3fc' },
  { key: 'offPositioning',      label: 'Off-Positioning',      color: '#fbbf24' },
  { key: 'offSlotPenalty',      label: 'Off-slot Penalty',     color: '#f87171' },
  { key: 'staminaEffectiveness', label: 'Stamina Effectiveness', color: '#fb7185' },
];

export default function HeroDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { player, fetchPlayer } = usePlayer();
  const [hero, setHero] = useState<HeroResponse | null>(null);
  const [equipment, setEquipment] = useState<HeroEquipmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activePicker, setActivePicker] = useState<number | null>(null);
  const [activeItemPicker, setActiveItemPicker] = useState<number | null>(null);
  const [confirmHeroSell, setConfirmHeroSell] = useState(false);
  const [confirmHalve, setConfirmHalve] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSeal, setConfirmSeal] = useState<'up' | 'down' | null>(null);
  const [sealPanelOpen, setSealPanelOpen] = useState(false);
  const [hoveredSeal, setHoveredSeal] = useState<number | null>(null);
  const [sealBtnHovered, setSealBtnHovered] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showSubStats, setShowSubStats] = useState(false);
  const [statAlloc, setStatAlloc] = useState<Record<string, number>>({
    physicalAttack: 0, magicPower: 0, dexterity: 0, element: 0, mana: 0, stamina: 0,
  });
  const [setups, setSetups] = useState<TeamSetupResponse[]>([]);
  const [hoveredSetupIdx, setHoveredSetupIdx] = useState<number | null>(null);
  const [setupSwitching, setSetupSwitching] = useState(false);
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [confirmElement, setConfirmElement] = useState(false);
  const [confirmBuyStats, setConfirmBuyStats] = useState(false);

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

  useEffect(() => {
    getTeamSetups().then(setSetups).catch(console.error);
  }, []);

  async function handleSwitchSetup(idx: number) {
    if (setupSwitching) return;
    setSetupSwitching(true);
    try {
      await switchTeamSetup(idx);
      window.location.reload();
    } catch {
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
    } catch {
      console.error('Failed to rename setup');
    }
  }

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
    setError(''); setMessage('');
    try {
      const res = await buyStats(heroId);
      setMessage(res.message);
      await Promise.all([refresh(), fetchPlayer()]);
    } catch {
      setError('Failed to buy stats.');
    }
  }

  async function handleAllocateStats() {
    const total = Object.values(statAlloc).reduce((a, b) => a + b, 0);
    if (total === 0) { setError('Allocate at least 1 point.'); return; }
    setError(''); setMessage('');
    try {
      const res = await allocateStats(heroId, statAlloc);
      setMessage(res.message);
      setStatAlloc({ physicalAttack: 0, magicPower: 0, dexterity: 0, element: 0, mana: 0, stamina: 0 });
      setShowAllocate(false);
      await Promise.all([refresh(), fetchPlayer()]);
    } catch {
      setError('Failed to allocate stats.');
    }
  }

  async function handleResetStats() {
    setError(''); setMessage('');
    try {
      const res = await resetHeroStats(heroId);
      setMessage(res.message);
      setConfirmReset(false);
      await Promise.all([refresh(), fetchPlayer()]);
    } catch {
      setError('Failed to reset stats.');
      setConfirmReset(false);
    }
  }

  async function handleChangeSeal(direction: 'up' | 'down') {
    setError(''); setMessage('');
    try {
      const res = await changeSeal(heroId, direction);
      setMessage(res.message);
      await refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change seal.';
      setError(msg);
    }
  }

  async function handleChangeElement() {
    if (!selectedElement) return;
    setError(''); setMessage('');
    try {
      const res = await changeElement(heroId, selectedElement);
      setMessage(res.message);
      setSelectedElement(null);
      await Promise.all([refresh(), fetchPlayer()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change element.';
      setError(msg);
    }
  }

  if (loading) return <div style={{ color: '#a0a0b0', display: 'flex', alignItems: 'center', gap: 10 }}><span className="spinner" style={{ width: 18, height: 18 }} />Loading hero...</div>;
  if (!hero) return <div style={{ color: '#e94560' }}>Hero not found.</div>;

  const xpPct = hero.xpToNextLevel > 0
    ? Math.min((hero.currentXp / hero.xpToNextLevel) * 100, 100) : 0;

  const totalBattles = hero.clashesWon + hero.clashesLost;
  const winRate = totalBattles > 0 ? Math.round((hero.clashesWon / totalBattles) * 100) : 0;
  const power = Object.values(hero.stats).reduce((sum: number, v: number) => sum + v, 0);

  return (
    <div onClick={() => { setActivePicker(null); setActiveItemPicker(null); }}>
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

      {confirmReset && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmCard}>
            <div style={styles.confirmTitle}>Reset Stats?</div>
            <div style={styles.confirmHeroName}>{hero.name}</div>
            <div style={styles.confirmSub}>
              All allocated stat points will be returned to the unallocated pool.
              <br />Costs <strong style={{ color: '#fbbf24' }}>{hero.nextResetCost}g</strong>
              {hero.statResetCount > 0 && <> · next reset: <strong style={{ color: '#fbbf24' }}>{hero.nextResetCost * 2}g</strong></>}.
            </div>
            <div style={styles.confirmBtns}>
              <button style={styles.confirmYes} onClick={handleResetStats}>Reset</button>
              <button style={styles.confirmNo} onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmSeal && hero && (() => {
        const nextSeal = confirmSeal === 'up' ? hero.seal + 1 : hero.seal - 1;
        const [mp, cc, sa] = SEAL_STATS_TABLE[nextSeal] ?? [18, 13, 7];
        const sealColor = nextSeal > 0 ? '#4ade80' : nextSeal < 0 ? '#e94560' : '#a0a0b0';
        return (
          <div style={styles.confirmOverlay}>
            <div style={styles.confirmCard}>
              <div style={styles.confirmTitle}>Change Seal?</div>
              <div style={styles.confirmHeroName}>{hero.name}</div>
              <div style={styles.confirmSub}>
                Seal will change from <strong style={{ color: hero.seal > 0 ? '#4ade80' : hero.seal < 0 ? '#e94560' : '#a0a0b0' }}>{hero.seal > 0 ? `+${hero.seal}` : hero.seal}</strong>
                {' → '}
                <strong style={{ color: sealColor }}>{nextSeal > 0 ? `+${nextSeal}` : nextSeal}</strong>
                <br />
                <span style={{ color: '#60a5fa' }}>Magic Prof.</span>: {mp}% &nbsp;·&nbsp;
                <span style={{ color: '#fb923c' }}>Crit</span>: {cc}% &nbsp;·&nbsp;
                <span style={{ color: '#e879f9' }}>Spell Act.</span>: {sa}%
                <br />
                <span style={{ color: '#f97316', fontSize: 11 }}>This uses 1 seal point and cannot be undone for free.</span>
              </div>
              <div style={styles.confirmBtns}>
                <button style={{ ...styles.confirmYes, backgroundColor: '#1a3a20', color: '#4ade80', border: '1px solid #4ade8044' }}
                  onClick={() => { setConfirmSeal(null); handleChangeSeal(confirmSeal); }}>
                  Confirm
                </button>
                <button style={styles.confirmNo} onClick={() => setConfirmSeal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmElement && selectedElement && hero && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmCard}>
            <div style={styles.confirmTitle}>Change Element?</div>
            <div style={styles.confirmHeroName}>{hero.name}</div>
            <div style={styles.confirmSub}>
              Change element from{' '}
              <strong style={{ color: ELEMENT_COLOR[hero.element ?? ''] ?? '#a0a0b0' }}>
                {ELEMENT_SYMBOL[hero.element ?? ''] ?? hero.element ?? 'None'}
              </strong>
              {' → '}
              <strong style={{ color: ELEMENT_COLOR[selectedElement] }}>
                {ELEMENT_SYMBOL[selectedElement]} {selectedElement.charAt(0) + selectedElement.slice(1).toLowerCase()}
              </strong>
              <br />
              Costs <strong style={{ color: '#fbbf24' }}>
                {hero.tier === 'LEGENDARY' ? 300 : hero.tier === 'ELITE' ? 150 : 75}g
              </strong>
            </div>
            <div style={styles.confirmBtns}>
              <button style={{ ...styles.confirmYes, backgroundColor: '#1a2a3a', color: ELEMENT_COLOR[selectedElement], border: `1px solid ${ELEMENT_COLOR[selectedElement]}44` }}
                onClick={() => { setConfirmElement(false); handleChangeElement(); }}>
                Confirm
              </button>
              <button style={styles.confirmNo} onClick={() => setConfirmElement(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmBuyStats && hero && (
        <div style={styles.confirmOverlay}>
          <div style={styles.confirmCard}>
            <div style={styles.confirmTitle}>Buy Stats?</div>
            <div style={styles.confirmHeroName}>{hero.name}</div>
            <div style={styles.confirmSub}>
              Purchase +1 stat point to allocate.<br />
              Costs <strong style={{ color: '#fbbf24' }}>{hero.nextStatCost}g</strong>
            </div>
            <div style={styles.confirmBtns}>
              <button style={styles.confirmYes} onClick={() => { setConfirmBuyStats(false); handleBuyStats(); }}>
                Buy
              </button>
              <button style={styles.confirmNo} onClick={() => setConfirmBuyStats(false)}>Cancel</button>
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

      {showAllocate && (() => {
        const STAT_ROWS: { key: string; label: string; color: string }[] = [
          { key: 'physicalAttack', label: 'PA',   color: '#f97316' },
          { key: 'magicPower',     label: 'MP',   color: '#60a5fa' },
          { key: 'dexterity',      label: 'DEX',  color: '#4ade80' },
          { key: 'element',        label: 'ELEM', color: '#facc15' },
          { key: 'mana',           label: 'MANA', color: '#a78bfa' },
          { key: 'stamina',        label: 'STAM', color: '#fb7185' },
        ];
        const pool = hero.unallocatedStatPoints;
        const spent = Object.values(statAlloc).reduce((a, b) => a + b, 0);
        const remaining = pool - spent;
        return (
          <div style={styles.confirmOverlay} onClick={() => setShowAllocate(false)}>
            <div style={{ ...styles.confirmCard, maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
              <div style={styles.confirmTitle}>Allocate Points</div>
              <div style={{ color: '#a0a0b0', fontSize: 12, marginBottom: 4 }}>
                <strong style={{ color: '#4ade80' }}>{pool}</strong> unallocated point{pool !== 1 ? 's' : ''}
                &nbsp;·&nbsp; <strong style={{ color: remaining > 0 ? '#fbbf24' : '#4ade80' }}>{remaining}</strong> remaining
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
                <button style={{ ...styles.confirmYes, opacity: spent > 0 ? 1 : 0.4 }} onClick={handleAllocateStats} disabled={spent === 0}>Allocate</button>
                <button style={styles.confirmNo} onClick={() => { setShowAllocate(false); setStatAlloc({ physicalAttack: 0, magicPower: 0, dexterity: 0, element: 0, mana: 0, stamina: 0 }); }}>Cancel</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={{ marginBottom: 20 }}>
        <Link to="/team" style={{ ...styles.backLink, marginBottom: setups.length > 0 ? 14 : 0 }}>
          <ChevronLeft size={14} style={{ flexShrink: 0 }} />
          Back to Team
        </Link>

        {/* ── Team Setup Tabs ── */}
        {setups.length > 0 && (
          <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid rgba(233,69,96,0.18)', paddingBottom: 0 }}>
            {setups.map((setup) => {
              const isActive = setup.isActive;
              const isHovered = hoveredSetupIdx === setup.setupIndex;
              const isRenaming = renamingIdx === setup.setupIndex;
              return (
                <div
                  key={setup.setupIndex}
                  className={isActive ? 'hd-setup-tab-active' : undefined}
                  style={{
                    position: 'relative',
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 18px',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(233,69,96,0.18) 0%, rgba(180,30,60,0.12) 100%)'
                      : isHovered ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.02)',
                    border: isActive
                      ? '1px solid rgba(233,69,96,0.5)'
                      : isHovered ? '1px solid rgba(255,255,255,0.13)' : '1px solid rgba(255,255,255,0.06)',
                    borderBottom: isActive ? '2px solid #e94560' : isHovered ? '2px solid rgba(233,69,96,0.2)' : '2px solid transparent',
                    color: isActive ? '#ffffff' : isHovered ? '#8888cc' : '#5050a0',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', letterSpacing: '0.03em',
                    marginBottom: -2, borderRadius: '7px 7px 0 0',
                    transition: 'all 0.18s ease', userSelect: 'none' as const,
                    opacity: setupSwitching && !isActive ? 0.5 : 1,
                    pointerEvents: setupSwitching && !isActive ? 'none' : 'auto',
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
                      style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(233,69,96,0.6)', borderRadius: 4, color: '#fff', fontSize: 13, padding: '2px 6px', outline: 'none', width: 110 }}
                      maxLength={30}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span>{setup.name}</span>
                      {(isActive || isHovered) && (
                        <span
                          style={{ fontSize: 12, color: 'rgba(233,69,96,0.55)', cursor: 'pointer', lineHeight: 1, marginLeft: 2 }}
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
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.header}>
        {/* Hex diagram — left of portrait */}
        <HexStatDiagram stats={hero.stats} growthStats={hero.growthStats} size={270} maxValue={100} />

        {/* Portrait + hero info — kept together */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
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
            <div style={{ color: '#e94560', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', lineHeight: 1, filter: 'drop-shadow(0 0 6px rgba(233,69,96,0.5))' }}>
              ⚔ {Math.round(power)}
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
            {/* ── Seal (slide-down) ── */}
            {(() => {
              const seal = hero.seal ?? 0;
              const pts = hero.sealPoints ?? 0;
              const previewSeal = hoveredSeal ?? seal;
              const [mp, cc, sa] = SEAL_STATS_TABLE[previewSeal] ?? [18, 13, 7];
              const sealColor = seal > 0 ? '#4ade80' : seal < 0 ? '#e94560' : '#a0a0b0';
              const canUp = pts > 0 && seal < 10;
              const canDown = pts > 0 && seal > -10;
              // Damage range
              const heroPa = hero.stats.physicalAttack ?? 0;
              const heroDex = hero.stats.dexterity ?? 0;
              const heroMp = hero.stats.magicPower ?? 0;
              const rFactor = (10 - previewSeal) / 20; // 1.0 at seal -10 → 0.0 at seal +10
              const taijutsu = heroPa / 2;
              const bukijutsu = heroDex * 0.33;
              const mpRangeMin = heroMp * 0.5 * (1 - rFactor);
              const mpRangeMax = heroMp * 0.5 * (1 + rFactor);
              const dmgMin = Math.round(taijutsu + bukijutsu + mpRangeMin);
              const dmgMax = Math.round(taijutsu + bukijutsu + mpRangeMax);
              return (
                <div style={{ marginTop: 8 }}>
                  {/* Toggle button */}
                  <button
                    onClick={() => setSealPanelOpen(p => !p)}
                    onMouseEnter={() => setSealBtnHovered(true)}
                    onMouseLeave={() => setSealBtnHovered(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 14px', borderRadius: 6,
                      background: sealPanelOpen
                        ? 'linear-gradient(135deg, rgba(74,222,128,0.12), rgba(74,222,128,0.06))'
                        : sealBtnHovered
                          ? 'linear-gradient(135deg, rgba(160,120,255,0.14), rgba(96,165,250,0.08))'
                          : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                      border: `1px solid ${sealPanelOpen ? 'rgba(74,222,128,0.35)' : sealBtnHovered ? 'rgba(160,120,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: sealBtnHovered && !sealPanelOpen ? '0 0 12px rgba(160,120,255,0.25), inset 0 0 8px rgba(96,165,250,0.08)' : 'none',
                      transform: sealBtnHovered ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, color: sealColor, fontWeight: 900, fontFamily: 'Inter, sans-serif', minWidth: 24, textAlign: 'center' as const }}>
                      {seal > 0 ? `+${seal}` : seal}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: sealBtnHovered ? '#d0c0ff' : '#c0c0d8', fontFamily: 'Inter, sans-serif', transition: 'color 0.2s' }}>
                      Change Seal
                    </span>
                    {pts > 0 && (
                      <span style={{
                        fontSize: 13, fontWeight: 900, color: '#fbbf24',
                        textShadow: '0 0 8px rgba(251,191,36,0.9), 0 0 16px rgba(251,191,36,0.5)',
                        filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.7))',
                        fontFamily: 'Inter, sans-serif', lineHeight: 1,
                      }}>
                        {pts}
                      </span>
                    )}
                  </button>
                  {/* Slide-down panel */}
                  <div style={{ maxHeight: sealPanelOpen ? '260px' : '0', overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.22,1,0.36,1)' }}>
                    <div style={{ paddingTop: 10, paddingBottom: 4, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                      {/* Seal level picker */}
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' as const }}>
                        {Array.from({ length: 21 }, (_, i) => i - 10).map(s => {
                          const sc = s > 0 ? '#4ade80' : s < 0 ? '#e94560' : '#a0a0b0';
                          const isCurrent = s === seal;
                          const isAdjacent = (s === seal + 1 && canUp) || (s === seal - 1 && canDown);
                          const isHov = s === hoveredSeal;
                          return (
                            <button
                              key={s}
                              onMouseEnter={() => setHoveredSeal(s)}
                              onMouseLeave={() => setHoveredSeal(null)}
                              onClick={() => isAdjacent && setConfirmSeal(s > seal ? 'up' : 'down')}
                              style={{
                                padding: '3px 7px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                border: isCurrent ? `1px solid ${sc}88` : isHov ? `1px solid ${sc}44` : '1px solid rgba(255,255,255,0.06)',
                                background: isCurrent ? `${sc}18` : isHov && isAdjacent ? `${sc}10` : 'rgba(255,255,255,0.02)',
                                color: isCurrent ? sc : isAdjacent ? '#7070a0' : '#2a2a4a',
                                cursor: isAdjacent ? 'pointer' : 'default',
                                boxShadow: isCurrent ? `0 0 6px ${sc}33` : 'none',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {s > 0 ? `+${s}` : s}
                            </button>
                          );
                        })}
                      </div>
                      {/* Stat preview + Damage range */}
                      <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
                        {/* Sub stat chips */}
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1 }}>
                          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
                            <span style={{ color: '#60a5fa', fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{mp}%</span>
                            <span style={{ color: '#60a5fa77', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', marginTop: 2 }}>MAGIC PROF</span>
                          </div>
                          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
                            <span style={{ color: '#fb923c', fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{cc}%</span>
                            <span style={{ color: '#fb923c77', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', marginTop: 2 }}>CRIT CHANCE</span>
                          </div>
                          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
                            <span style={{ color: '#e879f9', fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{sa}%</span>
                            <span style={{ color: '#e879f977', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', marginTop: 2 }}>SPELL ACT.</span>
                          </div>
                        </div>
                        {/* Damage range */}
                        <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 3 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#44446a', textTransform: 'uppercase' as const }}>Damage Range</span>
                          <span style={{ fontSize: 16, fontWeight: 900, color: '#f97316', lineHeight: 1, fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' as const }}>
                            {dmgMin === dmgMax ? dmgMin : `${dmgMin} – ${dmgMax}`}
                          </span>
                          <div style={{ display: 'flex', gap: 7, fontSize: 11, alignItems: 'center' }}>
                            <span style={{ color: '#6a6a8a' }}>PA <span style={{ color: '#f97316cc', fontWeight: 700 }}>{Math.round(taijutsu)}</span></span>
                            <span style={{ color: '#33334a' }}>·</span>
                            <span style={{ color: '#6a6a8a' }}>DEX <span style={{ color: '#4ade80cc', fontWeight: 700 }}>{Math.round(bukijutsu)}</span></span>
                            <span style={{ color: '#33334a' }}>·</span>
                            <span style={{ color: '#6a6a8a' }}>MP <span style={{ color: '#60a5facc', fontWeight: 700 }}>{Math.round(mpRangeMin)}–{Math.round(mpRangeMax)}</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <div style={styles.bodyColumns}>

        {/* ── LEFT COLUMN: combat record + stats ── */}
        <div style={styles.leftCol}>

          {/* ── Combat Record ── */}
          <div style={styles.combatSection}>
            <div style={styles.hdCombatHeader}>
              <span style={styles.hdCombatTitle}>⚔ Combat Record</span>
              <div style={styles.hdCombatLine} />
              <span style={styles.battleTotalTag}>{totalBattles} battles</span>
            </div>

            {/* Overview */}
            <div style={styles.hdGroupLabel}>Overview</div>
            <div style={styles.hdStatCardsRow}>
              {([
                { value: String(hero.clashesWon),                                     label: 'Wins',        color: '#4ade80', glow: 'hd-sv-green',  barPct: null },
                { value: String(hero.clashesLost),                                    label: 'Losses',      color: '#e94560', glow: 'hd-sv-red',    barPct: null },
                { value: `${winRate}%`,                                               label: 'Win Rate',    color: '#fbbf24', glow: 'hd-sv-gold',   barPct: winRate },
                { value: String(totalBattles),                                        label: 'Battles',     color: '#a0a0cc', glow: 'hd-sv-white',  barPct: null },
              ] as const).map(({ value, label, color, glow, barPct }) => (
                <div key={label} style={{ ...styles.hdStatCard, borderTop: `3px solid ${color}`, background: `linear-gradient(160deg,rgba(0,0,0,0) 0%,${color}09 100%)`, boxShadow: `0 2px 16px rgba(0,0,0,.35),inset 0 1px 0 ${color}18` }}>
                  <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg,transparent,${color}88,transparent)` }} />
                  <span style={{ ...styles.hdStatCardLabel, color: `${color}aa` }}>{label}</span>
                  <span className={glow} style={{ ...styles.hdStatCardValue, color }}>{value}</span>
                  {barPct !== null && (
                    <div style={styles.hdWrBarBg}>
                      <div className="hd-wr-fill" style={{ ...styles.hdWrBarFill, width: `${barPct}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Streaks */}
            <div style={styles.hdGroupLabel}>Streaks</div>
            <div style={styles.hdStatCardsRow}>
              {([
                { value: String(hero.currentWinStreak),  label: 'Win Streak',       color: '#4ade80', glow: 'hd-sv-green' },
                { value: String(hero.bestWinStreak),     label: 'Best Win Streak',  color: '#4ade80', glow: 'hd-sv-green' },
                { value: String(hero.currentLossStreak), label: 'Loss Streak',      color: '#e94560', glow: 'hd-sv-red'   },
                { value: String(hero.bestLossStreak),    label: 'Best Loss Streak', color: '#e94560', glow: 'hd-sv-red'   },
              ] as const).map(({ value, label, color, glow }) => (
                <div key={label} style={{ ...styles.hdStatCard, borderTop: `3px solid ${color}`, background: `linear-gradient(160deg,rgba(0,0,0,0) 0%,${color}09 100%)`, boxShadow: `0 2px 16px rgba(0,0,0,.35),inset 0 1px 0 ${color}18` }}>
                  <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg,transparent,${color}88,transparent)` }} />
                  <span style={{ ...styles.hdStatCardLabel, color: `${color}aa` }}>{label}</span>
                  <span className={glow} style={{ ...styles.hdStatCardValue, color }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Best Hits */}
            <div style={styles.hdGroupLabel}>Best Hits</div>
            <div style={styles.hdStatCardsRow}>
              {([
                { value: hero.maxDamageDealt.toFixed(1),    label: 'Max Dealt',   color: '#fbbf24', glow: 'hd-sv-gold'   },
                { value: hero.maxDamageReceived.toFixed(1), label: 'Max Taken',   color: '#a78bfa', glow: 'hd-sv-purple' },
                { value: hero.maxPaDamage.toFixed(1),       label: 'Best PA',     color: '#f97316', glow: 'hd-sv-orange' },
                { value: hero.maxMpDamage.toFixed(1),       label: 'Best MP',     color: '#818cf8', glow: 'hd-sv-indigo' },
                { value: hero.maxDexDamage.toFixed(1),      label: 'Best DEX',    color: '#d8d455', glow: 'hd-sv-yellow' },
                { value: hero.maxElemDamage.toFixed(1),     label: 'Best Elem',   color: '#34d399', glow: 'hd-sv-teal'   },
              ] as const).map(({ value, label, color, glow }) => (
                <div key={label} style={{ ...styles.hdStatCard, borderTop: `3px solid ${color}`, background: `linear-gradient(160deg,rgba(0,0,0,0) 0%,${color}09 100%)`, boxShadow: `0 2px 16px rgba(0,0,0,.35),inset 0 1px 0 ${color}18` }}>
                  <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg,transparent,${color}88,transparent)` }} />
                  <span style={{ ...styles.hdStatCardLabel, color: `${color}aa` }}>{label}</span>
                  <span className={glow} style={{ ...styles.hdStatCardValue, color }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Total Damage */}
            <div style={styles.hdGroupLabel}>Total Damage</div>
            <div style={styles.hdStatCardsRow}>
              {([
                { value: hero.totalPaDamage.toFixed(1),   label: 'Total PA',    color: '#f97316', glow: 'hd-sv-orange' },
                { value: hero.totalMpDamage.toFixed(1),   label: 'Total MP',    color: '#818cf8', glow: 'hd-sv-indigo' },
                { value: hero.totalDexDamage.toFixed(1),  label: 'Total DEX',   color: '#d8d455', glow: 'hd-sv-yellow' },
                { value: hero.totalElemDamage.toFixed(1), label: 'Total Elem',  color: '#34d399', glow: 'hd-sv-teal'   },
              ] as const).map(({ value, label, color, glow }) => (
                <div key={label} style={{ ...styles.hdStatCard, borderTop: `3px solid ${color}`, background: `linear-gradient(160deg,rgba(0,0,0,0) 0%,${color}09 100%)`, boxShadow: `0 2px 16px rgba(0,0,0,.35),inset 0 1px 0 ${color}18` }}>
                  <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg,transparent,${color}88,transparent)` }} />
                  <span style={{ ...styles.hdStatCardLabel, color: `${color}aa` }}>{label}</span>
                  <span className={glow} style={{ ...styles.hdStatCardValue, color }}>{value}</span>
                </div>
              ))}
            </div>
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
              <span style={{ ...styles.th, color: '#22d3ee' }}>Summon</span>
              <span style={styles.thTotal}>Total</span>
            </div>
            {Object.entries(STAT_LABELS).map(([key, label]) => {
              const statColor = STAT_COLORS[key] ?? '#a0a0b0';
              const baseGrowth = (hero.baseStats[key as keyof StatsType] ?? 0)
                + (hero.growthStats[key as keyof StatsType] ?? 0) * (hero.level - 1);
              const bought  = hero.purchasedStats?.[key as keyof StatsType] ?? 0;
              const allBonus = hero.bonusStats[key as keyof StatsType] ?? 0;
              const equip   = allBonus - bought;
              const summon  = (hero.summonStats?.[key as keyof StatsType] ?? 0) as number;
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
                  <span style={{ ...styles.td, color: summon > 0 ? '#22d3ee' : '#35354a', fontWeight: summon > 0 ? 700 : 400 }}>
                    {summon > 0 ? `+${summon.toFixed(1)}` : '—'}
                  </span>
                  <span style={{ ...styles.tdTotal, color: statColor }}>{total.toFixed(1)}</span>
                </div>
              );
            })}
          </div>

          {/* ── Sub Stats ── */}
          <div
            style={{ ...styles.statsSectionHeader, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setShowSubStats(prev => !prev)}
          >
            <span style={styles.statsSectionDiamond}>◆</span>
            <span style={styles.statsSectionTitle}>Sub Stats</span>
            <div style={styles.statsSectionLine} />
            <ChevronDown size={14} style={{ color: '#6060a0', flexShrink: 0, transition: 'transform 0.25s', transform: showSubStats ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </div>

          <div style={{ overflow: 'hidden', maxHeight: showSubStats ? '2000px' : '0px', transition: 'max-height 0.35s ease', }}>
          <div style={styles.statsTable}>
            {/* Sub stats header */}
            <div style={styles.tableHeader}>
              <span style={styles.thStat}>Stat</span>
              <span style={styles.th}>Base</span>
              <span style={{ ...styles.th, color: '#8b6fd4' }}>Bought</span>
              <span style={{ ...styles.th, color: '#4a7ab0' }}>Equip</span>
              <span style={{ ...styles.th, color: '#22d3ee' }}>Summon</span>
              <span style={styles.thTotal}>Total</span>
            </div>
            {SUB_STATS.map(({ key, label, color }) => {
              const sealRow = SEAL_STATS_TABLE[hero.seal ?? 0] ?? [18, 13, 7];
              const bs = hero.bonusStats as unknown as Record<string, number>;
              const ss = (hero.summonStats ?? {}) as Record<string, number>;

              // Helper formatters
              const fmtPct  = (v: number) => v > 0 ? `+${Math.round(v * 100)}%` : '—';
              const fmtFlat = (v: number) => v > 0 ? `+${v.toFixed(1)}` : '—';

              // Compute base / equip / summon / total per stat
              let base = '—', equip = '—', summon = '—', total = '—';

              if (key === 'tenacity') {
                const eVal = Math.round(bs.tenacity ?? 0);
                const sVal = Math.round(ss.tenacity ?? 0);
                equip  = eVal > 0 ? `+${eVal}` : '—';
                summon = sVal > 0 ? `+${sVal}` : '—';
                const t = eVal + sVal;
                if (t > 0) total = `+${t}`;
              } else if (key === 'fatigueRecovery') {
                equip  = fmtPct(bs.fatigueRecovery ?? 0);
                summon = fmtPct(ss.fatigueRecovery ?? 0);
                const t = (bs.fatigueRecovery ?? 0) + (ss.fatigueRecovery ?? 0);
                if (t > 0) total = `+${Math.round(t * 100)}%`;
              } else if (key === 'cleanse') {
                equip  = fmtPct(bs.cleanse ?? 0);
                summon = fmtPct(ss.cleanse ?? 0);
                const t = (bs.cleanse ?? 0) + (ss.cleanse ?? 0);
                if (t > 0) total = `+${Math.round(t * 100)}%`;
              } else if (key === 'offSlotPenalty') {
                const slot = hero.teamSlot;
                const slotTier = !slot ? null : slot <= 3 ? 'COMMONER' : slot <= 5 ? 'ELITE' : 'LEGENDARY';
                if (slotTier && hero.tier && hero.tier !== slotTier) {
                  const stamina = hero.stats.stamina ?? 0;
                  const bs2 = hero.bonusStats as unknown as Record<string, number>;
                  const ss2 = (hero.summonStats ?? {}) as Record<string, number>;
                  const offPos = (bs2.offPositioning ?? 0) + (ss2.offPositioning ?? 0);
                  const req = slotTier === 'COMMONER' ? 50 + hero.level * 3 : slotTier === 'ELITE' ? 100 + hero.level * 3 : 150 + hero.level * 3;
                  const rawMax = slotTier === 'COMMONER' ? 0.80 : slotTier === 'ELITE' ? 0.65 : 0.50;
                  const effMax = rawMax * Math.max(0, 1 - offPos);
                  const penalty = stamina >= req ? 0 : effMax * (1 - stamina / req);
                  base  = `${slotTier[0]}${slotTier.slice(1).toLowerCase()} slot`;
                  total = penalty <= 0 ? '✓ None' : `−${(penalty * 100).toFixed(1)}%`;
                }
              } else if (key === 'staminaEffectiveness') {
                base  = `${Math.min(100, (hero.stats.stamina / (60 + hero.level * 2.5)) * 100).toFixed(1)}%`;
                total = base;
              } else if (key === 'magicProficiency') {
                base   = `${sealRow[0]}%`;
                equip  = fmtPct(bs.magicProficiency ?? 0);
                summon = fmtPct(ss.magicProficiency ?? 0);
                total  = `${sealRow[0] + Math.round(((bs.magicProficiency ?? 0) + (ss.magicProficiency ?? 0)) * 100)}%`;
              } else if (key === 'criticalChance') {
                base   = `${sealRow[1]}%`;
                equip  = fmtPct(bs.critChance ?? 0);
                summon = fmtPct(ss.critChance ?? 0);
                total  = `${sealRow[1] + Math.round(((bs.critChance ?? 0) + (ss.critChance ?? 0)) * 100)}%`;
              } else if (key === 'spellActivation') {
                base   = `${sealRow[2]}%`;
                equip  = fmtPct(bs.spellActivation ?? 0);
                summon = fmtPct(ss.spellActivation ?? 0);
                total  = `${sealRow[2] + Math.round(((bs.spellActivation ?? 0) + (ss.spellActivation ?? 0)) * 100)}%`;
              } else if (key === 'dexProficiency') {
                base   = '33%';
                const equipVal = (bs.dexProficiency ?? 0.33) - 0.33;
                equip  = fmtPct(equipVal);
                summon = fmtPct(ss.dexProficiency ?? 0);
                total  = `${Math.round(((bs.dexProficiency ?? 0.33) + (ss.dexProficiency ?? 0)) * 100)}%`;
              } else if (key === 'dexPosture') {
                base   = '20%';
                const equipVal = (bs.dexPosture ?? 0.20) - 0.20;
                equip  = fmtPct(equipVal);
                summon = fmtPct(ss.dexPosture ?? 0);
                total  = `${Math.round(((bs.dexPosture ?? 0.20) + (ss.dexPosture ?? 0)) * 100)}%`;
              } else if (key === 'dexMaxPosture') {
                equip  = fmtPct(bs.dexMaxPosture ?? 0);
                summon = fmtPct(ss.dexMaxPosture ?? 0);
                const dmp = (bs.dexMaxPosture ?? 0) + (ss.dexMaxPosture ?? 0);
                if (dmp > 0) total = `${Math.round(dmp * 100)}%`;
              } else if (key === 'critDamage') {
                base   = '25%';
                const equipVal = (bs.critDamage ?? 0.25) - 0.25;
                equip  = fmtPct(equipVal);
                summon = fmtPct(ss.critDamage ?? 0);
                total  = `${Math.round(((bs.critDamage ?? 0.25) + (ss.critDamage ?? 0)) * 100)}%`;
              } else if (key === 'attack') {
                equip  = fmtFlat(bs.attack ?? 0);
                summon = fmtFlat(ss.attack ?? 0);
                const t = (bs.attack ?? 0) + (ss.attack ?? 0);
                if (t > 0) total = `+${t.toFixed(1)}`;
              } else if (key === 'spellMastery') {
                equip  = fmtPct(bs.spellMastery ?? 0);
                summon = fmtPct(ss.spellMastery ?? 0);
                const t = (bs.spellMastery ?? 0) + (ss.spellMastery ?? 0);
                if (t > 0) total = `+${Math.round(t * 100)}%`;
              } else if (key === 'itemDiscovery') {
                equip  = fmtFlat(bs.itemDiscovery ?? 0);
                summon = fmtFlat(ss.itemDiscovery ?? 0);
                const t = (bs.itemDiscovery ?? 0) + (ss.itemDiscovery ?? 0);
                if (t > 0) total = `+${t.toFixed(0)}`;
              } else {
                // Percentage bonus stats with no base
                const bsKey = key as keyof typeof bs;
                equip  = fmtPct(bs[bsKey] ?? 0);
                summon = fmtPct(ss[bsKey] ?? 0);
                const t = (bs[bsKey] ?? 0) + (ss[bsKey] ?? 0);
                if (t > 0) total = `+${Math.round(t * 100)}%`;
              }

              const hasTotal = total !== '—';
              return (
                <div key={key} style={{ ...styles.tableRow, borderLeft: `3px solid ${color}33` }}>
                  <span style={{ ...styles.tdStat, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, display: 'inline-block', backgroundColor: color, boxShadow: `0 0 4px ${color}88` }} />
                    <span style={{ color, fontWeight: 700, fontSize: 11 }}>{label}</span>
                  </span>
                  <span style={styles.td}>{base}</span>
                  <span style={{ ...styles.td, color: '#35354a' }}>—</span>
                  <span style={{ ...styles.td, color: equip !== '—' ? '#60a5fa' : '#35354a', fontWeight: equip !== '—' ? 700 : 400 }}>{equip}</span>
                  <span style={{ ...styles.td, color: summon !== '—' ? '#22d3ee' : '#35354a', fontWeight: summon !== '—' ? 700 : 400 }}>{summon}</span>
                  <span style={{ ...styles.tdTotal, color: hasTotal ? color : '#35354a', fontWeight: hasTotal ? 700 : 400 }}>{total}</span>
                </div>
              );
            })}
          </div>
          </div>{/* end collapse wrapper */}

        </div>{/* end leftCol */}

        {/* ── RIGHT COLUMN: equipment + abilities ── */}
        <div style={styles.rightCol}>

      {equipment && (
        <>
          <h3 style={styles.subtitle}>Equipment Slots (3)</h3>
          <div style={styles.slotsGrid}>
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
              const pickerAbilities = (equipment.heroAbilities as HeroAbilityEntry[])
                .filter((ab) => ab.slotNumber === null)
                .map((ab) => ({ type: 'ability' as const, id: ab.equippedAbilityId, label: ab.name }));
              const options = pickerAbilities;
              const isOpen = activePicker === slot.slotNumber;
              return (
                <div key={slot.slotNumber} style={styles.emptySlotCard} onClick={(e) => e.stopPropagation()}>
                  <span style={styles.emptySlotNum}>#{slot.slotNumber}</span>
                  <span style={styles.emptySlotText}>Empty Slot</span>
                  <div style={{ flex: 1 }} />
                  <div style={{ position: 'relative' }}>
                    <button
                      style={options.length === 0 ? styles.emptySlotBtnDisabled : styles.emptySlotBtn}
                      disabled={options.length === 0}
                      onClick={(e) => { e.stopPropagation(); setActivePicker(isOpen ? null : slot.slotNumber); }}
                      title={options.length === 0 ? 'No abilities in inventory' : 'Equip ability to this slot'}
                    >
                      {options.length === 0 ? 'No Abilities' : '+ Equip'}
                    </button>
                    {isOpen && (
                      <div style={styles.pickerDropdown} onClick={(e) => e.stopPropagation()}>
                        {options.map((opt) => (
                          <button
                            key={`${opt.type}-${opt.id}`}
                            style={styles.pickerOption}
                            onClick={() => handleEquipToSlot(slot.slotNumber, opt)}
                          >
                            <span style={{ color: '#a78bfa', marginRight: 5, fontWeight: 700 }}>A</span>
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

          {/* ── Inventory Items ── */}
          {equipment.inventoryItems.length > 0 && (
            <>
              <h3 style={styles.subtitle}>Inventory Items</h3>
              <div style={styles.abilityCardGrid}>
                {equipment.inventoryItems.map((item) => {
                  const tier = getInvItemTier(item.sellPrice);
                  const tc = INV_TIER_CFG[tier];
                  const icon = INV_ITEM_ICON[item.name] ?? '📦';
                  const bonusEntries = Object.entries(item.bonuses).filter(([, v]) => v !== 0);
                  const emptySlots = equipment.slots.filter((s) => !s.type);
                  const pickerOpen = activeItemPicker === item.equippedItemId;
                  return (
                    <div key={item.equippedItemId} style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <EquipmentTooltip name={item.name} type="item" bonuses={item.bonuses} sellPrice={item.sellPrice} copies={item.copies}>
                      <div style={{
                        position: 'relative', padding: '14px 14px 12px', borderRadius: 10,
                        border: `1px solid ${tc.color}38`, background: tc.bg,
                        boxShadow: `0 4px 20px ${tc.glow}, inset 0 0 0 1px ${tc.color}14`,
                        display: 'flex', flexDirection: 'column', gap: 8,
                        overflow: 'hidden', cursor: 'default', height: '100%', boxSizing: 'border-box',
                      }}>
                        {/* Top bar */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: tc.color, boxShadow: `0 0 8px ${tc.color}` }} />
                        {/* Tier badge */}
                        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const, padding: '2px 6px', borderRadius: 6, background: tc.color + '22', border: `1px solid ${tc.color}55`, color: tc.color }}>
                          {tc.label}
                        </div>
                        {/* Icon + Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tc.color + '16', border: `2px solid ${tc.color}44`, flexShrink: 0 }}>
                            <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>
                          </div>
                          <span style={{ color: '#e8e8f0', fontWeight: 700, fontSize: 13, lineHeight: 1.25 }}>{item.name}</span>
                        </div>
                        {/* Stat chips */}
                        {bonusEntries.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                            {bonusEntries.map(([stat, val]) => {
                              const sc = INV_STAT_CFG[stat] ?? { label: stat, color: '#9ca3af', icon: '·' };
                              return (
                                <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 6, background: sc.color + '14', border: `1px solid ${sc.color}45` }}>
                                  <span style={{ color: sc.color, fontSize: 9, lineHeight: 1 }}>{sc.icon}</span>
                                  <span style={{ color: sc.color, fontWeight: 800, fontSize: 11, lineHeight: 1 }}>+{val}</span>
                                  <span style={{ color: sc.color + 'aa', fontSize: 9, lineHeight: 1 }}>{sc.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div style={{ flex: 1 }} />
                        {/* Equip button */}
                        <button
                          disabled={emptySlots.length === 0}
                          onClick={() => setActiveItemPicker(pickerOpen ? null : item.equippedItemId)}
                          style={{
                            padding: '5px 12px', alignSelf: 'flex-start',
                            background: emptySlots.length > 0 ? `linear-gradient(135deg, ${tc.color}dd, ${tc.color}99)` : '#1e1e30',
                            border: `1px solid ${emptySlots.length > 0 ? tc.color + '80' : '#333'}`,
                            borderRadius: 5, color: emptySlots.length > 0 ? '#fff' : '#4a4a6a',
                            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                            textTransform: 'uppercase' as const,
                            cursor: emptySlots.length > 0 ? 'pointer' : 'not-allowed',
                            boxShadow: emptySlots.length > 0 ? `0 2px 10px ${tc.glow}` : 'none',
                          }}
                        >
                          {emptySlots.length === 0 ? 'No Empty Slots' : '+ Equip'}
                        </button>
                      </div>
                      </EquipmentTooltip>
                      {/* Slot picker dropdown */}
                      {pickerOpen && emptySlots.length > 0 && (
                        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 50, backgroundColor: '#0e0e1e', border: '1px solid #2a2a4e', borderRadius: 7, padding: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.8)', minWidth: 130 }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ color: '#44446a', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '3px 8px 5px', borderBottom: '1px solid #1a1a35' }}>
                            Choose slot
                          </div>
                          {emptySlots.map((s) => (
                            <button
                              key={s.slotNumber}
                              onClick={() => { handleEquipToSlot(s.slotNumber, { type: 'item', id: item.equippedItemId }); setActiveItemPicker(null); }}
                              style={{ display: 'block', width: '100%', textAlign: 'left' as const, padding: '6px 10px', background: 'transparent', border: 'none', color: '#c0c0d8', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 4 }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff10'; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                            >
                              Slot {s.slotNumber}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <h3 style={styles.subtitle}>Abilities</h3>
          {equipment.heroAbilities.length > 0 ? (
            <div style={styles.abilityCardGrid}>
              {equipment.heroAbilities.map((ab) => (
                <AbilitySlot
                  key={ab.equippedAbilityId}
                  ability={ab}
                  onUnequip={handleUnequipAbility}
                  emptySlots={equipment.slots.filter((s) => !s.type)}
                  onEquip={(slotNumber) => handleEquipToSlot(slotNumber, { type: 'ability', id: ab.equippedAbilityId })}
                />
              ))}
            </div>
          ) : (
            <p style={styles.muted}>No abilities owned.</p>
          )}

        </>
      )}

        </div>{/* end rightCol */}
      </div>{/* end bodyColumns */}

      <div style={{ borderTop: '1px solid rgba(233,69,96,0.12)', display: 'flex', flexDirection: 'column' as const, alignItems: 'stretch' }}>
      {/* Change Element bar */}
      {(() => {
        const ELEMENTS = ['FIRE', 'WIND', 'LIGHTNING', 'EARTH', 'WATER'] as const;
        const elementCost = hero.tier === 'LEGENDARY' ? 300 : hero.tier === 'ELITE' ? 150 : 75;
        const canChange = selectedElement !== null && (player?.gold ?? 0) >= elementCost;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '28px 16px', backgroundColor: '#0e0e1c', flexWrap: 'wrap' as const }}>
            <span style={{ color: '#f97316', fontStyle: 'italic', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Change Element to...</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {ELEMENTS.map((el) => {
                const isActive = selectedElement === el;
                const isCurrent = hero.element === el;
                return (
                  <button
                    key={el}
                    onClick={() => setSelectedElement(isActive ? null : el)}
                    title={el.charAt(0) + el.slice(1).toLowerCase() + (isCurrent ? ' (current)' : '')}
                    style={{
                      width: 34, height: 34, borderRadius: 6, border: `2px solid ${isActive ? ELEMENT_COLOR[el] : isCurrent ? ELEMENT_COLOR[el] + '66' : '#2a2a44'}`,
                      background: isActive ? ELEMENT_COLOR[el] + '28' : isCurrent ? ELEMENT_COLOR[el] + '10' : 'transparent',
                      cursor: isCurrent ? 'default' : 'pointer',
                      fontSize: 18, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: isCurrent ? 0.5 : 1,
                    }}
                    disabled={isCurrent}
                  >
                    {ELEMENT_SYMBOL[el]}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
              <span style={{ fontSize: 16 }}>💰</span>
              <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13 }}>{elementCost}g</span>
            </div>
            <button
              onClick={() => canChange && setConfirmElement(true)}
              disabled={!canChange}
              style={{
                padding: '7px 20px', borderRadius: 5, border: 'none', fontSize: 13, fontWeight: 700,
                background: canChange ? '#4a4a6a' : '#252535',
                color: canChange ? '#e0e0f0' : '#44445a',
                cursor: canChange ? 'pointer' : 'not-allowed',
                letterSpacing: '0.05em',
              }}
            >
              CHANGE
            </button>
          </div>
        );
      })()}

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

        <button style={styles.buyStatsBtn} onClick={() => setConfirmBuyStats(true)}>
          Buy Stats
        </button>
        <span style={styles.buyStatsPrice}>💰 {hero.nextStatCost}g</span>

        {hero.unallocatedStatPoints > 0 && (
          <>
            <div style={styles.sellHeroSep} />
            <button style={{ ...styles.buyStatsBtn, borderColor: 'rgba(74,222,128,0.5)', color: '#4ade80' }} onClick={() => setShowAllocate(true)}>
              Allocate
            </button>
            <span style={{ ...styles.buyStatsPrice, color: '#4ade80' }}>🟢 {hero.unallocatedStatPoints} pts</span>
          </>
        )}

        {player?.statResetUnlocked && (() => {
          const hasAllocated = Object.values(hero.purchasedStats).some(v => v > 0);
          return (
            <>
              <div style={styles.sellHeroSep} />
              <button
                style={{ ...styles.buyStatsBtn, borderColor: 'rgba(251,191,36,0.5)', color: hasAllocated ? '#fbbf24' : '#5a4a20', cursor: hasAllocated ? 'pointer' : 'not-allowed' }}
                onClick={() => hasAllocated && setConfirmReset(true)}
                disabled={!hasAllocated}
                title={!hasAllocated ? 'No stats allocated to reset' : undefined}
              >
                Reset Stats
              </button>
              <span style={{ ...styles.buyStatsPrice, color: hasAllocated ? '#fbbf24' : '#5a4a20' }}>💰 {hero.nextResetCost}g</span>
            </>
          );
        })()}

        <div style={styles.sellHeroSep} />

        <button style={styles.sellHeroBtn} onClick={() => setConfirmHeroSell(true)}>
          Sell Hero
        </button>
        <span style={styles.sellHeroPrice}>💰 {hero.sellPrice}g</span>
      </div>
      </div>{/* end footer wrapper */}
    </div>
  );
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
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 8,
  },
  emptySlotCard: {
    padding: '14px 14px 12px',
    borderRadius: 10,
    border: '1px dashed rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.02)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    cursor: 'default',
    position: 'relative' as const,
  },
  emptySlotNum: {
    color: '#303050',
    fontSize: 11,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums' as const,
  },
  emptySlotText: {
    color: '#3a3a5a',
    fontSize: 12,
    fontStyle: 'italic' as const,
  },
  muted: {
    color: '#666',
    fontSize: 13,
  },
  abilityCardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
    gap: 12,
    marginBottom: 4,
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
  combatSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
    padding: '18px 20px',
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    border: '1px solid #16213e',
    marginTop: 16,
  },
  hdCombatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  hdCombatTitle: {
    color: '#4a4a7a',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  hdCombatLine: {
    flex: 1,
    height: 1,
    background: 'linear-gradient(90deg, rgba(74,74,122,0.4), transparent)',
  },
  hdGroupLabel: {
    color: '#3a3a5a',
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    marginTop: 4,
  },
  hdStatCardsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  hdStatCard: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
    padding: '14px 8px 12px',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  hdStatCardLabel: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    lineHeight: 1,
  },
  hdStatCardValue: {
    fontSize: 26,
    fontWeight: 900,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    fontFamily: 'Inter, sans-serif',
    letterSpacing: '-0.02em',
  },
  hdWrBarBg: {
    width: '70%',
    height: 3,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  hdWrBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #d97706, #fbbf24)',
    borderRadius: 2,
    boxShadow: '0 0 4px rgba(251,191,36,0.7)',
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
    color: '#8080a8',
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
    padding: '16px 0 28px',
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
