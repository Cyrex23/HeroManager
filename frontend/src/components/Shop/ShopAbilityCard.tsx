import { Coins } from 'lucide-react';
import type { ShopAbilityResponse } from '../../types';
import EquipmentTooltip from '../Equipment/EquipmentTooltip';
import AbilityTierIcon from '../Equipment/AbilityTierIcon';

interface Props {
  ability: ShopAbilityResponse;
  canAfford: boolean;
  onBuy: () => void;
}

// ── Tier config ───────────────────────────────────────────────────────────────
const TIER_CFG: Record<number, { label: string; color: string; glow: string; bg: string }> = {
  1: {
    label: 'Tier I',
    color: '#9ca3af',
    glow: 'rgba(156,163,175,0.18)',
    bg: 'linear-gradient(160deg, rgba(156,163,175,0.07) 0%, rgba(26,26,46,0.9) 100%)',
  },
  2: {
    label: 'Tier II',
    color: '#38bdf8',
    glow: 'rgba(56,189,248,0.25)',
    bg: 'linear-gradient(160deg, rgba(56,189,248,0.1) 0%, rgba(26,26,46,0.9) 100%)',
  },
  3: {
    label: 'Tier III',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.28)',
    bg: 'linear-gradient(160deg, rgba(167,139,250,0.1) 0%, rgba(26,26,46,0.9) 100%)',
  },
  4: {
    label: 'Tier IV',
    color: '#fb923c',
    glow: 'rgba(251,146,60,0.32)',
    bg: 'linear-gradient(160deg, rgba(251,146,60,0.12) 0%, rgba(26,26,46,0.9) 100%)',
  },
};

// ── Stat config (same as ShopItemCard) ───────────────────────────────────────
const STAT_CFG: Record<string, { label: string; color: string; icon: string }> = {
  physicalAttack: { label: 'PA',   color: '#f97316', icon: '⚔'  },
  magicPower:     { label: 'MP',   color: '#60a5fa', icon: '✦'  },
  dexterity:      { label: 'Dex',  color: '#4ade80', icon: '◈'  },
  mana:           { label: 'Mana', color: '#818cf8', icon: '◆'  },
  stamina:        { label: 'Stam', color: '#fb923c', icon: '◉'  },
  element:        { label: 'Elem', color: '#facc15', icon: '⚡' },
};

export default function ShopAbilityCard({ ability: ab, canAfford, onBuy }: Props) {
  const tc          = TIER_CFG[ab.tier] ?? TIER_CFG[1];
  const bonusEntries = Object.entries(ab.bonuses).filter(([, v]) => v !== 0);

  return (
    <EquipmentTooltip
      name={ab.name}
      type="ability"
      bonuses={ab.bonuses}
      tier={ab.tier}
      spells={ab.spells ?? []}
    >
      <div style={{
        position: 'relative',
        padding: '18px 14px 14px',
        borderRadius: 12,
        border: `1px solid ${tc.color}38`,
        background: tc.bg,
        boxShadow: `0 4px 24px ${tc.glow}, inset 0 0 0 1px ${tc.color}14`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        overflow: 'hidden',
        cursor: 'default',
        height: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Top color bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, background: tc.color,
          boxShadow: `0 0 8px ${tc.color}`,
        }} />

        {/* Tier badge (top-right) */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          padding: '2px 7px', borderRadius: 8,
          background: tc.color + '22',
          border: `1px solid ${tc.color}55`,
          color: tc.color,
        }}>
          {tc.label}
        </div>

        {/* SPELL badge (top-left) */}
        {ab.spells && ab.spells.length > 0 && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
            padding: '2px 6px', borderRadius: 8,
            background: 'rgba(96,165,250,0.15)',
            border: '1px solid rgba(96,165,250,0.35)',
            color: '#60a5fa',
            textTransform: 'uppercase' as const,
          }}>
            {ab.spells.length > 1 ? `${ab.spells.length} SPELLS` : 'SPELL'}
          </div>
        )}

        {/* Icon circle */}
        <div style={{
          width: 62, height: 62, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: tc.color + '16',
          border: `2px solid ${tc.color}44`,
          boxShadow: `0 0 16px ${tc.glow}`,
          marginTop: 6, flexShrink: 0,
        }}>
          <AbilityTierIcon tier={ab.tier} size={40} />
        </div>

        {/* Name */}
        <div style={{
          color: '#e8e8f0', fontWeight: 700, fontSize: 13,
          textAlign: 'center', lineHeight: 1.25, marginTop: 2,
        }}>
          {ab.name}
        </div>

        {/* Stat chips */}
        {bonusEntries.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, justifyContent: 'center' }}>
            {bonusEntries.map(([stat, val]) => {
              const sc = STAT_CFG[stat] ?? { label: stat, color: '#9ca3af', icon: '·' };
              return (
                <div key={stat} style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '3px 8px', borderRadius: 6,
                  background: sc.color + '14',
                  border: `1px solid ${sc.color}45`,
                }}>
                  <span style={{ color: sc.color, fontSize: 10, lineHeight: 1 }}>{sc.icon}</span>
                  <span style={{ color: sc.color, fontWeight: 800, fontSize: 12, lineHeight: 1 }}>+{val}</span>
                  <span style={{ color: sc.color + 'aa', fontSize: 10, lineHeight: 1 }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Spacer to push cost + button to bottom */}
        <div style={{ flex: 1 }} />

        {/* Gold cost */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.7))', display: 'flex' }}>
            <Coins size={15} />
          </span>
          <span style={{
            color: '#fbbf24', fontWeight: 800, fontSize: 17, lineHeight: 1,
            textShadow: '0 0 8px rgba(251,191,36,0.5)',
          }}>
            {ab.cost.toLocaleString()}
          </span>
          <span style={{
            color: '#fbbf2470', fontSize: 10, fontWeight: 600,
            textTransform: 'uppercase' as const, letterSpacing: '0.05em',
          }}>
            gold
          </span>
        </div>

        {/* Buy / Owned */}
        {ab.owned ? (
          <div style={{
            width: '100%', padding: '7px 14px',
            borderRadius: 6,
            border: '1px solid rgba(74,222,128,0.35)',
            background: 'rgba(74,222,128,0.08)',
            color: '#4ade80', fontSize: 11, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase' as const,
            textAlign: 'center',
          }}>
            ✓ Owned
          </div>
        ) : (
          <button
            onClick={onBuy}
            disabled={!canAfford}
            style={{
              width: '100%', padding: '7px 14px',
              border: `1px solid ${canAfford ? tc.color + '80' : '#333'}`,
              borderRadius: 6, fontSize: 11, fontWeight: 800,
              letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              cursor: canAfford ? 'pointer' : 'not-allowed',
              background: canAfford
                ? `linear-gradient(135deg, ${tc.color}dd, ${tc.color}99)`
                : '#1e1e30',
              color: canAfford ? '#fff' : '#4a4a6a',
              boxShadow: canAfford ? `0 2px 12px ${tc.glow}` : 'none',
              transition: 'all 0.15s',
            }}
          >
            {canAfford ? 'Purchase' : 'Not enough gold'}
          </button>
        )}
      </div>
    </EquipmentTooltip>
  );
}
