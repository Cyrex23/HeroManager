import { useEffect, useState, useCallback, useRef } from 'react';
import { Coins, Gem } from 'lucide-react';
import type { MaterialTemplate, WeaponRecipe, WeaponSpellInfo, MaterialRecipe } from '../types';
import { getMaterials, getWeaponRecipes, getMaterialRecipes, craftWeapon, craftMaterial, getSpinStatus, claimDailySpin, claimSpinReward, finishCraftNow } from '../api/blacksmithApi';
import type { SpinStatus, SpinResult } from '../api/blacksmithApi';
import { usePlayer } from '../context/PlayerContext';

// ─── Sprite Icon ──────────────────────────────────────────────────────────────
const SHEET_PARAMS: Record<string, { cw: number; ch: number; ox?: number; oy?: number }> = {
  'mat1':              { cw: 128, ch: 128 },
  'mat2':              { cw: 128, ch: 128 },
  'mat3':              { cw: 128, ch: 128 },
  'mat4':              { cw: 128, ch: 128 },
  'weapons-common':    { cw: 128, ch: 128 },
  'weapons-epic':      { cw: 146, ch: 205 },
  'weapons-legendary': { cw: 166, ch: 201, ox: 13, oy: 4 },
};

function SpriteIcon({ iconKey, size = 48 }: { iconKey: string; size?: number }) {
  if (!iconKey) return <div style={{ width: size, height: size, background: '#0d1117', borderRadius: 4 }} />;
  const parts = iconKey.split(':');
  if (parts.length < 3) return <div style={{ width: size, height: size, background: '#0d1117', borderRadius: 4 }} />;
  const [sheet, col, row] = parts;
  const { cw, ch, ox = 0, oy = 0 } = SHEET_PARAMS[sheet] ?? { cw: 128, ch: 128 };
  const s = size / cw;
  return (
    <div style={{
      width: size, height: size, flexShrink: 0, display: 'inline-block',
      backgroundImage: `url(/blacksmith/${sheet}.png)`,
      backgroundPosition: `-${(ox + Number(col) * cw) * s}px -${(oy + Number(row) * ch) * s}px`,
      backgroundSize: `${1024 * s}px ${1024 * s}px`,
      imageRendering: 'auto',
    }} />
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtCraftTime(hours: number): string {
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function fmtStat(val: number, pct: boolean): string {
  return pct ? `+${Math.round(val * 100)}%` : `+${val}`;
}

const TIER_COLOR: Record<number, string> = { 1: '#9ca3af', 2: '#60a5fa', 3: '#a78bfa', 4: '#f97316', 5: '#fbbf24' };
const TIER_LABEL: Record<number, string> = { 1: 'T1 Primal', 2: 'T2 Refined', 3: 'T3 Exotic', 4: 'T4 Mythic', 5: 'T5 Celestial' };
const WEAPON_COLOR: Record<string, string> = { COMMON: '#9ca3af', EPIC: '#a78bfa', LEGENDARY: '#fbbf24' };
const FINISH_COST = (tier: string): number => tier === 'LEGENDARY' ? 30 : tier === 'EPIC' ? 20 : 10;

// 1 in-game hour = 10 real seconds for the countdown
const TIME_SCALE_MS = 10 * 1000;

interface CraftQueueEntry {
  id: string;
  name: string;
  iconKey: string;
  endTime: number;
  tier: string;
  type: 'weapon' | 'material';
  ingredients: Array<{ iconKey: string; materialName: string; required: number }>;
}

const QUEUE_KEY = 'hm_craft_queue';
function loadQueue(): CraftQueueEntry[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as CraftQueueEntry[]).filter(e => e.endTime > Date.now());
  } catch { return []; }
}
function saveQueue(q: CraftQueueEntry[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

interface StatEntry { key: keyof WeaponRecipe; label: string; pct: boolean; color: string }
const WEAPON_STATS: StatEntry[] = [
  { key: 'bonusPa',              label: 'Physical Attack',  pct: false, color: '#f87171' },
  { key: 'bonusMp',              label: 'Magic Power',      pct: false, color: '#818cf8' },
  { key: 'bonusDex',             label: 'Dexterity',        pct: false, color: '#34d399' },
  { key: 'bonusElem',            label: 'Element',          pct: false, color: '#38bdf8' },
  { key: 'bonusMana',            label: 'Mana',             pct: false, color: '#c084fc' },
  { key: 'bonusStam',            label: 'Stamina',          pct: false, color: '#fb923c' },
  { key: 'bonusAttack',          label: 'Attack',           pct: false, color: '#fca5a5' },
  { key: 'bonusMagicProficiency',label: 'Magic Prof.',      pct: true,  color: '#a5b4fc' },
  { key: 'bonusSpellMastery',    label: 'Spell Mastery',    pct: true,  color: '#c4b5fd' },
  { key: 'bonusSpellActivation', label: 'Spell Activation', pct: true,  color: '#d8b4fe' },
  { key: 'bonusDexProficiency',  label: 'Dex Prof.',        pct: true,  color: '#6ee7b7' },
  { key: 'bonusDexPosture',      label: 'Dex Posture',      pct: true,  color: '#4ade80' },
  { key: 'bonusCritChance',      label: 'Crit Chance',      pct: true,  color: '#facc15' },
  { key: 'bonusCritDamage',      label: 'Crit Damage',      pct: true,  color: '#fde047' },
  { key: 'bonusExpBonus',        label: 'EXP Bonus',        pct: true,  color: '#86efac' },
  { key: 'bonusGoldBonus',       label: 'Gold Bonus',       pct: true,  color: '#fbbf24' },
  { key: 'bonusItemDiscovery',   label: 'Item Discovery',   pct: true,  color: '#fdba74' },
  { key: 'bonusPhysicalImmunity',label: 'Phys. Immunity',   pct: true,  color: '#67e8f9' },
  { key: 'bonusMagicImmunity',   label: 'Magic Immunity',   pct: true,  color: '#7dd3fc' },
  { key: 'bonusDexEvasiveness',  label: 'Evasiveness',      pct: true,  color: '#93c5fd' },
];

// ─── Flash ────────────────────────────────────────────────────────────────────
function Flash({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', top: 80, right: 24, zIndex: 9999,
      background: msg.ok ? '#052e16' : '#450a0a',
      border: `1px solid ${msg.ok ? '#4ade80' : '#ef4444'}`,
      color: msg.ok ? '#4ade80' : '#ef4444',
      borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>{msg.text}</div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, msg, onOk, onCancel }: { title: string; msg: string; onOk: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0b0d1e', border: '1px solid #2a2a4a', borderRadius: 12, padding: 28, minWidth: 320, maxWidth: 420 }}>
        <div style={{ fontWeight: 900, fontSize: 16, color: '#e0e0f0', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>{msg}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ background: 'transparent', border: '1px solid #374151', color: '#9ca3af', borderRadius: 6, padding: '7px 18px', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
          <button onClick={onOk} style={{ background: '#fbbf2422', border: '1px solid #fbbf24', color: '#fbbf24', borderRadius: 6, padding: '7px 18px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ─── Recipe Popup (centered overlay) ─────────────────────────────────────────
const TRIGGER_LABEL: Record<string, string> = {
  ENTRANCE:               'ON ENTER',
  OPPONENT_ENTRANCE:      'EITHER ENTERS',
  ATTACK:                 'ON ATTACK',
  AFTER_CLASH:            'AFTER CLASH',
  AFTER_CLASH_CRIT:       'AFTER CRIT',
  AFTER_CLASH_MAGIC_PROF: 'AFTER MAG.PROF',
};
function triggerLabel(trigger: string, threshold: number): string {
  if (trigger === 'BEFORE_TURN_X') return `< TURN ${threshold}`;
  if (trigger === 'AFTER_TURN_X')  return `> TURN ${threshold}`;
  return TRIGGER_LABEL[trigger] ?? trigger;
}

function SpellBadge({ spell }: { spell: WeaponSpellInfo }) {
  const allBonuses = [
    { l: 'PA',            v: spell.bonusPa,               pct: false },
    { l: 'MP',            v: spell.bonusMp,               pct: false },
    { l: 'DEX',           v: spell.bonusDex,              pct: false },
    { l: 'ELEM',          v: spell.bonusElem,             pct: false },
    { l: 'MANA',          v: spell.bonusMana,             pct: false },
    { l: 'STAM',          v: spell.bonusStam,             pct: false },
    { l: 'ATTACK',        v: spell.bonusAttack,           pct: false },
    { l: 'MAG.PROF',      v: spell.bonusMagicProficiency, pct: true  },
    { l: 'SP.MASTERY',    v: spell.bonusSpellMastery,     pct: true  },
    { l: 'SP.ACTIV',      v: spell.bonusSpellActivation,  pct: true  },
    { l: 'DEX.PROF',      v: spell.bonusDexProficiency,   pct: true  },
    { l: 'DEX.POSTURE',   v: spell.bonusDexPosture,       pct: true  },
    { l: 'CRIT%',         v: spell.bonusCritChance,       pct: true  },
    { l: 'CRIT DMG',      v: spell.bonusCritDamage,       pct: true  },
    { l: 'EXP+',          v: spell.bonusExpBonus,         pct: true  },
    { l: 'GOLD+',         v: spell.bonusGoldBonus,        pct: true  },
    { l: 'DISCOVERY',     v: spell.bonusItemDiscovery,    pct: true  },
    { l: 'PHYS.IMM',      v: spell.bonusPhysicalImmunity, pct: true  },
    { l: 'MAG.IMM',       v: spell.bonusMagicImmunity,    pct: true  },
    { l: 'DEX.EVAS',      v: spell.bonusDexEvasiveness,   pct: true  },
  ].filter(b => b.v !== 0);

  const isDebuff    = spell.affectsOpponent;
  const borderColor = isDebuff ? 'rgba(239,68,68,0.35)'  : 'rgba(59,130,246,0.25)';
  const bgColor     = isDebuff ? 'rgba(239,68,68,0.05)'  : 'rgba(59,130,246,0.06)';
  const nameColor   = isDebuff ? '#fca5a5'               : '#93c5fd';
  const starColor   = isDebuff ? '#f87171'               : '#60a5fa';
  const chipColor   = isDebuff ? '#fca5a5'               : '#93c5fd';
  const chipBg      = isDebuff ? '#ef444415'             : '#3b82f60d';
  const chipBorder  = isDebuff ? '#ef444430'             : '#3b82f630';
  const trigBg      = isDebuff ? '#450a0a'               : '#1e3a5f';

  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: allBonuses.length > 0 ? 4 : 0, flexWrap: 'wrap' }}>
        <span style={{ color: starColor, fontSize: 13 }}>&#10022;</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: nameColor }}>{spell.name}</span>
        {isDebuff && <span style={{ fontSize: 9, fontWeight: 800, background: '#7f1d1d', color: '#fca5a5', borderRadius: 3, padding: '1px 6px' }}>DEBUFF</span>}
        <span style={{ fontSize: 9, fontWeight: 800, background: trigBg, color: starColor, borderRadius: 3, padding: '1px 6px' }}>
          {triggerLabel(spell.trigger, spell.turnThreshold)}
        </span>
        <span style={{ fontSize: 11, color: '#6b7280' }}>
          {Math.round(spell.chance * 100)}%{spell.manaCost > 0 ? ` · ${spell.manaCost} mana` : ''}
        </span>
        {spell.maxUsages > 0  && <span style={{ fontSize: 9, color: '#9ca3af', fontStyle: 'italic' }}>max {spell.maxUsages}×</span>}
        {spell.lastsTurns > 0 && <span style={{ fontSize: 9, color: '#9ca3af', fontStyle: 'italic' }}>{spell.lastsTurns}t persist</span>}
      </div>
      {allBonuses.length > 0 && (
        <div style={{ display: 'flex', gap: '3px 5px', flexWrap: 'wrap' }}>
          {allBonuses.map(({ l, v, pct }) => (
            <span key={l} style={{ fontSize: 10, color: chipColor, background: chipBg, border: `1px solid ${chipBorder}`, borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>
              {v > 0 ? '+' : ''}{pct ? `${Math.round(v * 100)}%` : v} {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function WeaponPopup({ r, canForge, onForge, onClose }: { r: WeaponRecipe; canForge: boolean; onForge: () => void; onClose: () => void }) {
  const stats = WEAPON_STATS.filter(s => (r[s.key] as number) > 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0b0d1e', border: `2px solid ${WEAPON_COLOR[r.weaponTier]}55`,
        borderRadius: 14, padding: 24, width: 500, maxHeight: '82vh', overflowY: 'auto',
        boxShadow: `0 0 40px ${WEAPON_COLOR[r.weaponTier]}22`,
        ...(r.weaponTier === 'LEGENDARY' ? { animation: 'legGlow 3s ease-in-out infinite' } : {}),
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <SpriteIcon iconKey={r.iconKey} size={64} />
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: r.weaponTier === 'LEGENDARY' ? '#fbbf24' : '#e0e0f0', lineHeight: 1.2 }}>{r.name}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, border: `1px solid ${WEAPON_COLOR[r.weaponTier]}55`, color: WEAPON_COLOR[r.weaponTier], borderRadius: 4, padding: '2px 7px', letterSpacing: 0.8 }}>{r.weaponTier}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>&#9201; {fmtCraftTime(r.craftHours)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>&#x2715;</button>
        </div>

        {/* Stats */}
        {stats.length > 0 && (
          <>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#4b5563', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Bonuses</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 6px', marginBottom: 14 }}>
              {stats.map(s => (
                <span key={String(s.key)} style={{ fontSize: 11, fontWeight: 700, color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}30`, borderRadius: 5, padding: '2px 7px' }}>
                  {fmtStat(r[s.key] as number, s.pct)} {s.label}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Spells */}
        {r.spells && r.spells.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#4b5563', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
              {r.spells.length === 1 ? 'Spell' : `Spells (${r.spells.length})`}
            </div>
            {r.spells.map((spell, i) => <SpellBadge key={i} spell={spell} />)}
          </div>
        )}

        {/* Ingredients */}
        <div style={{ fontSize: 9, fontWeight: 800, color: '#4b5563', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Recipe</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {r.ingredients.map(i => {
            const met = i.have >= i.required;
            return (
              <div key={i.materialId} style={{ display: 'flex', alignItems: 'center', gap: 8, background: met ? '#052e1615' : '#450a0a15', border: `1px solid ${met ? '#4ade8030' : '#ef444430'}`, borderRadius: 6, padding: '5px 10px' }}>
                <SpriteIcon iconKey={i.iconKey} size={28} />
                <span style={{ fontSize: 12, color: '#9ca3af', flex: 1 }}>{i.materialName}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: met ? '#4ade80' : '#ef4444' }}>{i.have}/{i.required}</span>
              </div>
            );
          })}
        </div>

        <button disabled={!canForge} onClick={onForge} style={{
          width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 900,
          cursor: canForge ? 'pointer' : 'not-allowed', letterSpacing: 1,
          background: canForge ? 'linear-gradient(90deg,#78350f,#fbbf2433,#78350f)' : '#1a1a2a',
          color: canForge ? '#fbbf24' : '#4b5563',
          border: `1px solid ${canForge ? '#fbbf2466' : '#374151'}`,
        }}>
          {canForge ? '⚒  CRAFT RECIPE' : '⚒  INSUFFICIENT MATERIALS'}
        </button>
      </div>
    </div>
  );
}

function RefinePopup({ r, canRefine, onRefine, onClose }: { r: MaterialRecipe; canRefine: boolean; onRefine: () => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0b0d1e', border: `2px solid ${TIER_COLOR[r.outputTier]}55`,
        borderRadius: 14, padding: 24, width: 440, maxHeight: '80vh', overflowY: 'auto',
        boxShadow: `0 0 30px ${TIER_COLOR[r.outputTier]}22`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <SpriteIcon iconKey={r.outputIconKey} size={56} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#e0e0f0' }}>{r.outputName}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: TIER_COLOR[r.outputTier], fontWeight: 700 }}>{TIER_LABEL[r.outputTier]}</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>&#x2192; &times;{r.outputQuantity}</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>&#9201; {fmtCraftTime(r.craftHours)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>&#x2715;</button>
        </div>

        <div style={{ fontSize: 9, fontWeight: 800, color: '#4b5563', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Ingredients</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
          {r.ingredients.map(i => {
            const met = i.have >= i.required;
            return (
              <div key={i.materialId} style={{ display: 'flex', alignItems: 'center', gap: 8, background: met ? '#052e1615' : '#450a0a15', border: `1px solid ${met ? '#4ade8030' : '#ef444430'}`, borderRadius: 6, padding: '5px 10px' }}>
                <SpriteIcon iconKey={i.iconKey} size={28} />
                <span style={{ fontSize: 12, color: '#9ca3af', flex: 1 }}>{i.materialName}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: met ? '#4ade80' : '#ef4444' }}>{i.have}/{i.required}</span>
              </div>
            );
          })}
        </div>

        <button disabled={!canRefine} onClick={onRefine} style={{
          width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 900,
          cursor: canRefine ? 'pointer' : 'not-allowed', letterSpacing: 1,
          background: canRefine ? `linear-gradient(90deg,${TIER_COLOR[r.outputTier]}22,${TIER_COLOR[r.outputTier]}44,${TIER_COLOR[r.outputTier]}22)` : '#1a1a2a',
          color: canRefine ? TIER_COLOR[r.outputTier] : '#4b5563',
          border: `1px solid ${canRefine ? TIER_COLOR[r.outputTier] + '66' : '#374151'}`,
        }}>
          {canRefine ? '&#128293;  REFINE MATERIALS' : '&#128293;  INSUFFICIENT MATERIALS'}
        </button>
      </div>
    </div>
  );
}

// ─── Crafting In Progress ─────────────────────────────────────────────────────
function CraftingProgress({ queue, tick, diamonds, maxSlots, onFinish, onFinishNow }: {
  queue: CraftQueueEntry[]; tick: number; diamonds: number; maxSlots: number;
  onFinish: (id: string) => void;
  onFinishNow: (entry: CraftQueueEntry) => void;
}) {
  return (
    <div style={{ marginTop: 32, borderTop: '1px solid #1a1a2a', paddingTop: 24, marginBottom: 36 }}>
      <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#e0e0f0' }}>Crafting In Progress</span>
        <span style={{
          fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif',
          color: queue.length >= maxSlots ? '#ef4444' : '#6b7280',
          background: queue.length >= maxSlots ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)',
          border: `1px solid ${queue.length >= maxSlots ? 'rgba(239,68,68,0.3)' : 'rgba(107,114,128,0.2)'}`,
          borderRadius: 6, padding: '2px 8px',
        }}>
          {queue.length} / {maxSlots} slots
        </span>
      </div>
      <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 16px' }}>
        {queue.length === 0 ? 'No active crafting jobs. Start forging a weapon or refining materials!' : 'These recipes are currently being crafted. The time can be reduced by finishing now.'}
      </p>
      {queue.length === 0 ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          background: '#0b0d1e', border: '1px dashed #1e1e3a', borderRadius: 10,
          padding: '28px 20px', color: '#374151',
        }}>
          <div style={{ fontSize: 32 }}>⚒</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4b5563' }}>The forge is idle</div>
            <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>Craft a weapon or refine materials to see progress here</div>
          </div>
        </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {queue.map(entry => {
          const remaining = Math.max(0, entry.endTime - tick);
          const done = remaining === 0;
          const tierColor = entry.type === 'weapon'
            ? (WEAPON_COLOR[entry.tier] ?? '#9ca3af')
            : (TIER_COLOR[Number(entry.tier)] ?? '#9ca3af');
          return (
            <div key={entry.id} style={{ background: '#0b0d1e', border: `1px solid ${tierColor}33`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <SpriteIcon iconKey={entry.iconKey} size={52} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 }}>
                  {entry.type === 'weapon' ? 'Crafting Recipe' : 'Refining Recipe'}
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: tierColor }}>{entry.name.toUpperCase()}</div>
                {entry.ingredients.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {entry.ingredients.map((ing, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#0d1117', border: '1px solid #1e1e3a', borderRadius: 6, padding: '3px 8px 3px 4px' }}>
                        <SpriteIcon iconKey={ing.iconKey} size={22} />
                        <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{ing.materialName.split(' ')[0]}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 900 }}>&times;{ing.required}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 9, color: '#6b7280', letterSpacing: 1.2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Time Until Completion</div>
                <div style={{
                  fontFamily: 'monospace', fontSize: 20, fontWeight: 900,
                  color: done ? '#4ade80' : '#fbbf24',
                  background: '#07080f', border: `1px solid ${done ? '#4ade8033' : '#fbbf2433'}`,
                  borderRadius: 6, padding: '4px 14px', letterSpacing: 1, display: 'inline-block',
                }}>
                  {done ? 'READY!' : fmtCountdown(remaining)}
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <button onClick={() => done ? onFinish(entry.id) : onFinishNow(entry)} style={{
                    background: done
                      ? '#052e16'
                      : diamonds >= FINISH_COST(entry.tier)
                        ? 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(109,40,217,0.15) 100%)'
                        : '#1a1a2a',
                    border: `1px solid ${done ? '#4ade8066' : diamonds >= FINISH_COST(entry.tier) ? '#7c3aed99' : '#374151'}`,
                    color: done ? '#4ade80' : diamonds >= FINISH_COST(entry.tier) ? '#c4b5fd' : '#4b5563',
                    boxShadow: !done && diamonds >= FINISH_COST(entry.tier) ? '0 0 10px rgba(139,92,246,0.3)' : 'none',
                    borderRadius: 6, padding: '6px 18px', cursor: done || diamonds >= FINISH_COST(entry.tier) ? 'pointer' : 'not-allowed',
                    fontWeight: 800, fontSize: 12, letterSpacing: 0.5,
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s',
                  }}>
                    {done ? 'COLLECT' : (
                      <>
                        FINISH NOW &nbsp;<Gem size={12} color="#c4b5fd" />{FINISH_COST(entry.tier)}
                      </>
                    )}
                  </button>
                  {!done && diamonds < FINISH_COST(entry.tier) && (
                    <div style={{ fontSize: 9, color: '#6b7280' }}>Need {FINISH_COST(entry.tier)} diamonds</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

// ─── Daily Wheel ──────────────────────────────────────────────────────────────
const CELL_W = 88;
const VISIBLE = 7;
const PREFIX = 90;

function fmtCountdownShort(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function DailyWheel({ materials, onSpun }: { materials: MaterialTemplate[]; onSpun: () => void }) {
  const pool = materials.filter(m => m.tier <= 2);
  const [status, setStatus] = useState<SpinStatus | null>(null);
  const [strip, setStrip] = useState<MaterialTemplate[]>([]);
  const [tx, setTx] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [pendingResult, setPendingResult] = useState<SpinResult | null>(null);
  const [claimed, setClaimed] = useState<{ choice: 'material' | 'gold' | 'diamond'; result: SpinResult } | null>(null);
  const [tick, setTick] = useState(Date.now());
  const [animating, setAnimating] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getSpinStatus().then(setStatus); }, []);
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Pre-fill reel with random items so it shows something before spinning
  useEffect(() => {
    if (pool.length > 0 && strip.length === 0) {
      const initial: MaterialTemplate[] = [];
      for (let i = 0; i < PREFIX + VISIBLE + 15; i++)
        initial.push(pool[Math.floor(Math.random() * pool.length)]);
      setStrip(initial);
      // Center item 2 (middle of VISIBLE=5): tx = containerW/2 - 2.5*CELL_W, fallback approximation
      const containerW = reelRef.current?.offsetWidth ?? VISIBLE * CELL_W;
      setTx(containerW / 2 - 2.5 * CELL_W);
    }
  }, [pool.length]); // eslint-disable-line

  const handleSpin = async () => {
    if (!status?.canSpin || spinning || pool.length === 0) return;
    setSpinning(true);
    setPendingResult(null);
    setClaimed(null);
    let result: SpinResult;
    try {
      result = await claimDailySpin();
    } catch {
      setSpinning(false);
      return;
    }
    // Build new strip with winner at PREFIX
    const winner = pool.find(m => m.id === result.materialId) ?? pool[0];
    const newStrip: MaterialTemplate[] = [];
    for (let i = 0; i < PREFIX; i++)
      newStrip.push(pool[Math.floor(Math.random() * pool.length)]);
    newStrip.push(winner);
    for (let i = 0; i < 15; i++)
      newStrip.push(pool[Math.floor(Math.random() * pool.length)]);

    // Reset to start instantly (no transition), then animate to winner
    setAnimating(false);
    setStrip(newStrip);
    setTx(0);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      const containerW = reelRef.current?.offsetWidth ?? VISIBLE * CELL_W;
      const targetX = containerW / 2 - (PREFIX + 0.5) * CELL_W;
      setAnimating(true);
      setTx(targetX);
    }));

    setTimeout(() => {
      setAnimating(false);
      setSpinning(false);
      setPendingResult(result);
      setStatus({ canSpin: false, nextResetMs: result.nextResetMs });
    }, 9400);
  };

  const handleClaim = async (choice: 'material' | 'gold' | 'diamond') => {
    if (!pendingResult) return;
    try {
      await claimSpinReward(choice);
      setClaimed({ choice, result: pendingResult });
      setPendingResult(null);
      onSpun();
    } catch {
      // still dismiss modal on error
      setPendingResult(null);
    }
  };

  const remaining = status ? Math.max(0, status.nextResetMs - tick) : 0;
  const canSpin = !spinning && (status?.canSpin ?? false);

  return (
    <div style={{
      background: 'linear-gradient(180deg,#1a0e00,#0d0900)',
      border: '2px solid #78350f',
      borderRadius: 12, padding: '16px 20px',
      boxShadow: '0 4px 24px rgba(251,191,36,0.08)',
      maxWidth: '55.55%', margin: '0 auto 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24', fontStyle: 'italic' }}>Daily Reward</div>
          <div style={{ fontSize: 11, color: '#92400e', marginTop: 2 }}>
            Visit the Forge daily and spin the material wheel! Win rare crafting materials.
          </div>
        </div>
        {!status?.canSpin && remaining > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#78350f', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Next spin in</div>
            <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>{fmtCountdownShort(remaining)}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {/* Reel */}
        <div ref={reelRef} style={{ position: 'relative', width: '100%', maxWidth: VISIBLE * CELL_W, overflow: 'hidden', height: CELL_W }}>
          {/* Center highlight */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, zIndex: 2, pointerEvents: 'none',
            left: `calc(50% - ${CELL_W / 2}px)`, width: CELL_W,
            border: `2px solid ${claimed ? TIER_COLOR[claimed.result.tier] : '#fbbf24'}`,
            borderRadius: 8,
            boxShadow: `0 0 ${claimed ? '20px' : '8px'} ${claimed ? TIER_COLOR[claimed.result.tier] : '#fbbf2444'}`,
            transition: 'box-shadow 0.5s, border-color 0.5s',
          }} />
          {/* Fade masks */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
            background: 'linear-gradient(90deg,#0d0900 0%,transparent 18%,transparent 82%,#0d0900 100%)' }} />

          {/* Strip */}
          <div ref={stripRef} style={{
            display: 'flex', gap: CELL_W - 80,
            transform: `translateX(${tx}px)`,
            transition: animating ? 'transform 9s cubic-bezier(0.18,0.0,0.04,1.0)' : 'none',
            willChange: 'transform',
          }}>
            {strip.map((m, idx) => (
              <div key={idx} style={{
                width: 80, height: 80, flexShrink: 0,
                background: '#0b0d1e',
                border: `1px solid ${TIER_COLOR[m.tier]}33`,
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <SpriteIcon iconKey={m.iconKey} size={64} />
              </div>
            ))}
          </div>
        </div>

        {/* Spin button */}
        <button onClick={handleSpin} disabled={!canSpin} style={{
          padding: '10px 36px', borderRadius: 8, fontSize: 13, fontWeight: 900,
          letterSpacing: 1, cursor: canSpin ? 'pointer' : 'not-allowed',
          background: canSpin ? 'linear-gradient(180deg,#16a34a,#15803d)' : '#1a1a2a',
          color: canSpin ? '#fff' : '#374151',
          border: `2px solid ${canSpin ? '#4ade80' : '#1e1e3a'}`,
          boxShadow: canSpin ? '0 0 12px #16a34a66' : 'none',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}>
          {spinning ? '⟳  SPINNING...' : '⚄  SPIN THE WHEEL'}
        </button>

        {/* Claimed summary */}
        {claimed && (
          <div style={{ textAlign: 'center', animation: 'wonPop 0.4s ease-out' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Claimed!</div>
            {claimed.choice === 'material' && <>
              <div style={{ fontSize: 20, fontWeight: 900, color: TIER_COLOR[claimed.result.tier] }}>×{claimed.result.wonQty}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#e0e0f0', lineHeight: 1.3 }}>{claimed.result.name}</div>
            </>}
            {claimed.choice === 'gold' && <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>+20 Gold</div>}
            {claimed.choice === 'diamond' && <div style={{ fontSize: 20, fontWeight: 900, color: '#67e8f9' }}>+1 Diamond</div>}
          </div>
        )}
      </div>

      {/* Choice Modal */}
      {pendingResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 850, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            background: 'linear-gradient(180deg,#12090a,#0b0d1e)',
            border: '2px solid #fbbf24', borderRadius: 16, padding: '32px 36px',
            textAlign: 'center', maxWidth: 420, width: '90%',
            boxShadow: '0 0 60px #fbbf2433',
            animation: 'wonPop 0.35s ease-out',
          }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24', marginBottom: 4 }}>Congratulations!</div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>The wheel has spoken. Choose your reward:</div>

            {/* Won item */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <div style={{ border: `2px solid ${TIER_COLOR[pendingResult.tier]}`, borderRadius: 12, padding: 6, boxShadow: `0 0 20px ${TIER_COLOR[pendingResult.tier]}44` }}>
                <SpriteIcon iconKey={pendingResult.iconKey} size={72} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: TIER_COLOR[pendingResult.tier] }}>×{pendingResult.wonQty} {pendingResult.name}</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{TIER_LABEL[pendingResult.tier]}</div>
            </div>

            {/* Choices */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Material */}
              <button onClick={() => handleClaim('material')} style={{
                flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontWeight: 900,
                background: `${TIER_COLOR[pendingResult.tier]}18`,
                border: `2px solid ${TIER_COLOR[pendingResult.tier]}`,
                color: TIER_COLOR[pendingResult.tier], fontSize: 11,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <SpriteIcon iconKey={pendingResult.iconKey} size={40} />
                <div>TAKE MATERIAL</div>
                <div style={{ fontSize: 13, fontWeight: 900 }}>×{pendingResult.wonQty}</div>
              </button>

              <div style={{ color: '#4b5563', fontWeight: 700, fontSize: 12 }}>or</div>

              {/* Gold */}
              <button onClick={() => handleClaim('gold')} style={{
                flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontWeight: 900,
                background: '#fbbf2415', border: '2px solid #fbbf24', color: '#fbbf24', fontSize: 11,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <Coins size={28} color="#fbbf24" />
                <div>TAKE GOLD</div>
                <div style={{ fontSize: 13, fontWeight: 900 }}>20g</div>
              </button>

              <div style={{ color: '#4b5563', fontWeight: 700, fontSize: 12 }}>or</div>

              {/* Diamond */}
              <button onClick={() => handleClaim('diamond')} style={{
                flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer', fontWeight: 900,
                background: '#67e8f915', border: '2px solid #67e8f9', color: '#67e8f9', fontSize: 11,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}>
                <div style={{ fontSize: 28 }}>&#128142;</div>
                <div>TAKE DIAMOND</div>
                <div style={{ fontSize: 13, fontWeight: 900 }}>×1</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BlacksmithPage() {
  const { player, fetchPlayer } = usePlayer();
  const [materials, setMaterials] = useState<MaterialTemplate[]>([]);
  const [weaponRecipes, setWeaponRecipes] = useState<WeaponRecipe[]>([]);
  const [materialRecipes, setMaterialRecipes] = useState<MaterialRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const [matTierF, setMatTierF] = useState<number | null>(null);
  const [matSearch, setMatSearch] = useState('');
  const [weaponTierF, setWeaponTierF] = useState<string | null>(null);
  const [weaponSortKey, setWeaponSortKey] = useState<keyof WeaponRecipe | null>(null);
  const [refineTierF, setRefineTierF] = useState<number | null>(null);

  const [selectedWeapon, setSelectedWeapon] = useState<WeaponRecipe | null>(null);
  const [selectedRefine, setSelectedRefine] = useState<MaterialRecipe | null>(null);

  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirmWeapon, setConfirmWeapon] = useState<WeaponRecipe | null>(null);
  const [confirmRefine, setConfirmRefine] = useState<MaterialRecipe | null>(null);

  const [craftQueue, setCraftQueue] = useState<CraftQueueEntry[]>(() => loadQueue());
  const [tick, setTick] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { saveQueue(craftQueue); }, [craftQueue]);

  const showFlash = (text: string, ok: boolean) => {
    setFlash({ text, ok });
    setTimeout(() => setFlash(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mats, wRec, mRec] = await Promise.all([getMaterials(), getWeaponRecipes(), getMaterialRecipes()]);
      setMaterials(mats);
      setWeaponRecipes(wRec);
      setMaterialRecipes(mRec);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = `
      @keyframes legGlow { 0%,100%{box-shadow:0 0 15px #fbbf2422} 50%{box-shadow:0 0 40px #fbbf2466} }
      @keyframes wonPop { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
      .bs-weapon-row:hover { background: #0d1117 !important; }
      .bs-refine-row:hover { background: #0d1117 !important; }
    `;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  const filteredMats = materials.filter(m =>
    (matTierF === null || m.tier === matTierF) &&
    (matSearch === '' || m.name.toLowerCase().includes(matSearch.toLowerCase()))
  );
  const filteredWeapons = (() => {
    let list = weaponTierF ? weaponRecipes.filter(r => r.weaponTier === weaponTierF) : [...weaponRecipes];
    if (weaponSortKey) {
      list.sort((a, b) => ((b[weaponSortKey] as number) ?? 0) - ((a[weaponSortKey] as number) ?? 0));
    }
    return list;
  })();
  const filteredRefine = refineTierF ? materialRecipes.filter(r => r.outputTier === refineTierF) : materialRecipes;

  const maxCraftSlots = player?.extraCraftingSlotPurchased ? 2 : 1;
  const craftQueueFull = craftQueue.length >= maxCraftSlots;

  const canForge = (r: WeaponRecipe) => r.ingredients.every(i => i.have >= i.required);
  const canRefine = (r: MaterialRecipe) => r.ingredients.every(i => i.have >= i.required);

  const doForge = async (r: WeaponRecipe) => {
    setConfirmWeapon(null);
    setSelectedWeapon(null);
    if (craftQueueFull) { showFlash(`Crafting queue is full (${maxCraftSlots}/${maxCraftSlots} slots).`, false); return; }
    try {
      await craftWeapon(r.itemTemplateId);
      const entry: CraftQueueEntry = {
        id: `weapon-${r.itemTemplateId}-${Date.now()}`,
        name: r.name,
        iconKey: r.iconKey,
        endTime: Date.now() + r.craftHours * TIME_SCALE_MS,
        tier: r.weaponTier,
        type: 'weapon',
        ingredients: r.ingredients.map(i => ({ iconKey: i.iconKey, materialName: i.materialName, required: i.required })),
      };
      setCraftQueue(q => [...q, entry]);
      showFlash(`Forging ${r.name}...`, true);
      load();
    } catch {
      showFlash('Forge failed — insufficient materials.', false);
    }
  };

  const doRefine = async (r: MaterialRecipe) => {
    setConfirmRefine(null);
    setSelectedRefine(null);
    if (craftQueueFull) { showFlash(`Crafting queue is full (${maxCraftSlots}/${maxCraftSlots} slots).`, false); return; }
    try {
      await craftMaterial(r.recipeId);
      const entry: CraftQueueEntry = {
        id: `material-${r.recipeId}-${Date.now()}`,
        name: r.outputName,
        iconKey: r.outputIconKey,
        endTime: Date.now() + r.craftHours * TIME_SCALE_MS,
        tier: String(r.outputTier),
        type: 'material',
        ingredients: r.ingredients.map(i => ({ iconKey: i.iconKey, materialName: i.materialName, required: i.required })),
      };
      setCraftQueue(q => [...q, entry]);
      showFlash(`Refining ${r.outputName}...`, true);
      load();
    } catch {
      showFlash('Refinement failed — insufficient materials.', false);
    }
  };

  const finishCraft = (id: string) => {
    setCraftQueue(q => q.filter(e => e.id !== id));
  };

  const handleFinishNow = async (entry: CraftQueueEntry) => {
    try {
      await finishCraftNow(entry.tier);
      fetchPlayer();
      setCraftQueue(q => q.filter(e => e.id !== entry.id));
      showFlash(`${entry.name} finished!`, true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      showFlash(msg || 'Not enough diamonds.', false);
    }
  };

  const ownedCount = materials.filter(m => m.quantity > 0).length;
  const readyWeapons = weaponRecipes.filter(r => canForge(r)).length;
  const readyRefine = materialRecipes.filter(r => canRefine(r)).length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: '#4b5563', fontSize: 14, letterSpacing: 1 }}>
        Heating the forge...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px', minHeight: '100vh', color: '#e0e0e0', boxSizing: 'border-box' }}>
      <Flash msg={flash} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#fbbf24', letterSpacing: 1 }}>Blacksmith</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#6b7280' }}>Forge legendary weapons &middot; Refine ancient materials</p>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
          {[
            { val: ownedCount,   label: 'materials owned', color: '#fbbf24' },
            { val: readyWeapons, label: 'weapons ready',   color: readyWeapons > 0 ? '#4ade80' : '#4b5563' },
            { val: readyRefine,  label: 'refines ready',   color: readyRefine  > 0 ? '#60a5fa' : '#4b5563' },
          ].map(({ val, label, color }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{val}</span>
              <span style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Wheel */}
      {materials.length > 0 && <DailyWheel materials={materials} onSpun={load} />}

      {/* Crafting In Progress */}
      <CraftingProgress queue={craftQueue} tick={tick} diamonds={player?.diamonds ?? 0} maxSlots={player?.extraCraftingSlotPurchased ? 2 : 1} onFinish={finishCraft} onFinishNow={handleFinishNow} />

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── LEFT: Materials ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#9ca3af', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Materials</div>

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {([null, 1, 2, 3, 4, 5] as (number | null)[]).map(t => (
              <button key={t ?? 'all'} onClick={() => setMatTierF(t)} style={{
                background: matTierF === t ? (t ? `${TIER_COLOR[t]}22` : '#fbbf2415') : 'transparent',
                border: `1px solid ${matTierF === t ? (t ? TIER_COLOR[t] : '#fbbf24') : '#1e1e3a'}`,
                color: matTierF === t ? (t ? TIER_COLOR[t] : '#fbbf24') : '#6b7280',
                borderRadius: 20, cursor: 'pointer', padding: '3px 12px', fontSize: 10, fontWeight: 700, transition: 'all 0.12s',
              }}>{t === null ? 'All' : TIER_LABEL[t]}</button>
            ))}
          </div>

          <input value={matSearch} onChange={e => setMatSearch(e.target.value)} placeholder="Search materials..."
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10, padding: '6px 12px', background: '#0b0d1e', border: '1px solid #1e1e3a', borderRadius: 6, color: '#e0e0e0', fontSize: 12, outline: 'none' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6 }}>
            {filteredMats.map(m => {
              const color = TIER_COLOR[m.tier];
              return (
                <div key={m.id} style={{ background: '#0b0d1e', border: `1px solid ${m.quantity > 0 ? color + '44' : '#1a1a2a'}`, borderRadius: 7, padding: '8px 6px 6px', textAlign: 'center', position: 'relative', transition: 'border-color 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <SpriteIcon iconKey={m.iconKey} size={44} />
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color, margin: '5px 0 2px' }}>{TIER_LABEL[m.tier]}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#b0b0c8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                  <div style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 11, fontWeight: 900, color: m.quantity > 0 ? color : '#4b5563', background: '#0b0d1e', border: `1px solid ${m.quantity > 0 ? color + '55' : '#1e1e3a'}`, borderRadius: 3, padding: '0 3px', lineHeight: '15px' }}>{m.quantity}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Weapons + Refine ── */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Craft Weapons */}
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#9ca3af', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Craft Weapons</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {([null, 'COMMON', 'EPIC', 'LEGENDARY'] as (string | null)[]).map(t => (
                <button key={t ?? 'all'} onClick={() => { setWeaponTierF(t); }} style={{
                  background: weaponTierF === t ? (t ? `${WEAPON_COLOR[t]}22` : '#fbbf2415') : 'transparent',
                  border: `1px solid ${weaponTierF === t ? (t ? WEAPON_COLOR[t] : '#fbbf24') : '#1e1e3a'}`,
                  color: weaponTierF === t ? (t ? WEAPON_COLOR[t] : '#fbbf24') : '#6b7280',
                  borderRadius: 20, cursor: 'pointer', padding: '3px 8px', fontSize: 10, fontWeight: 700, flex: 1,
                }}>{t ?? 'All'}</button>
              ))}
            </div>

            {/* Sort */}
            <select value={weaponSortKey ?? ''} onChange={e => setWeaponSortKey((e.target.value as keyof WeaponRecipe) || null)} style={{
              width: '100%', marginBottom: 8, padding: '5px 8px', background: '#0b0d1e',
              border: '1px solid #1e1e3a', borderRadius: 6, color: weaponSortKey ? '#fbbf24' : '#6b7280',
              fontSize: 11, cursor: 'pointer', outline: 'none',
            }}>
              <option value="">Sort: Default</option>
              {WEAPON_STATS.map(s => (
                <option key={String(s.key)} value={String(s.key)}>Sort: {s.label}</option>
              ))}
            </select>

            <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredWeapons.map(r => {
                const ok = canForge(r);
                const sortVal = weaponSortKey ? (r[weaponSortKey] as number) : null;
                return (
                  <div key={r.recipeId} className="bs-weapon-row" onClick={() => setSelectedWeapon(r)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                    background: 'transparent', border: '1px solid transparent', transition: 'all 0.12s',
                  }}>
                    <SpriteIcon iconKey={r.iconKey} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: r.weaponTier === 'LEGENDARY' ? '#fbbf24' : '#e0e0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 1 }}>
                        <span style={{ fontSize: 8, fontWeight: 800, border: `1px solid ${WEAPON_COLOR[r.weaponTier]}44`, color: WEAPON_COLOR[r.weaponTier], borderRadius: 3, padding: '0 4px' }}>{r.weaponTier}</span>
                        <span style={{ fontSize: 9, color: '#4b5563' }}>&#9201; {fmtCraftTime(r.craftHours)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      {sortVal != null && sortVal > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#fbbf24', background: '#fbbf2415', border: '1px solid #fbbf2433', borderRadius: 3, padding: '0 5px', lineHeight: '16px' }}>
                          {weaponSortKey && WEAPON_STATS.find(s => s.key === weaponSortKey)?.pct
                            ? `+${Math.round(sortVal * 100)}%`
                            : `+${sortVal}`}
                        </span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 900, color: ok ? '#4ade80' : '#374151' }}>{ok ? '✓' : '·'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refine */}
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#9ca3af', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Refine Materials</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {([null, 2, 3, 4, 5] as (number | null)[]).map(t => (
                <button key={t ?? 'all'} onClick={() => setRefineTierF(t)} style={{
                  background: refineTierF === t ? (t ? `${TIER_COLOR[t]}22` : '#fbbf2415') : 'transparent',
                  border: `1px solid ${refineTierF === t ? (t ? TIER_COLOR[t] : '#fbbf24') : '#1e1e3a'}`,
                  color: refineTierF === t ? (t ? TIER_COLOR[t] : '#fbbf24') : '#6b7280',
                  borderRadius: 20, cursor: 'pointer', padding: '3px 9px', fontSize: 10, fontWeight: 700,
                }}>{t === null ? 'All' : TIER_LABEL[t]}</button>
              ))}
            </div>

            <div style={{ maxHeight: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredRefine.map(r => {
                const ok = canRefine(r);
                return (
                  <div key={r.recipeId} className="bs-refine-row" onClick={() => setSelectedRefine(r)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                    background: 'transparent', border: '1px solid transparent', transition: 'all 0.12s',
                  }}>
                    <SpriteIcon iconKey={r.outputIconKey} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#e0e0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.outputName}</div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 1 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: TIER_COLOR[r.outputTier] }}>{TIER_LABEL[r.outputTier]}</span>
                        <span style={{ fontSize: 9, color: '#4b5563' }}>&#x2192; &times;{r.outputQuantity}</span>
                        <span style={{ fontSize: 9, color: '#4b5563' }}>&#9201; {fmtCraftTime(r.craftHours)}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 900, color: ok ? '#4ade80' : '#374151' }}>{ok ? '✓' : '·'}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Popups */}
      {selectedWeapon && (
        <WeaponPopup r={selectedWeapon} canForge={canForge(selectedWeapon)}
          onForge={() => { setConfirmWeapon(selectedWeapon); }}
          onClose={() => setSelectedWeapon(null)} />
      )}
      {selectedRefine && (
        <RefinePopup r={selectedRefine} canRefine={canRefine(selectedRefine)}
          onRefine={() => { setConfirmRefine(selectedRefine); }}
          onClose={() => setSelectedRefine(null)} />
      )}

      {confirmWeapon && (
        <ConfirmModal title="Craft Recipe" msg={`Forge ${confirmWeapon.name}? Materials will be consumed.`}
          onOk={() => doForge(confirmWeapon)} onCancel={() => setConfirmWeapon(null)} />
      )}
      {confirmRefine && (
        <ConfirmModal title="Refine Material" msg={`Refine x${confirmRefine.outputQuantity} ${confirmRefine.outputName}? Ingredients will be consumed.`}
          onOk={() => doRefine(confirmRefine)} onCancel={() => setConfirmRefine(null)} />
      )}
    </div>
  );
}
